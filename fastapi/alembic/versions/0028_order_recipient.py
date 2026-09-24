"""Add recipient contact details to orders.

Revision ID: 0028_order_recipient
Revises: 0027_shop_all_category_images
"""

from alembic import op
import sqlalchemy as sa


revision = "0028_order_recipient"
down_revision = "0027_shop_all_category_images"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("Order", sa.Column("recipientName", sa.String(), nullable=True))
    op.add_column("Order", sa.Column("recipientPhone", sa.String(), nullable=True))


def downgrade():
    op.drop_column("Order", "recipientPhone")
    op.drop_column("Order", "recipientName")
