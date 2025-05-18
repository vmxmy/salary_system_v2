"""test_with_info_logging

Revision ID: 78c60bb67c84
Revises: d14dfdd58afe
Create Date: 2025-05-18 11:15:24.680945

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '78c60bb67c84'
down_revision: Union[str, None] = 'd14dfdd58afe'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
