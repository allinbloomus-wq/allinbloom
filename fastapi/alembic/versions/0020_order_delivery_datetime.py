"""add requested delivery date and time to orders

Revision ID: 0020_order_delivery_datetime
Revises: 0019_payment_events
Create Date: 2026-06-22 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "0020_order_delivery_datetime"
down_revision = "0019_payment_events"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("Order", sa.Column("deliveryDateTime", sa.String(), nullable=True))


def downgrade():
    op.drop_column("Order", "deliveryDateTime")
