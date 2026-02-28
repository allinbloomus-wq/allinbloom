"""add bouquet allow flower quantity flag

Revision ID: 0013_bouquet_allow_flower_quantity
Revises: 0012_bouquet_type_and_style_csv
Create Date: 2026-02-28 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "0013_bouquet_allow_flower_quantity"
down_revision = "0012_bouquet_type_and_style_csv"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "Bouquet",
        sa.Column(
            "allowFlowerQuantity",
            sa.Boolean(),
            nullable=False,
            server_default=sa.true(),
        ),
    )


def downgrade():
    op.drop_column("Bouquet", "allowFlowerQuantity")
