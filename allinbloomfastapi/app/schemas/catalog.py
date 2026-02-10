from __future__ import annotations

from typing import Optional

from app.schemas.base import SchemaBase
from app.schemas.bouquet import BouquetOut


class DiscountInfo(SchemaBase):
    percent: int
    note: str
    source: str


class BouquetPricing(SchemaBase):
    original_price_cents: int
    final_price_cents: int
    discount: Optional[DiscountInfo] = None


class CatalogItem(SchemaBase):
    bouquet: BouquetOut
    pricing: BouquetPricing


class CatalogResponse(SchemaBase):
    items: list[CatalogItem]
    next_cursor: Optional[str] = None
