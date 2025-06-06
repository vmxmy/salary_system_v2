"""Fix payroll entry status code with NBSP

Revision ID: e1e362b4b79a
Revises: 386b390211c2
Create Date: 2025-06-05 12:14:06.xxx

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e1e362b4b79a'
down_revision: Union[str, None] = '386b390211c2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # 修复状态码中的非断行空格问题 - 直接使用ID更新
    op.execute("""
    UPDATE config.lookup_values 
    SET code = 'PENTRY_ENTRY'
    WHERE id = 64;
    """)


def downgrade() -> None:
    """Downgrade schema."""
    # 恢复原来的状态码（包含非断行空格）
    op.execute("""
    UPDATE config.lookup_values 
    SET code = 'PENTRY_ ENTRY'
    WHERE code = 'PENTRY_ENTRY' 
    AND lookup_type_id = (
        SELECT id FROM config.lookup_types WHERE code = 'PAYROLL_ENTRY_STATUS'
    );
    """)
