"""Merge migration history branches

Revision ID: 9e2d8e3ebcaf
Revises: 435ecfdc952a, 75e6429035e1
Create Date: 2025-05-04 23:33:23.511321

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9e2d8e3ebcaf'
down_revision: Union[str, None] = ('435ecfdc952a', '75e6429035e1')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
