"""Merge report cleanup branch with main branch

Revision ID: ea69457e251f
Revises: 65e450893a6c, 76b4676ec34b
Create Date: 2025-05-30 22:57:45.349318

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ea69457e251f'
down_revision: Union[str, None] = ('65e450893a6c', '76b4676ec34b')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
