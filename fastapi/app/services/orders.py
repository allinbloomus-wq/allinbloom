from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Iterable

import stripe
from sqlalchemy import select, update
from sqlalchemy.orm import Session, joinedload

from app.core.config import settings
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.enums import OrderStatus
from app.utils.admin_orders import get_day_range


PENDING_EXPIRATION_HOURS = 24


def expire_pending_orders(db: Session) -> None:
    cutoff = datetime.now(timezone.utc) - timedelta(hours=PENDING_EXPIRATION_HOURS)
    db.execute(
        update(Order)
        .where(
            Order.status == OrderStatus.PENDING,
            Order.stripe_session_id.is_not(None),
            Order.created_at < cutoff,
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

        amount_matches = (
            isinstance(session.amount_total, int)
            and session.amount_total == order.total_cents
        )
        currency_matches = (
            not session.currency
            or session.currency.lower() == order.currency.lower()
        )
        is_paid = (
            session.payment_status == "paid"
            and session.status == "complete"
            and amount_matches
            and currency_matches
        )
        if is_paid:
            db.execute(
                update(Order)
                .where(Order.id == order.id)
                .values(status=OrderStatus.PAID)
            )
            updates[order.id] = OrderStatus.PAID
            continue

        is_expired = session.status == "expired" or (
            isinstance(session.expires_at, int) and session.expires_at < now_seconds
        )
        is_unpaid_complete = session.payment_status == "unpaid" and session.status != "open"
        if is_expired or is_unpaid_complete:
            db.execute(
                update(Order)
                .where(Order.id == order.id)
                .values(status=OrderStatus.FAILED)
            )
            updates[order.id] = OrderStatus.FAILED

    if updates:
        db.commit()
    return updates


def get_admin_orders(db: Session) -> list[Order]:
    expire_pending_orders(db)
    orders = (
        db.execute(select(Order).options(joinedload(Order.items)).order_by(Order.created_at.desc()))
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


def get_admin_orders_by_day(db: Session, day_key: str) -> list[Order]:
    expire_pending_orders(db)
    day_range = get_day_range(day_key)
    if not day_range:
        return []
    orders = (
        db.execute(
            select(Order)
            .where(Order.created_at >= day_range["start"], Order.created_at < day_range["end"])
            .options(joinedload(Order.items))
            .order_by(Order.created_at.desc())
        )
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


def get_orders_by_email(db: Session, email: str) -> list[Order]:
    expire_pending_orders(db)
    orders = (
        db.execute(
            select(Order)
            .where(Order.email == email)
            .options(joinedload(Order.items))
            .order_by(Order.created_at.desc())
        )
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
