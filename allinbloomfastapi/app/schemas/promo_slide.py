from __future__ import annotations

from typing import Optional

from app.schemas.base import SchemaBase


class PromoSlideOut(SchemaBase):
    id: str
    title: str
    subtitle: Optional[str] = None
    image: str
    link: Optional[str] = None
    is_active: bool
    position: int


class PromoSlideCreate(SchemaBase):
    title: str
    subtitle: Optional[str] = None
    image: str
    link: Optional[str] = None
    is_active: bool = True
    position: int = 0


class PromoSlideUpdate(SchemaBase):
    title: Optional[str] = None
    subtitle: Optional[str] = None
    image: Optional[str] = None
    link: Optional[str] = None
    is_active: Optional[bool] = None
    position: Optional[int] = None
