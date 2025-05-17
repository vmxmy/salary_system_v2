"""update_payroll_periods_add_status_transform_id_to_uuid

Revision ID: 5fb8e953a477
Revises: 9e442765901c
Create Date: 2025-05-15 19:45:34.728307

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '5fb8e953a477'
down_revision: Union[str, None] = '9e442765901c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
