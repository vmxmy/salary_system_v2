"""empty message

Revision ID: 099ca014cbac
Revises: 96805dc2fc94, update_specific_field_types_002
Create Date: 2025-05-04 14:52:17.086731

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '099ca014cbac'
down_revision: Union[str, None] = ('96805dc2fc94', 'update_specific_field_types_002')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
