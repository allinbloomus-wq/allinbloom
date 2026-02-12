from __future__ import annotations

import stripe
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select, update
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_db
from app.core.config import settings
from app.models.order import Order
from app.models.enums import OrderStatus
from app.services.email import send_admin_order_email, send_customer_order_email

router = APIRouter(prefix="/api/stripe", tags=["stripe"])


@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    if not settings.stripe_secret_key or not settings.stripe_webhook_secret:
        raise HTTPException(status_code=400, detail="Stripe webhook is not configured.")

    signature = request.headers.get("stripe-signature")
    if not signature:
        raise HTTPException(status_code=400, detail="Missing Stripe signature.")

    payload = await request.body()
    stripe.api_key = settings.stripe_secret_key

    try:
        event = stripe.Webhook.construct_event(
            payload=payload, sig_header=signature, secret=settings.stripe_webhook_secret
        )
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid signature.")

    if event["type"] in ["checkout.session.completed", "checkout.session.async_payment_succeeded"]:
        session = event["data"]["object"]
        order_id = (session.get("metadata") or {}).get("orderId")
        if order_id:
            order = (
                db.execute(
                    select(Order).where(Order.id == order_id).options(joinedload(Order.items))
                )
                .unique()
                .scalars()
                .first()
            )
            if order:
                is_paid = session.get("payment_status") == "paid" and session.get("status") == "complete"
                amount_matches = isinstance(session.get("amount_total"), int) and session.get("amount_total") == order.total_cents
                currency = (session.get("currency") or "").lower()
                currency_matches = not currency or currency == order.currency.lower()
                if is_paid and amount_matches and currency_matches:
                    updated = db.execute(
                        update(Order)
                        .where(Order.id == order_id, Order.status != OrderStatus.PAID)
                        .values(
                            status=OrderStatus.PAID,
                            stripe_session_id=session.get("id") or order.stripe_session_id,
                        )
                    )
                    db.commit()
                    if updated.rowcount:
                        metadata = session.get("metadata") or {}
                        email_payload = {
                            "order_id": order.id,
                            "total_cents": order.total_cents,
                            "currency": order.currency,
                            "email": order.email,
                            "phone": metadata.get("phone") or order.phone,
                            "items": [
                                {
                                    "name": item.name,
                                    "quantity": item.quantity,
                                    "price_cents": item.price_cents,
                                }
                                for item in order.items
                            ],
                            "delivery_address": metadata.get("deliveryAddress"),
                            "delivery_miles": metadata.get("deliveryMiles"),
                            "delivery_fee": metadata.get("deliveryFeeCents"),
                            "first_order_discount": metadata.get("firstOrderDiscountPercent"),
                        }
                        await send_admin_order_email(email_payload)
                        await send_customer_order_email(email_payload)

    if event["type"] in ["checkout.session.expired", "checkout.session.async_payment_failed"]:
        session = event["data"]["object"]
        order_id = (session.get("metadata") or {}).get("orderId")
        if order_id:
            db.execute(
                update(Order)
                .where(Order.id == order_id, Order.status != OrderStatus.PAID)
                .values(status=OrderStatus.FAILED)
            )
            db.commit()

    return {"received": True}
