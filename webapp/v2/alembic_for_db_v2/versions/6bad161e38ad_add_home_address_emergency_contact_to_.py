"""add_home_address_emergency_contact_to_employees

Revision ID: 6bad161e38ad
Revises: 20240726080000
Create Date: 2025-05-18 06:04:40.772662

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6bad161e38ad'
down_revision: Union[str, None] = '20240726080000'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('employees', 'emergency_contact_phone', schema='hr')
    op.drop_column('employees', 'emergency_contact_name', schema='hr')
    op.drop_column('employees', 'home_address', schema='hr')
    # ### end Alembic commands ###
