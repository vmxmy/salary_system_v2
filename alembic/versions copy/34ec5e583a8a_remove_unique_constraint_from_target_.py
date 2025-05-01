"""Remove unique constraint from target_name in salary_field_mappings

Revision ID: 34ec5e583a8a
Revises: 6c8759c4da83
Create Date: 2025-04-19 07:01:13.087494

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '34ec5e583a8a'
down_revision: Union[str, None] = '6c8759c4da83'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Constraint name defined in 2ea776f87497
constraint_name = 'uq_salary_field_mappings_target_name'
table_name = 'salary_field_mappings'
schema_name = 'public'

def upgrade() -> None:
    """Removes the unique constraint on the target_name column."""
    print(f"Applying upgrade {revision}: Dropping unique constraint '{constraint_name}' from {table_name}...")
    try:
        op.drop_constraint(constraint_name, table_name, schema=schema_name, type_='unique')
        print(f"Unique constraint '{constraint_name}' dropped successfully.")
    except Exception as e:
        print(f"Error dropping constraint {constraint_name}: {e}")
        # Decide if the migration should fail or proceed with a warning
        print("Proceeding with migration despite potential error dropping constraint (it might not exist)." )
        # raise e # Uncomment to make the migration fail on error

def downgrade() -> None:
    """Re-adds the unique constraint on the target_name column."""
    print(f"Applying downgrade {revision}: Creating unique constraint '{constraint_name}' on {table_name} (target_name)...")
    try:
        op.create_unique_constraint(constraint_name, table_name, ['target_name'], schema=schema_name)
        print(f"Unique constraint '{constraint_name}' created successfully.")
    except Exception as e:
        print(f"Error creating constraint {constraint_name}: {e}")
        # Decide if the migration should fail or proceed with a warning
        print("Proceeding with migration despite potential error creating constraint (it might already exist)." )
        # raise e # Uncomment to make the migration fail on error
