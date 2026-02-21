from __future__ import annotations

import json
import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select, update
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_db
from app.core.critical_logging import log_critical_event
from app.models.enums import OrderStatus
from app.models.order import Order
from app.schemas.paypal import PayPalCaptureRequest, PayPalCaptureResponse
from app.services.email import send_admin_order_email, send_customer_order_email
from app.services.orders import resolve_order_status_from_paypal_order
from app.services.paypal import (
    PayPalApiError,
    paypal_capture_order,
    paypal_extract_order_metadata,
    paypal_get_order,
    paypal_is_configured,
    paypal_verify_webhook_signature,
    paypal_webhook_is_configured,
)
from app.services.webhook_events import (
    is_webhook_event_processed,
    mark_webhook_event_processed,
)


router = APIRouter(prefix="/api/paypal", tags=["paypal"])


def _load_order_by_id(db: Session, order_id: str | None) -> Order | None:
    if not order_id:
        return None
    return (
        db.execute(
            select(Order).where(Order.id == order_id).options(joinedload(Order.items))
        )
        .unique()
        .scalars()
        .first()
    )


def _build_email_payload(order: Order) -> dict:
    return {
        "order_id": order.id,
        "total_cents": order.total_cents,
        "currency": order.currency,
        "email": order.email,
        "phone": order.phone,
        "items": [
            {"name": item.name, "quantity": item.quantity, "price_cents": item.price_cents}
            for item in order.items
        ],
        "delivery_address": order.delivery_address,
        "delivery_miles": order.delivery_miles,
        "delivery_fee": order.delivery_fee_cents,
        "first_order_discount": order.first_order_discount_percent,
    }


def _set_order_failed(
    db: Session,
    *,
    order: Order,
    paypal_order_id: str,
    capture_id: str | None,
) -> None:
    db.execute(
        update(Order)
        .where(Order.id == order.id, Order.status != OrderStatus.PAID)
        .values(
            status=OrderStatus.FAILED,
            paypal_order_id=paypal_order_id,
            paypal_capture_id=capture_id or order.paypal_capture_id,
        )
    )
    db.commit()


def _find_order_for_paypal(db: Session, *, order_id: str | None, paypal_order_id: str | None) -> Order | None:
    order = _load_order_by_id(db, order_id)
    if order:
        return order
    if not paypal_order_id:
        return None
    return (
        db.execute(
            select(Order)
            .where(Order.paypal_order_id == paypal_order_id)
            .options(joinedload(Order.items))
        )
        .unique()
        .scalars()
        .first()
    )


def _resolve_paypal_order_id_from_event(event: dict[str, Any], event_type: str) -> str | None:
    resource = event.get("resource")
    if not isinstance(resource, dict):
        return None

    if event_type.startswith("CHECKOUT.ORDER."):
        direct_id = resource.get("id")
        if isinstance(direct_id, str) and direct_id.strip():
            return direct_id

    supplementary = resource.get("supplementary_data")
    if isinstance(supplementary, dict):
        related_ids = supplementary.get("related_ids")
        if isinstance(related_ids, dict):
            related_order_id = related_ids.get("order_id")
            if isinstance(related_order_id, str) and related_order_id.strip():
                return related_order_id

    return None


def _is_paypal_event_type_supported(event_type: str) -> bool:
    return event_type in {
        "CHECKOUT.ORDER.APPROVED",
        "CHECKOUT.ORDER.COMPLETED",
        "CHECKOUT.ORDER.VOIDED",
        "PAYMENT.CAPTURE.COMPLETED",
        "PAYMENT.CAPTURE.DECLINED",
        "PAYMENT.CAPTURE.DENIED",
    }


@router.post("/capture", response_model=PayPalCaptureResponse)
async def capture_paypal_order(
    payload: PayPalCaptureRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    if not paypal_is_configured():
        log_critical_event(
            domain="payment",
            event="paypal_not_configured",
            message="PayPal capture requested while PayPal is not configured.",
            request=request,
        )
        raise HTTPException(status_code=400, detail="PayPal is not configured.")

    paypal_order_id = (payload.order_id or "").strip()
    if not paypal_order_id:
        raise HTTPException(status_code=400, detail="Missing PayPal order id.")

    try:
        order_payload = paypal_get_order(paypal_order_id)
    except PayPalApiError as exc:
        log_critical_event(
            domain="payment",
            event="paypal_order_fetch_failed",
            message="Failed to fetch PayPal order during capture.",
            request=request,
            context={"paypal_order_id": paypal_order_id},
            exc=exc,
        )
        raise HTTPException(status_code=502, detail="Unable to verify PayPal order.")

    metadata = paypal_extract_order_metadata(order_payload)
    order_id = metadata.get("custom_id")
    order = _find_order_for_paypal(
        db,
        order_id=order_id if isinstance(order_id, str) else None,
        paypal_order_id=paypal_order_id,
    )
    if not order:
        log_critical_event(
            domain="payment",
            event="paypal_order_not_found",
            message="PayPal capture references unknown order.",
            request=request,
            context={"paypal_order_id": paypal_order_id, "order_id": order_id},
        )
        raise HTTPException(status_code=404, detail="Order not found.")
    if order.paypal_order_id and order.paypal_order_id != paypal_order_id:
        log_critical_event(
            domain="payment",
            event="paypal_order_id_mismatch",
            message="PayPal order id mismatch for capture request.",
            request=request,
            context={
                "order_id": order.id,
                "paypal_order_id": paypal_order_id,
                "expected_paypal_order_id": order.paypal_order_id,
            },
        )
        raise HTTPException(status_code=400, detail="PayPal order id mismatch.")

    amount_cents = metadata.get("amount_cents")
    currency = metadata.get("currency")
    if isinstance(amount_cents, int) and amount_cents != order.total_cents:
        log_critical_event(
            domain="payment",
            event="paypal_amount_mismatch",
            message="PayPal order amount mismatch.",
            request=request,
            context={
                "order_id": order.id,
                "paypal_order_id": paypal_order_id,
                "amount_cents": amount_cents,
                "expected_total": order.total_cents,
            },
        )
        raise HTTPException(status_code=400, detail="Order amount mismatch.")
    if currency and currency.upper() != order.currency.upper():
        log_critical_event(
            domain="payment",
            event="paypal_currency_mismatch",
            message="PayPal order currency mismatch.",
            request=request,
            context={
                "order_id": order.id,
                "paypal_order_id": paypal_order_id,
                "currency": currency,
                "expected_currency": order.currency,
            },
        )
        raise HTTPException(status_code=400, detail="Order currency mismatch.")

    status = metadata.get("status") or ""
    if status == "APPROVED":
        try:
            order_payload = paypal_capture_order(paypal_order_id)
        except PayPalApiError as exc:
            log_critical_event(
                domain="payment",
                event="paypal_capture_failed",
                message="PayPal capture failed.",
                request=request,
                context={"order_id": order.id, "paypal_order_id": paypal_order_id},
                exc=exc,
            )
            if exc.status_code is not None and 400 <= exc.status_code < 500:
                _set_order_failed(
                    db,
                    order=order,
                    paypal_order_id=paypal_order_id,
                    capture_id=metadata.get("capture_id")
                    if isinstance(metadata.get("capture_id"), str)
                    else None,
                )
                raise HTTPException(
                    status_code=400,
                    detail="PayPal payment was declined or canceled.",
                )
            raise HTTPException(status_code=502, detail="Unable to capture PayPal order.")
        metadata = paypal_extract_order_metadata(order_payload)
        status = metadata.get("status") or ""
        amount_cents = metadata.get("amount_cents")
        currency = metadata.get("currency")
        if isinstance(amount_cents, int) and amount_cents != order.total_cents:
            log_critical_event(
                domain="payment",
                event="paypal_amount_mismatch",
                message="PayPal captured amount mismatch.",
                request=request,
                context={
                    "order_id": order.id,
                    "paypal_order_id": paypal_order_id,
                    "amount_cents": amount_cents,
                    "expected_total": order.total_cents,
                },
            )
            raise HTTPException(status_code=400, detail="Order amount mismatch.")
        if currency and currency.upper() != order.currency.upper():
            log_critical_event(
                domain="payment",
                event="paypal_currency_mismatch",
                message="PayPal captured currency mismatch.",
                request=request,
                context={
                    "order_id": order.id,
                    "paypal_order_id": paypal_order_id,
                    "currency": currency,
                    "expected_currency": order.currency,
                },
            )
            raise HTTPException(status_code=400, detail="Order currency mismatch.")

    resolved_status, capture_id = resolve_order_status_from_paypal_order(order, order_payload)
    if order.status == OrderStatus.PAID:
        if not order.paypal_order_id:
            order.paypal_order_id = paypal_order_id
            order.paypal_capture_id = capture_id or order.paypal_capture_id
            db.commit()
        return PayPalCaptureResponse(status=order.status.value)

    if resolved_status == OrderStatus.PAID:
        updated = db.execute(
            update(Order)
            .where(Order.id == order.id, Order.status != OrderStatus.PAID)
            .values(
                status=OrderStatus.PAID,
                paypal_order_id=paypal_order_id,
                paypal_capture_id=capture_id,
            )
        )
        db.commit()
        if updated.rowcount:
            email_payload = _build_email_payload(order)
            try:
                await send_admin_order_email(email_payload)
                await send_customer_order_email(email_payload)
            except Exception as exc:
                log_critical_event(
                    domain="messaging",
                    event="order_email_delivery_failed",
                    message="Order confirmation email delivery failed after PayPal payment.",
                    request=request,
                    context={"order_id": order.id},
                    exc=exc,
                )
        return PayPalCaptureResponse(status=OrderStatus.PAID.value)

    if resolved_status == OrderStatus.FAILED:
        _set_order_failed(
            db,
            order=order,
            paypal_order_id=paypal_order_id,
            capture_id=capture_id,
        )
        return PayPalCaptureResponse(status=OrderStatus.FAILED.value)

    if status in {"CREATED", "SAVED", "PAYER_ACTION_REQUIRED"}:
        _set_order_failed(
            db,
            order=order,
            paypal_order_id=paypal_order_id,
            capture_id=capture_id,
        )
        return PayPalCaptureResponse(status=OrderStatus.FAILED.value)

    if not order.paypal_order_id:
        order.paypal_order_id = paypal_order_id
        order.paypal_capture_id = capture_id or order.paypal_capture_id
        db.commit()

    return PayPalCaptureResponse(status=order.status.value)


@router.post("/webhook")
async def paypal_webhook(request: Request, db: Session = Depends(get_db)):
    if not paypal_webhook_is_configured():
        log_critical_event(
            domain="payment",
            event="paypal_webhook_not_configured",
            message="PayPal webhook called while PayPal webhook settings are missing.",
            request=request,
        )
        raise HTTPException(status_code=400, detail="PayPal webhook is not configured.")

    payload_bytes = await request.body()
    try:
        event = json.loads(payload_bytes.decode("utf-8"))
    except Exception:
        log_critical_event(
            domain="payment",
            event="paypal_webhook_invalid_json",
            message="PayPal webhook rejected: invalid JSON payload.",
            request=request,
            level=logging.WARNING,
        )
        raise HTTPException(status_code=400, detail="Invalid payload.")

    if not isinstance(event, dict):
        raise HTTPException(status_code=400, detail="Invalid payload.")

    try:
        signature_ok = paypal_verify_webhook_signature(
            event_payload=event,
            headers=request.headers,
        )
    except PayPalApiError as exc:
        log_critical_event(
            domain="payment",
            event="paypal_webhook_signature_verification_failed",
            message="PayPal webhook signature verification failed.",
            request=request,
            exc=exc,
            level=logging.WARNING,
        )
        raise HTTPException(status_code=400, detail="Invalid PayPal signature.")

    if not signature_ok:
        log_critical_event(
            domain="payment",
            event="paypal_webhook_signature_invalid",
            message="PayPal webhook rejected: invalid signature.",
            request=request,
            level=logging.WARNING,
        )
        raise HTTPException(status_code=400, detail="Invalid PayPal signature.")

    event_id = event.get("id")
    if not isinstance(event_id, str) or not event_id.strip():
        log_critical_event(
            domain="payment",
            event="paypal_event_missing_id",
            message="PayPal webhook rejected: missing event id.",
            request=request,
            level=logging.WARNING,
        )
        raise HTTPException(status_code=400, detail="Invalid PayPal event.")

    if is_webhook_event_processed(db, provider="paypal", event_id=event_id):
        return {"received": True}

    event_type = str(event.get("event_type") or "")
    if not _is_paypal_event_type_supported(event_type):
        mark_webhook_event_processed(db, provider="paypal", event_id=event_id)
        return {"received": True}

    paypal_order_id = _resolve_paypal_order_id_from_event(event, event_type)
    if not paypal_order_id:
        log_critical_event(
            domain="payment",
            event="paypal_webhook_order_id_missing",
            message="PayPal webhook event does not contain order id.",
            request=request,
            context={"event_type": event_type, "event_id": event_id},
            level=logging.WARNING,
        )
        mark_webhook_event_processed(db, provider="paypal", event_id=event_id)
        return {"received": True}

    try:
        if event_type == "CHECKOUT.ORDER.APPROVED":
            order_payload = paypal_capture_order(paypal_order_id)
        else:
            order_payload = paypal_get_order(paypal_order_id)
    except PayPalApiError as exc:
        log_critical_event(
            domain="payment",
            event="paypal_webhook_order_fetch_failed",
            message="PayPal webhook failed to fetch/capture order.",
            request=request,
            context={
                "event_type": event_type,
                "event_id": event_id,
                "paypal_order_id": paypal_order_id,
            },
            exc=exc,
        )
        raise HTTPException(status_code=502, detail="Unable to process PayPal webhook.")

    metadata = paypal_extract_order_metadata(order_payload)
    custom_id = metadata.get("custom_id")
    order = _find_order_for_paypal(
        db,
        order_id=custom_id if isinstance(custom_id, str) else None,
        paypal_order_id=paypal_order_id,
    )

    if not order:
        log_critical_event(
            domain="payment",
            event="paypal_webhook_order_not_found",
            message="PayPal webhook references unknown order.",
            request=request,
            context={
                "event_type": event_type,
                "event_id": event_id,
                "paypal_order_id": paypal_order_id,
                "order_id": custom_id,
            },
            level=logging.WARNING,
        )
        mark_webhook_event_processed(db, provider="paypal", event_id=event_id)
        return {"received": True}

    amount_cents = metadata.get("amount_cents")
    currency = metadata.get("currency")
    if isinstance(amount_cents, int) and amount_cents != order.total_cents:
        log_critical_event(
            domain="payment",
            event="paypal_amount_mismatch",
            message="PayPal webhook order amount mismatch.",
            request=request,
            context={
                "event_type": event_type,
                "event_id": event_id,
                "order_id": order.id,
                "paypal_order_id": paypal_order_id,
                "amount_cents": amount_cents,
                "expected_total": order.total_cents,
            },
        )
        mark_webhook_event_processed(db, provider="paypal", event_id=event_id)
        return {"received": True}
    if currency and currency.upper() != order.currency.upper():
        log_critical_event(
            domain="payment",
            event="paypal_currency_mismatch",
            message="PayPal webhook order currency mismatch.",
            request=request,
            context={
                "event_type": event_type,
                "event_id": event_id,
                "order_id": order.id,
                "paypal_order_id": paypal_order_id,
                "currency": currency,
                "expected_currency": order.currency,
            },
        )
        mark_webhook_event_processed(db, provider="paypal", event_id=event_id)
        return {"received": True}

    resolved_status, capture_id = resolve_order_status_from_paypal_order(order, order_payload)
    if resolved_status == OrderStatus.PAID:
        updated = db.execute(
            update(Order)
            .where(Order.id == order.id, Order.status != OrderStatus.PAID)
            .values(
                status=OrderStatus.PAID,
                paypal_order_id=paypal_order_id,
                paypal_capture_id=capture_id or order.paypal_capture_id,
            )
        )
        db.commit()
        if updated.rowcount:
            email_payload = _build_email_payload(order)
            try:
                await send_admin_order_email(email_payload)
                await send_customer_order_email(email_payload)
            except Exception as exc:
                log_critical_event(
                    domain="messaging",
                    event="order_email_delivery_failed",
                    message="Order confirmation email delivery failed after PayPal webhook payment.",
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
                paypal_order_id=paypal_order_id,
                paypal_capture_id=capture_id or order.paypal_capture_id,
            )
        )
        db.commit()
    else:
        if not order.paypal_order_id:
            order.paypal_order_id = paypal_order_id
            order.paypal_capture_id = capture_id or order.paypal_capture_id
            db.commit()

    mark_webhook_event_processed(db, provider="paypal", event_id=event_id)
    return {"received": True}
