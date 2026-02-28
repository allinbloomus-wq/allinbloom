from __future__ import annotations

from sqlalchemy import Boolean, Column, DateTime, Enum, Integer, String, func
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.enums import BouquetType, FlowerType
from app.utils.ids import generate_cuid


class Bouquet(Base):
    __tablename__ = "Bouquet"

    id = Column(String, primary_key=True, default=generate_cuid)
    name = Column(String, nullable=False)
    description = Column(String, nullable=False)
    price_cents = Column("priceCents", Integer, nullable=False)
    currency = Column(String, default="USD", nullable=False)
    flower_type = Column("flowerType", Enum(FlowerType, name="FlowerType"), nullable=False)
    # Stores up to three flower types as CSV (e.g. "ROSE, TULIP").
    style = Column(String, nullable=False)
    bouquet_type = Column("bouquetType", String, default=BouquetType.MONO.value, nullable=False)
    colors = Column(String, nullable=False)
    is_mixed = Column("isMixed", Boolean, default=False, nullable=False)
    is_featured = Column("isFeatured", Boolean, default=False, nullable=False)
    is_active = Column("isActive", Boolean, default=True, nullable=False)
    allow_flower_quantity = Column(
        "allowFlowerQuantity", Boolean, default=True, nullable=False
    )
    discount_percent = Column("discountPercent", Integer, default=0, nullable=False)
    discount_note = Column("discountNote", String, nullable=True)
    image = Column(String, nullable=False)
    image_2 = Column("image2", String, nullable=True)
    image_3 = Column("image3", String, nullable=True)
    image_4 = Column("image4", String, nullable=True)
    image_5 = Column("image5", String, nullable=True)
    image_6 = Column("image6", String, nullable=True)
    created_at = Column(
        "createdAt", DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        "updatedAt",
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    order_items = relationship("OrderItem", back_populates="bouquet")
