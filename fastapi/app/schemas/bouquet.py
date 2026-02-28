from __future__ import annotations

from typing import Optional

from app.models.enums import BouquetType, FlowerType
from app.schemas.base import SchemaBase


class BouquetOut(SchemaBase):
    id: str
    name: str
    description: str
    price_cents: int
    currency: str
    flower_type: FlowerType
    style: str
    bouquet_type: BouquetType
    colors: str
    is_mixed: bool
    is_featured: bool
    is_active: bool
    allow_flower_quantity: bool
    discount_percent: int
    discount_note: Optional[str] = None
    image: str
    image_2: Optional[str] = None
    image_3: Optional[str] = None
    image_4: Optional[str] = None
    image_5: Optional[str] = None
    image_6: Optional[str] = None


class BouquetCreate(SchemaBase):
    name: str
    description: str
    price_cents: int
    currency: str = "USD"
    flower_type: FlowerType
    style: str
    bouquet_type: BouquetType = BouquetType.MONO
    colors: str
    is_mixed: bool = False
    is_featured: bool = False
    is_active: bool = True
    allow_flower_quantity: bool = True
    discount_percent: int = 0
    discount_note: Optional[str] = None
    image: str
    image_2: Optional[str] = None
    image_3: Optional[str] = None
    image_4: Optional[str] = None
    image_5: Optional[str] = None
    image_6: Optional[str] = None


class BouquetUpdate(SchemaBase):
    name: Optional[str] = None
    description: Optional[str] = None
    price_cents: Optional[int] = None
    currency: Optional[str] = None
    flower_type: Optional[FlowerType] = None
    style: Optional[str] = None
    bouquet_type: Optional[BouquetType] = None
    colors: Optional[str] = None
    is_mixed: Optional[bool] = None
    is_featured: Optional[bool] = None
    is_active: Optional[bool] = None
    allow_flower_quantity: Optional[bool] = None
    discount_percent: Optional[int] = None
    discount_note: Optional[str] = None
    image: Optional[str] = None
    image_2: Optional[str] = None
    image_3: Optional[str] = None
    image_4: Optional[str] = None
    image_5: Optional[str] = None
    image_6: Optional[str] = None
