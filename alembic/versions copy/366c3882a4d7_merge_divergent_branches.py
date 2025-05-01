"""Merge divergent branches

Revision ID: 366c3882a4d7
Revises: 08dfbe83b327, 40959e38e047
Create Date: 2025-04-22 10:05:54.262900

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '366c3882a4d7'
down_revision: Union[str, None] = ('08dfbe83b327', '40959e38e047')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
