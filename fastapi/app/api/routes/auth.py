from __future__ import annotations

from datetime import datetime, timedelta, timezone
import logging

from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, status
from fastapi.responses import JSONResponse
import httpx
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.config import settings
from app.core.critical_logging import log_critical_event
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
    generate_otp,
    verify_otp,
)
from app.models.user import User
from app.models.verification_code import VerificationCode
from app.schemas.auth import GoogleCodeSignInIn, GoogleSignInIn, RequestCodeIn, VerifyCodeIn
from app.schemas.user import TokenOut, UserOut
from app.services.email import send_otp_email

router = APIRouter(prefix="/api/auth", tags=["auth"])
GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token"


def _cookie_secure() -> bool:
    return settings.is_production()


def _cookie_max_age() -> int:
    return max(1, settings.refresh_token_expire_days * 24 * 60 * 60)


def _set_refresh_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=settings.refresh_token_cookie_name,
        value=token,
        httponly=True,
        secure=_cookie_secure(),
        samesite=settings.resolved_refresh_cookie_samesite(),
        path="/",
        max_age=_cookie_max_age(),
    )


def _clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(
        key=settings.refresh_token_cookie_name,
        path="/",
        secure=_cookie_secure(),
        httponly=True,
        samesite=settings.resolved_refresh_cookie_samesite(),
    )


def _build_auth_response(response: Response, user: User) -> TokenOut:
    token = create_access_token(
        {"sub": user.id, "email": user.email, "role": user.role.value, "name": user.name or ""}
    )
    refresh_token = create_refresh_token({"sub": user.id, "email": user.email})
    _set_refresh_cookie(response, refresh_token)
    return TokenOut(access_token=token, user=UserOut.model_validate(user))


def _verify_google_id_token_or_401(raw_id_token: str, request: Request) -> dict:
    try:
        return id_token.verify_oauth2_token(
            raw_id_token,
            google_requests.Request(),
            settings.google_client_id,
        )
    except Exception:
        log_critical_event(
            domain="auth",
            event="google_token_validation_failed",
            message="Google ID token validation failed.",
            request=request,
            level=logging.WARNING,
        )
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token.")


def _upsert_google_user_from_profile(
    profile: dict,
    request: Request,
    db: Session,
) -> User:
    email = str(profile.get("email") or "").lower().strip()
    if not email:
        log_critical_event(
            domain="auth",
            event="google_profile_missing_email",
            message="Google token did not include user email.",
            request=request,
            level=logging.WARNING,
        )
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token.")

    user = db.execute(select(User).where(User.email == email)).scalars().first()
    if not user:
        user = User(email=email, name=profile.get("name"), image=profile.get("picture"))
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        if profile.get("name") and not user.name:
            user.name = profile.get("name")
        if profile.get("picture") and not user.image:
            user.image = profile.get("picture")
        db.commit()
    return user


@router.post("/request-code")
async def request_code(
    payload: RequestCodeIn,
    request: Request,
    db: Session = Depends(get_db),
):
    email = payload.email.strip().lower()
    if "@" not in email:
        raise HTTPException(status_code=400, detail="Please provide a valid email address.")

    now = datetime.now(timezone.utc)
    window_start = now - timedelta(minutes=15)
    recent_count = (
        db.execute(
            select(VerificationCode)
            .where(VerificationCode.email == email, VerificationCode.created_at > window_start)
        )
        .scalars()
        .all()
    )
    if len(recent_count) >= 5:
        log_critical_event(
            domain="auth",
            event="otp_rate_limit_reached",
            message="OTP request rate limit reached.",
            request=request,
            context={"email": email},
            level=logging.WARNING,
        )
        oldest = (
            db.execute(
                select(VerificationCode)
                .where(VerificationCode.email == email, VerificationCode.created_at > window_start)
                .order_by(VerificationCode.created_at.asc())
            )
            .scalars()
            .first()
        )
        retry_after = 15 * 60
        if oldest:
            retry_after = max(
                1,
                int((oldest.created_at + timedelta(minutes=15) - now).total_seconds()),
            )
        return JSONResponse(
            status_code=429,
            content={
                "error": "Too many requests. Please try again later.",
                "retryAfterSec": retry_after,
            },
        )

    last_code = (
        db.execute(
            select(VerificationCode)
            .where(VerificationCode.email == email)
            .order_by(VerificationCode.created_at.desc())
        )
        .scalars()
        .first()
    )
    if last_code and (now - last_code.created_at).total_seconds() < 20:
        log_critical_event(
            domain="auth",
            event="otp_request_too_fast",
            message="OTP requested too frequently.",
            request=request,
            context={"email": email},
            level=logging.WARNING,
        )
        retry_after = max(1, int(20 - (now - last_code.created_at).total_seconds()))
        return JSONResponse(
            status_code=429,
            content={
                "error": "Please wait a moment before requesting another code.",
                "retryAfterSec": retry_after,
            },
        )

    otp = generate_otp()
    db.execute(delete(VerificationCode).where(VerificationCode.email == email))
    db.add(
        VerificationCode(
            email=email,
            code_hash=otp["hash"],
            salt=otp["salt"],
            expires_at=otp["expires_at"],
        )
    )
    db.commit()

    try:
        await send_otp_email(email, str(otp["code"]))
    except Exception as exc:
        # The code should not remain valid if delivery failed.
        db.execute(delete(VerificationCode).where(VerificationCode.email == email))
        db.commit()
        log_critical_event(
            domain="auth",
            event="otp_delivery_failed",
            message="Failed to deliver OTP email.",
            request=request,
            context={"email": email},
            exc=exc,
        )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to send verification code. Please try again later.",
        )
    return {"ok": True}


@router.post("/verify-code", response_model=TokenOut)
def verify_code(
    payload: VerifyCodeIn,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    email = payload.email.strip().lower()
    code = payload.code.strip()

    record = (
        db.execute(
            select(VerificationCode)
            .where(VerificationCode.email == email)
            .order_by(VerificationCode.created_at.desc())
        )
        .scalars()
        .first()
    )
    if not record or record.expires_at < datetime.now(timezone.utc):
        log_critical_event(
            domain="auth",
            event="otp_invalid_or_expired",
            message="OTP verification failed: invalid or expired code.",
            request=request,
            context={"email": email},
            level=logging.WARNING,
        )
        raise HTTPException(status_code=400, detail="Invalid or expired code.")
    if not verify_otp(code, record.salt, record.code_hash):
        # Invalidate the active code after a failed attempt to limit brute-force attempts.
        db.execute(delete(VerificationCode).where(VerificationCode.email == email))
        db.commit()
        log_critical_event(
            domain="auth",
            event="otp_verification_failed",
            message="OTP verification failed: hash mismatch.",
            request=request,
            context={"email": email},
            level=logging.WARNING,
        )
        raise HTTPException(status_code=400, detail="Invalid or expired code.")

    user = db.execute(select(User).where(User.email == email)).scalars().first()
    if not user:
        if not payload.name or not payload.name.strip():
            raise HTTPException(status_code=400, detail="Name is required.")
        user = User(email=email, name=payload.name.strip())
        db.add(user)
        db.commit()
        db.refresh(user)
    elif payload.name and not user.name:
        user.name = payload.name.strip()
        db.commit()
        db.refresh(user)

    db.execute(delete(VerificationCode).where(VerificationCode.email == email))
    db.commit()

    token = create_access_token(
        {"sub": user.id, "email": user.email, "role": user.role.value, "name": user.name or ""}
    )
    refresh_token = create_refresh_token({"sub": user.id, "email": user.email})
    _set_refresh_cookie(response, refresh_token)
    return TokenOut(access_token=token, user=UserOut.model_validate(user))


@router.post("/google", response_model=TokenOut)
def google_sign_in(
    payload: GoogleSignInIn,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    if not settings.google_client_id:
        log_critical_event(
            domain="auth",
            event="google_auth_not_configured",
            message="Google sign-in requested but integration is not configured.",
            request=request,
        )
        raise HTTPException(status_code=400, detail="Google login is not configured.")

    info = _verify_google_id_token_or_401(payload.id_token, request)
    user = _upsert_google_user_from_profile(info, request, db)
    return _build_auth_response(response, user)


@router.post("/google/code", response_model=TokenOut)
def google_sign_in_with_code(
    payload: GoogleCodeSignInIn,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    if not settings.google_client_id or not settings.google_client_secret:
        log_critical_event(
            domain="auth",
            event="google_auth_not_configured",
            message="Google code sign-in requested but integration is not configured.",
            request=request,
        )
        raise HTTPException(status_code=400, detail="Google login is not configured.")

    code = payload.code.strip()
    if not code:
        raise HTTPException(status_code=400, detail="Google authorization code is required.")
    redirect_uri = (payload.redirect_uri or "postmessage").strip() or "postmessage"

    try:
        exchange_response = httpx.post(
            GOOGLE_TOKEN_ENDPOINT,
            data={
                "code": code,
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "redirect_uri": redirect_uri,
                "grant_type": "authorization_code",
            },
            headers={"Accept": "application/json"},
            timeout=10.0,
        )
    except Exception as exc:
        log_critical_event(
            domain="auth",
            event="google_code_exchange_request_failed",
            message="Google authorization code exchange request failed.",
            request=request,
            exc=exc,
        )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google sign-in is temporarily unavailable.",
        )

    try:
        exchange_payload = exchange_response.json()
    except ValueError:
        exchange_payload = {}

    if exchange_response.status_code >= 400:
        log_critical_event(
            domain="auth",
            event="google_code_exchange_failed",
            message="Google authorization code exchange failed.",
            request=request,
            context={
                "status_code": exchange_response.status_code,
                "error": exchange_payload.get("error"),
            },
            level=logging.WARNING,
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google authorization code.",
        )

    id_token_value = str(exchange_payload.get("id_token") or "").strip()
    if not id_token_value:
        log_critical_event(
            domain="auth",
            event="google_code_exchange_missing_id_token",
            message="Google token exchange did not return an ID token.",
            request=request,
            level=logging.WARNING,
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google authorization code.",
        )

    info = _verify_google_id_token_or_401(id_token_value, request)
    user = _upsert_google_user_from_profile(info, request, db)
    return _build_auth_response(response, user)


@router.post("/refresh", response_model=TokenOut)
def refresh_access_token(
    request: Request,
    response: Response,
    refresh_cookie: str | None = Cookie(default=None, alias=settings.refresh_token_cookie_name),
    db: Session = Depends(get_db),
):
    if not refresh_cookie:
        log_critical_event(
            domain="auth",
            event="refresh_cookie_missing",
            message="Refresh token cookie is missing.",
            request=request,
            level=logging.WARNING,
        )
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")

    try:
        payload = decode_refresh_token(refresh_cookie)
    except Exception:
        log_critical_event(
            domain="auth",
            event="refresh_token_invalid",
            message="Refresh token failed validation.",
            request=request,
            level=logging.WARNING,
        )
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")

    user_id = payload.get("sub")
    email = payload.get("email")
    stmt = None
    if user_id:
        stmt = select(User).where(User.id == str(user_id))
    elif email:
        stmt = select(User).where(User.email == str(email))
    if stmt is None:
        log_critical_event(
            domain="auth",
            event="refresh_token_without_identity",
            message="Refresh token payload does not include user identity.",
            request=request,
            level=logging.WARNING,
        )
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")

    user = db.execute(stmt).scalars().first()
    if not user:
        log_critical_event(
            domain="auth",
            event="refresh_user_not_found",
            message="Refresh token resolved to unknown user.",
            request=request,
            level=logging.WARNING,
        )
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")

    access_token = create_access_token(
        {"sub": user.id, "email": user.email, "role": user.role.value, "name": user.name or ""}
    )
    new_refresh_token = create_refresh_token({"sub": user.id, "email": user.email})
    _set_refresh_cookie(response, new_refresh_token)
    return TokenOut(access_token=access_token, user=UserOut.model_validate(user))


@router.post("/logout")
def logout(response: Response):
    _clear_refresh_cookie(response)
    return {"ok": True}
