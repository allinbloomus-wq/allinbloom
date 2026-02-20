from __future__ import annotations

from datetime import datetime
from typing import Optional

from app.schemas.base import SchemaBase


class ReviewPublicOut(SchemaBase):
    id: str
    name: str
    rating: int
    text: str
    image: Optional[str] = None
    created_at: datetime


class ReviewAdminOut(SchemaBase):
    id: str
    name: str
    email: str
    rating: int
    text: str
    image: Optional[str] = None
    is_active: bool
    is_read: bool
    created_at: datetime
    updated_at: datetime


class ReviewCreatePublic(SchemaBase):
    name: str
    email: str
    rating: int
    text: str
    image: Optional[str] = None


class ReviewCreateAdmin(SchemaBase):
    name: str
    email: str
    rating: int
    text: str
    image: Optional[str] = None
    is_active: bool = True
    is_read: bool = True


class ReviewUpdateAdmin(SchemaBase):
    name: Optional[str] = None
    email: Optional[str] = None
    rating: Optional[int] = None
    text: Optional[str] = None
    image: Optional[str] = None
    is_active: Optional[bool] = None
    is_read: Optional[bool] = None


class ReviewCountOut(SchemaBase):
    count: int


class ReviewToggleReadOut(SchemaBase):
    is_read: bool


class ReviewToggleActiveOut(SchemaBase):
    is_active: bool


class ReviewDeleteOut(SchemaBase):
    deleted: bool
