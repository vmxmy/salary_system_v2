"""complete_report_models_migration

Revision ID: complete_report_models_migration
Revises: c933569d87ee
Create Date: 2025-01-27 15:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'complete_report_models_migration'
down_revision: Union[str, None] = 'c933569d87ee'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - 完整报表功能模型迁移."""
    
    # 1. 增强现有的 report_data_sources 表
    print("🔄 增强 report_data_sources 表...")
    
    # 添加新字段
    op.add_column('report_data_sources', sa.Column('code', sa.String(length=100), nullable=False, comment='数据源编码'), schema='config')
    op.add_column('report_data_sources', sa.Column('category', sa.String(length=50), nullable=True, comment='数据源分类'), schema='config')
    op.add_column('report_data_sources', sa.Column('connection_type', sa.String(length=50), nullable=False, server_default='postgresql', comment='连接类型'), schema='config')
    op.add_column('report_data_sources', sa.Column('view_name', sa.String(length=100), nullable=True, comment='视图名'), schema='config')
    op.add_column('report_data_sources', sa.Column('custom_query', sa.Text(), nullable=True, comment='自定义查询SQL'), schema='config')
    op.add_column('report_data_sources', sa.Column('source_type', sa.String(length=20), nullable=False, server_default='table', comment='数据源类型'), schema='config')
    
    # 高级配置字段
    op.add_column('report_data_sources', sa.Column('connection_config', postgresql.JSONB(astext_type=sa.Text()), nullable=True, comment='连接配置信息'), schema='config')
    op.add_column('report_data_sources', sa.Column('field_mapping', postgresql.JSONB(astext_type=sa.Text()), nullable=True, comment='字段映射配置'), schema='config')
    op.add_column('report_data_sources', sa.Column('default_filters', postgresql.JSONB(astext_type=sa.Text()), nullable=True, comment='默认筛选条件'), schema='config')
    op.add_column('report_data_sources', sa.Column('sort_config', postgresql.JSONB(astext_type=sa.Text()), nullable=True, comment='默认排序配置'), schema='config')
    
    # 权限控制字段
    op.add_column('report_data_sources', sa.Column('access_level', sa.String(length=20), nullable=True, server_default='public', comment='访问级别'), schema='config')
    op.add_column('report_data_sources', sa.Column('allowed_roles', postgresql.JSONB(astext_type=sa.Text()), nullable=True, comment='允许访问的角色列表'), schema='config')
    op.add_column('report_data_sources', sa.Column('allowed_users', postgresql.JSONB(astext_type=sa.Text()), nullable=True, comment='允许访问的用户列表'), schema='config')
    
    # 性能配置字段
    op.add_column('report_data_sources', sa.Column('cache_enabled', sa.Boolean(), nullable=True, server_default='false', comment='是否启用缓存'), schema='config')
    op.add_column('report_data_sources', sa.Column('cache_duration', sa.Integer(), nullable=True, server_default='3600', comment='缓存时长(秒)'), schema='config')
    op.add_column('report_data_sources', sa.Column('max_rows', sa.Integer(), nullable=True, server_default='10000', comment='最大返回行数'), schema='config')
    
    # 状态和显示字段
    op.add_column('report_data_sources', sa.Column('is_system', sa.Boolean(), nullable=True, server_default='false', comment='是否系统内置'), schema='config')
    op.add_column('report_data_sources', sa.Column('tags', postgresql.JSONB(astext_type=sa.Text()), nullable=True, comment='标签'), schema='config')
    
    # 统计信息字段
    op.add_column('report_data_sources', sa.Column('field_count', sa.Integer(), nullable=True, server_default='0', comment='字段数量'), schema='config')
    op.add_column('report_data_sources', sa.Column('usage_count', sa.Integer(), nullable=True, server_default='0', comment='使用次数'), schema='config')
    op.add_column('report_data_sources', sa.Column('last_used_at', sa.DateTime(timezone=True), nullable=True, comment='最后使用时间'), schema='config')
    op.add_column('report_data_sources', sa.Column('last_sync_at', sa.DateTime(timezone=True), nullable=True, comment='最后同步时间'), schema='config')
    
    # 审计字段
    op.add_column('report_data_sources', sa.Column('created_by', sa.BigInteger(), nullable=True, comment='创建者'), schema='config')
    op.add_column('report_data_sources', sa.Column('updated_by', sa.BigInteger(), nullable=True, comment='更新者'), schema='config')
    op.add_column('report_data_sources', sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True, comment='创建时间'), schema='config')
    op.add_column('report_data_sources', sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True, comment='更新时间'), schema='config')
    
    # 修改现有字段
    op.alter_column('report_data_sources', 'name', type_=sa.String(length=200), comment='数据源名称', schema='config')
    op.alter_column('report_data_sources', 'table_name', nullable=True, comment='表名', schema='config')
    
    # 添加唯一约束和索引
    op.create_unique_constraint('uq_report_data_sources_code', 'report_data_sources', ['code'], schema='config')
    op.create_index('idx_data_source_type_active', 'report_data_sources', ['source_type', 'is_active'], schema='config')
    op.create_index('idx_data_source_category', 'report_data_sources', ['category'], schema='config')
    op.create_index('idx_data_source_schema_table', 'report_data_sources', ['schema_name', 'table_name'], schema='config')
    
    # 添加外键约束
    op.create_foreign_key('fk_report_data_sources_created_by', 'report_data_sources', 'users', ['created_by'], ['id'], source_schema='config', referent_schema='security')
    op.create_foreign_key('fk_report_data_sources_updated_by', 'report_data_sources', 'users', ['updated_by'], ['id'], source_schema='config', referent_schema='security')


def downgrade() -> None:
    """Downgrade schema."""
    
    # 删除外键约束
    op.drop_constraint('fk_report_data_sources_updated_by', 'report_data_sources', schema='config', type_='foreignkey')
    op.drop_constraint('fk_report_data_sources_created_by', 'report_data_sources', schema='config', type_='foreignkey')
    
    # 删除索引
    op.drop_index('idx_data_source_schema_table', 'report_data_sources', schema='config')
    op.drop_index('idx_data_source_category', 'report_data_sources', schema='config')
    op.drop_index('idx_data_source_type_active', 'report_data_sources', schema='config')
    op.drop_constraint('uq_report_data_sources_code', 'report_data_sources', schema='config', type_='unique')
    
    # 删除新增字段
    op.drop_column('report_data_sources', 'updated_at', schema='config')
    op.drop_column('report_data_sources', 'created_at', schema='config')
    op.drop_column('report_data_sources', 'updated_by', schema='config')
    op.drop_column('report_data_sources', 'created_by', schema='config')
    op.drop_column('report_data_sources', 'last_sync_at', schema='config')
    op.drop_column('report_data_sources', 'last_used_at', schema='config')
    op.drop_column('report_data_sources', 'usage_count', schema='config')
    op.drop_column('report_data_sources', 'field_count', schema='config')
    op.drop_column('report_data_sources', 'tags', schema='config')
    op.drop_column('report_data_sources', 'is_system', schema='config')
    op.drop_column('report_data_sources', 'max_rows', schema='config')
    op.drop_column('report_data_sources', 'cache_duration', schema='config')
    op.drop_column('report_data_sources', 'cache_enabled', schema='config')
    op.drop_column('report_data_sources', 'allowed_users', schema='config')
    op.drop_column('report_data_sources', 'allowed_roles', schema='config')
    op.drop_column('report_data_sources', 'access_level', schema='config')
    op.drop_column('report_data_sources', 'sort_config', schema='config')
    op.drop_column('report_data_sources', 'default_filters', schema='config')
    op.drop_column('report_data_sources', 'field_mapping', schema='config')
    op.drop_column('report_data_sources', 'connection_config', schema='config')
    op.drop_column('report_data_sources', 'source_type', schema='config')
    op.drop_column('report_data_sources', 'custom_query', schema='config')
    op.drop_column('report_data_sources', 'view_name', schema='config')
    op.drop_column('report_data_sources', 'connection_type', schema='config')
    op.drop_column('report_data_sources', 'category', schema='config')
    op.drop_column('report_data_sources', 'code', schema='config')
    
    # 恢复原始字段类型
    op.alter_column('report_data_sources', 'name', type_=sa.String(length=255), schema='config')
    op.alter_column('report_data_sources', 'table_name', nullable=False, schema='config') 