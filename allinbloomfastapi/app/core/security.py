from __future__ import annotations

from datetime import datetime, timedelta, timezone
from hashlib import sha256
from secrets import randbelow, token_hex
from typing import Any

from jose import jwt

from app.core.config import settings


ALGORITHM = "HS256"
OTP_TTL_MINUTES = 10


def create_access_token(subject: dict[str, Any], expires_minutes: int | None = None) -> str:
    expire_minutes = expires_minutes or settings.access_token_expire_minutes
    expire = datetime.utcnow() + timedelta(minutes=expire_minutes)
    to_encode = {"exp": expire, **subject}
    secret = settings.resolved_auth_secret()
    if not secret:
        raise RuntimeError("AUTH_SECRET is not configured")
    return jwt.encode(to_encode, secret, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict[str, Any]:
    secret = settings.resolved_auth_secret()
    if not secret:
        raise RuntimeError("AUTH_SECRET is not configured")
    return jwt.decode(token, secret, algorithms=[ALGORITHM])


def generate_otp() -> dict[str, str | datetime]:
    code = str(randbelow(900000) + 100000)
    salt = token_hex(16)
    code_hash = sha256(f"{code}{salt}".encode()).hexdigest()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=OTP_TTL_MINUTES)
    return {
        "code": code,
        "salt": salt,
        "hash": code_hash,
        "expires_at": expires_at,
    }


def verify_otp(code: str, salt: str, code_hash: str) -> bool:
    candidate = sha256(f"{code}{salt}".encode()).hexdigest()
    return candidate == code_hash
