from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_admin
from app.models.bouquet import Bouquet
from app.schemas.bouquet import BouquetCreate, BouquetOut, BouquetUpdate

router = APIRouter(prefix="/api/bouquets", tags=["bouquets"])


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
    bouquet = Bouquet(**payload.model_dump())
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
