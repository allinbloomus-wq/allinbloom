from __future__ import annotations

from typing import Optional

from app.schemas.base import SchemaBase


class StoreSettingsOut(SchemaBase):
    id: str
    global_discount_percent: int
    global_discount_note: Optional[str] = None
    category_discount_percent: int
    category_discount_note: Optional[str] = None
    category_flower_type: Optional[str] = None
    category_style: Optional[str] = None
    category_mixed: Optional[str] = None
    category_color: Optional[str] = None
    category_min_price_cents: Optional[int] = None
    category_max_price_cents: Optional[int] = None
    first_order_discount_percent: int
    first_order_discount_note: Optional[str] = None
    home_hero_image: str
    home_gallery_image_1: str
    home_gallery_image_2: str
    home_gallery_image_3: str
    home_gallery_image_4: str
    home_gallery_image_5: str
    home_gallery_image_6: str


class StoreSettingsUpdate(SchemaBase):
    global_discount_percent: Optional[int] = None
    global_discount_note: Optional[str] = None
    category_discount_percent: Optional[int] = None
    category_discount_note: Optional[str] = None
    category_flower_type: Optional[str] = None
    category_style: Optional[str] = None
    category_mixed: Optional[str] = None
    category_color: Optional[str] = None
    category_min_price_cents: Optional[int] = None
    category_max_price_cents: Optional[int] = None
    first_order_discount_percent: Optional[int] = None
    first_order_discount_note: Optional[str] = None
    home_hero_image: Optional[str] = None
    home_gallery_image_1: Optional[str] = None
    home_gallery_image_2: Optional[str] = None
    home_gallery_image_3: Optional[str] = None
    home_gallery_image_4: Optional[str] = None
    home_gallery_image_5: Optional[str] = None
    home_gallery_image_6: Optional[str] = None
