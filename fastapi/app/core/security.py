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
CHECKOUT_CANCEL_TOKEN_TTL_HOURS = 24


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


def create_checkout_cancel_token(
    *, order_id: str, email: str, expires_hours: int | None = None
) -> str:
    ttl_hours = expires_hours or CHECKOUT_CANCEL_TOKEN_TTL_HOURS
    subject = {"order_id": order_id, "email": email.strip().lower()}
    return _encode_token(subject, timedelta(hours=ttl_hours), "checkout_cancel")


def decode_checkout_cancel_token(token: str) -> dict[str, Any]:
    payload = _decode_token(token, "checkout_cancel")
    order_id = payload.get("order_id")
    email = payload.get("email")
    if not isinstance(order_id, str) or not order_id.strip():
        raise ValueError("Invalid checkout token: missing order_id")
    if not isinstance(email, str) or "@" not in email:
        raise ValueError("Invalid checkout token: missing email")
    return {"order_id": order_id.strip(), "email": email.strip().lower()}


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
