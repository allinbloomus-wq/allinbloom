from __future__ import annotations

from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.utils.ids import generate_cuid


class OrderItem(Base):
    __tablename__ = "OrderItem"

    id = Column(String, primary_key=True, default=generate_cuid)
    order_id = Column("orderId", String, ForeignKey("Order.id"), nullable=False)
    bouquet_id = Column("bouquetId", String, ForeignKey("Bouquet.id"), nullable=True)
    name = Column(String, nullable=False)
    price_cents = Column("priceCents", Integer, nullable=False)
    quantity = Column(Integer, nullable=False)
    image = Column(String, nullable=False)
    details = Column(String, nullable=True)

    order = relationship("Order", back_populates="items")
    bouquet = relationship("Bouquet", back_populates="order_items")
