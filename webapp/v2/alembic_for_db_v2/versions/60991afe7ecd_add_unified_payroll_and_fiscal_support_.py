"""add_unified_payroll_and_fiscal_support_fields_to_employees

Revision ID: 60991afe7ecd
Revises: b118216affd3
Create Date: 2025-06-09 03:05:06.127602

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '60991afe7ecd'
down_revision: Union[str, None] = 'b118216affd3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
