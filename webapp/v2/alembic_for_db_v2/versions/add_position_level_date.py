"""feat: Add career_position_level_date and current_position_start_date to employees table

Revision ID: add_career_position_dates
Revises: 427d09a2fdee
Create Date: 2025-05-22 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'add_career_position_dates'
down_revision: Union[str, None] = '427d09a2fdee'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """添加任职级时间相关字段"""
    # 在 employees 表中添加 career_position_level_date 和 current_position_start_date 字段
    with op.batch_alter_table('employees', schema='hr') as batch_op:
        batch_op.add_column(sa.Column('career_position_level_date', sa.Date(), nullable=True, 
                           comment="The date when employee first reached this position level in their entire career"))
        batch_op.add_column(sa.Column('current_position_start_date', sa.Date(), nullable=True, 
                           comment="The date when employee started this position in current organization"))


def downgrade() -> None:
    """删除任职级时间相关字段"""
    # 删除添加的字段
    with op.batch_alter_table('employees', schema='hr') as batch_op:
        batch_op.drop_column('current_position_start_date')
        batch_op.drop_column('career_position_level_date') 