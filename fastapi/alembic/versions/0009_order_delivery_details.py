"""add structured delivery address fields and order comment

Revision ID: 0009_order_delivery_details
Revises: 0008_webhook_events
Create Date: 2026-02-23 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "0009_order_delivery_details"
down_revision = "0008_webhook_events"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("Order", sa.Column("deliveryAddressLine1", sa.String(), nullable=True))
    op.add_column("Order", sa.Column("deliveryAddressLine2", sa.String(), nullable=True))
    op.add_column("Order", sa.Column("deliveryCity", sa.String(), nullable=True))
    op.add_column("Order", sa.Column("deliveryState", sa.String(), nullable=True))
    op.add_column("Order", sa.Column("deliveryPostalCode", sa.String(), nullable=True))
    op.add_column("Order", sa.Column("deliveryCountry", sa.String(), nullable=True))
    op.add_column("Order", sa.Column("deliveryFloor", sa.String(), nullable=True))
    op.add_column("Order", sa.Column("orderComment", sa.String(), nullable=True))


def downgrade():
    op.drop_column("Order", "orderComment")
    op.drop_column("Order", "deliveryFloor")
    op.drop_column("Order", "deliveryCountry")
    op.drop_column("Order", "deliveryPostalCode")
    op.drop_column("Order", "deliveryState")
    op.drop_column("Order", "deliveryCity")
    op.drop_column("Order", "deliveryAddressLine2")
    op.drop_column("Order", "deliveryAddressLine1")
