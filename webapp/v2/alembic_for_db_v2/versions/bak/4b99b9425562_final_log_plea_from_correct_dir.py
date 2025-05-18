"""final_log_plea_from_correct_dir

Revision ID: 4b99b9425562
Revises: 78c60bb67c84
Create Date: 2025-05-18 11:27:47.035504

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4b99b9425562'
down_revision: Union[str, None] = '78c60bb67c84'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
