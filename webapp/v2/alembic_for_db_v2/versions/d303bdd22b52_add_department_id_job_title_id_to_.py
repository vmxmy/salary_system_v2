"""add_department_id_job_title_id_to_employees

Revision ID: d303bdd22b52
Revises: 6bad161e38ad
Create Date: 2025-05-18 06:11:59.710734

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd303bdd22b52'
down_revision: Union[str, None] = '6bad161e38ad'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('employees', sa.Column('department_id', sa.BigInteger(), nullable=True), schema='hr')
    op.add_column('employees', sa.Column('personnel_category_id', sa.BigInteger(), nullable=True), schema='hr')
    op.create_foreign_key(
        'fk_employees_department_id', 'employees', 'departments',
        ['department_id'], ['id'], source_schema='hr', referent_schema='hr', ondelete='SET NULL'
    )
    op.create_foreign_key(
        'fk_employee_personnel_category_id', 'employees', 'personnel_categories',
        ['personnel_category_id'], ['id'], source_schema='hr', referent_schema='hr', ondelete='SET NULL'
    )
    # ### end Alembic commands ###


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint('fk_employee_personnel_category_id', 'employees', schema='hr', type_='foreignkey')
    op.drop_constraint('fk_employees_department_id', 'employees', schema='hr', type_='foreignkey')
    op.drop_column('employees', 'personnel_category_id', schema='hr')
    op.drop_column('employees', 'department_id', schema='hr')
    # ### end Alembic commands ###
