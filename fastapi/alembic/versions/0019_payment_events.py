"""add payment event timeline

Revision ID: 0019_payment_events
Revises: 0018_order_pay_diag
Create Date: 2026-05-28 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "0019_payment_events"
down_revision = "0018_order_pay_diag"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "PaymentEvent",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("orderId", sa.String(), nullable=False),
        sa.Column("provider", sa.String(), nullable=False),
        sa.Column("source", sa.String(), nullable=False),
        sa.Column("event", sa.String(), nullable=False),
        sa.Column("message", sa.String(), nullable=True),
        sa.Column("stripeSessionId", sa.String(), nullable=True),
        sa.Column("stripeEventId", sa.String(), nullable=True),
        sa.Column("paymentIntentId", sa.String(), nullable=True),
        sa.Column("context", sa.JSON(), nullable=True),
        sa.Column(
            "createdAt",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["orderId"], ["Order.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_PaymentEvent_orderId"), "PaymentEvent", ["orderId"], unique=False)
    op.create_index(
        "ix_PaymentEvent_orderId_createdAt",
        "PaymentEvent",
        ["orderId", "createdAt"],
        unique=False,
    )
    op.create_index(
        op.f("ix_PaymentEvent_paymentIntentId"),
        "PaymentEvent",
        ["paymentIntentId"],
        unique=False,
    )
    op.create_index(
        op.f("ix_PaymentEvent_stripeEventId"),
        "PaymentEvent",
        ["stripeEventId"],
        unique=False,
    )
    op.create_index(
        op.f("ix_PaymentEvent_stripeSessionId"),
        "PaymentEvent",
        ["stripeSessionId"],
        unique=False,
    )


def downgrade():
    op.drop_index(op.f("ix_PaymentEvent_stripeSessionId"), table_name="PaymentEvent")
    op.drop_index(op.f("ix_PaymentEvent_stripeEventId"), table_name="PaymentEvent")
    op.drop_index(op.f("ix_PaymentEvent_paymentIntentId"), table_name="PaymentEvent")
    op.drop_index("ix_PaymentEvent_orderId_createdAt", table_name="PaymentEvent")
    op.drop_index(op.f("ix_PaymentEvent_orderId"), table_name="PaymentEvent")
    op.drop_table("PaymentEvent")
