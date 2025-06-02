"""Merge multiple heads

Revision ID: 7a35dee8d386
Revises: 61d6ab6ad0cf, ea69457e251f, f1265c5cec16
Create Date: 2025-06-02 17:30:52.552551

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7a35dee8d386'
down_revision: Union[str, None] = ('61d6ab6ad0cf', 'ea69457e251f', 'f1265c5cec16')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
