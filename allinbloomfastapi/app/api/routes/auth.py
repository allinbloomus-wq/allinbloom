from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.config import settings
from app.core.security import create_access_token, generate_otp, verify_otp
from app.models.user import User
from app.models.verification_code import VerificationCode
from app.schemas.auth import GoogleSignInIn, RequestCodeIn, VerifyCodeIn
from app.schemas.user import TokenOut, UserOut
from app.services.email import send_otp_email

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/request-code")
async def request_code(
    payload: RequestCodeIn,
    background: BackgroundTasks,
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

    background.add_task(send_otp_email, email, otp["code"])
    return {"ok": True}


@router.post("/verify-code", response_model=TokenOut)
def verify_code(payload: VerifyCodeIn, db: Session = Depends(get_db)):
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
    return TokenOut(access_token=token, user=UserOut.model_validate(user))


@router.post("/google", response_model=TokenOut)
def google_sign_in(payload: GoogleSignInIn, db: Session = Depends(get_db)):
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
    return TokenOut(access_token=token, user=UserOut.model_validate(user))
