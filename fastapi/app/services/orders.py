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
            Order.is_deleted.is_(False),
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
