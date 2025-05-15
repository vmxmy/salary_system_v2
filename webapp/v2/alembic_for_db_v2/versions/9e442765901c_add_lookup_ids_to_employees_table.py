"""add_lookup_ids_to_employees_table

Revision ID: 9e442765901c
Revises: add_parent_job_title_id
Create Date: <Alembic会自动填充>

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9e442765901c'
down_revision: Union[str, None] = 'add_parent_job_title_id'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

TABLE_NAME = 'employees'
SCHEMA_NAME = 'hr'
REFERENCING_TABLE_SCHEMA = 'config'
REFERENCING_TABLE_NAME = 'lookup_values'
REFERENCING_COLUMN_NAME = 'id'

NEW_COLUMNS = [
    ('employment_type_lookup_value_id', 'fk_employees_employment_type_lookup_value_id'),
    ('education_level_lookup_value_id', 'fk_employees_education_level_lookup_value_id'),
    ('marital_status_lookup_value_id', 'fk_employees_marital_status_lookup_value_id'),
    ('political_status_lookup_value_id', 'fk_employees_political_status_lookup_value_id'),
    ('contract_type_lookup_value_id', 'fk_employees_contract_type_lookup_value_id'),
]

def upgrade() -> None:
    print(f"Adding new lookup_value_id columns and foreign keys to {SCHEMA_NAME}.{TABLE_NAME}")
    for col_name, fk_name in NEW_COLUMNS:
        with op.batch_alter_table(TABLE_NAME, schema=SCHEMA_NAME) as batch_op:
            batch_op.add_column(sa.Column(col_name, sa.BigInteger(), nullable=True))
            batch_op.create_foreign_key(
                fk_name,
                REFERENCING_TABLE_NAME,
                [col_name],
                [REFERENCING_COLUMN_NAME],
                referent_schema=REFERENCING_TABLE_SCHEMA
            )
        print(f"Added column {col_name} and foreign key {fk_name} to {SCHEMA_NAME}.{TABLE_NAME}")

def downgrade() -> None:
    print(f"Removing new lookup_value_id columns and foreign keys from {SCHEMA_NAME}.{TABLE_NAME}")
    for col_name, fk_name in reversed(NEW_COLUMNS):  # 注意降级时顺序相反
        with op.batch_alter_table(TABLE_NAME, schema=SCHEMA_NAME) as batch_op:
            batch_op.drop_constraint(fk_name, type_='foreignkey')
            batch_op.drop_column(col_name)
        print(f"Dropped foreign key {fk_name} and column {col_name} from {SCHEMA_NAME}.{TABLE_NAME}")
