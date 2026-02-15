"""add soft delete fields to order

Revision ID: 0002_order_soft_delete
Revises: 0001_initial
Create Date: 2026-02-15 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "0002_order_soft_delete"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "Order",
        sa.Column(
            "isDeleted",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )
    op.add_column("Order", sa.Column("deletedAt", sa.DateTime(timezone=True), nullable=True))
    op.create_index("ix_Order_isDeleted", "Order", ["isDeleted"], unique=False)


def downgrade():
    op.drop_index("ix_Order_isDeleted", table_name="Order")
    op.drop_column("Order", "deletedAt")
    op.drop_column("Order", "isDeleted")
