"""add bouquet default flower quantity

Revision ID: 0014_bouquet_default_flower_qty
Revises: 0013_bouquet_allow_flower_qty
Create Date: 2026-03-01 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "0014_bouquet_default_flower_qty"
down_revision = "0013_bouquet_allow_flower_qty"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "Bouquet",
        sa.Column(
            "defaultFlowerQuantity",
            sa.Integer(),
            nullable=False,
            server_default="1",
        ),
    )


def downgrade():
    op.drop_column("Bouquet", "defaultFlowerQuantity")
