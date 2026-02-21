from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.webhook_event import WebhookEvent


def is_webhook_event_processed(db: Session, *, provider: str, event_id: str) -> bool:
    if not event_id:
        return False
    existing = db.execute(
        select(WebhookEvent.id).where(
            WebhookEvent.provider == provider,
            WebhookEvent.event_id == event_id,
        )
    ).first()
    return existing is not None


def mark_webhook_event_processed(db: Session, *, provider: str, event_id: str) -> None:
    if not event_id:
        return
    db.add(WebhookEvent(provider=provider, event_id=event_id))
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
