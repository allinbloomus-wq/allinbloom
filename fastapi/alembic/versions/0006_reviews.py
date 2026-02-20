"""add reviews table

Revision ID: 0006_reviews
Revises: 0005_catalog_category_images
Create Date: 2026-02-20 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "0006_reviews"
down_revision = "0005_catalog_category_images"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "Review",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("rating", sa.Integer(), nullable=False),
        sa.Column("text", sa.String(), nullable=False),
        sa.Column("image", sa.String(), nullable=True),
        sa.Column(
            "isActive",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("true"),
        ),
        sa.Column(
            "isRead",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
        sa.Column(
            "createdAt",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updatedAt",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.CheckConstraint(
            "rating >= 1 AND rating <= 5",
            name="ck_review_rating_range",
        ),
    )

    op.create_index("ix_Review_email", "Review", ["email"], unique=False)
    op.create_index("ix_Review_isActive", "Review", ["isActive"], unique=False)
    op.create_index("ix_Review_isRead", "Review", ["isRead"], unique=False)
    op.create_index("ix_Review_createdAt", "Review", ["createdAt"], unique=False)


def downgrade():
    op.drop_index("ix_Review_createdAt", table_name="Review")
    op.drop_index("ix_Review_isRead", table_name="Review")
    op.drop_index("ix_Review_isActive", table_name="Review")
    op.drop_index("ix_Review_email", table_name="Review")
    op.drop_table("Review")
