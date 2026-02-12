from __future__ import annotations

from datetime import datetime, timedelta, timezone
from hmac import compare_digest
from hashlib import sha256
from secrets import randbelow, token_hex
from typing import Any

from jose import jwt

from app.core.config import settings


ALGORITHM = "HS256"
OTP_TTL_MINUTES = 10


def _encode_token(subject: dict[str, Any], expires_delta: timedelta, token_type: str) -> str:
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode = {"exp": expire, "type": token_type, **subject}
    secret = settings.resolved_auth_secret()
    if not secret:
        raise RuntimeError("AUTH_SECRET is not configured")
    return jwt.encode(to_encode, secret, algorithm=ALGORITHM)


def _decode_token(token: str, token_type: str) -> dict[str, Any]:
    secret = settings.resolved_auth_secret()
    if not secret:
        raise RuntimeError("AUTH_SECRET is not configured")
    payload = jwt.decode(token, secret, algorithms=[ALGORITHM])
    payload_type = payload.get("type")
    if token_type == "access" and payload_type is None:
        return payload
    if payload_type != token_type:
        raise ValueError("Invalid token type")
    return payload


def create_access_token(subject: dict[str, Any], expires_minutes: int | None = None) -> str:
    expire_minutes = expires_minutes or settings.access_token_expire_minutes
    return _encode_token(subject, timedelta(minutes=expire_minutes), "access")


def decode_access_token(token: str) -> dict[str, Any]:
    return _decode_token(token, "access")


def create_refresh_token(subject: dict[str, Any], expires_days: int | None = None) -> str:
    expire_days = expires_days or settings.refresh_token_expire_days
    return _encode_token(subject, timedelta(days=expire_days), "refresh")


def decode_refresh_token(token: str) -> dict[str, Any]:
    return _decode_token(token, "refresh")


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
    return compare_digest(candidate, code_hash)
