from __future__ import annotations

from sqlalchemy import Column, DateTime, Integer, String, func

from app.core.database import Base


class StoreSettings(Base):
    __tablename__ = "StoreSettings"

    id = Column(String, primary_key=True, default="default")
    global_discount_percent = Column("globalDiscountPercent", Integer, default=0, nullable=False)
    global_discount_note = Column("globalDiscountNote", String, nullable=True)
    category_discount_percent = Column(
        "categoryDiscountPercent", Integer, default=0, nullable=False
    )
    category_discount_note = Column("categoryDiscountNote", String, nullable=True)
    category_flower_type = Column("categoryFlowerType", String, nullable=True)
    category_style = Column("categoryStyle", String, nullable=True)
    category_mixed = Column("categoryMixed", String, nullable=True)
    category_color = Column("categoryColor", String, nullable=True)
    category_min_price_cents = Column("categoryMinPriceCents", Integer, nullable=True)
    category_max_price_cents = Column("categoryMaxPriceCents", Integer, nullable=True)
    first_order_discount_percent = Column(
        "firstOrderDiscountPercent", Integer, default=10, nullable=False
    )
    first_order_discount_note = Column("firstOrderDiscountNote", String, nullable=True)
    updated_at = Column(
        "updatedAt",
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
