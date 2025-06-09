"""add_unique_constraint_to_payroll_component_name

Revision ID: 946648c5bd5c
Revises: 5684dc4abd47
Create Date: 2025-06-09 07:36:22.682240

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '946648c5bd5c'
down_revision: Union[str, None] = '5684dc4abd47'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add unique constraint to name column in payroll_component_definitions table
    op.create_unique_constraint(
        'uq_payroll_component_definitions_name',
        'payroll_component_definitions',
        ['name'],
        schema='config'
    )


def downgrade() -> None:
    """Downgrade schema."""
    # Drop unique constraint from name column in payroll_component_definitions table
    op.drop_constraint(
        'uq_payroll_component_definitions_name',
        'payroll_component_definitions',
        type_='unique',
        schema='config'
    )
