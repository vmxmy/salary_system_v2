"""empty message

Revision ID: 5dea5cb69ac1
Revises: 099ca014cbac, add_personnel_fields_003
Create Date: 2025-05-04 15:30:29.403601

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5dea5cb69ac1'
down_revision: Union[str, None] = ('099ca014cbac', 'add_personnel_fields_003')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
