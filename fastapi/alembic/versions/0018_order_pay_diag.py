"""add order payment diagnostics

Revision ID: 0018_order_pay_diag
Revises: 0017_bouquet_sold_out_flag
Create Date: 2026-03-30 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "0018_order_pay_diag"
down_revision = "0017_bouquet_sold_out_flag"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("Order", sa.Column("paymentFailureStage", sa.String(), nullable=True))
    op.add_column("Order", sa.Column("paymentFailureCode", sa.String(), nullable=True))
    op.add_column("Order", sa.Column("paymentFailureMessage", sa.String(), nullable=True))
    op.add_column("Order", sa.Column("paymentFailureDetails", sa.String(), nullable=True))
    op.add_column("Order", sa.Column("paymentFailedAt", sa.DateTime(timezone=True), nullable=True))


def downgrade():
    op.drop_column("Order", "paymentFailedAt")
    op.drop_column("Order", "paymentFailureDetails")
    op.drop_column("Order", "paymentFailureMessage")
    op.drop_column("Order", "paymentFailureCode")
    op.drop_column("Order", "paymentFailureStage")
