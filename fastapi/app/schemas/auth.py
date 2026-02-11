from __future__ import annotations

from typing import Optional

from app.schemas.base import SchemaBase


class RequestCodeIn(SchemaBase):
    email: str


class VerifyCodeIn(SchemaBase):
    email: str
    code: str
    name: Optional[str] = None


class GoogleSignInIn(SchemaBase):
    id_token: str
