"""Add occupational_pension_base to employee_salary_configs

Revision ID: 37215b0f10f2
Revises: 499a47843ad2
Create Date: 2025-06-16 18:04:12.668808

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '37215b0f10f2'
down_revision: Union[str, None] = '499a47843ad2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # 添加职业年金缴费基数字段到 employee_salary_configs 表
    op.add_column(
        'employee_salary_configs',
        sa.Column(
            'occupational_pension_base',
            sa.Numeric(precision=15, scale=2),
            nullable=True,
            comment='职业年金缴费基数'
        ),
        schema='payroll'
    )


def downgrade() -> None:
    """Downgrade schema."""
    # 删除职业年金缴费基数字段
    op.drop_column('employee_salary_configs', 'occupational_pension_base', schema='payroll')
