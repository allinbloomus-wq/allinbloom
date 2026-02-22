from __future__ import annotations

from datetime import datetime, timezone
import logging
from urllib.parse import quote_plus

from fastapi import APIRouter, Depends, HTTPException, Request
import stripe
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_optional_user
from app.core.config import settings
from app.core.critical_logging import log_critical_event
from app.core.security import create_checkout_cancel_token, decode_checkout_cancel_token
from app.models.bouquet import Bouquet
from app.models.enums import OrderStatus
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.user import User
from app.schemas.checkout import (
    CheckoutCancelRequest,
    CheckoutCancelResponse,
    CheckoutRequest,
    CheckoutResponse,
    CheckoutStatusRequest,
    CheckoutStatusResponse,
)
from app.services.delivery import get_delivery_quote
from app.services.orders import (
    STRIPE_CHECKOUT_SESSION_EXPIRATION_SECONDS,
    resolve_order_status_from_paypal_order,
    resolve_order_status_from_session,
    sync_order_with_paypal,
    sync_order_with_stripe,
)
from app.services.paypal import (
    PayPalApiError,
    paypal_create_order,
    paypal_get_order,
    paypal_is_configured,
    paypal_void_order,
)
from app.services.pricing import apply_percent_discount, get_bouquet_discount
from app.services.settings import get_store_settings

router = APIRouter(prefix="/api/checkout", tags=["checkout"])


def _set_order_status_safely(db: Session, order: Order, status: OrderStatus) -> None:
    try:
        order.status = status
        db.commit()
    except Exception:
        db.rollback()


def _order_email(order: Order) -> str:
    return (order.email or "").strip().lower()


def _is_order_access_allowed(order: Order, *, user, cancel_token: str | None) -> bool:
    order_email = _order_email(order)
    if not order_email:
        return False

    user_email = ((getattr(user, "email", None) or "")).strip().lower()
    if user_email and user_email == order_email:
        return True

    token_value = (cancel_token or "").strip()
    if not token_value:
        return False

    try:
        token_payload = decode_checkout_cancel_token(token_value)
    except Exception:
        return False

    token_order_id = str(token_payload.get("order_id") or "").strip()
    token_email = str(token_payload.get("email") or "").strip().lower()
    return token_order_id == order.id and token_email == order_email


@router.post("", response_model=CheckoutResponse)
async def start_checkout(
    payload: CheckoutRequest,
    request: Request,
    user=Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    user_id = user.id if user else None

    payment_method = (payload.payment_method or "stripe").strip().lower()
    if payment_method not in {"stripe", "paypal"}:
        log_critical_event(
            domain="payment",
            event="checkout_invalid_payment_method",
            message="Checkout requested with unsupported payment method.",
            request=request,
            context={"user_id": user_id, "payment_method": payment_method},
            level=logging.WARNING,
        )
        raise HTTPException(status_code=400, detail="Unsupported payment method.")

    if payment_method == "stripe":
        if not settings.stripe_secret_key:
            log_critical_event(
                domain="payment",
                event="stripe_not_configured",
                message="Checkout requested while Stripe is not configured.",
                request=request,
                context={"user_id": user_id},
            )
            raise HTTPException(status_code=400, detail="Stripe is not configured.")
    else:
        if not paypal_is_configured():
            log_critical_event(
                domain="payment",
                event="paypal_not_configured",
                message="Checkout requested while PayPal is not configured.",
                request=request,
                context={"user_id": user_id},
            )
            raise HTTPException(status_code=400, detail="PayPal is not configured.")

    items = payload.items
    address = payload.address.strip()
    raw_phone = payload.phone.strip()
    payload_email = (payload.email or "").strip().lower()
    checkout_email = (user.email or "").strip().lower() if user else payload_email
    digits = "".join(char for char in raw_phone if char.isdigit())
    normalized_phone = f"+{digits}" if len(digits) == 11 and digits.startswith("1") else ""

    if not items:
        log_critical_event(
            domain="cart",
            event="checkout_empty_cart",
            message="Checkout request contains no items.",
            request=request,
            context={"user_id": user_id},
            level=logging.WARNING,
        )
        raise HTTPException(status_code=400, detail="No items provided.")
    if "@" not in checkout_email:
        log_critical_event(
            domain="personal_data",
            event="checkout_missing_or_invalid_email",
            message="Checkout request has missing or invalid email.",
            request=request,
            context={"user_id": user_id},
            level=logging.WARNING,
        )
        raise HTTPException(status_code=400, detail="A valid email is required.")
    if not address:
        log_critical_event(
            domain="personal_data",
            event="checkout_missing_address",
            message="Checkout request has empty delivery address.",
            request=request,
            context={"user_id": user_id},
            level=logging.WARNING,
        )
        raise HTTPException(status_code=400, detail="Delivery address is required.")
    if not normalized_phone:
        log_critical_event(
            domain="personal_data",
            event="checkout_invalid_phone",
            message="Checkout request has invalid phone format.",
            request=request,
            context={"user_id": user_id, "phone_length": len(raw_phone)},
            level=logging.WARNING,
        )
        raise HTTPException(status_code=400, detail="Use phone format +1 312 555 0123.")

    settings_row = get_store_settings(db)
    delivery = await get_delivery_quote(address)
    if not delivery.ok:
        log_critical_event(
            domain="payment",
            event="delivery_quote_failed",
            message="Delivery quote failed during checkout.",
            request=request,
            context={"user_id": user_id, "item_count": len(items)},
        )
        raise HTTPException(status_code=400, detail=delivery.error or "Unable to calculate delivery.")

    bouquet_ids = [item.id for item in items if not item.is_custom]
    bouquets = (
        db.execute(select(Bouquet).where(Bouquet.id.in_(bouquet_ids), Bouquet.is_active.is_(True)))
        .scalars()
        .all()
    )
    bouquet_map = {bouquet.id: bouquet for bouquet in bouquets}

    has_any_discount = False
    normalized_items = []

    for item in items:
        if item.is_custom:
            price_cents = int(item.price_cents or 0)
            quantity = max(1, item.quantity)
            if not item.name or not item.image:
                log_critical_event(
                    domain="cart",
                    event="invalid_custom_item_payload",
                    message="Custom cart item is missing required fields.",
                    request=request,
                    context={"user_id": user_id, "item_id": item.id},
                    level=logging.WARNING,
                )
                raise HTTPException(status_code=400, detail="Some items are unavailable.")
            if price_cents < 6500 or price_cents > 18000:
                log_critical_event(
                    domain="cart",
                    event="invalid_custom_item_price",
                    message="Custom cart item price is out of expected range.",
                    request=request,
                    context={"user_id": user_id, "item_id": item.id, "price_cents": price_cents},
                    level=logging.WARNING,
                )
                raise HTTPException(status_code=400, detail="Some items are unavailable.")
            normalized_items.append(
                {
                    "id": item.id,
                    "name": item.name,
                    "image": item.image,
                    "quantity": quantity,
                    "unit_price": price_cents,
                }
            )
            continue

        bouquet = bouquet_map.get(item.id)
        if not bouquet:
            log_critical_event(
                domain="cart",
                event="checkout_item_not_found",
                message="Checkout item does not exist or is inactive.",
                request=request,
                context={"user_id": user_id, "item_id": item.id},
                level=logging.WARNING,
            )
            raise HTTPException(status_code=400, detail="Some items are unavailable.")
        discount = get_bouquet_discount(bouquet, settings_row)
        if discount:
            has_any_discount = True
        unit_price = (
            apply_percent_discount(bouquet.price_cents, discount.percent)
            if discount
            else bouquet.price_cents
        )
        normalized_items.append(
            {
                "id": bouquet.id,
                "name": bouquet.name,
                "image": bouquet.image,
                "quantity": max(1, item.quantity),
                "unit_price": unit_price,
            }
        )

    orders_count = 0
    has_existing_first_order_discount = False
    if user:
        # Serialize first-order-discount calculation for the same user.
        db.execute(select(User.id).where(User.id == user.id).with_for_update()).first()
        orders_count = (
            db.execute(
                select(func.count())
                .select_from(Order)
                .where(Order.email == checkout_email, Order.status == OrderStatus.PAID)
            ).scalar_one()
        )
        has_existing_first_order_discount = (
            db.execute(
                select(Order.id)
                .where(
                    Order.email == checkout_email,
                    Order.first_order_discount_percent > 0,
                    Order.status.in_([OrderStatus.PENDING, OrderStatus.PAID]),
                )
                .limit(1)
            )
            .scalars()
            .first()
            is not None
        )
    first_order_discount_percent = (
        settings_row.first_order_discount_percent
        if user
        and orders_count == 0
        and not has_existing_first_order_discount
        and not has_any_discount
        else 0
    )

    discounted_items = []
    for item in normalized_items:
        unit_price = (
            apply_percent_discount(item["unit_price"], first_order_discount_percent)
            if first_order_discount_percent > 0
            else item["unit_price"]
        )
        discounted_items.append({**item, "unit_price": unit_price})

    discounted_subtotal = sum(item["unit_price"] * item["quantity"] for item in discounted_items)
    computed_total = discounted_subtotal + (delivery.fee_cents or 0)

    order_items = [
        OrderItem(
            name=item["name"],
            price_cents=item["unit_price"],
            quantity=item["quantity"],
            image=item["image"],
        )
        for item in discounted_items
    ]

    if delivery.fee_cents and delivery.fee_cents > 0:
        order_items.append(
            OrderItem(
                name=f"Delivery ({delivery.distance_text})",
                price_cents=delivery.fee_cents,
                quantity=1,
                image="",
            )
        )

    order = Order(
        email=checkout_email,
        phone=normalized_phone,
        total_cents=computed_total,
        items=order_items,
        delivery_address=address,
        delivery_miles=f"{delivery.miles:.1f}" if delivery.miles is not None else None,
        delivery_fee_cents=delivery.fee_cents,
        first_order_discount_percent=first_order_discount_percent,
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    if user and user.phone != normalized_phone:
        user.phone = normalized_phone
        db.commit()

    origin = settings.resolved_site_url()
    checkout_cancel_token = create_checkout_cancel_token(
        order_id=order.id, email=checkout_email
    )
    encoded_cancel_token = quote_plus(checkout_cancel_token)
    encoded_order_id = quote_plus(order.id)

    if payment_method == "paypal":
        try:
            paypal_order = paypal_create_order(
                order_id=order.id,
                total_cents=computed_total,
                currency=order.currency,
                return_url=(
                    f"{origin}/checkout/success?provider=paypal&orderId={encoded_order_id}"
                    f"&cancelToken={encoded_cancel_token}"
                ),
                cancel_url=(
                    f"{origin}/cart?checkoutCanceled=1&orderId={encoded_order_id}"
                    f"&cancelToken={encoded_cancel_token}&provider=paypal"
                ),
            )
        except PayPalApiError as exc:
            log_critical_event(
                domain="payment",
                event="paypal_order_create_failed",
                message="PayPal order creation failed.",
                request=request,
                context={"order_id": order.id, "user_id": user_id, "item_count": len(discounted_items)},
                exc=exc,
            )
            _set_order_status_safely(db, order, OrderStatus.FAILED)
            raise HTTPException(status_code=502, detail="Unable to start checkout.")

        order.paypal_order_id = paypal_order.order_id
        db.commit()
        return CheckoutResponse(url=paypal_order.approve_url)

    stripe.api_key = settings.stripe_secret_key
    expires_at = int(datetime.now(timezone.utc).timestamp()) + STRIPE_CHECKOUT_SESSION_EXPIRATION_SECONDS

    line_items = [
        {
            "price_data": {
                "currency": "usd",
                "product_data": {
                    "name": item["name"],
                    "images": [f"{origin}{item['image']}"] if item["image"] else [],
                },
                "unit_amount": item["unit_price"],
            },
            "quantity": item["quantity"],
        }
        for item in discounted_items
    ]

    if delivery.fee_cents and delivery.fee_cents > 0:
        line_items.append(
            {
                "price_data": {
                    "currency": "usd",
                    "product_data": {"name": "Delivery", "images": []},
                    "unit_amount": delivery.fee_cents,
                },
                "quantity": 1,
            }
        )

    try:
        session = stripe.checkout.Session.create(
            mode="payment",
            line_items=line_items,
            success_url=(
                f"{origin}/checkout/success?provider=stripe&orderId={encoded_order_id}"
                f"&cancelToken={encoded_cancel_token}"
            ),
            cancel_url=(
                f"{origin}/cart?checkoutCanceled=1&orderId={encoded_order_id}"
                f"&cancelToken={encoded_cancel_token}&provider=stripe"
            ),
            payment_method_types=["card"],
            customer_email=checkout_email or None,
            expires_at=expires_at,
            metadata={
                "orderId": order.id,
                "deliveryAddress": address,
                "deliveryMiles": f"{delivery.miles:.1f}" if delivery.miles is not None else "",
                "deliveryFeeCents": str(delivery.fee_cents or 0),
                "firstOrderDiscountPercent": str(first_order_discount_percent),
                "phone": normalized_phone,
            },
            payment_intent_data={"metadata": {"orderId": order.id}},
            idempotency_key=f"stripe-checkout-{order.id}",
        )
    except Exception as exc:
        log_critical_event(
            domain="payment",
            event="stripe_checkout_session_failed",
            message="Stripe checkout session creation failed.",
            request=request,
            context={"order_id": order.id, "user_id": user_id, "item_count": len(discounted_items)},
            exc=exc,
        )
        _set_order_status_safely(db, order, OrderStatus.FAILED)
        raise HTTPException(status_code=502, detail="Unable to start checkout.")

    order.stripe_session_id = session.id
    db.commit()

    if not session.url:
        log_critical_event(
            domain="payment",
            event="stripe_session_missing_url",
            message="Stripe session was created without redirect URL.",
            request=request,
            context={"order_id": order.id, "user_id": user_id},
        )
        _set_order_status_safely(db, order, OrderStatus.FAILED)
        raise HTTPException(status_code=500, detail="Unable to start checkout.")
    return CheckoutResponse(url=session.url)


@router.post("/cancel", response_model=CheckoutCancelResponse)
async def cancel_checkout(
    payload: CheckoutCancelRequest,
    request: Request,
    user=Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    user_id = user.id if user else None

    order = db.get(Order, payload.order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Not found")
    if not _is_order_access_allowed(order, user=user, cancel_token=payload.cancel_token):
        log_critical_event(
            domain="payment",
            event="checkout_cancel_unauthorized",
            message="Checkout cancel denied: invalid user/token for order.",
            request=request,
            context={"order_id": payload.order_id, "user_id": user_id},
            level=logging.WARNING,
        )
        raise HTTPException(status_code=404, detail="Not found")

    if order.status == OrderStatus.PAID:
        return CheckoutCancelResponse(canceled=False, status=order.status.value)

    if order.status in {OrderStatus.CANCELED, OrderStatus.FAILED}:
        return CheckoutCancelResponse(canceled=True, status=order.status.value)

    if order.stripe_session_id and settings.stripe_secret_key:
        stripe.api_key = settings.stripe_secret_key
        try:
            session = stripe.checkout.Session.retrieve(order.stripe_session_id)
        except Exception as exc:
            log_critical_event(
                domain="payment",
                event="stripe_session_fetch_failed_during_cancel",
                message="Failed to fetch Stripe checkout session during cancellation.",
                request=request,
                context={"order_id": order.id, "user_id": user_id},
                exc=exc,
                level=logging.WARNING,
            )
            session = None

        if session:
            resolved_status = resolve_order_status_from_session(order, session)
            if resolved_status == OrderStatus.PAID:
                _set_order_status_safely(db, order, OrderStatus.PAID)
                return CheckoutCancelResponse(canceled=False, status=OrderStatus.PAID.value)
            if resolved_status == OrderStatus.FAILED:
                _set_order_status_safely(db, order, OrderStatus.FAILED)
                return CheckoutCancelResponse(canceled=True, status=OrderStatus.FAILED.value)

            session_status = (getattr(session, "status", None) or "").lower()
            if session_status == "open":
                try:
                    stripe.checkout.Session.expire(order.stripe_session_id)
                except Exception as exc:
                    log_critical_event(
                        domain="payment",
                        event="stripe_session_expire_failed",
                        message="Failed to expire open Stripe checkout session during cancellation.",
                        request=request,
                        context={"order_id": order.id, "user_id": user_id},
                        exc=exc,
                        level=logging.WARNING,
                    )

    if order.paypal_order_id and paypal_is_configured():
        paypal_order_payload = None
        try:
            paypal_order_payload = paypal_get_order(order.paypal_order_id)
        except PayPalApiError as exc:
            log_critical_event(
                domain="payment",
                event="paypal_order_fetch_failed_during_cancel",
                message="Failed to fetch PayPal order during cancellation.",
                request=request,
                context={"order_id": order.id, "user_id": user_id},
                exc=exc,
                level=logging.WARNING,
            )
        if paypal_order_payload:
            resolved_status, _capture_id = resolve_order_status_from_paypal_order(
                order, paypal_order_payload
            )
            if resolved_status == OrderStatus.PAID:
                _set_order_status_safely(db, order, OrderStatus.PAID)
                return CheckoutCancelResponse(canceled=False, status=OrderStatus.PAID.value)
            if resolved_status == OrderStatus.FAILED:
                _set_order_status_safely(db, order, OrderStatus.FAILED)
                return CheckoutCancelResponse(canceled=True, status=OrderStatus.FAILED.value)

            paypal_order_status = (
                paypal_order_payload.get("status") if isinstance(paypal_order_payload, dict) else None
            )
            if isinstance(paypal_order_status, str) and paypal_order_status.upper() in {
                "CREATED",
                "SAVED",
                "APPROVED",
                "PAYER_ACTION_REQUIRED",
            }:
                try:
                    paypal_void_order(order.paypal_order_id)
                except PayPalApiError as exc:
                    log_critical_event(
                        domain="payment",
                        event="paypal_order_void_failed",
                        message="Failed to void PayPal order during cancellation.",
                        request=request,
                        context={"order_id": order.id, "user_id": user_id},
                        exc=exc,
                        level=logging.WARNING,
                    )

    _set_order_status_safely(db, order, OrderStatus.CANCELED)
    return CheckoutCancelResponse(canceled=True, status=OrderStatus.CANCELED.value)


@router.post("/status", response_model=CheckoutStatusResponse)
async def checkout_status(
    payload: CheckoutStatusRequest,
    request: Request,
    user=Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    user_id = user.id if user else None
    order = db.get(Order, payload.order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Not found")
    if not _is_order_access_allowed(order, user=user, cancel_token=payload.cancel_token):
        log_critical_event(
            domain="payment",
            event="checkout_status_unauthorized",
            message="Checkout status denied: invalid user/token for order.",
            request=request,
            context={"order_id": payload.order_id, "user_id": user_id},
            level=logging.WARNING,
        )
        raise HTTPException(status_code=404, detail="Not found")

    if order.status == OrderStatus.PENDING:
        if order.stripe_session_id and settings.stripe_secret_key:
            sync_order_with_stripe(db, order)
        if order.paypal_order_id and paypal_is_configured():
            sync_order_with_paypal(db, order)
        db.refresh(order)

    return CheckoutStatusResponse(status=order.status.value)
