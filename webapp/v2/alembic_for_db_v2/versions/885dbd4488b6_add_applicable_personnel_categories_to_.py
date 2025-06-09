"""add_applicable_personnel_categories_to_social_insurance_configs

Revision ID: 885dbd4488b6
Revises: a38055a0ae0c
Create Date: 2025-06-09 16:12:44.959075

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '885dbd4488b6'
down_revision: Union[str, None] = 'a38055a0ae0c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # 添加 applicable_personnel_categories 字段到 social_insurance_configs 表
    op.add_column(
        'social_insurance_configs',
        sa.Column('applicable_personnel_categories', sa.JSON(), nullable=True),
        schema='payroll'
    )
    
    # 添加字段注释
    op.execute("""
        COMMENT ON COLUMN payroll.social_insurance_configs.applicable_personnel_categories 
        IS '适用的人员分类ID数组，如[75, 81]表示适用于公务员和机关工勤'
    """)


def downgrade() -> None:
    """Downgrade schema."""
    # 删除 applicable_personnel_categories 字段
    op.drop_column('social_insurance_configs', 'applicable_personnel_categories', schema='payroll')
