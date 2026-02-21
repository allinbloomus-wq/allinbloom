"""add paypal fields and delivery metadata to order

Revision ID: 0007_order_paypal_fields
Revises: 0006_reviews
Create Date: 2026-02-21 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "0007_order_paypal_fields"
down_revision = "0006_reviews"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("Order", sa.Column("paypalOrderId", sa.String(), nullable=True))
    op.add_column("Order", sa.Column("paypalCaptureId", sa.String(), nullable=True))
    op.add_column("Order", sa.Column("deliveryAddress", sa.String(), nullable=True))
    op.add_column("Order", sa.Column("deliveryMiles", sa.String(), nullable=True))
    op.add_column("Order", sa.Column("deliveryFeeCents", sa.Integer(), nullable=True))
    op.add_column(
        "Order",
        sa.Column("firstOrderDiscountPercent", sa.Integer(), nullable=True),
    )
    op.create_index("ix_Order_paypalOrderId", "Order", ["paypalOrderId"], unique=True)
    op.create_index("ix_Order_paypalCaptureId", "Order", ["paypalCaptureId"], unique=True)


def downgrade():
    op.drop_index("ix_Order_paypalCaptureId", table_name="Order")
    op.drop_index("ix_Order_paypalOrderId", table_name="Order")
    op.drop_column("Order", "firstOrderDiscountPercent")
    op.drop_column("Order", "deliveryFeeCents")
    op.drop_column("Order", "deliveryMiles")
    op.drop_column("Order", "deliveryAddress")
    op.drop_column("Order", "paypalCaptureId")
    op.drop_column("Order", "paypalOrderId")
