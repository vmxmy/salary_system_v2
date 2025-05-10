"""add_is_default_to_email_server_configs

Revision ID: 5edc1ec29f12
Revises: 41c0e13ab6a3
Create Date: 2025-05-10 19:19:18.896728

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5edc1ec29f12'
down_revision: Union[str, None] = '41c0e13ab6a3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # 添加is_default字段到email_server_configs表
    op.add_column('email_server_configs', sa.Column('is_default', sa.Boolean(), nullable=False, server_default='false'), schema='core')

    # 创建一个唯一索引，确保只有一个配置可以是默认配置
    op.create_index('ix_email_server_configs_is_default_true', 'email_server_configs', ['is_default'], unique=True,
                   postgresql_where=sa.text('is_default = true'), schema='core')


def downgrade() -> None:
    """Downgrade schema."""
    # 删除唯一索引
    op.drop_index('ix_email_server_configs_is_default_true', table_name='email_server_configs', schema='core')

    # 删除is_default字段
    op.drop_column('email_server_configs', 'is_default', schema='core')
