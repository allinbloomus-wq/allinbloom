from __future__ import annotations

from datetime import datetime, timezone
import logging
from urllib.parse import quote_plus

from fastapi import APIRouter, Depends, HTTPException, Request
import stripe
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_optional_user
from app.core.config import settings
from app.core.critical_logging import log_critical_event
from app.core.security import create_checkout_cancel_token, decode_checkout_cancel_token
from app.models.bouquet import Bouquet
from app.models.enums import BouquetType, OrderStatus
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.user import User
from app.schemas.checkout import (
    CheckoutCancelRequest,
    CheckoutCancelResponse,
    CheckoutEventRequest,
    CheckoutEventResponse,
    CheckoutRequest,
    CheckoutResponse,
    CheckoutStatusRequest,
    CheckoutStatusResponse,
)
from app.services.delivery import (
    build_delivery_quote_log_context,
    delivery_quote_failure_level,
    get_delivery_quote,
)
from app.services.orders import (
    STRIPE_CHECKOUT_SESSION_EXPIRATION_SECONDS,
    expire_pending_orders,
    resolve_order_status_from_paypal_order,
    resolve_order_status_from_session,
    sync_order_with_paypal,
    sync_order_with_stripe,
)
from app.services.payment_diagnostics import (
    build_exception_failure_diagnostics,
    build_paypal_failure_diagnostics,
    build_stripe_session_failure_diagnostics,
    payment_failure_values,
    payment_success_values,
)
from app.services.payment_events import record_payment_event_best_effort
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
FLOWER_QUANTITY_MIN = 1
FLOWER_QUANTITY_MAX = 1001


def _is_flower_quantity_enabled_for_bouquet(bouquet: Bouquet) -> bool:
    bouquet_type = str(getattr(bouquet, "bouquet_type", "") or "").strip().upper()
    if bouquet_type not in {BouquetType.MONO.value, BouquetType.SEASON.value}:
        return False
    return bool(getattr(bouquet, "allow_flower_quantity", False))


def _set_order_status_safely(db: Session, order: Order, status: OrderStatus) -> None:
    try:
        if status == OrderStatus.PAID:
            values = payment_success_values()
        else:
            values = {"status": status}
        for key, value in values.items():
            setattr(order, key, value)
        db.commit()
    except Exception:
        db.rollback()


def _set_order_failed_safely(
    db: Session,
    order: Order,
    *,
    diagnostics,
) -> None:
    try:
        values = payment_failure_values(diagnostics)
        for key, value in values.items():
            setattr(order, key, value)
        db.commit()
    except Exception:
        db.rollback()


def _order_email(order: Order) -> str:
    return (order.email or "").strip().lower()


def _normalize_payment_method(value: str | None) -> str:
    normalized = (value or "").strip().lower().replace("-", "_")
    if not normalized:
        return "stripe"

    aliases = {
        "card": "stripe",
        "credit": "stripe",
        "credit_card": "stripe",
        "stripe_card": "stripe",
        "pay_pal": "paypal",
        "paypal_checkout": "paypal",
    }
    return aliases.get(normalized, normalized)


def _payment_provider_for_order(order: Order, raw_provider: str | None = None) -> str:
    if raw_provider:
        normalized = _normalize_payment_method(raw_provider)
        if normalized in {"stripe", "paypal"}:
            return normalized
    if order.stripe_session_id:
        return "stripe"
    if order.paypal_order_id:
        return "paypal"
    return "checkout"


CLIENT_CHECKOUT_EVENTS = {
    "browser_redirect_started",
    "browser_success_returned",
    "browser_cancel_returned",
    "browser_status_check_started",
}


def _clean_text(value: str | None) -> str:
    return (value or "").strip()


def _format_delivery_address(
    *,
    line1: str,
    line2: str,
    floor: str,
    city: str,
    state: str,
    postal_code: str,
    country: str,
) -> str:
    base = line1.strip()
    extras = []
    if line2 and line2.strip():
        extras.append(line2.strip())
    if floor and floor.strip():
        cleaned_floor = floor.strip()
        if cleaned_floor.lower().startswith("floor"):
            extras.append(cleaned_floor)
        else:
            extras.append(f"Floor {cleaned_floor}")
    if extras:
        base = f"{base}, {', '.join(extras)}"

    state_zip = " ".join(part for part in [state.strip(), postal_code.strip()] if part)
    city_state_zip = ", ".join(part for part in [city.strip(), state_zip] if part)
    parts = [base, city_state_zip, country.strip()]
    return ", ".join(part for part in parts if part)


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


def _resolve_first_order_discount_percent(
    *,
    configured_percent: int | None,
    has_blocking_order_history: bool,
    has_any_discount: bool,
) -> int:
    percent = int(configured_percent or 0)
    if percent <= 0:
        return 0
    if has_blocking_order_history:
        return 0
    if has_any_discount:
        return 0
    return percent


@router.post("", response_model=CheckoutResponse)
async def start_checkout(
    payload: CheckoutRequest,
    request: Request,
    user=Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    user_id = user.id if user else None

    raw_payment_method = payload.payment_method
    payment_method = _normalize_payment_method(raw_payment_method)
    if payment_method not in {"stripe", "paypal"}:
        log_critical_event(
            domain="payment",
            event="checkout_invalid_payment_method",
            message="Checkout requested with unsupported payment method.",
            request=request,
            context={
                "user_id": user_id,
                "payment_method": payment_method,
                "raw_payment_method": (raw_payment_method or "").strip(),
            },
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
    raw_address = _clean_text(payload.address)
    address_line1 = _clean_text(payload.address_line1)
    address_line2 = _clean_text(payload.address_line2)
    city = _clean_text(payload.city)
    state = _clean_text(payload.state)
    postal_code = _clean_text(payload.postal_code)
    country = _clean_text(payload.country) or "United States"
    floor = _clean_text(payload.floor)
    delivery_date_time = _clean_text(payload.delivery_date_time)
    order_comment = _clean_text(payload.order_comment)
    raw_phone = _clean_text(payload.phone)
    payload_email = _clean_text(payload.email).lower()
    has_structured_address = any(
        [address_line1, address_line2, city, state, postal_code, floor]
    )
    if not has_structured_address:
        country = ""
    checkout_email = (user.email or "").strip().lower() if user else payload_email
    fallback_phone = (user.phone or "").strip() if user else ""
    phone_candidate = raw_phone or fallback_phone
    digits = "".join(char for char in phone_candidate if char.isdigit())
    normalized_phone = (
        f"+{digits}" if len(digits) == 11 and digits.startswith("1") else ""
    )

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
    address_for_quote = raw_address
    if not address_for_quote:
        if not address_line1 or not city or not state or not postal_code:
            log_critical_event(
                domain="personal_data",
                event="checkout_missing_address",
                message="Checkout request has incomplete delivery address.",
                request=request,
                context={"user_id": user_id},
                level=logging.WARNING,
            )
            raise HTTPException(
                status_code=400,
                detail="Delivery address must include street, city, state, and ZIP.",
            )
        address_for_quote = _format_delivery_address(
            line1=address_line1,
            line2="",
            floor="",
            city=city,
            state=state,
            postal_code=postal_code,
            country=country,
        )

    if order_comment and len(order_comment) > 500:
        log_critical_event(
            domain="cart",
            event="checkout_order_comment_too_long",
            message="Checkout request contains an order comment that is too long.",
            request=request,
            context={
                "user_id": user_id,
                "order_comment_length": len(order_comment),
            },
            level=logging.WARNING,
        )
        raise HTTPException(status_code=400, detail="Order comment is too long.")
    if not delivery_date_time:
        log_critical_event(
            domain="cart",
            event="checkout_missing_delivery_datetime",
            message="Checkout request is missing the requested delivery date/time.",
            request=request,
            context={"user_id": user_id},
            level=logging.WARNING,
        )
        raise HTTPException(
            status_code=400,
            detail="Delivery date and time is required.",
        )
    if len(delivery_date_time) > 80:
        log_critical_event(
            domain="cart",
            event="checkout_delivery_datetime_too_long",
            message="Checkout request contains a delivery date/time that is too long.",
            request=request,
            context={
                "user_id": user_id,
                "delivery_date_time_length": len(delivery_date_time),
            },
            level=logging.WARNING,
        )
        raise HTTPException(status_code=400, detail="Delivery date/time is too long.")
    try:
        datetime.fromisoformat(delivery_date_time)
    except ValueError:
        log_critical_event(
            domain="cart",
            event="checkout_delivery_datetime_invalid",
            message="Checkout request contains an invalid delivery date/time.",
            request=request,
            context={"user_id": user_id},
            level=logging.WARNING,
        )
        raise HTTPException(
            status_code=400,
            detail="Delivery date and time is invalid.",
        )
    if "T" not in delivery_date_time:
        log_critical_event(
            domain="cart",
            event="checkout_delivery_datetime_missing_time",
            message="Checkout request contains a delivery date without a time.",
            request=request,
            context={"user_id": user_id},
            level=logging.WARNING,
        )
        raise HTTPException(
            status_code=400,
            detail="Delivery date and time is required.",
        )
    if payment_method == "stripe" and not normalized_phone:
        log_critical_event(
            domain="personal_data",
            event="checkout_invalid_phone",
            message="Stripe checkout request has invalid phone format.",
            request=request,
            context={"user_id": user_id, "phone_length": len(phone_candidate)},
            level=logging.WARNING,
        )
        raise HTTPException(status_code=400, detail="Use phone format +1 312 555 0123.")

    settings_row = get_store_settings(db)
    delivery = await get_delivery_quote(address_for_quote)
    if not delivery.ok:
        delivery_context = build_delivery_quote_log_context(address_for_quote, delivery)
        delivery_context.update({"user_id": user_id, "item_count": len(items)})
        log_critical_event(
            domain="payment",
            event="delivery_quote_failed",
            message="Delivery quote failed during checkout.",
            request=request,
            context=delivery_context,
            level=delivery_quote_failure_level(delivery),
        )
        raise HTTPException(
            status_code=400, detail=delivery.error or "Unable to calculate delivery."
        )

    bouquet_ids = [item.id for item in items if not item.is_custom]
    bouquets = (
        db.execute(
            select(Bouquet).where(
                Bouquet.id.in_(bouquet_ids),
                Bouquet.is_active.is_(True),
                Bouquet.is_sold_out.is_(False),
            )
        )
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
            details = _clean_text(item.details)
            if details and len(details) > 500:
                log_critical_event(
                    domain="cart",
                    event="checkout_custom_item_details_too_long",
                    message="Custom cart item details are too long.",
                    request=request,
                    context={
                        "user_id": user_id,
                        "item_id": item.id,
                        "details_length": len(details),
                    },
                    level=logging.WARNING,
                )
                raise HTTPException(
                    status_code=400, detail="Custom item details are too long."
                )
            if not item.name or not item.image:
                log_critical_event(
                    domain="cart",
                    event="invalid_custom_item_payload",
                    message="Custom cart item is missing required fields.",
                    request=request,
                    context={"user_id": user_id, "item_id": item.id},
                    level=logging.WARNING,
                )
                raise HTTPException(
                    status_code=400, detail="Some items are unavailable."
                )
            if price_cents < 6500 or price_cents > 18000:
                log_critical_event(
                    domain="cart",
                    event="invalid_custom_item_price",
                    message="Custom cart item price is out of expected range.",
                    request=request,
                    context={
                        "user_id": user_id,
                        "item_id": item.id,
                        "price_cents": price_cents,
                    },
                    level=logging.WARNING,
                )
                raise HTTPException(
                    status_code=400, detail="Some items are unavailable."
                )
            normalized_items.append(
                {
                    "id": item.id,
                    "name": item.name,
                    "image": item.image,
                    "quantity": quantity,
                    "unit_price": price_cents,
                    "details": details or None,
                }
            )
            continue

        bouquet = bouquet_map.get(item.id)
        if not bouquet:
            log_critical_event(
                domain="cart",
                event="checkout_item_not_found",
                message="Checkout item does not exist, is inactive, or is sold out.",
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
        has_flower_quantity = _is_flower_quantity_enabled_for_bouquet(bouquet)
        raw_quantity = int(item.quantity or 0)
        quantity = max(1, raw_quantity)
        details = None
        if has_flower_quantity:
            if raw_quantity < FLOWER_QUANTITY_MIN or raw_quantity > FLOWER_QUANTITY_MAX:
                log_critical_event(
                    domain="cart",
                    event="checkout_flower_quantity_out_of_range",
                    message="Checkout flower quantity is outside the allowed range.",
                    request=request,
                    context={
                        "user_id": user_id,
                        "item_id": item.id,
                        "flower_quantity": raw_quantity,
                        "min_quantity": FLOWER_QUANTITY_MIN,
                        "max_quantity": FLOWER_QUANTITY_MAX,
                    },
                    level=logging.WARNING,
                )
                raise HTTPException(
                    status_code=400,
                    detail=(
                        "Flower quantity must be between "
                        f"{FLOWER_QUANTITY_MIN} and {FLOWER_QUANTITY_MAX}."
                    ),
                )
            quantity = raw_quantity
            details = f"Flowers: {quantity}"
        normalized_items.append(
            {
                "id": bouquet.id,
                "name": bouquet.name,
                "image": bouquet.image,
                "quantity": quantity,
                "unit_price": unit_price,
                "details": details,
            }
        )

    # Only explicit final failures may reopen first-order discount eligibility.
    # Pending orders remain blocking so delayed provider updates cannot reopen
    # the discount and create a second discounted checkout.
    expire_pending_orders(db)

    if user:
        # Serialize first-order-discount calculation for authenticated users.
        db.execute(select(User.id).where(User.id == user.id).with_for_update()).first()

    has_blocking_order_history = (
        db.execute(
            select(Order.id)
            .where(
                Order.email == checkout_email,
                Order.status.in_([OrderStatus.PENDING, OrderStatus.PAID]),
            )
            .limit(1)
        )
        .scalars()
        .first()
        is not None
    )
    first_order_discount_percent = _resolve_first_order_discount_percent(
        configured_percent=settings_row.first_order_discount_percent,
        has_blocking_order_history=has_blocking_order_history,
        has_any_discount=has_any_discount,
    )

    discounted_items = []
    for item in normalized_items:
        unit_price = (
            apply_percent_discount(item["unit_price"], first_order_discount_percent)
            if first_order_discount_percent > 0
            else item["unit_price"]
        )
        discounted_items.append({**item, "unit_price": unit_price})

    discounted_subtotal = sum(
        item["unit_price"] * item["quantity"] for item in discounted_items
    )
    computed_total = discounted_subtotal + (delivery.fee_cents or 0)

    order_items = [
        OrderItem(
            name=item["name"],
            price_cents=item["unit_price"],
            quantity=item["quantity"],
            image=item["image"],
            details=item.get("details"),
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

    delivery_address = address_for_quote
    if address_line1:
        delivery_address = _format_delivery_address(
            line1=address_line1,
            line2=address_line2,
            floor=floor,
            city=city,
            state=state,
            postal_code=postal_code,
            country=country,
        )

    order = Order(
        email=checkout_email,
        phone=normalized_phone or None,
        total_cents=computed_total,
        items=order_items,
        delivery_address=delivery_address or None,
        delivery_address_line1=address_line1 or None,
        delivery_address_line2=address_line2 or None,
        delivery_city=city or None,
        delivery_state=state or None,
        delivery_postal_code=postal_code or None,
        delivery_country=country or None,
        delivery_floor=floor or None,
        delivery_date_time=delivery_date_time or None,
        order_comment=order_comment or None,
        delivery_miles=f"{delivery.miles:.1f}" if delivery.miles is not None else None,
        delivery_fee_cents=delivery.fee_cents,
        first_order_discount_percent=first_order_discount_percent,
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    if user and normalized_phone and user.phone != normalized_phone:
        user.phone = normalized_phone
        db.commit()

    origin = settings.resolved_site_url()
    checkout_cancel_token = create_checkout_cancel_token(
        order_id=order.id, email=checkout_email
    )
    encoded_cancel_token = quote_plus(checkout_cancel_token)
    encoded_order_id = quote_plus(order.id)

    record_payment_event_best_effort(
        db,
        order_id=order.id,
        event="checkout_order_created",
        provider=payment_method,
        source="server",
        message="Checkout order was created and is waiting for provider session setup.",
        context={
            "order_status": order.status.value,
            "total_cents": computed_total,
            "currency": order.currency,
            "item_count": len(discounted_items),
            "has_delivery_fee": bool(delivery.fee_cents and delivery.fee_cents > 0),
            "delivery_fee_cents": delivery.fee_cents or 0,
        },
        request=request,
    )

    if payment_method == "paypal":
        try:
            paypal_order = paypal_create_order(
                order_id=order.id,
                total_cents=computed_total,
                currency=order.currency,
                payer_email=checkout_email,
                payer_name=(user.name if user else None),
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
                context={
                    "order_id": order.id,
                    "user_id": user_id,
                    "item_count": len(discounted_items),
                },
                exc=exc,
            )
            _set_order_failed_safely(
                db,
                order,
                diagnostics=build_exception_failure_diagnostics(
                    stage="paypal_order_create",
                    code="paypal_order_create_failed",
                    message="Failed to create the PayPal order.",
                    exc=exc,
                    provider="paypal",
                ),
            )
            record_payment_event_best_effort(
                db,
                order_id=order.id,
                event="paypal_order_create_failed",
                provider="paypal",
                source="server",
                message="PayPal order creation failed before customer approval.",
                context={"order_status": OrderStatus.FAILED.value},
                request=request,
            )
            raise HTTPException(status_code=502, detail="Unable to start checkout.")

        order.paypal_order_id = paypal_order.order_id
        db.commit()
        record_payment_event_best_effort(
            db,
            order_id=order.id,
            event="paypal_order_created",
            provider="paypal",
            source="server",
            message="PayPal order was created and approval URL was returned.",
            context={"paypal_order_id": paypal_order.order_id},
            request=request,
        )
        return CheckoutResponse(
            url=paypal_order.approve_url,
            order_id=order.id,
            cancel_token=checkout_cancel_token,
            provider="paypal",
        )

    stripe.api_key = settings.stripe_secret_key
    expires_at = (
        int(datetime.now(timezone.utc).timestamp())
        + STRIPE_CHECKOUT_SESSION_EXPIRATION_SECONDS
    )

    image_url = item["image"]
    if image_url and not image_url.startswith(("http://", "https://")):
        image_url = f"{origin}{image_url}"

    line_items = [
        {
            "price_data": {
                "currency": "usd",
                "product_data": {
                    "name": item["name"],
                    "images": [image_url] if image_url else [],
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

    record_payment_event_best_effort(
        db,
        order_id=order.id,
        event="stripe_checkout_create_started",
        provider="stripe",
        source="server",
        message="Stripe Checkout session creation started.",
        context={
            "expires_at": expires_at,
            "line_item_count": len(line_items),
            "total_cents": computed_total,
            "currency": order.currency,
        },
        request=request,
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
                "deliveryAddress": delivery_address or address_for_quote,
                "deliveryAddressLine1": address_line1 or "",
                "deliveryAddressLine2": address_line2 or "",
                "deliveryCity": city or "",
                "deliveryState": state or "",
                "deliveryPostalCode": postal_code or "",
                "deliveryCountry": country or "",
                "deliveryFloor": floor or "",
                "deliveryDateTime": delivery_date_time or "",
                "deliveryMiles": (
                    f"{delivery.miles:.1f}" if delivery.miles is not None else ""
                ),
                "deliveryFeeCents": str(delivery.fee_cents or 0),
                "firstOrderDiscountPercent": str(first_order_discount_percent),
                "phone": normalized_phone,
                "orderComment": order_comment or "",
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
            context={
                "order_id": order.id,
                "user_id": user_id,
                "item_count": len(discounted_items),
            },
            exc=exc,
        )
        _set_order_failed_safely(
            db,
            order,
            diagnostics=build_exception_failure_diagnostics(
                stage="stripe_checkout_create",
                code="stripe_checkout_session_failed",
                message="Failed to create the Stripe Checkout session.",
                exc=exc,
                provider="stripe",
            ),
        )
        record_payment_event_best_effort(
            db,
            order_id=order.id,
            event="stripe_checkout_create_failed",
            provider="stripe",
            source="server",
            message="Stripe Checkout session creation failed.",
            context={"order_status": OrderStatus.FAILED.value},
            request=request,
        )
        raise HTTPException(status_code=502, detail="Unable to start checkout.")

    order.stripe_session_id = session.id
    db.commit()
    record_payment_event_best_effort(
        db,
        order_id=order.id,
        event="stripe_checkout_session_created",
        provider="stripe",
        source="server",
        message="Stripe Checkout session was created and redirect URL is available.",
        stripe_session_id=session.id,
        payment_intent_id=getattr(session, "payment_intent", None),
        context={
            "session_status": getattr(session, "status", None),
            "payment_status": getattr(session, "payment_status", None),
            "expires_at": getattr(session, "expires_at", expires_at),
        },
        request=request,
    )

    if not session.url:
        log_critical_event(
            domain="payment",
            event="stripe_session_missing_url",
            message="Stripe session was created without redirect URL.",
            request=request,
            context={"order_id": order.id, "user_id": user_id},
        )
        _set_order_failed_safely(
            db,
            order,
            diagnostics=build_exception_failure_diagnostics(
                stage="stripe_checkout_redirect",
                code="stripe_session_missing_url",
                message="Stripe created a checkout session without a redirect URL.",
                provider="stripe",
                extra_details={"Session ID": session.id},
            ),
        )
        record_payment_event_best_effort(
            db,
            order_id=order.id,
            event="stripe_checkout_redirect_url_missing",
            provider="stripe",
            source="server",
            message="Stripe created a Checkout session without a redirect URL.",
            stripe_session_id=session.id,
            context={"order_status": OrderStatus.FAILED.value},
            request=request,
        )
        raise HTTPException(status_code=500, detail="Unable to start checkout.")
    return CheckoutResponse(
        url=session.url,
        order_id=order.id,
        cancel_token=checkout_cancel_token,
        provider="stripe",
    )


@router.post("/event", response_model=CheckoutEventResponse)
async def record_checkout_event(
    payload: CheckoutEventRequest,
    request: Request,
    user=Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    event_name = _clean_text(payload.event).lower()
    if event_name not in CLIENT_CHECKOUT_EVENTS:
        log_critical_event(
            domain="payment",
            event="checkout_client_event_invalid",
            message="Checkout client event was rejected: unsupported event name.",
            request=request,
            context={"event_name": event_name},
            level=logging.WARNING,
        )
        raise HTTPException(status_code=400, detail="Unsupported checkout event.")

    order = db.get(Order, payload.order_id)
    if not order:
        log_critical_event(
            domain="payment",
            event="checkout_client_event_order_not_found",
            message="Checkout client event references a missing order.",
            request=request,
            context={"order_id": payload.order_id, "event_name": event_name},
            level=logging.WARNING,
        )
        raise HTTPException(status_code=404, detail="Not found")

    if not _is_order_access_allowed(
        order, user=user, cancel_token=payload.cancel_token
    ):
        log_critical_event(
            domain="payment",
            event="checkout_client_event_unauthorized",
            message="Checkout client event denied: invalid user/token for order.",
            request=request,
            context={"order_id": order.id, "event_name": event_name},
            level=logging.WARNING,
        )
        raise HTTPException(status_code=404, detail="Not found")

    provider = _payment_provider_for_order(order, payload.provider)
    event_context = {
        **(payload.context or {}),
        "order_status": order.status.value,
        "client_event": event_name,
    }
    record_payment_event_best_effort(
        db,
        order_id=order.id,
        event=event_name,
        provider=provider,
        source="browser",
        message="Browser reported a checkout flow event.",
        stripe_session_id=order.stripe_session_id,
        context=event_context,
        request=request,
    )
    return CheckoutEventResponse(received=True)


@router.post("/cancel", response_model=CheckoutCancelResponse)
async def cancel_checkout(
    payload: CheckoutCancelRequest,
    request: Request,
    user=Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    user_id = user.id if user else None

    order_id = (payload.order_id or "").strip()
    paypal_order_id = (payload.paypal_order_id or "").strip()
    order = db.get(Order, order_id) if order_id else None
    if not order and paypal_order_id:
        order = (
            db.execute(select(Order).where(Order.paypal_order_id == paypal_order_id))
            .scalars()
            .first()
        )
    if not order:
        log_critical_event(
            domain="payment",
            event="checkout_cancel_order_not_found",
            message="Checkout cancel requested for a missing order.",
            request=request,
            context={
                "order_id": order_id or None,
                "paypal_order_id": paypal_order_id or None,
                "user_id": user_id,
            },
            level=logging.WARNING,
        )
        raise HTTPException(status_code=404, detail="Not found")
    access_allowed = _is_order_access_allowed(
        order, user=user, cancel_token=payload.cancel_token
    )
    if (
        not access_allowed
        and paypal_order_id
        and order.paypal_order_id == paypal_order_id
    ):
        access_allowed = True
    if not access_allowed:
        log_critical_event(
            domain="payment",
            event="checkout_cancel_unauthorized",
            message="Checkout cancel denied: invalid user/token for order.",
            request=request,
            context={
                "order_id": order_id or order.id,
                "paypal_order_id": paypal_order_id or order.paypal_order_id,
                "user_id": user_id,
            },
            level=logging.WARNING,
        )
        raise HTTPException(status_code=404, detail="Not found")

    provider = _payment_provider_for_order(
        order, "paypal" if paypal_order_id else None
    )
    record_payment_event_best_effort(
        db,
        order_id=order.id,
        event="checkout_cancel_returned",
        provider=provider,
        source="server",
        message="Customer returned to the cart through the checkout cancel flow.",
        stripe_session_id=order.stripe_session_id,
        context={
            "order_status_before": order.status.value,
            "has_cancel_token": bool(payload.cancel_token),
            "has_paypal_order_token": bool(paypal_order_id),
        },
        request=request,
    )

    if order.status == OrderStatus.PAID:
        record_payment_event_best_effort(
            db,
            order_id=order.id,
            event="checkout_cancel_observed_paid",
            provider=provider,
            source="server",
            message="Cancel flow found that the order was already paid.",
            stripe_session_id=order.stripe_session_id,
            context={"order_status": order.status.value},
            request=request,
        )
        return CheckoutCancelResponse(canceled=False, status=order.status.value)

    if order.status in {OrderStatus.CANCELED, OrderStatus.FAILED}:
        record_payment_event_best_effort(
            db,
            order_id=order.id,
            event="checkout_cancel_observed_closed",
            provider=provider,
            source="server",
            message="Cancel flow found that the order was already closed.",
            stripe_session_id=order.stripe_session_id,
            context={"order_status": order.status.value},
            request=request,
        )
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
            record_payment_event_best_effort(
                db,
                order_id=order.id,
                event="stripe_session_fetch_failed_during_cancel",
                provider="stripe",
                source="server",
                message="Failed to fetch Stripe Checkout session during cancel flow.",
                stripe_session_id=order.stripe_session_id,
                context={"order_status": order.status.value},
                request=request,
            )
            session = None

        if session:
            resolved_status = resolve_order_status_from_session(order, session)
            if resolved_status == OrderStatus.PAID:
                _set_order_status_safely(db, order, OrderStatus.PAID)
                record_payment_event_best_effort(
                    db,
                    order_id=order.id,
                    event="checkout_cancel_resolved_paid",
                    provider="stripe",
                    source="server",
                    message="Cancel flow synced Stripe session and resolved the order as paid.",
                    stripe_session_id=order.stripe_session_id,
                    payment_intent_id=getattr(session, "payment_intent", None),
                    context={
                        "session_status": getattr(session, "status", None),
                        "payment_status": getattr(session, "payment_status", None),
                    },
                    request=request,
                )
                return CheckoutCancelResponse(
                    canceled=False, status=OrderStatus.PAID.value
                )
            if resolved_status == OrderStatus.FAILED:
                _set_order_failed_safely(
                    db,
                    order,
                    diagnostics=build_stripe_session_failure_diagnostics(session),
                )
                record_payment_event_best_effort(
                    db,
                    order_id=order.id,
                    event="checkout_cancel_resolved_failed",
                    provider="stripe",
                    source="server",
                    message="Cancel flow synced Stripe session and resolved the order as failed.",
                    stripe_session_id=order.stripe_session_id,
                    payment_intent_id=getattr(session, "payment_intent", None),
                    context={
                        "session_status": getattr(session, "status", None),
                        "payment_status": getattr(session, "payment_status", None),
                    },
                    request=request,
                )
                return CheckoutCancelResponse(
                    canceled=True, status=OrderStatus.FAILED.value
                )

            session_status = (getattr(session, "status", None) or "").lower()
            if session_status == "open":
                try:
                    stripe.checkout.Session.expire(order.stripe_session_id)
                    record_payment_event_best_effort(
                        db,
                        order_id=order.id,
                        event="stripe_session_expired_by_cancel",
                        provider="stripe",
                        source="server",
                        message="Open Stripe Checkout session was expired after customer cancel return.",
                        stripe_session_id=order.stripe_session_id,
                        context={"session_status_before": session_status},
                        request=request,
                    )
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
                    record_payment_event_best_effort(
                        db,
                        order_id=order.id,
                        event="stripe_session_expire_failed",
                        provider="stripe",
                        source="server",
                        message="Failed to expire open Stripe Checkout session during cancel flow.",
                        stripe_session_id=order.stripe_session_id,
                        context={"session_status_before": session_status},
                        request=request,
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
            record_payment_event_best_effort(
                db,
                order_id=order.id,
                event="paypal_order_fetch_failed_during_cancel",
                provider="paypal",
                source="server",
                message="Failed to fetch PayPal order during cancel flow.",
                context={"paypal_order_id": order.paypal_order_id},
                request=request,
            )
        if paypal_order_payload:
            resolved_status, _capture_id = resolve_order_status_from_paypal_order(
                order, paypal_order_payload
            )
            if resolved_status == OrderStatus.PAID:
                _set_order_status_safely(db, order, OrderStatus.PAID)
                record_payment_event_best_effort(
                    db,
                    order_id=order.id,
                    event="checkout_cancel_resolved_paid",
                    provider="paypal",
                    source="server",
                    message="Cancel flow synced PayPal order and resolved the order as paid.",
                    context={
                        "paypal_order_id": order.paypal_order_id,
                        "paypal_capture_id": _capture_id,
                    },
                    request=request,
                )
                return CheckoutCancelResponse(
                    canceled=False, status=OrderStatus.PAID.value
                )
            if resolved_status == OrderStatus.FAILED:
                _set_order_failed_safely(
                    db,
                    order,
                    diagnostics=build_paypal_failure_diagnostics(paypal_order_payload),
                )
                record_payment_event_best_effort(
                    db,
                    order_id=order.id,
                    event="checkout_cancel_resolved_failed",
                    provider="paypal",
                    source="server",
                    message="Cancel flow synced PayPal order and resolved the order as failed.",
                    context={
                        "paypal_order_id": order.paypal_order_id,
                        "paypal_capture_id": _capture_id,
                    },
                    request=request,
                )
                return CheckoutCancelResponse(
                    canceled=True, status=OrderStatus.FAILED.value
                )

            paypal_order_status = (
                paypal_order_payload.get("status")
                if isinstance(paypal_order_payload, dict)
                else None
            )
            if isinstance(paypal_order_status, str) and paypal_order_status.upper() in {
                "CREATED",
                "SAVED",
                "APPROVED",
                "PAYER_ACTION_REQUIRED",
            }:
                try:
                    paypal_void_order(order.paypal_order_id)
                    record_payment_event_best_effort(
                        db,
                        order_id=order.id,
                        event="paypal_order_voided_by_cancel",
                        provider="paypal",
                        source="server",
                        message="Open PayPal order was voided after customer cancel return.",
                        context={
                            "paypal_order_id": order.paypal_order_id,
                            "paypal_status_before": paypal_order_status,
                        },
                        request=request,
                    )
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
                    record_payment_event_best_effort(
                        db,
                        order_id=order.id,
                        event="paypal_order_void_failed",
                        provider="paypal",
                        source="server",
                        message="Failed to void PayPal order during cancel flow.",
                        context={
                            "paypal_order_id": order.paypal_order_id,
                            "paypal_status_before": paypal_order_status,
                        },
                        request=request,
                    )

    _set_order_status_safely(db, order, OrderStatus.CANCELED)
    record_payment_event_best_effort(
        db,
        order_id=order.id,
        event="checkout_marked_canceled",
        provider=provider,
        source="server",
        message="Checkout order was marked canceled after cancel return.",
        stripe_session_id=order.stripe_session_id,
        context={"order_status": OrderStatus.CANCELED.value},
        request=request,
    )
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
        log_critical_event(
            domain="payment",
            event="checkout_status_order_not_found",
            message="Checkout status requested for a missing order.",
            request=request,
            context={"order_id": payload.order_id, "user_id": user_id},
            level=logging.WARNING,
        )
        raise HTTPException(status_code=404, detail="Not found")
    if not _is_order_access_allowed(
        order, user=user, cancel_token=payload.cancel_token
    ):
        log_critical_event(
            domain="payment",
            event="checkout_status_unauthorized",
            message="Checkout status denied: invalid user/token for order.",
            request=request,
            context={"order_id": payload.order_id, "user_id": user_id},
            level=logging.WARNING,
        )
        raise HTTPException(status_code=404, detail="Not found")

    provider = _payment_provider_for_order(order)
    status_before = order.status.value
    record_payment_event_best_effort(
        db,
        order_id=order.id,
        event="checkout_status_requested",
        provider=provider,
        source="browser",
        message="Checkout success page requested order payment status.",
        stripe_session_id=order.stripe_session_id,
        context={"order_status_before": status_before},
        request=request,
    )

    stripe_sync_status = None
    paypal_sync_status = None
    if order.status == OrderStatus.PENDING:
        if order.stripe_session_id and settings.stripe_secret_key:
            stripe_sync_status = sync_order_with_stripe(db, order)
        if order.paypal_order_id and paypal_is_configured():
            paypal_sync_status = sync_order_with_paypal(db, order)
        db.refresh(order)

    record_payment_event_best_effort(
        db,
        order_id=order.id,
        event="checkout_status_resolved",
        provider=_payment_provider_for_order(order),
        source="server",
        message="Checkout status request completed.",
        stripe_session_id=order.stripe_session_id,
        context={
            "order_status_before": status_before,
            "order_status_after": order.status.value,
            "stripe_sync_status": (
                stripe_sync_status.value if stripe_sync_status else None
            ),
            "paypal_sync_status": (
                paypal_sync_status.value if paypal_sync_status else None
            ),
        },
        request=request,
    )
    return CheckoutStatusResponse(status=order.status.value)
