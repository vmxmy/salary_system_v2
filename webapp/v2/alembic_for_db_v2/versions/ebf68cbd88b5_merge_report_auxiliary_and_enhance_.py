"""merge report_auxiliary and enhance_report_data_source heads

Revision ID: ebf68cbd88b5
Revises: create_report_auxiliary_tables, enhance_report_data_source_models
Create Date: 2025-05-30 10:09:39.245486

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ebf68cbd88b5'
down_revision: Union[str, None] = ('create_report_auxiliary_tables', 'enhance_report_data_source_models')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
