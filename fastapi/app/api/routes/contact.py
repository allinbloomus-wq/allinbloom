from __future__ import annotations

from datetime import datetime, timedelta
import logging

from fastapi import APIRouter, HTTPException, Request

from app.core.config import settings
from app.core.critical_logging import log_critical_event
from app.schemas.contact import ContactRequest
from app.services.email import send_contact_email

router = APIRouter(prefix="/api/contact", tags=["contact"])


RATE_WINDOW = timedelta(minutes=15)
RATE_LIMIT = 5
rate_limit: dict[str, dict[str, object]] = {}


def _get_client_key(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.headers.get("x-real-ip") or "unknown"


def _allow_request(key: str) -> bool:
    now = datetime.utcnow()
    entry = rate_limit.get(key)
    if not entry or entry["reset_at"] <= now:
        rate_limit[key] = {"count": 1, "reset_at": now + RATE_WINDOW}
        return True
    if entry["count"] >= RATE_LIMIT:
        return False
    entry["count"] += 1
    return True


@router.post("")
async def contact(request: Request, payload: ContactRequest):
    key = _get_client_key(request)
    if not _allow_request(key):
        log_critical_event(
            domain="messaging",
            event="contact_rate_limited",
            message="Contact form request blocked by rate limit.",
            request=request,
            level=logging.WARNING,
        )
        raise HTTPException(status_code=429, detail="Too many requests. Please try again later.")

    name = payload.name.strip()
    email = payload.email.strip()
    message = payload.message.strip()

    if not name or not email or not message:
        log_critical_event(
            domain="personal_data",
            event="contact_missing_fields",
            message="Contact form is missing required personal data fields.",
            request=request,
            context={"has_name": bool(name), "has_email": bool(email), "has_message": bool(message)},
            level=logging.WARNING,
        )
        raise HTTPException(status_code=400, detail="Missing required fields.")

    if "@" not in email or "." not in email:
        log_critical_event(
            domain="personal_data",
            event="contact_invalid_email",
            message="Contact form email format is invalid.",
            request=request,
            context={"email": email},
            level=logging.WARNING,
        )
        raise HTTPException(status_code=400, detail="Invalid email format.")

    if len(name) > 100 or len(email) > 254 or len(message) > 2000:
        log_critical_event(
            domain="personal_data",
            event="contact_payload_too_large",
            message="Contact form payload exceeded limits.",
            request=request,
            context={
                "name_length": len(name),
                "email_length": len(email),
                "message_length": len(message),
            },
            level=logging.WARNING,
        )
        raise HTTPException(status_code=400, detail="Message is too long. Please shorten it.")

    if not settings.resend_api_key or not settings.admin_email or not settings.email_from:
        log_critical_event(
            domain="messaging",
            event="contact_email_service_not_configured",
            message="Contact message failed because email service is not configured.",
            request=request,
        )
        raise HTTPException(status_code=500, detail="Email service is not configured.")

    try:
        await send_contact_email(name=name, email=email, message=message)
    except Exception as exc:
        log_critical_event(
            domain="messaging",
            event="contact_email_delivery_failed",
            message="Contact email delivery failed.",
            request=request,
            context={"email": email},
            exc=exc,
        )
        raise HTTPException(status_code=500, detail="Failed to send message.")

    return {"ok": True}
