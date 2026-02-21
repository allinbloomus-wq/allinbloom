"""add webhook events table for replay protection

Revision ID: 0008_webhook_events
Revises: 0007_order_paypal_fields
Create Date: 2026-02-21 00:30:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "0008_webhook_events"
down_revision = "0007_order_paypal_fields"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "WebhookEvent",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("provider", sa.String(), nullable=False),
        sa.Column("eventId", sa.String(), nullable=False),
        sa.Column("createdAt", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("provider", "eventId", name="uq_WebhookEvent_provider_eventId"),
    )
    op.create_index("ix_WebhookEvent_provider", "WebhookEvent", ["provider"], unique=False)


def downgrade():
    op.drop_index("ix_WebhookEvent_provider", table_name="WebhookEvent")
    op.drop_table("WebhookEvent")
