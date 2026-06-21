from __future__ import annotations

import logging
from typing import Any

from fastapi import Request
from sqlalchemy.orm import Session

from app.core.critical_logging import log_critical_event, sanitize_context
from app.models.payment_event import PaymentEvent

_TEXT_MAX_LENGTH = 500
_EVENT_MAX_LENGTH = 120
_PROVIDER_MAX_LENGTH = 40
_SOURCE_MAX_LENGTH = 40
_ID_MAX_LENGTH = 255


def _clean_text(value: object, *, max_length: int) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    if not text:
        return None
    return text[:max_length]


def _clean_context(context: dict[str, Any] | None) -> dict[str, Any] | None:
    if not context:
        return None
    sanitized = sanitize_context(context)
    if not isinstance(sanitized, dict):
        return None
    return sanitized


def record_payment_event(
    db: Session,
    *,
    order_id: str,
    event: str,
    provider: str = "checkout",
    source: str = "server",
    message: str | None = None,
    stripe_session_id: str | None = None,
    stripe_event_id: str | None = None,
    payment_intent_id: str | None = None,
    context: dict[str, Any] | None = None,
) -> PaymentEvent:
    payment_event = PaymentEvent(
        order_id=order_id,
        provider=_clean_text(provider, max_length=_PROVIDER_MAX_LENGTH) or "checkout",
        source=_clean_text(source, max_length=_SOURCE_MAX_LENGTH) or "server",
        event=_clean_text(event, max_length=_EVENT_MAX_LENGTH) or "unknown",
        message=_clean_text(message, max_length=_TEXT_MAX_LENGTH),
        stripe_session_id=_clean_text(stripe_session_id, max_length=_ID_MAX_LENGTH),
        stripe_event_id=_clean_text(stripe_event_id, max_length=_ID_MAX_LENGTH),
        payment_intent_id=_clean_text(payment_intent_id, max_length=_ID_MAX_LENGTH),
        context=_clean_context(context),
    )
    db.add(payment_event)
    db.commit()
    return payment_event


def record_payment_event_best_effort(
    db: Session,
    *,
    order_id: str | None,
    event: str,
    provider: str = "checkout",
    source: str = "server",
    message: str | None = None,
    stripe_session_id: str | None = None,
    stripe_event_id: str | None = None,
    payment_intent_id: str | None = None,
    context: dict[str, Any] | None = None,
    request: Request | None = None,
) -> None:
    if not order_id:
        return

    try:
        record_payment_event(
            db,
            order_id=order_id,
            event=event,
            provider=provider,
            source=source,
            message=message,
            stripe_session_id=stripe_session_id,
            stripe_event_id=stripe_event_id,
            payment_intent_id=payment_intent_id,
            context=context,
        )
    except Exception as exc:
        db.rollback()
        log_critical_event(
            domain="payment",
            event="payment_event_record_failed",
            message="Failed to record payment timeline event.",
            request=request,
            context={
                "order_id": order_id,
                "payment_event": event,
                "provider": provider,
                "source": source,
            },
            exc=exc,
            level=logging.WARNING,
        )
