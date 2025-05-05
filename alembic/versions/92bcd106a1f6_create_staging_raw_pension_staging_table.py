"""Create staging_raw_pension_staging table

Revision ID: 92bcd106a1f6
Revises: c0315b176ea0 # Adjust if your previous revision ID is different
Create Date: <timestamp>

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB, TIMESTAMP


# revision identifiers, used by Alembic.
revision: str = '92bcd106a1f6'
down_revision: Union[str, None] = 'c0315b176ea0' # Point to the add identity migration
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    print("Creating table staging.raw_pension_staging")
    op.create_table(
        'raw_pension_staging',
        # Primary Key
        sa.Column('_pension_staging_id', sa.Integer(), sa.Identity(always=False), primary_key=True),

        # Matching Keys
        sa.Column('id_card_number', sa.String(length=18), nullable=False, index=True),
        sa.Column('pay_period_identifier', sa.String(), nullable=False, index=True),
        sa.Column('employee_name', sa.String(), nullable=False, index=True),

        # Data Columns (Pension, Unemployment, Injury)
        sa.Column('pension_contribution_base', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('pension_total_amount', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('pension_employer_rate', sa.Numeric(precision=8, scale=4), nullable=True),
        sa.Column('pension_employer_contribution', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('pension_employee_rate', sa.Numeric(precision=8, scale=4), nullable=True),
        sa.Column('pension_employee_contribution', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('unemployment_contribution_base', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('unemployment_total_amount', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('unemployment_employer_rate', sa.Numeric(precision=8, scale=4), nullable=True),
        sa.Column('unemployment_employer_contribution', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('unemployment_employee_rate', sa.Numeric(precision=8, scale=4), nullable=True),
        sa.Column('unemployment_employee_contribution', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('injury_contribution_base', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('injury_total_amount', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('injury_employer_rate', sa.Numeric(precision=8, scale=4), nullable=True),
        sa.Column('injury_employer_contribution', sa.Numeric(precision=15, scale=2), nullable=True),
        # General Total Contributions from this source file
        sa.Column('ss_total_employer_contribution', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('ss_total_employee_contribution', sa.Numeric(precision=15, scale=2), nullable=True),

        # Metadata Columns
        sa.Column('_source_filename', sa.Text(), nullable=True),
        sa.Column('_row_number', sa.Integer(), nullable=True),
        sa.Column('_import_timestamp', TIMESTAMP(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('_import_batch_id', UUID(), nullable=True, index=True),
        sa.Column('_validation_status', sa.String(length=20), server_default='pending', nullable=True),
        sa.Column('_validation_errors', JSONB(), nullable=True),

        # Specify schema
        schema='staging'
    )
    print("Table staging.raw_pension_staging created.")


def downgrade() -> None:
    print("Dropping table staging.raw_pension_staging")
    op.drop_table('raw_pension_staging', schema='staging')
    print("Table staging.raw_pension_staging dropped.")
