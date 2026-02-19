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
    home_hero_image = Column(
        "homeHeroImage",
        String,
        default="/images/hero-bouquet.webp",
        nullable=False,
    )
    home_gallery_image_1 = Column(
        "homeGalleryImage1",
        String,
        default="/images/bouquet-1.webp",
        nullable=False,
    )
    home_gallery_image_2 = Column(
        "homeGalleryImage2",
        String,
        default="/images/bouquet-2.webp",
        nullable=False,
    )
    home_gallery_image_3 = Column(
        "homeGalleryImage3",
        String,
        default="/images/bouquet-3.webp",
        nullable=False,
    )
    home_gallery_image_4 = Column(
        "homeGalleryImage4",
        String,
        default="/images/bouquet-4.webp",
        nullable=False,
    )
    home_gallery_image_5 = Column(
        "homeGalleryImage5",
        String,
        default="/images/bouquet-5.webp",
        nullable=False,
    )
    home_gallery_image_6 = Column(
        "homeGalleryImage6",
        String,
        default="/images/bouquet-6.webp",
        nullable=False,
    )
    catalog_category_image_mono = Column(
        "catalogCategoryImageMono",
        String,
        default="/images/bouquet-7.webp",
        nullable=False,
    )
    catalog_category_image_mixed = Column(
        "catalogCategoryImageMixed",
        String,
        default="/images/bouquet-5.webp",
        nullable=False,
    )
    catalog_category_image_season = Column(
        "catalogCategoryImageSeason",
        String,
        default="/images/bouquet-2.webp",
        nullable=False,
    )
    catalog_category_image_all = Column(
        "catalogCategoryImageAll",
        String,
        default="/images/hero-bouquet.webp",
        nullable=False,
    )
    updated_at = Column(
        "updatedAt",
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
