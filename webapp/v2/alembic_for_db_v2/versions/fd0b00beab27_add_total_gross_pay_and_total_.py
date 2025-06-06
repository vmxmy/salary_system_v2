"""Add total_gross_pay and total_deductions to payroll_runs

Revision ID: fd0b00beab27
Revises: enhance_payroll_audit_system
Create Date: 2025-06-06 13:22:59.259244

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fd0b00beab27'
down_revision: Union[str, None] = 'enhance_payroll_audit_system'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # 添加 total_gross_pay 字段
    op.add_column('payroll_runs', 
                  sa.Column('total_gross_pay', sa.Numeric(18, 4), nullable=True),
                  schema='payroll')
    
    # 添加 total_deductions 字段
    op.add_column('payroll_runs', 
                  sa.Column('total_deductions', sa.Numeric(18, 4), nullable=True),
                  schema='payroll')


def downgrade() -> None:
    """Downgrade schema."""
    # 删除添加的字段
    op.drop_column('payroll_runs', 'total_deductions', schema='payroll')
    op.drop_column('payroll_runs', 'total_gross_pay', schema='payroll')
