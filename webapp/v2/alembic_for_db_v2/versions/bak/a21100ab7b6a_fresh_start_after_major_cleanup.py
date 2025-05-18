"""fresh_start_after_major_cleanup

Revision ID: a21100ab7b6a
Revises: d303bdd22b52
Create Date: 2025-05-18 11:35:37.569567

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a21100ab7b6a'
down_revision: Union[str, None] = 'd303bdd22b52'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
