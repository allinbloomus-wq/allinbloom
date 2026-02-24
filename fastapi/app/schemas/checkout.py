from __future__ import annotations

from typing import Optional

from app.schemas.base import SchemaBase


class CheckoutItemIn(SchemaBase):
    id: str
    quantity: int
    name: Optional[str] = None
    price_cents: Optional[int] = None
    image: Optional[str] = None
    is_custom: Optional[bool] = None


class CheckoutRequest(SchemaBase):
    items: list[CheckoutItemIn]
    address: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    floor: Optional[str] = None
    order_comment: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    payment_method: Optional[str] = None


class CheckoutResponse(SchemaBase):
    url: str


class CheckoutCancelRequest(SchemaBase):
    order_id: Optional[str] = None
    paypal_order_id: Optional[str] = None
    cancel_token: Optional[str] = None


class CheckoutCancelResponse(SchemaBase):
    canceled: bool
    status: str


class CheckoutStatusRequest(SchemaBase):
    order_id: str
    cancel_token: Optional[str] = None


class CheckoutStatusResponse(SchemaBase):
    status: str
