"""add home page image settings

Revision ID: 0004_store_settings_home_images
Revises: 0003_bouquet_style_season
Create Date: 2026-02-19 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "0004_store_settings_home_images"
down_revision = "0003_bouquet_style_season"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "StoreSettings",
        sa.Column(
            "homeHeroImage",
            sa.String(),
            nullable=False,
            server_default="/images/hero-bouquet.webp",
        ),
    )
    op.add_column(
        "StoreSettings",
        sa.Column(
            "homeGalleryImage1",
            sa.String(),
            nullable=False,
            server_default="/images/bouquet-1.webp",
        ),
    )
    op.add_column(
        "StoreSettings",
        sa.Column(
            "homeGalleryImage2",
            sa.String(),
            nullable=False,
            server_default="/images/bouquet-2.webp",
        ),
    )
    op.add_column(
        "StoreSettings",
        sa.Column(
            "homeGalleryImage3",
            sa.String(),
            nullable=False,
            server_default="/images/bouquet-3.webp",
        ),
    )
    op.add_column(
        "StoreSettings",
        sa.Column(
            "homeGalleryImage4",
            sa.String(),
            nullable=False,
            server_default="/images/bouquet-4.webp",
        ),
    )
    op.add_column(
        "StoreSettings",
        sa.Column(
            "homeGalleryImage5",
            sa.String(),
            nullable=False,
            server_default="/images/bouquet-5.webp",
        ),
    )
    op.add_column(
        "StoreSettings",
        sa.Column(
            "homeGalleryImage6",
            sa.String(),
            nullable=False,
            server_default="/images/bouquet-6.webp",
        ),
    )


def downgrade():
    op.drop_column("StoreSettings", "homeGalleryImage6")
    op.drop_column("StoreSettings", "homeGalleryImage5")
    op.drop_column("StoreSettings", "homeGalleryImage4")
    op.drop_column("StoreSettings", "homeGalleryImage3")
    op.drop_column("StoreSettings", "homeGalleryImage2")
    op.drop_column("StoreSettings", "homeGalleryImage1")
    op.drop_column("StoreSettings", "homeHeroImage")
