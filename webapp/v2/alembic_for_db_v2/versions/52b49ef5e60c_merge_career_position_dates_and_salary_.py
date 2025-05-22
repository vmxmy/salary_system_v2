"""merge career_position_dates and salary_fields

Revision ID: 52b49ef5e60c
Revises: add_career_position_dates, add_salary_fields_to_employee
Create Date: 2025-05-22 12:04:25.657723

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '52b49ef5e60c'
down_revision: Union[str, None] = ('add_career_position_dates', 'add_salary_fields_to_employee')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
