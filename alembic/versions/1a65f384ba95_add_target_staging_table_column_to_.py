"""Add target_staging_table column to sheet_name_mappings

Revision ID: 1a65f384ba95
Revises: 846130644dad # Pointing to the create tax staging table migration
Create Date: <timestamp>

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1a65f384ba95'
down_revision: Union[str, None] = '846130644dad' # Adjust if your last migration was different
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    print("Adding column target_staging_table to core.sheet_name_mappings")
    op.add_column(
        'sheet_name_mappings',
        sa.Column('target_staging_table', sa.String(length=255), nullable=True),
        schema='core'
    )
    # Add comment using raw SQL
    op.execute(
        "COMMENT ON COLUMN core.sheet_name_mappings.target_staging_table IS 'The name of the target staging table in the \'\'staging\'\' schema for this sheet.';"
    ) 
    print("Column target_staging_table added.")


def downgrade() -> None:
    print("Removing column target_staging_table from core.sheet_name_mappings")
    # Comment will be dropped automatically when column is dropped
    op.drop_column(
        'sheet_name_mappings',
        'target_staging_table',
        schema='core'
    )
    print("Column target_staging_table removed.")
