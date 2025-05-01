"""merge three divergent branches

Revision ID: 6dd98956e2ec
Revises: 40959e38e047, 6cf5277d002a, add_report_links_table
Create Date: 2025-04-30 22:40:22.745137

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6dd98956e2ec'
down_revision: Union[str, None] = ('40959e38e047', '6cf5277d002a', 'add_report_links_table')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
