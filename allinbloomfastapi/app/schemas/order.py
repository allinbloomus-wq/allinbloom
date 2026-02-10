from __future__ import annotations

from datetime import datetime
from typing import Optional

from app.models.enums import OrderStatus
from app.schemas.base import SchemaBase


class OrderItemOut(SchemaBase):
    id: str
    order_id: str
    bouquet_id: Optional[str] = None
    name: str
    price_cents: int
    quantity: int
    image: str


class OrderOut(SchemaBase):
    id: str
    email: Optional[str] = None
    phone: Optional[str] = None
    stripe_session_id: Optional[str] = None
    total_cents: int
    currency: str
    status: OrderStatus
    is_read: bool
    created_at: datetime
    items: list[OrderItemOut]


class OrderToggleOut(SchemaBase):
    is_read: bool


class OrderCountOut(SchemaBase):
    count: int


class OrdersByDayOut(SchemaBase):
    day_key: str
    orders: list[OrderOut]
