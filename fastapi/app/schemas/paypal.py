from __future__ import annotations

from app.schemas.base import SchemaBase


class PayPalCaptureRequest(SchemaBase):
    order_id: str


class PayPalCaptureResponse(SchemaBase):
    status: str
