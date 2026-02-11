from __future__ import annotations

from sqlalchemy import Boolean, Column, DateTime, Integer, String, func

from app.core.database import Base
from app.utils.ids import generate_cuid


class PromoSlide(Base):
    __tablename__ = "PromoSlide"

    id = Column(String, primary_key=True, default=generate_cuid)
    title = Column(String, nullable=False)
    subtitle = Column(String, nullable=True)
    image = Column(String, nullable=False)
    link = Column(String, nullable=True)
    is_active = Column("isActive", Boolean, default=True, nullable=False)
    position = Column(Integer, default=0, nullable=False)
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
