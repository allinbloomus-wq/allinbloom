"""add bouquet gallery images

Revision ID: 0011_bouquet_gallery_images
Revises: 0010_order_item_details
Create Date: 2026-02-27 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "0011_bouquet_gallery_images"
down_revision = "0010_order_item_details"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("Bouquet", sa.Column("image2", sa.String(), nullable=True))
    op.add_column("Bouquet", sa.Column("image3", sa.String(), nullable=True))
    op.add_column("Bouquet", sa.Column("image4", sa.String(), nullable=True))
    op.add_column("Bouquet", sa.Column("image5", sa.String(), nullable=True))
    op.add_column("Bouquet", sa.Column("image6", sa.String(), nullable=True))


def downgrade():
    op.drop_column("Bouquet", "image6")
    op.drop_column("Bouquet", "image5")
    op.drop_column("Bouquet", "image4")
    op.drop_column("Bouquet", "image3")
    op.drop_column("Bouquet", "image2")
