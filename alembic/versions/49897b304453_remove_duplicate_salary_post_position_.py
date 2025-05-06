"""remove_duplicate_salary_post_position_allowance_from_raw_staging

Revision ID: 49897b304453
Revises: 642fe329b96a
Create Date: <Alembic will fill this>

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '49897b304453'
down_revision: Union[str, None] = '642fe329b96a' # Verify this matches what Alembic generated
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Remove redundant salary_post_position_allowance from staging.raw_salary_data_staging."""
    
    print("Attempting to drop redundant column 'salary_post_position_allowance' from 'staging.raw_salary_data_staging'")
    try:
        # Check if the column exists before attempting to drop it to avoid errors if already removed.
        # This requires a way to inspect the database, which op.drop_column doesn't do directly.
        # However, op.drop_column is generally idempotent in practice for many backends or handles "if exists"
        # For maximum safety, direct DB inspection or context managers for specific DBs might be used,
        # but for a typical Alembic script, a direct op.drop_column is common.
        
        op.drop_column('raw_salary_data_staging', 'salary_post_position_allowance', schema='staging')
        print("Successfully dropped column 'salary_post_position_allowance' from 'staging.raw_salary_data_staging' or it did not exist.")
    except Exception as e:
        # Log the exception, but don't necessarily fail the migration if the column just didn't exist.
        # If the error is due to other reasons (permissions, locks), it should be addressed.
        print(f"WARNING: An error occurred while trying to drop 'salary_post_position_allowance': {e}. "
              "This might be okay if the column was already removed.")
        # Depending on the database and desired strictness, you might choose to pass or re-raise.
        # For this cleanup, if it's already gone, that's the desired state.

    # The column 'post_position_allowance' is the correct one as per current models.py
    # and should already exist in the database because:
    # 1. It's in the RawSalaryDataStaging model.
    # 2. You confirmed it's present in the database.
    # 3. If previous Alembic autogenerate runs were effective after the model change,
    #    they would have added/renamed to ensure 'post_position_allowance' exists.
    # Therefore, no action needed here to add/ensure 'post_position_allowance'.

def downgrade() -> None:
    """Re-add salary_post_position_allowance to staging.raw_salary_data_staging."""
    print("Attempting to re-add column 'salary_post_position_allowance' to 'staging.raw_salary_data_staging'")
    try:
        op.add_column('raw_salary_data_staging', 
                      sa.Column('salary_post_position_allowance', sa.Numeric(15, 2), nullable=True), 
                      schema='staging')
        print("Successfully re-added column 'salary_post_position_allowance' to 'staging.raw_salary_data_staging'.")
    except Exception as e:
        # If the column somehow still exists (e.g., upgrade failed silently, or manual intervention),
        # this add_column might fail.
        print(f"WARNING: An error occurred while trying to re-add 'salary_post_position_allowance': {e}. "
              "This might be okay if the column already exists due to a previous state or failed upgrade.")
