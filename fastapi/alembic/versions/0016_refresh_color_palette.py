"""refresh color palette values

Revision ID: 0016_refresh_color_palette
Revises: 0015_refresh_flower_types
Create Date: 2026-03-01 00:00:00.000000
"""

from alembic import op


revision = "0016_refresh_color_palette"
down_revision = "0015_refresh_flower_types"
branch_labels = None
depends_on = None


def _normalize_sql_expression(column_name: str) -> str:
    return f"""
    REGEXP_REPLACE(
        REGEXP_REPLACE(
            REPLACE(
                REPLACE(
                    REPLACE(
                        REPLACE(
                            REPLACE(
                                REPLACE(
                                    LOWER(COALESCE({column_name}, '')),
                                    'champange',
                                    'yellow'
                                ),
                                'champagne',
                                'yellow'
                            ),
                            'blush',
                            'pink'
                        ),
                        'ivory',
                        'white'
                    ),
                    'ruby',
                    'burgundy'
                ),
                'sage',
                'light blue'
            ),
            '\\s*,\\s*',
            ', ',
            'g'
        ),
        '\\s+',
        ' ',
        'g'
    )
    """


def upgrade():
    op.execute(
        """
        UPDATE "StoreSettings"
        SET "categoryColor" = CASE
            WHEN LOWER(TRIM(COALESCE("categoryColor", ''))) = 'blush' THEN 'pink'
            WHEN LOWER(TRIM(COALESCE("categoryColor", ''))) = 'ivory' THEN 'white'
            WHEN LOWER(TRIM(COALESCE("categoryColor", ''))) = 'ruby' THEN 'burgundy'
            WHEN LOWER(TRIM(COALESCE("categoryColor", ''))) = 'sage' THEN 'light blue'
            WHEN LOWER(TRIM(COALESCE("categoryColor", ''))) IN ('champagne', 'champange') THEN 'yellow'
            ELSE LOWER(TRIM(COALESCE("categoryColor", '')))
        END
        WHERE "categoryColor" IS NOT NULL
        """
    )
    op.execute(
        f"""
        UPDATE "Bouquet"
        SET "colors" = TRIM(BOTH ', ' FROM {_normalize_sql_expression('"colors"')})
        WHERE "colors" IS NOT NULL
        """
    )


def downgrade():
    op.execute(
        """
        UPDATE "StoreSettings"
        SET "categoryColor" = CASE
            WHEN LOWER(TRIM(COALESCE("categoryColor", ''))) = 'pink' THEN 'blush'
            WHEN LOWER(TRIM(COALESCE("categoryColor", ''))) = 'white' THEN 'ivory'
            WHEN LOWER(TRIM(COALESCE("categoryColor", ''))) = 'burgundy' THEN 'ruby'
            WHEN LOWER(TRIM(COALESCE("categoryColor", ''))) = 'light blue' THEN 'sage'
            WHEN LOWER(TRIM(COALESCE("categoryColor", ''))) = 'yellow' THEN 'champagne'
            ELSE LOWER(TRIM(COALESCE("categoryColor", '')))
        END
        WHERE "categoryColor" IS NOT NULL
        """
    )
    op.execute(
        """
        UPDATE "Bouquet"
        SET "colors" = TRIM(
            BOTH ', ' FROM REGEXP_REPLACE(
                REPLACE(
                    REPLACE(
                        REPLACE(
                            REPLACE(
                                REPLACE(
                                    LOWER(COALESCE("colors", '')),
                                    'pink',
                                    'blush'
                                ),
                                'white',
                                'ivory'
                            ),
                            'burgundy',
                            'ruby'
                        ),
                        'light blue',
                        'sage'
                    ),
                    'yellow',
                    'champagne'
                ),
                '\\s*,\\s*',
                ', ',
                'g'
            )
        )
        WHERE "colors" IS NOT NULL
        """
    )
