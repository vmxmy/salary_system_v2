"""update_hr_models_v2_positions_categories_appraisals_employee_fields

Revision ID: f59074c0f545
Revises: d303bdd22b52
Create Date: 2025-05-18 11:04:06.160746

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f59074c0f545'
down_revision: Union[str, None] = 'd303bdd22b52'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
