"""merge_multiple_heads

Revision ID: 61d6ab6ad0cf
Revises: 4567e316d860, 76b4676ec34b, create_report_views_tables
Create Date: 2025-06-01 11:01:33.542468

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '61d6ab6ad0cf'
down_revision: Union[str, None] = ('4567e316d860', '76b4676ec34b', 'create_report_views_tables')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
