"""add catalog category image settings

Revision ID: 0005_catalog_category_images
Revises: 0004_store_settings_home_images
Create Date: 2026-02-19 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "0005_catalog_category_images"
down_revision = "0004_store_settings_home_images"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "StoreSettings",
        sa.Column(
            "catalogCategoryImageMono",
            sa.String(),
            nullable=False,
            server_default="/images/bouquet-7.webp",
        ),
    )
    op.add_column(
        "StoreSettings",
        sa.Column(
            "catalogCategoryImageMixed",
            sa.String(),
            nullable=False,
            server_default="/images/bouquet-5.webp",
        ),
    )
    op.add_column(
        "StoreSettings",
        sa.Column(
            "catalogCategoryImageSeason",
            sa.String(),
            nullable=False,
            server_default="/images/bouquet-2.webp",
        ),
    )
    op.add_column(
        "StoreSettings",
        sa.Column(
            "catalogCategoryImageAll",
            sa.String(),
            nullable=False,
            server_default="/images/hero-bouquet.webp",
        ),
    )


def downgrade():
    op.drop_column("StoreSettings", "catalogCategoryImageAll")
    op.drop_column("StoreSettings", "catalogCategoryImageSeason")
    op.drop_column("StoreSettings", "catalogCategoryImageMixed")
    op.drop_column("StoreSettings", "catalogCategoryImageMono")
