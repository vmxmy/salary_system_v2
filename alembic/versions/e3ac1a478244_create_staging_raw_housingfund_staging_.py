"""Create staging_raw_housingfund_staging table

Revision ID: e3ac1a478244
Revises: 1231fe918ff3 # Pointing to the create annuity staging table migration
Create Date: <timestamp>

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB, TIMESTAMP


# revision identifiers, used by Alembic.
revision: str = 'e3ac1a478244'
down_revision: Union[str, None] = '1231fe918ff3' # Point to the create annuity staging table migration
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    print("Creating table staging.raw_housingfund_staging")
    op.create_table(
        'raw_housingfund_staging',
        # Primary Key
        sa.Column('_housingfund_staging_id', sa.Integer(), sa.Identity(always=False), primary_key=True),

        # Matching Keys
        sa.Column('id_card_number', sa.String(length=18), nullable=False, index=True),
        sa.Column('pay_period_identifier', sa.String(), nullable=False, index=True),
        sa.Column('employee_name', sa.String(), nullable=False, index=True),

        # Data Columns
        sa.Column('housingfund_contribution_base_salary', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('housingfund_contribution_base', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('housingfund_employer_rate', sa.Numeric(precision=8, scale=4), nullable=True),
        sa.Column('housingfund_employer_contribution', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('housingfund_employee_rate', sa.Numeric(precision=8, scale=4), nullable=True),
        sa.Column('housingfund_employee_contribution', sa.Numeric(precision=15, scale=2), nullable=True),

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
    print("Table staging.raw_housingfund_staging created.")


def downgrade() -> None:
    print("Dropping table staging.raw_housingfund_staging")
    op.drop_table('raw_housingfund_staging', schema='staging')
    print("Table staging.raw_housingfund_staging dropped.")
