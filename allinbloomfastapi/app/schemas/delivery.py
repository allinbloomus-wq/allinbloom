from __future__ import annotations

from app.schemas.base import SchemaBase


class DeliveryQuoteRequest(SchemaBase):
    address: str


class DeliveryQuoteOut(SchemaBase):
    fee_cents: int
    miles: float
    distance_text: str
