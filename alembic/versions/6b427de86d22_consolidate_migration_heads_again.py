"""Consolidate migration heads again

Revision ID: 6b427de86d22
Revises: 1ae8d5865b1c, 92bcd106a1f6
Create Date: 2025-05-05 09:59:14.942357

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6b427de86d22'
down_revision: Union[str, None] = ('1ae8d5865b1c', '92bcd106a1f6')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
