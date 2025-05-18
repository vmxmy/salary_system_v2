"""test_metadata

Revision ID: dfad1fac4af9
Revises: f59074c0f545
Create Date: 2025-05-18 11:05:27.287369

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'dfad1fac4af9'
down_revision: Union[str, None] = 'f59074c0f545'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
