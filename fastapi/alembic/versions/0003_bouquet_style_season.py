"""add season bouquet style

Revision ID: 0003_bouquet_style_season
Revises: 0002_order_soft_delete
Create Date: 2026-02-19 00:00:00.000000
"""

from alembic import op


revision = "0003_bouquet_style_season"
down_revision = "0002_order_soft_delete"
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        op.execute('ALTER TYPE "BouquetStyle" ADD VALUE IF NOT EXISTS \'SEASON\'')


def downgrade():
    # PostgreSQL enum values are not safely removable in-place.
    pass
