"""test_from_alembic_dir

Revision ID: d14dfdd58afe
Revises: dfad1fac4af9
Create Date: 2025-05-18 11:08:16.705027

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd14dfdd58afe'
down_revision: Union[str, None] = 'dfad1fac4af9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
