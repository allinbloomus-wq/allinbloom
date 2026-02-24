"""add order item details

Revision ID: 0010_order_item_details
Revises: 0009_order_delivery_details
Create Date: 2026-02-24 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "0010_order_item_details"
down_revision = "0009_order_delivery_details"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("OrderItem", sa.Column("details", sa.String(), nullable=True))


def downgrade():
    op.drop_column("OrderItem", "details")
