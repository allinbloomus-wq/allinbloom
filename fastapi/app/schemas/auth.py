from __future__ import annotations

from app.schemas.base import SchemaBase


class RequestCodeIn(SchemaBase):
    email: str


class VerifyCodeIn(SchemaBase):
    email: str
    code: str
    name: str | None = None


class GoogleSignInIn(SchemaBase):
    id_token: str


class GoogleCodeSignInIn(SchemaBase):
    code: str
