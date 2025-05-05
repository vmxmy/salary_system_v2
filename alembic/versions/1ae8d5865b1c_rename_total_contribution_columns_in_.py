"""Rename total contribution columns in medical staging table

Revision ID: 1ae8d5865b1c
Revises: c0315b176ea0
Create Date: 2025-05-05 01:11:55.689225

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1ae8d5865b1c'
down_revision: Union[str, None] = 'c0315b176ea0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
