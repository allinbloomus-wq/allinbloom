from __future__ import annotations

from app.schemas.base import SchemaBase


class UploadResponse(SchemaBase):
    url: str
    public_id: str
