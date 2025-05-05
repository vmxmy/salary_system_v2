"""Create staging_raw_tax_staging table

Revision ID: 846130644dad
Revises: e3ac1a478244 # Pointing to the create housingfund staging table migration
Create Date: <timestamp>

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB, TIMESTAMP, DATE


# revision identifiers, used by Alembic.
revision: str = '846130644dad'
down_revision: Union[str, None] = 'e3ac1a478244' # Point to the create housingfund staging table migration
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    print("Creating table staging.raw_tax_staging")
    op.create_table(
        'raw_tax_staging',
        # Primary Key
        sa.Column('_tax_staging_id', sa.Integer(), sa.Identity(always=False), primary_key=True),

        # Matching Keys
        sa.Column('id_card_number', sa.String(length=18), nullable=False, index=True),
        sa.Column('tax_period_identifier', sa.String(), nullable=False, index=True), # 税款所属期
        sa.Column('employee_name', sa.String(), nullable=False, index=True),

        # Data Columns from Tax Calculation Input/Output
        sa.Column('income_period_start', sa.Date(), nullable=True),
        sa.Column('income_period_end', sa.Date(), nullable=True),
        sa.Column('current_period_income', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('current_period_tax_exempt_income', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('deduction_basic_pension', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('deduction_basic_medical', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('deduction_unemployment', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('deduction_housing_fund', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('deduction_child_edu_cumulative', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('deduction_cont_edu_cumulative', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('deduction_housing_loan_interest_cumulative', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('deduction_housing_rent_cumulative', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('deduction_support_elderly_cumulative', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('deduction_infant_care_cumulative', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('deduction_private_pension_cumulative', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('deduction_annuity', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('deduction_commercial_health_insurance', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('deduction_deferred_pension_insurance', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('deduction_other', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('deduction_donations', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('total_deductions_pre_tax', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('tax_reduction_amount', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('standard_deduction', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('calculated_income_tax', sa.Numeric(precision=15, scale=2), nullable=True), # 当期应缴税额
        sa.Column('remarks', sa.Text(), nullable=True),

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
    print("Table staging.raw_tax_staging created.")


def downgrade() -> None:
    print("Dropping table staging.raw_tax_staging")
    op.drop_table('raw_tax_staging', schema='staging')
    print("Table staging.raw_tax_staging dropped.")
