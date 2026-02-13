from __future__ import annotations

import stripe
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_db, get_current_user, require_admin
from app.core.config import settings
from app.core.critical_logging import log_critical_event
from app.models.order import Order
from app.schemas.order import (
    OrderCountOut,
    OrderOut,
    OrderToggleOut,
    OrdersByDayOut,
    StripeAddressOut,
    StripeSessionOut,
    StripeShippingOut,
)
from app.services.orders import (
    expire_pending_orders,
    get_admin_orders,
    get_admin_orders_by_day,
    get_orders_by_email,
)
from app.utils.admin_orders import parse_day_key

router = APIRouter(prefix="/api", tags=["orders"])


@router.get("/orders/me", response_model=list[OrderOut])
def list_my_orders(user=Depends(get_current_user), db: Session = Depends(get_db)):
    orders = get_orders_by_email(db, user.email)
    return orders


@router.get("/orders/{order_id}", response_model=OrderOut)
def get_order(order_id: str, db: Session = Depends(get_db), _admin=Depends(require_admin)):
    expire_pending_orders(db)
    order = (
        db.execute(select(Order).where(Order.id == order_id).options(joinedload(Order.items)))
        .unique()
        .scalars()
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Not found")
    return order


@router.get("/admin/orders", response_model=list[OrderOut])
def list_admin_orders(db: Session = Depends(get_db), _admin=Depends(require_admin)):
    return get_admin_orders(db)


@router.get("/admin/orders/new-count", response_model=OrderCountOut)
def new_orders_count(db: Session = Depends(get_db), _admin=Depends(require_admin)):
    count = db.execute(
        select(func.count()).select_from(Order).where(Order.is_read.is_(False))
    ).scalar_one()
    return OrderCountOut(count=count)


@router.get("/admin/orders/by-day", response_model=OrdersByDayOut)
def orders_by_day(
    date: str = Query(..., alias="date"),
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    if not parse_day_key(date):
        raise HTTPException(status_code=400, detail="Invalid date")
    orders = get_admin_orders_by_day(db, date)
    return OrdersByDayOut(day_key=date, orders=orders)


@router.patch("/admin/orders/{order_id}/toggle-read", response_model=OrderToggleOut)
def toggle_read(
    order_id: str,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    order = db.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Not found")
    order.is_read = not bool(order.is_read)
    db.commit()
    db.refresh(order)
    return OrderToggleOut(is_read=bool(order.is_read))


@router.get("/admin/orders/{order_id}/stripe-session", response_model=StripeSessionOut)
def get_order_stripe_session(
    order_id: str,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    order = db.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Not found")

    if not settings.stripe_secret_key or not order.stripe_session_id:
        return StripeSessionOut()

    stripe.api_key = settings.stripe_secret_key
    try:
        session = stripe.checkout.Session.retrieve(order.stripe_session_id)
    except Exception as exc:
        log_critical_event(
            domain="payment",
            event="stripe_session_fetch_failed",
            message="Admin failed to load Stripe session for order.",
            context={"order_id": order_id},
            exc=exc,
        )
        raise HTTPException(status_code=502, detail="Unable to load Stripe session.")

    shipping = getattr(session, "shipping_details", None)
    address = getattr(shipping, "address", None) if shipping else None
    return StripeSessionOut(
        payment_status=getattr(session, "payment_status", None),
        status=getattr(session, "status", None),
        shipping=StripeShippingOut(
            name=getattr(shipping, "name", None),
            phone=getattr(shipping, "phone", None),
            address=StripeAddressOut(
                line1=getattr(address, "line1", None),
                line2=getattr(address, "line2", None),
                city=getattr(address, "city", None),
                state=getattr(address, "state", None),
                postal_code=getattr(address, "postal_code", None),
                country=getattr(address, "country", None),
            )
            if address
            else None,
        )
        if shipping
        else None,
    )
