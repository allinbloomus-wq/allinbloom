"""add bouquet sold out flag

Revision ID: 0017_bouquet_sold_out_flag
Revises: 0016_refresh_color_palette
Create Date: 2026-03-01 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "0017_bouquet_sold_out_flag"
down_revision = "0016_refresh_color_palette"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "Bouquet",
        sa.Column(
            "isSoldOut",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )


def downgrade():
    op.drop_column("Bouquet", "isSoldOut")
