from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_admin
from app.schemas.settings import StoreSettingsOut, StoreSettingsUpdate
from app.services.settings import get_store_settings, update_store_settings

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("", response_model=StoreSettingsOut)
def get_settings(db: Session = Depends(get_db)):
    return get_store_settings(db)


@router.patch("", response_model=StoreSettingsOut)
def patch_settings(
    payload: StoreSettingsUpdate,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    data = payload.model_dump(exclude_unset=True)
    return update_store_settings(db, data)
