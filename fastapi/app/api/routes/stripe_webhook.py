from __future__ import annotations

import logging

import stripe
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select, update
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_db
from app.core.config import settings
from app.core.critical_logging import log_critical_event
from app.models.order import Order
from app.models.enums import OrderStatus
from app.services.email import send_admin_order_email, send_customer_order_email
from app.services.orders import resolve_order_status_from_session

router = APIRouter(prefix="/api/stripe", tags=["stripe"])


def _load_order_for_session(
    db: Session, order_id: str | None, session_id: str | None
) -> Order | None:
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
            return order

    if session_id:
        return (
            db.execute(
                select(Order)
                .where(Order.stripe_session_id == session_id)
                .options(joinedload(Order.items))
            )
            .unique()
            .scalars()
            .first()
        )

    return None


@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    if not settings.stripe_secret_key or not settings.stripe_webhook_secret:
        log_critical_event(
            domain="payment",
            event="stripe_webhook_not_configured",
            message="Stripe webhook called while Stripe webhook settings are missing.",
            request=request,
        )
        raise HTTPException(status_code=400, detail="Stripe webhook is not configured.")

    signature = request.headers.get("stripe-signature")
    if not signature:
        log_critical_event(
            domain="payment",
            event="stripe_signature_missing",
            message="Stripe webhook rejected: missing signature header.",
            request=request,
            level=logging.WARNING,
        )
        raise HTTPException(status_code=400, detail="Missing Stripe signature.")

    payload = await request.body()
    stripe.api_key = settings.stripe_secret_key

    try:
        event = stripe.Webhook.construct_event(
            payload=payload, sig_header=signature, secret=settings.stripe_webhook_secret
        )
    except Exception:
        log_critical_event(
            domain="payment",
            event="stripe_signature_invalid",
            message="Stripe webhook rejected: invalid signature.",
            request=request,
            level=logging.WARNING,
        )
        raise HTTPException(status_code=400, detail="Invalid signature.")

    if event["type"] in ["checkout.session.completed", "checkout.session.async_payment_succeeded"]:
        session = event["data"]["object"]
        metadata = session.get("metadata") or {}
        order_id = metadata.get("orderId")
        session_id = session.get("id")
        order = _load_order_for_session(db, order_id=order_id, session_id=session_id)

        if not order:
            log_critical_event(
                domain="payment",
                event="webhook_order_not_found",
                message="Stripe webhook references unknown order.",
                request=request,
                context={"order_id": order_id, "stripe_session_id": session_id},
            )
        elif order.stripe_session_id and session_id and order.stripe_session_id != session_id:
            log_critical_event(
                domain="payment",
                event="stripe_session_id_mismatch",
                message="Stripe webhook session id does not match stored order session id.",
                request=request,
                context={
                    "order_id": order.id,
                    "stripe_session_id": session_id,
                    "expected_stripe_session_id": order.stripe_session_id,
                },
            )
        else:
            resolved_status = resolve_order_status_from_session(order, session)
            if resolved_status == OrderStatus.PAID:
                updated = db.execute(
                    update(Order)
                    .where(Order.id == order.id, Order.status != OrderStatus.PAID)
                    .values(
                        status=OrderStatus.PAID,
                        stripe_session_id=session_id or order.stripe_session_id,
                    )
                )
                db.commit()
                if updated.rowcount:
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
                    try:
                        await send_admin_order_email(email_payload)
                        await send_customer_order_email(email_payload)
                    except Exception as exc:
                        log_critical_event(
                            domain="messaging",
                            event="order_email_delivery_failed",
                            message="Order confirmation email delivery failed after successful payment.",
                            request=request,
                            context={"order_id": order.id},
                            exc=exc,
                        )
            elif resolved_status == OrderStatus.FAILED:
                db.execute(
                    update(Order)
                    .where(Order.id == order.id, Order.status != OrderStatus.PAID)
                    .values(
                        status=OrderStatus.FAILED,
                        stripe_session_id=session_id or order.stripe_session_id,
                    )
                )
                db.commit()
            else:
                payment_status = (session.get("payment_status") or "").lower()
                session_status = (session.get("status") or "").lower()
                currency = (session.get("currency") or "").lower()
                if session_status == "complete" and payment_status in {"paid", "no_payment_required"}:
                    log_critical_event(
                        domain="payment",
                        event="stripe_payment_data_mismatch",
                        message="Stripe paid session does not match order amount or currency.",
                        request=request,
                        context={
                            "order_id": order.id,
                            "amount_total": session.get("amount_total"),
                            "expected_total": order.total_cents,
                            "currency": currency,
                            "expected_currency": order.currency.lower(),
                        },
                    )

    if event["type"] in ["checkout.session.expired", "checkout.session.async_payment_failed"]:
        session = event["data"]["object"]
        metadata = session.get("metadata") or {}
        order_id = metadata.get("orderId")
        session_id = session.get("id")
        order = _load_order_for_session(db, order_id=order_id, session_id=session_id)
        if order:
            db.execute(
                update(Order)
                .where(Order.id == order.id, Order.status != OrderStatus.PAID)
                .values(
                    status=OrderStatus.FAILED,
                    stripe_session_id=session_id or order.stripe_session_id,
                )
            )
            db.commit()
        else:
            log_critical_event(
                domain="payment",
                event="webhook_order_not_found",
                message="Stripe failure webhook references unknown order.",
                request=request,
                context={"order_id": order_id, "stripe_session_id": session_id},
            )

    return {"received": True}
