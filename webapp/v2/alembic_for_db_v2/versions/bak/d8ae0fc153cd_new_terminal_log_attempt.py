"""new_terminal_log_attempt

Revision ID: d8ae0fc153cd
Revises: 4b99b9425562
Create Date: 2025-05-18 11:29:15.703088

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd8ae0fc153cd'
down_revision: Union[str, None] = '4b99b9425562'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
