"""add social_security_client_number to employees

Revision ID: add_social_security_client_number
Revises: [最新的revision_id]
Create Date: 2025-01-08 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'add_social_security_client_number'
down_revision: Union[str, None] = '885dbd4488b6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add social_security_client_number column to hr.employees table."""
    # 1. 添加社保个人客户号字段
    op.add_column(
        'employees', 
        sa.Column(
            'social_security_client_number', 
            sa.String(50), 
            nullable=True,
            comment='社保个人客户号'
        ),
        schema='hr'
    )
    
    # 2. 添加索引以提高查询性能
    op.create_index(
        'idx_employees_social_security_client_number',
        'employees',
        ['social_security_client_number'],
        schema='hr'
    )


def downgrade() -> None:
    """Remove social_security_client_number column from hr.employees table."""
    # 删除索引
    op.drop_index(
        'idx_employees_social_security_client_number',
        'employees',
        schema='hr'
    )
    
    # 删除字段
    op.drop_column('employees', 'social_security_client_number', schema='hr') 