"""add_report_user_preference_groups_table

Revision ID: a1b2c3d4e5f6
Revises: 3589bc545e06
Create Date: 2025-06-19 15:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '37215b0f10f2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    
    # 创建用户偏好分组表
    op.create_table(
        'report_user_preference_groups',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('user_id', sa.BigInteger(), nullable=False, comment='用户ID'),
        
        # 分组基本信息
        sa.Column('name', sa.String(50), nullable=False, comment='分组名称'),
        sa.Column('description', sa.String(200), nullable=True, comment='分组描述'),
        sa.Column('color', sa.String(7), nullable=True, comment='分组颜色(十六进制)'),
        sa.Column('icon', sa.String(50), nullable=True, comment='分组图标'),
        
        # 排序和状态
        sa.Column('sort_order', sa.Integer(), nullable=False, default=0, comment='排序顺序'),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True, comment='是否激活'),
        
        # 审计字段
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False, comment='创建时间'),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False, comment='更新时间'),
        
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['security.users.id'], ondelete='CASCADE'),
        schema='config'
    )
    
    # 创建索引
    op.create_index('idx_user_preference_groups_user', 'report_user_preference_groups', ['user_id'], schema='config')
    op.create_index('idx_user_preference_groups_name', 'report_user_preference_groups', ['user_id', 'name'], schema='config')
    op.create_index('idx_user_preference_groups_order', 'report_user_preference_groups', ['user_id', 'sort_order'], schema='config')
    
    # 创建用户内分组名称唯一约束
    op.create_index('uq_user_preference_group_name', 'report_user_preference_groups', ['user_id', 'name'], unique=True, schema='config')


def downgrade() -> None:
    """Downgrade schema."""
    
    # 删除索引
    op.drop_index('uq_user_preference_group_name', table_name='report_user_preference_groups', schema='config')
    op.drop_index('idx_user_preference_groups_order', table_name='report_user_preference_groups', schema='config')
    op.drop_index('idx_user_preference_groups_name', table_name='report_user_preference_groups', schema='config')
    op.drop_index('idx_user_preference_groups_user', table_name='report_user_preference_groups', schema='config')
    
    # 删除表
    op.drop_table('report_user_preference_groups', schema='config')