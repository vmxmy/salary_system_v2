"""add establishment_type_id fk to employees

Revision ID: 08dfbe83b327
Revises: 34ec5e583a8a
Create Date: 2025-04-19 07:18:55.584150

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
# Removed unused import: from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '08dfbe83b327'
down_revision: Union[str, None] = '34ec5e583a8a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('employees', sa.Column('establishment_type_id', sa.Integer(), nullable=True))
    op.create_foreign_key(
        'fk_employees_establishment_type_id', # Constraint name
        'employees',                            # Source table
        'establishment_types',                  # Target table
        ['establishment_type_id'],              # Source column(s)
        ['id']                                  # Target column(s)
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint('fk_employees_establishment_type_id', 'employees', type_='foreignkey')
    op.drop_column('employees', 'establishment_type_id')
