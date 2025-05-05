"""Add new fields to employees table

Revision ID: 1f35e7c6cb03
Revises: 1a65f384ba95
Create Date: 2025-05-05 13:17:11.092550

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import DATE


# revision identifiers, used by Alembic.
revision: str = '1f35e7c6cb03'
down_revision: Union[str, None] = '1a65f384ba95'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    print("Adding new columns to core.employees table")
    op.add_column('employees', sa.Column('gender', sa.String(length=10), nullable=True), schema='core')
    op.add_column('employees', sa.Column('ethnicity', sa.String(length=50), nullable=True), schema='core')
    op.add_column('employees', sa.Column('date_of_birth', sa.Date(), nullable=True), schema='core')
    op.add_column('employees', sa.Column('education_level', sa.String(length=100), nullable=True), schema='core')
    op.add_column('employees', sa.Column('interrupted_service_years', sa.Integer(), nullable=True), schema='core')
    op.add_column('employees', sa.Column('continuous_service_years', sa.Integer(), nullable=True), schema='core')
    op.add_column('employees', sa.Column('actual_position', sa.String(length=255), nullable=True), schema='core')
    op.add_column('employees', sa.Column('actual_position_start_date', sa.Date(), nullable=True), schema='core')
    op.add_column('employees', sa.Column('position_level_start_date', sa.Date(), nullable=True), schema='core')
    print("New columns added to core.employees table.")


def downgrade() -> None:
    """Downgrade schema."""
    print("Removing new columns from core.employees table")
    op.drop_column('employees', 'position_level_start_date', schema='core')
    op.drop_column('employees', 'actual_position_start_date', schema='core')
    op.drop_column('employees', 'actual_position', schema='core')
    op.drop_column('employees', 'continuous_service_years', schema='core')
    op.drop_column('employees', 'interrupted_service_years', schema='core')
    op.drop_column('employees', 'education_level', schema='core')
    op.drop_column('employees', 'date_of_birth', schema='core')
    op.drop_column('employees', 'ethnicity', schema='core')
    op.drop_column('employees', 'gender', schema='core')
    print("New columns removed from core.employees table.")
