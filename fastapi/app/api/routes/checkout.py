from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, Request
import stripe
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.core.config import settings
from app.core.critical_logging import log_critical_event
from app.models.bouquet import Bouquet
from app.models.order import Order
from app.models.order_item import OrderItem
from app.schemas.checkout import CheckoutRequest, CheckoutResponse
from app.services.delivery import get_delivery_quote
from app.services.pricing import apply_percent_discount, get_bouquet_discount
from app.services.settings import get_store_settings

router = APIRouter(prefix="/api/checkout", tags=["checkout"])


@router.post("", response_model=CheckoutResponse)
async def start_checkout(
    payload: CheckoutRequest,
    request: Request,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not settings.stripe_secret_key:
        log_critical_event(
            domain="payment",
            event="stripe_not_configured",
            message="Checkout requested while Stripe is not configured.",
            request=request,
            context={"user_id": user.id},
        )
        raise HTTPException(status_code=400, detail="Stripe is not configured.")

    items = payload.items
    address = payload.address.strip()
    raw_phone = payload.phone.strip()
    digits = "".join(char for char in raw_phone if char.isdigit())
    normalized_phone = f"+{digits}" if len(digits) == 11 and digits.startswith("1") else ""

    if not items:
        log_critical_event(
            domain="cart",
            event="checkout_empty_cart",
            message="Checkout request contains no items.",
            request=request,
            context={"user_id": user.id},
            level=logging.WARNING,
        )
        raise HTTPException(status_code=400, detail="No items provided.")
    if not address:
        log_critical_event(
            domain="personal_data",
            event="checkout_missing_address",
            message="Checkout request has empty delivery address.",
            request=request,
            context={"user_id": user.id},
            level=logging.WARNING,
        )
        raise HTTPException(status_code=400, detail="Delivery address is required.")
    if not normalized_phone:
        log_critical_event(
            domain="personal_data",
            event="checkout_invalid_phone",
            message="Checkout request has invalid phone format.",
            request=request,
            context={"user_id": user.id, "phone_length": len(raw_phone)},
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
            context={"user_id": user.id, "item_count": len(items)},
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
                    context={"user_id": user.id, "item_id": item.id},
                    level=logging.WARNING,
                )
                raise HTTPException(status_code=400, detail="Some items are unavailable.")
            if price_cents < 6500 or price_cents > 18000:
                log_critical_event(
                    domain="cart",
                    event="invalid_custom_item_price",
                    message="Custom cart item price is out of expected range.",
                    request=request,
                    context={"user_id": user.id, "item_id": item.id, "price_cents": price_cents},
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
                context={"user_id": user.id, "item_id": item.id},
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

    orders_count = (
        db.execute(select(func.count()).select_from(Order).where(Order.email == user.email)).scalar_one()
    )
    first_order_discount_percent = (
        settings_row.first_order_discount_percent if orders_count == 0 and not has_any_discount else 0
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
        email=user.email,
        phone=normalized_phone,
        total_cents=computed_total,
        items=order_items,
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    user.phone = normalized_phone
    db.commit()

    origin = settings.resolved_site_url()
    stripe.api_key = settings.stripe_secret_key

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
            success_url=f"{origin}/checkout/success",
            cancel_url=f"{origin}/cart",
            payment_method_types=["card"],
            customer_email=user.email or None,
            metadata={
                "orderId": order.id,
                "deliveryAddress": address,
                "deliveryMiles": f"{delivery.miles:.1f}" if delivery.miles is not None else "",
                "deliveryFeeCents": str(delivery.fee_cents or 0),
                "firstOrderDiscountPercent": str(first_order_discount_percent),
                "phone": normalized_phone,
            },
        )
    except Exception as exc:
        log_critical_event(
            domain="payment",
            event="stripe_checkout_session_failed",
            message="Stripe checkout session creation failed.",
            request=request,
            context={"order_id": order.id, "user_id": user.id, "item_count": len(discounted_items)},
            exc=exc,
        )
        raise HTTPException(status_code=502, detail="Unable to start checkout.")

    order.stripe_session_id = session.id
    db.commit()

    if not session.url:
        log_critical_event(
            domain="payment",
            event="stripe_session_missing_url",
            message="Stripe session was created without redirect URL.",
            request=request,
            context={"order_id": order.id, "user_id": user.id},
        )
        raise HTTPException(status_code=500, detail="Unable to start checkout.")
    return CheckoutResponse(url=session.url)
