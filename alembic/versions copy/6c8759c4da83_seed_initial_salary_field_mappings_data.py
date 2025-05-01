"""Seed initial salary field mappings data

Revision ID: 6c8759c4da83
Revises: 2ea776f87497
Create Date: 2025-04-19 04:27:42.204300

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import json
import os

# revision identifiers, used by Alembic.
revision: str = '6c8759c4da83'
down_revision: Union[str, None] = '2ea776f87497'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Define the table structure for bulk insert
# Match the columns defined in the create_table migration (2ea776f87497)
salary_field_mappings_table = sa.table(
    'salary_field_mappings',
    sa.column('source_name', sa.String),
    sa.column('target_name', sa.String),
    sa.column('is_intermediate', sa.Boolean),
    sa.column('is_final', sa.Boolean),
    sa.column('description', sa.Text),
    sa.column('data_type', sa.String)
)

def upgrade() -> None:
    """Seeds initial data from JSON into the salary_field_mappings table."""
    print("Applying upgrade 6c8759c4da83: Seeding initial salary field mappings data...")

    # Determine the correct path to the JSON file relative to this script
    # Go up three levels from script dir (versions -> alembic -> salary_system) then into config
    script_dir = os.path.dirname(__file__)
    project_root_dir = os.path.abspath(os.path.join(script_dir, '..', '..', '..'))
    json_path = os.path.join(project_root_dir, 'config', 'salary_field_definitions_data.json')
    print(f"Attempting to load initial mapping data from: {json_path}")

    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            initial_data = json.load(f)
    except FileNotFoundError:
        print(f"Error: Initial mapping data file not found at {json_path}")
        # Fail the migration if the data file is missing
        raise FileNotFoundError(f"Initial mapping data file not found at {json_path}")
    except json.JSONDecodeError:
        print(f"Error: Could not decode JSON from {json_path}. Check file format.")
        raise ValueError(f"Could not decode JSON from {json_path}")

    # Prepare data for bulk insert
    bulk_data = []
    for source, target in initial_data.items():
        bulk_data.append({
            'source_name': source,
            'target_name': target,
            # Set default values - adjust if needed
            'is_intermediate': False, 
            'is_final': True, 
            'description': f'Mapping for {source}', # Basic description
            'data_type': 'Text' # Default data type - adjust if needed
        })

    if not bulk_data:
        print("Warning: No data found in JSON file to insert.")
        return

    try:
        # Perform the bulk insert
        op.bulk_insert(salary_field_mappings_table, bulk_data)
        print(f"Successfully inserted {len(bulk_data)} initial mappings into salary_field_mappings.")
    except Exception as e:
        # Catch potential DB errors during insert (e.g., constraint violations)
        print(f"Error during bulk insert: {e}")
        # Depending on the error, you might want to rollback or handle differently
        # For now, re-raise to indicate migration failure
        raise e

def downgrade() -> None:
    """Deletes the initial data seeded by this migration."""
    print("Applying downgrade 6c8759c4da83: Deleting initial salary field mappings data...")
    
    # We need the source names from the JSON to delete the specific rows
    script_dir = os.path.dirname(__file__)
    project_root_dir = os.path.abspath(os.path.join(script_dir, '..', '..', '..'))
    json_path = os.path.join(project_root_dir, 'config', 'salary_field_definitions_data.json')
    
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            initial_data = json.load(f)
        source_names_to_delete = list(initial_data.keys())
        
        if not source_names_to_delete:
            print("No source names found in JSON to delete.")
            return
            
        # Construct a DELETE statement targeting the specific source names
        # Use bindparam for safety
        bind = op.get_bind()
        delete_stmt = salary_field_mappings_table.delete().where(
            salary_field_mappings_table.c.source_name.in_(source_names_to_delete)
        )
        bind.execute(delete_stmt)
        
        print(f"Deleted initial mapping data for {len(source_names_to_delete)} source names.")
        
    except FileNotFoundError:
        print(f"Warning: Initial mapping data file not found at {json_path}. Cannot perform targeted delete in downgrade.")
        # Optionally, could delete all rows, but that might be too destructive.
        # op.execute("DELETE FROM public.salary_field_mappings;")
    except Exception as e:
        print(f"Error during downgrade delete: {e}")
        # It might be safer to allow downgrade to proceed even if delete fails
        # raise e 
