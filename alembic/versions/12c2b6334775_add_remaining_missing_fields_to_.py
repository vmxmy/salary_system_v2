"""Add remaining missing fields to employees table

Revision ID: 12c2b6334775
Revises: 1f35e7c6cb03
Create Date: 2025-05-05 13:21:30.700269

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import DATE


# revision identifiers, used by Alembic.
revision: str = '12c2b6334775'
down_revision: Union[str, None] = '1f35e7c6cb03'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    print("Adding *actually* missing columns to core.employees table")
    # Only add columns identified as missing from the DDL
    op.add_column('employees', sa.Column('gender', sa.String(length=10), nullable=True), schema='core')
    op.add_column('employees', sa.Column('ethnicity', sa.String(length=50), nullable=True), schema='core')
    op.add_column('employees', sa.Column('date_of_birth', sa.Date(), nullable=True), schema='core')
    # education_level already exists
    # interrupted_service_years already exists (type mismatch handled in model)
    # continuous_service_years already exists (type mismatch handled in model)
    op.add_column('employees', sa.Column('actual_position', sa.String(length=255), nullable=True), schema='core')
    op.add_column('employees', sa.Column('actual_position_start_date', sa.Date(), nullable=True), schema='core')
    op.add_column('employees', sa.Column('position_level_start_date', sa.Date(), nullable=True), schema='core')
    print("Missing columns added to core.employees table.")


def downgrade() -> None:
    """Downgrade schema."""
    print("Removing columns added in this migration from core.employees table")
    op.drop_column('employees', 'position_level_start_date', schema='core')
    op.drop_column('employees', 'actual_position_start_date', schema='core')
    op.drop_column('employees', 'actual_position', schema='core')
    # Do not drop education_level, interrupted_service_years, continuous_service_years here
    op.drop_column('employees', 'date_of_birth', schema='core')
    op.drop_column('employees', 'ethnicity', schema='core')
    op.drop_column('employees', 'gender', schema='core')
    print("Columns removed from core.employees table.")
