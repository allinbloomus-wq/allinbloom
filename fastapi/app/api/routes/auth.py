from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status
from fastapi.responses import JSONResponse
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
    generate_otp,
    verify_otp,
)
from app.models.user import User
from app.models.verification_code import VerificationCode
from app.schemas.auth import GoogleSignInIn, RequestCodeIn, VerifyCodeIn
from app.schemas.user import TokenOut, UserOut
from app.services.email import send_otp_email

router = APIRouter(prefix="/api/auth", tags=["auth"])


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


@router.post("/request-code")
async def request_code(
    payload: RequestCodeIn,
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
    except Exception:
        # The code should not remain valid if delivery failed.
        db.execute(delete(VerificationCode).where(VerificationCode.email == email))
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to send verification code. Please try again later.",
        )
    return {"ok": True}


@router.post("/verify-code", response_model=TokenOut)
def verify_code(
    payload: VerifyCodeIn,
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
        raise HTTPException(status_code=400, detail="Invalid or expired code.")
    if not verify_otp(code, record.salt, record.code_hash):
        # Invalidate the active code after a failed attempt to limit brute-force attempts.
        db.execute(delete(VerificationCode).where(VerificationCode.email == email))
        db.commit()
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
    response: Response,
    db: Session = Depends(get_db),
):
    if not settings.google_client_id:
        raise HTTPException(status_code=400, detail="Google login is not configured.")

    try:
        info = id_token.verify_oauth2_token(
            payload.id_token,
            google_requests.Request(),
            settings.google_client_id,
        )
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token.")

    email = str(info.get("email") or "").lower().strip()
    if not email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token.")

    user = db.execute(select(User).where(User.email == email)).scalars().first()
    if not user:
        user = User(email=email, name=info.get("name"), image=info.get("picture"))
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        if info.get("name") and not user.name:
            user.name = info.get("name")
        if info.get("picture") and not user.image:
            user.image = info.get("picture")
        db.commit()

    token = create_access_token(
        {"sub": user.id, "email": user.email, "role": user.role.value, "name": user.name or ""}
    )
    refresh_token = create_refresh_token({"sub": user.id, "email": user.email})
    _set_refresh_cookie(response, refresh_token)
    return TokenOut(access_token=token, user=UserOut.model_validate(user))


@router.post("/refresh", response_model=TokenOut)
def refresh_access_token(
    response: Response,
    refresh_cookie: str | None = Cookie(default=None, alias=settings.refresh_token_cookie_name),
    db: Session = Depends(get_db),
):
    if not refresh_cookie:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")

    try:
        payload = decode_refresh_token(refresh_cookie)
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")

    user_id = payload.get("sub")
    email = payload.get("email")
    stmt = None
    if user_id:
        stmt = select(User).where(User.id == str(user_id))
    elif email:
        stmt = select(User).where(User.email == str(email))
    if stmt is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")

    user = db.execute(stmt).scalars().first()
    if not user:
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
