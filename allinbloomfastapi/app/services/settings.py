from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.store_settings import StoreSettings


DEFAULT_SETTINGS = {
    "id": "default",
    "global_discount_percent": 0,
    "global_discount_note": None,
    "category_discount_percent": 0,
    "category_discount_note": None,
    "category_flower_type": None,
    "category_style": None,
    "category_mixed": None,
    "category_color": None,
    "category_min_price_cents": None,
    "category_max_price_cents": None,
    "first_order_discount_percent": 10,
    "first_order_discount_note": "10% off your first order",
}


def get_store_settings(db: Session) -> StoreSettings:
    settings = db.get(StoreSettings, "default")
    if settings:
        return settings
    settings = StoreSettings(**DEFAULT_SETTINGS)
    db.add(settings)
    db.commit()
    db.refresh(settings)
    return settings


def update_store_settings(db: Session, data: dict) -> StoreSettings:
    settings = get_store_settings(db)
    for key, value in data.items():
        if hasattr(settings, key):
            setattr(settings, key, value)
    db.commit()
    db.refresh(settings)
    return settings
