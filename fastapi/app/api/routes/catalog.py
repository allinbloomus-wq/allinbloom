from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import and_, func, or_, select
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.bouquet import Bouquet
from app.models.enums import BouquetStyle, FlowerType
from app.schemas.catalog import CatalogResponse
from app.schemas.bouquet import BouquetOut
from app.services.pricing import get_bouquet_pricing
from app.services.settings import get_store_settings

router = APIRouter(prefix="/api/catalog", tags=["catalog"])


def _normalize_enum(value: str | None, enum_cls):
    if not value:
        return None
    upper = value.upper()
    try:
        return enum_cls(upper)
    except Exception:
        return None


@router.get("", response_model=CatalogResponse)
def list_catalog(
    flower: str | None = None,
    color: str | None = None,
    style: str | None = None,
    mixed: str | None = None,
    min: float | None = Query(default=None, alias="min"),
    max: float | None = Query(default=None, alias="max"),
    filter: str | None = None,
    cursor: str | None = None,
    take: int = Query(default=12, ge=1, le=50),
    db: Session = Depends(get_db),
):
    filters = [Bouquet.is_active.is_(True)]
    if filter == "featured":
        filters.append(Bouquet.is_featured.is_(True))

    flower_enum = _normalize_enum(flower, FlowerType)
    if flower_enum and flower_enum != FlowerType.MIXED:
        filters.append(Bouquet.flower_type == flower_enum)
    elif flower_enum == FlowerType.MIXED:
        filters.append(Bouquet.flower_type == flower_enum)

    style_enum = _normalize_enum(style, BouquetStyle)
    if style_enum:
        filters.append(Bouquet.style == style_enum)

    if mixed == "mixed":
        filters.append(Bouquet.is_mixed.is_(True))
    if mixed == "mono":
        filters.append(Bouquet.is_mixed.is_(False))

    if min is not None or max is not None:
        min_cents = int(min * 100) if min is not None else None
        max_cents = int(max * 100) if max is not None else None
        if min_cents is not None:
            filters.append(Bouquet.price_cents >= min_cents)
        if max_cents is not None:
            filters.append(Bouquet.price_cents <= max_cents)

    if color:
        needle = color.lower()
        filters.append(func.lower(Bouquet.colors).contains(needle))

    base_query = select(Bouquet).where(and_(*filters))

    if cursor:
        cursor_row = db.execute(select(Bouquet).where(Bouquet.id == cursor)).scalars().first()
        if not cursor_row:
            raise HTTPException(status_code=400, detail="Invalid cursor.")
        base_query = base_query.where(
            or_(
                Bouquet.created_at < cursor_row.created_at,
                and_(
                    Bouquet.created_at == cursor_row.created_at,
                    Bouquet.id < cursor_row.id,
                ),
            )
        )

    query = base_query.order_by(Bouquet.created_at.desc(), Bouquet.id.desc()).limit(take + 1)
    results = db.execute(query).scalars().all()

    has_more = len(results) > take
    page = results[:take]
    next_cursor = page[-1].id if has_more and page else None

    settings = get_store_settings(db)
    items = [
        {
            "bouquet": BouquetOut.model_validate(bouquet),
            "pricing": get_bouquet_pricing(bouquet, settings),
        }
        for bouquet in page
    ]
    return CatalogResponse(items=items, next_cursor=next_cursor)
