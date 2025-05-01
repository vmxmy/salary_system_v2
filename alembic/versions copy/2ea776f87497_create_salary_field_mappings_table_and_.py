"""Create salary_field_mappings table and seed initial data

Revision ID: 2ea776f87497
Revises: ac9f5e3e9e16
Create Date: 2025-04-19 02:52:31.961644

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2ea776f87497'
down_revision: Union[str, None] = 'ac9f5e3e9e16'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Creates the salary_field_mappings table."""
    print("Applying upgrade 2ea776f87497: Creating salary_field_mappings table...")
    op.create_table(
        'salary_field_mappings',
        sa.Column('source_name', sa.String(), nullable=False),
        sa.Column('target_name', sa.String(), nullable=False),
        sa.Column('is_intermediate', sa.Boolean(), nullable=True),
        sa.Column('is_final', sa.Boolean(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('data_type', sa.String(length=50), nullable=True),
        sa.PrimaryKeyConstraint('source_name', name=op.f('pk_salary_field_mappings')),
        sa.UniqueConstraint('target_name', name=op.f('uq_salary_field_mappings_target_name')),
        schema='public' # Explicitly specify schema if needed
    )
    print("Table salary_field_mappings created.")
    # TODO: Add op.bulk_insert here later to seed initial data if required
    # Example:
    # mappings_table = sa.table('salary_field_mappings', ... column definitions ...)
    # op.bulk_insert(mappings_table, [
    #    {'source_name': '姓名', 'target_name': 'employee_name', ...},
    #    ...
    # ])
    # print("Initial data inserted into salary_field_mappings.")


def downgrade() -> None:
    """Drops the salary_field_mappings table."""
    print("Applying downgrade 2ea776f87497: Dropping salary_field_mappings table...")
    op.drop_table('salary_field_mappings', schema='public')
    print("Table salary_field_mappings dropped.")
