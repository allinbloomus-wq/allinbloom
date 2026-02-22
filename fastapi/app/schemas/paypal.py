from __future__ import annotations

from app.schemas.base import SchemaBase


class PayPalCaptureRequest(SchemaBase):
    order_id: str
    checkout_order_id: str | None = None
    cancel_token: str | None = None


class PayPalCaptureResponse(SchemaBase):
    status: str
