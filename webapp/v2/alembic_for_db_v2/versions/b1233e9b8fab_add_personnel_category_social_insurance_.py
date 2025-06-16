"""Add personnel category social insurance rules association table

Revision ID: b1233e9b8fab
Revises: e5b0a567754e
Create Date: 2025-06-11 10:07:47.663103

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'b1233e9b8fab'
down_revision: Union[str, None] = 'e5b0a567754e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # 创建人员类别与社保配置关联表
    op.create_table('personnel_category_social_insurance_rules',
    sa.Column('id', sa.BigInteger(), sa.Identity(always=True), nullable=False),
    sa.Column('personnel_category_id', sa.BigInteger(), nullable=False),
    sa.Column('social_insurance_config_id', sa.BigInteger(), nullable=False),
    sa.Column('effective_date', sa.Date(), nullable=False, comment='关联生效日期'),
    sa.Column('end_date', sa.Date(), nullable=True, comment='关联结束日期'),
    sa.Column('is_active', sa.Boolean(), server_default='TRUE', nullable=False, comment='关联是否启用'),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['personnel_category_id'], ['hr.personnel_categories.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['social_insurance_config_id'], ['payroll.social_insurance_configs.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('personnel_category_id', 'social_insurance_config_id', 'effective_date', name='uq_personnel_ss_rule_effective'),
    schema='payroll'
    )


def downgrade() -> None:
    """Downgrade schema."""
    # 删除人员类别与社保配置关联表
    op.drop_table('personnel_category_social_insurance_rules', schema='payroll')
