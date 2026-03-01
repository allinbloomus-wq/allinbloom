from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_admin
from app.models.bouquet import Bouquet
from app.models.enums import BouquetType, FlowerType
from app.schemas.bouquet import BouquetCreate, BouquetOut, BouquetUpdate
from app.services.colors import normalize_color_csv

router = APIRouter(prefix="/api/bouquets", tags=["bouquets"])

FLOWER_TYPE_VALUES = {member.value for member in FlowerType}
FLOWER_QUANTITY_MIN = 1
FLOWER_QUANTITY_MAX = 1001
FLOWER_QUANTITY_ELIGIBLE_TYPES = {BouquetType.MONO, BouquetType.SEASON}


def _normalize_flower_types_csv(value: str | None, fallback: FlowerType | str | None) -> str:
    parts = str(value or "").split(",")
    values: list[str] = []
    for part in parts:
        token = part.strip().upper()
        if token in FLOWER_TYPE_VALUES and token != "MIXED" and token not in values:
            values.append(token)
        if len(values) >= 3:
            break

    if not values:
        fallback_token = str(getattr(fallback, "value", fallback) or "").strip().upper()
        if fallback_token in FLOWER_TYPE_VALUES and fallback_token != "MIXED":
            values.append(fallback_token)

    if not values:
        values.append(FlowerType.ROSE.value)
    return ", ".join(values)


def _resolve_bouquet_type(data: dict, existing: Bouquet | None = None) -> BouquetType:
    raw = data.get("bouquet_type")
    if raw:
        return BouquetType(str(getattr(raw, "value", raw)).upper())

    raw_is_mixed = data.get("is_mixed")
    if raw_is_mixed is not None:
        return BouquetType.MIXED if bool(raw_is_mixed) else BouquetType.MONO

    if existing and existing.bouquet_type:
        try:
            return BouquetType(str(getattr(existing.bouquet_type, "value", existing.bouquet_type)).upper())
        except Exception:
            pass
    if existing and existing.is_mixed:
        return BouquetType.MIXED
    return BouquetType.MONO


def _normalize_default_flower_quantity(value: object) -> int:
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        return FLOWER_QUANTITY_MIN
    return max(FLOWER_QUANTITY_MIN, min(FLOWER_QUANTITY_MAX, parsed))


@router.get("", response_model=list[BouquetOut])
def list_bouquets(
    include_inactive: bool = Query(default=False),
    db: Session = Depends(get_db),
):
    stmt = select(Bouquet)
    if not include_inactive:
        stmt = stmt.where(Bouquet.is_active.is_(True))
    stmt = stmt.order_by(Bouquet.created_at.desc())
    return db.execute(stmt).scalars().all()


@router.get("/{bouquet_id}", response_model=BouquetOut)
def get_bouquet(bouquet_id: str, db: Session = Depends(get_db)):
    bouquet = db.get(Bouquet, bouquet_id)
    if not bouquet:
        raise HTTPException(status_code=404, detail="Not found")
    return bouquet


@router.post("", response_model=BouquetOut)
def create_bouquet(
    payload: BouquetCreate,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    data = payload.model_dump()
    data["colors"] = normalize_color_csv(data.get("colors"))
    bouquet_type = _resolve_bouquet_type(data)
    data["bouquet_type"] = bouquet_type.value
    data["is_mixed"] = bouquet_type == BouquetType.MIXED
    allow_flower_quantity = bool(data.get("allow_flower_quantity", True))
    data["allow_flower_quantity"] = allow_flower_quantity
    default_flower_quantity = _normalize_default_flower_quantity(
        data.get("default_flower_quantity")
    )
    if not allow_flower_quantity or bouquet_type not in FLOWER_QUANTITY_ELIGIBLE_TYPES:
        default_flower_quantity = FLOWER_QUANTITY_MIN
    data["default_flower_quantity"] = default_flower_quantity
    data["style"] = _normalize_flower_types_csv(data.get("style"), data.get("flower_type"))
    data["flower_type"] = FlowerType(data["style"].split(",")[0].strip())
    bouquet = Bouquet(**data)
    db.add(bouquet)
    db.commit()
    db.refresh(bouquet)
    return bouquet


@router.patch("/{bouquet_id}", response_model=BouquetOut)
def update_bouquet(
    bouquet_id: str,
    payload: BouquetUpdate,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    bouquet = db.get(Bouquet, bouquet_id)
    if not bouquet:
        raise HTTPException(status_code=404, detail="Not found")
    data = payload.model_dump(exclude_unset=True)
    if "colors" in data:
        data["colors"] = normalize_color_csv(data.get("colors"))
    if "style" in data or "flower_type" in data:
        data["style"] = _normalize_flower_types_csv(
            data.get("style"),
            data.get("flower_type") or bouquet.flower_type,
        )
        data["flower_type"] = FlowerType(data["style"].split(",")[0].strip())
    bouquet_type = _resolve_bouquet_type(data, bouquet)
    data["bouquet_type"] = bouquet_type.value
    data["is_mixed"] = bouquet_type == BouquetType.MIXED
    allow_flower_quantity = bool(
        data.get("allow_flower_quantity", bouquet.allow_flower_quantity)
    )
    data["allow_flower_quantity"] = allow_flower_quantity
    default_flower_quantity = _normalize_default_flower_quantity(
        data.get("default_flower_quantity", bouquet.default_flower_quantity)
    )
    if not allow_flower_quantity or bouquet_type not in FLOWER_QUANTITY_ELIGIBLE_TYPES:
        default_flower_quantity = FLOWER_QUANTITY_MIN
    data["default_flower_quantity"] = default_flower_quantity
    for key, value in data.items():
        setattr(bouquet, key, value)
    db.commit()
    db.refresh(bouquet)
    return bouquet


@router.delete("/{bouquet_id}")
def delete_bouquet(
    bouquet_id: str,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    bouquet = db.get(Bouquet, bouquet_id)
    if not bouquet:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(bouquet)
    db.commit()
    return {"ok": True}
