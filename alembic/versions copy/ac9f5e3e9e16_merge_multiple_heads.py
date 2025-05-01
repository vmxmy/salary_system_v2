"""Merge multiple heads

Revision ID: ac9f5e3e9e16
Revises: 07437c8b1569, 1f3a30f4b34f, 700f7db5eabb
Create Date: 2025-04-19 02:51:45.246796

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ac9f5e3e9e16'
down_revision: Union[str, None] = ('07437c8b1569', '1f3a30f4b34f', '700f7db5eabb')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
