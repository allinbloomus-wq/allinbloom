from __future__ import annotations

from sqlalchemy import Boolean, CheckConstraint, Column, DateTime, Integer, String, func

from app.core.database import Base
from app.utils.ids import generate_cuid


class Review(Base):
    __tablename__ = "Review"
    __table_args__ = (
        CheckConstraint("rating >= 1 AND rating <= 5", name="ck_review_rating_range"),
    )

    id = Column(String, primary_key=True, default=generate_cuid)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    rating = Column(Integer, nullable=False)
    text = Column(String, nullable=False)
    image = Column(String, nullable=True)
    is_active = Column("isActive", Boolean, default=True, nullable=False)
    is_read = Column("isRead", Boolean, default=False, nullable=False)
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
