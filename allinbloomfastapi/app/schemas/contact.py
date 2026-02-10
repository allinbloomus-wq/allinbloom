from __future__ import annotations

from app.schemas.base import SchemaBase


class ContactRequest(SchemaBase):
    name: str
    email: str
    message: str
