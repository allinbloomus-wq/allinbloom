from __future__ import annotations

from sqlalchemy import Boolean, Column, DateTime, Enum, Integer, String, func
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.enums import OrderStatus
from app.utils.ids import generate_cuid


class Order(Base):
    __tablename__ = "Order"

    id = Column(String, primary_key=True, default=generate_cuid)
    email = Column(String, nullable=True, index=True)
    phone = Column(String, nullable=True)
    stripe_session_id = Column("stripeSessionId", String, unique=True, nullable=True)
    total_cents = Column("totalCents", Integer, nullable=False)
    currency = Column(String, default="USD", nullable=False)
    status = Column(Enum(OrderStatus, name="OrderStatus"), default=OrderStatus.PENDING, nullable=False)
    is_read = Column("isRead", Boolean, default=False, nullable=False)
    created_at = Column(
        "createdAt", DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    items = relationship("OrderItem", back_populates="order", cascade="all, delete")
