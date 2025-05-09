"""add_user_table_configs

Revision ID: 7a9886d11537
Revises: e2a7fb6eb40b
Create Date: 2025-05-08 15:35:27.340720

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, TIMESTAMP


# revision identifiers, used by Alembic.
revision: str = '7a9886d11537'
down_revision: Union[str, None] = 'e2a7fb6eb40b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # 创建user_table_configs表
    op.create_table(
        'user_table_configs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('table_id', sa.String(50), nullable=False),
        sa.Column('config_type', sa.String(20), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('config_data', JSONB, nullable=False),
        sa.Column('is_default', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('is_shared', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('created_at', TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['core.users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'table_id', 'config_type', 'name', name='uq_user_table_config'),
        schema='core'
    )
    
    # 添加索引以提高查询性能
    op.create_index('idx_user_table_configs_user_id', 'user_table_configs', ['user_id'], schema='core')
    op.create_index('idx_user_table_configs_table_id', 'user_table_configs', ['table_id'], schema='core')


def downgrade() -> None:
    """Downgrade schema."""
    # 删除索引
    op.drop_index('idx_user_table_configs_table_id', table_name='user_table_configs', schema='core')
    op.drop_index('idx_user_table_configs_user_id', table_name='user_table_configs', schema='core')
    
    # 删除表
    op.drop_table('user_table_configs', schema='core')
