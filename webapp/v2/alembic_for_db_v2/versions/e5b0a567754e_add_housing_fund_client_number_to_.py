"""add housing_fund_client_number to employees

Revision ID: e5b0a567754e
Revises: add_social_security_client_number
Create Date: 2025-06-10 18:29:50.674636

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e5b0a567754e'
down_revision: Union[str, None] = 'add_social_security_client_number'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add housing_fund_client_number column to hr.employees table."""
    # 1. 添加公积金个人客户号字段
    op.add_column(
        'employees', 
        sa.Column(
            'housing_fund_client_number', 
            sa.String(50), 
            nullable=True,
            comment='公积金个人客户号'
        ),
        schema='hr'
    )
    
    # 2. 添加索引以提高查询性能
    op.create_index(
        'idx_employees_housing_fund_client_number',
        'employees',
        ['housing_fund_client_number'],
        schema='hr'
    )


def downgrade() -> None:
    """Remove housing_fund_client_number column from hr.employees table."""
    # 删除索引
    op.drop_index(
        'idx_employees_housing_fund_client_number',
        'employees',
        schema='hr'
    )
    
    # 删除字段
    op.drop_column('employees', 'housing_fund_client_number', schema='hr')
