from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Iterable

import stripe
from sqlalchemy import select, update
from sqlalchemy.orm import Session, joinedload

from app.core.config import settings
from app.models.order import Order
from app.models.enums import OrderStatus
from app.utils.admin_orders import get_day_range, get_week_range


PENDING_EXPIRATION_HOURS = 24
PENDING_WITHOUT_SESSION_EXPIRATION_MINUTES = 10
STRIPE_CHECKOUT_SESSION_EXPIRATION_SECONDS = 30 * 60


def _read_stripe_attr(obj: object, key: str) -> object:
    if isinstance(obj, dict):
        return obj.get(key)
    return getattr(obj, key, None)


def _extract_payment_intent_status(payment_intent: object) -> str | None:
    if not payment_intent:
        return None

    if isinstance(payment_intent, str):
        try:
            intent = stripe.PaymentIntent.retrieve(payment_intent)
        except Exception:
            return None
        status = getattr(intent, "status", None)
    elif isinstance(payment_intent, dict):
        status = payment_intent.get("status")
    else:
        status = getattr(payment_intent, "status", None)

    if not status:
        return None
    return str(status).lower()


def resolve_order_status_from_session(
    order: Order, session: object, now_seconds: int | None = None
) -> OrderStatus | None:
    metadata_raw = _read_stripe_attr(session, "metadata") or {}
    metadata_order_id = (
        metadata_raw.get("orderId") if isinstance(metadata_raw, dict) else None
    )
    if metadata_order_id and metadata_order_id != order.id:
        return None

    session_status = str(_read_stripe_attr(session, "status") or "").lower()
    payment_status = str(_read_stripe_attr(session, "payment_status") or "").lower()
    amount_total = _read_stripe_attr(session, "amount_total")
    currency = str(_read_stripe_attr(session, "currency") or "").lower()

    amount_matches = isinstance(amount_total, int) and amount_total == order.total_cents
    currency_matches = not currency or currency == order.currency.lower()

    if (
        session_status == "complete"
        and payment_status in {"paid", "no_payment_required"}
        and amount_matches
        and currency_matches
    ):
        if payment_status == "no_payment_required" and amount_total not in {0, None}:
            return None
        return OrderStatus.PAID

    if session_status == "expired":
        return OrderStatus.FAILED

    if now_seconds is None:
        now_seconds = int(datetime.now(timezone.utc).timestamp())
    expires_at = _read_stripe_attr(session, "expires_at")
    if isinstance(expires_at, int) and expires_at < now_seconds:
        return OrderStatus.FAILED

    if session_status == "complete" and payment_status == "unpaid":
        payment_intent = _read_stripe_attr(session, "payment_intent")
        intent_status = _extract_payment_intent_status(payment_intent)
        if intent_status == "succeeded" and amount_matches and currency_matches:
            return OrderStatus.PAID
        if intent_status in {"canceled", "requires_payment_method"}:
            return OrderStatus.FAILED

    return None


def expire_pending_orders(db: Session) -> None:
    now = datetime.now(timezone.utc)
    cutoff_with_session = now - timedelta(hours=PENDING_EXPIRATION_HOURS)
    cutoff_without_session = now - timedelta(
        minutes=PENDING_WITHOUT_SESSION_EXPIRATION_MINUTES
    )

    db.execute(
        update(Order)
        .where(
            Order.status == OrderStatus.PENDING,
            Order.stripe_session_id.is_not(None),
            Order.is_deleted.is_(False),
            Order.created_at < cutoff_with_session,
        )
        .values(status=OrderStatus.FAILED)
    )
    db.execute(
        update(Order)
        .where(
            Order.status == OrderStatus.PENDING,
            Order.stripe_session_id.is_(None),
            Order.is_deleted.is_(False),
            Order.created_at < cutoff_without_session,
        )
        .values(status=OrderStatus.FAILED)
    )
    db.commit()


def _sync_with_stripe(db: Session, orders: Iterable[Order]) -> dict[str, OrderStatus]:
    if not settings.stripe_secret_key:
        return {}
    stripe.api_key = settings.stripe_secret_key
    updates: dict[str, OrderStatus] = {}
    now_seconds = int(datetime.now(timezone.utc).timestamp())

    for order in orders:
        if order.status != OrderStatus.PENDING or not order.stripe_session_id:
            continue
        try:
            session = stripe.checkout.Session.retrieve(order.stripe_session_id)
        except Exception:
            continue

        next_status = resolve_order_status_from_session(
            order, session, now_seconds=now_seconds
        )
        if next_status and next_status != order.status:
            db.execute(
                update(Order)
                .where(Order.id == order.id, Order.status == OrderStatus.PENDING)
                .values(status=next_status)
            )
            updates[order.id] = next_status

    if updates:
        db.commit()
    return updates


def sync_order_with_stripe(db: Session, order: Order) -> OrderStatus | None:
    if (
        order.status != OrderStatus.PENDING
        or not order.stripe_session_id
        or not settings.stripe_secret_key
    ):
        return None

    stripe.api_key = settings.stripe_secret_key
    try:
        session = stripe.checkout.Session.retrieve(order.stripe_session_id)
    except Exception:
        return None

    next_status = resolve_order_status_from_session(order, session)
    if not next_status or next_status == order.status:
        return None

    db.execute(
        update(Order)
        .where(Order.id == order.id, Order.status == OrderStatus.PENDING)
        .values(status=next_status)
    )
    db.commit()
    order.status = next_status
    return next_status


def get_admin_orders(db: Session) -> list[Order]:
    expire_pending_orders(db)
    orders = (
        db.execute(
            select(Order)
            .where(Order.is_deleted.is_(False))
            .options(joinedload(Order.items))
            .order_by(Order.created_at.desc())
        )
        .unique()
        .scalars()
        .all()
    )
    updates = _sync_with_stripe(db, orders)
    if not updates:
        return orders
    for order in orders:
        if order.id in updates:
            order.status = updates[order.id]
    return orders


def get_admin_orders_by_day(
    db: Session, day_key: str, only_deleted: bool = False
) -> list[Order]:
    expire_pending_orders(db)
    day_range = get_day_range(day_key)
    if not day_range:
        return []
    orders = (
        db.execute(
            select(Order)
            .where(
                Order.created_at >= day_range["start"],
                Order.created_at < day_range["end"],
                Order.is_deleted.is_(only_deleted),
            )
            .options(joinedload(Order.items))
            .order_by(Order.created_at.desc())
        )
        .unique()
        .scalars()
        .all()
    )
    updates = _sync_with_stripe(db, orders)
    if not updates:
        return orders
    for order in orders:
        if order.id in updates:
            order.status = updates[order.id]
    return orders


def get_admin_orders_by_week(
    db: Session, week_start_key: str, only_deleted: bool = False
) -> list[Order]:
    expire_pending_orders(db)
    week_range = get_week_range(week_start_key)
    if not week_range:
        return []
    orders = (
        db.execute(
            select(Order)
            .where(
                Order.created_at >= week_range["start"],
                Order.created_at < week_range["end"],
                Order.is_deleted.is_(only_deleted),
            )
            .options(joinedload(Order.items))
            .order_by(Order.created_at.desc())
        )
        .unique()
        .scalars()
        .all()
    )
    updates = _sync_with_stripe(db, orders)
    if not updates:
        return orders
    for order in orders:
        if order.id in updates:
            order.status = updates[order.id]
    return orders


def get_admin_orders_page(
    db: Session,
    only_deleted: bool = False,
    offset: int = 0,
    limit: int = 20,
) -> tuple[list[Order], bool, int | None]:
    expire_pending_orders(db)
    safe_offset = max(offset, 0)
    safe_limit = max(limit, 1)
    order_ids = (
        db.execute(
            select(Order.id)
            .where(Order.is_deleted.is_(only_deleted))
            .order_by(Order.created_at.desc(), Order.id.desc())
            .offset(safe_offset)
            .limit(safe_limit + 1)
        )
        .scalars()
        .all()
    )
    has_more = len(order_ids) > safe_limit
    page_order_ids = order_ids[:safe_limit]
    if not page_order_ids:
        return [], False, None

    orders = (
        db.execute(
            select(Order)
            .where(Order.id.in_(page_order_ids))
            .options(joinedload(Order.items))
        )
        .unique()
        .scalars()
        .all()
    )
    orders_by_id = {order.id: order for order in orders}
    sorted_orders = [
        orders_by_id[order_id]
        for order_id in page_order_ids
        if order_id in orders_by_id
    ]
    updates = _sync_with_stripe(db, sorted_orders)
    if updates:
        for order in sorted_orders:
            if order.id in updates:
                order.status = updates[order.id]

    next_offset = safe_offset + safe_limit if has_more else None
    return sorted_orders, has_more, next_offset


def get_orders_by_email(db: Session, email: str) -> list[Order]:
    expire_pending_orders(db)
    orders = (
        db.execute(
            select(Order)
            .where(Order.email == email)
            .options(joinedload(Order.items))
            .order_by(Order.created_at.desc())
        )
        .unique()
        .scalars()
        .all()
    )
    updates = _sync_with_stripe(db, orders)
    if not updates:
        return orders
    for order in orders:
        if order.id in updates:
            order.status = updates[order.id]
    return orders
