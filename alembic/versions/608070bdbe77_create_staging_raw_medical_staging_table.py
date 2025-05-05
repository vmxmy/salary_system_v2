"""Create staging_raw_medical_staging table

Revision ID: 608070bdbe77
Revises: e83e5c143eae
Create Date: 2025-05-05 00:50:10.402531

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB, TIMESTAMP


# revision identifiers, used by Alembic.
revision: str = '608070bdbe77'
down_revision: Union[str, None] = 'e83e5c143eae'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    print("Creating table staging.raw_medical_staging")
    op.create_table(
        'raw_medical_staging',
        # Primary Key for this table
        sa.Column('_medical_staging_id', sa.Integer(), sa.Identity(always=False), primary_key=True),

        # Matching Keys (NOT NULL based on previous assumption)
        sa.Column('id_card_number', sa.String(length=18), nullable=False, index=True),
        sa.Column('pay_period_identifier', sa.String(), nullable=False, index=True),
        sa.Column('employee_name', sa.String(), nullable=False, index=True),

        # Medical Data Columns
        sa.Column('contribution_base_salary', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('contribution_base', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('employer_medical_rate', sa.Numeric(precision=8, scale=4), nullable=True),
        sa.Column('employer_medical_contribution', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('employee_medical_rate', sa.Numeric(precision=8, scale=4), nullable=True),
        sa.Column('employee_medical_contribution', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('employer_critical_illness_rate', sa.Numeric(precision=8, scale=4), nullable=True),
        sa.Column('employer_critical_illness_contribution', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('medical_total_employer_contribution', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('medical_total_employee_contribution', sa.Numeric(precision=15, scale=2), nullable=True),

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
    # Add indexes for faster lookups on matching keys (already added via index=True, but explicit is fine too)
    # op.create_index(op.f('ix_staging_raw_medical_staging_id_card_number'), 'raw_medical_staging', ['id_card_number'], unique=False, schema='staging')
    # op.create_index(op.f('ix_staging_raw_medical_staging_pay_period_identifier'), 'raw_medical_staging', ['pay_period_identifier'], unique=False, schema='staging')
    # op.create_index(op.f('ix_staging_raw_medical_staging_employee_name'), 'raw_medical_staging', ['employee_name'], unique=False, schema='staging')
    print("Table staging.raw_medical_staging created.")


def downgrade() -> None:
    """Downgrade schema."""
    print("Dropping table staging.raw_medical_staging")
    op.drop_table('raw_medical_staging', schema='staging')
    print("Table staging.raw_medical_staging dropped.")
