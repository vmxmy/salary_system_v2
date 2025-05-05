"""Drop field_mappings table

Revision ID: e83e5c143eae
Revises: 9e2d8e3ebcaf
Create Date: 2025-05-04 23:33:36.118436

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
# Import UUID type if needed, depending on your SQLAlchemy setup
from sqlalchemy.dialects.postgresql import UUID


# revision identifiers, used by Alembic.
revision: str = 'e83e5c143eae'
down_revision: Union[str, None] = '9e2d8e3ebcaf' # Should point to the merge revision
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    print("Dropping field_mappings table from core schema...")
    op.drop_table('field_mappings', schema='core')
    print("field_mappings table dropped.")


def downgrade() -> None:
    print("Re-creating field_mappings table in core schema...")
    op.create_table('field_mappings',
        sa.Column('id', UUID, primary_key=True),
        sa.Column('source_field', sa.VARCHAR(length=100), nullable=False),
        sa.Column('target_field', sa.VARCHAR(length=100), nullable=False),
        # Assuming establishment_types table is in 'core' schema now
        sa.Column('establishment_type_id', UUID, sa.ForeignKey('core.establishment_types.id'), nullable=True),
        sa.Column('data_type', sa.VARCHAR(length=50), nullable=True),
        sa.Column('is_required', sa.BOOLEAN(), server_default=sa.text('false'), nullable=True),
        sa.Column('default_value', sa.TEXT(), nullable=True),
        sa.Column('is_active', sa.BOOLEAN(), server_default=sa.text('true'), nullable=True),
        schema='core'
    )
    print("field_mappings table re-created.")
