"""enhance_report_data_source_models

Revision ID: enhance_report_data_source_models
Revises: c933569d87ee
Create Date: 2025-01-27 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'enhance_report_data_source_models'
down_revision: Union[str, None] = 'c933569d87ee'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    
    # 1. 增强 report_data_sources 表
    op.add_column('report_data_sources', sa.Column('code', sa.String(length=100), nullable=False, comment='数据源编码'), schema='config')
    op.add_column('report_data_sources', sa.Column('category', sa.String(length=50), nullable=True, comment='数据源分类'), schema='config')
    op.add_column('report_data_sources', sa.Column('connection_type', sa.String(length=50), nullable=False, server_default='postgresql', comment='连接类型'), schema='config')
    op.add_column('report_data_sources', sa.Column('view_name', sa.String(length=100), nullable=True, comment='视图名'), schema='config')
    op.add_column('report_data_sources', sa.Column('custom_query', sa.Text(), nullable=True, comment='自定义查询SQL'), schema='config')
    op.add_column('report_data_sources', sa.Column('source_type', sa.String(length=20), nullable=False, server_default='table', comment='数据源类型'), schema='config')
    op.add_column('report_data_sources', sa.Column('field_mapping', postgresql.JSONB(astext_type=sa.Text()), nullable=True, comment='字段映射配置'), schema='config')
    op.add_column('report_data_sources', sa.Column('default_filters', postgresql.JSONB(astext_type=sa.Text()), nullable=True, comment='默认筛选条件'), schema='config')
    op.add_column('report_data_sources', sa.Column('sort_config', postgresql.JSONB(astext_type=sa.Text()), nullable=True, comment='默认排序配置'), schema='config')
    op.add_column('report_data_sources', sa.Column('access_level', sa.String(length=20), nullable=True, server_default='public', comment='访问级别'), schema='config')
    op.add_column('report_data_sources', sa.Column('allowed_roles', postgresql.JSONB(astext_type=sa.Text()), nullable=True, comment='允许访问的角色列表'), schema='config')
    op.add_column('report_data_sources', sa.Column('allowed_users', postgresql.JSONB(astext_type=sa.Text()), nullable=True, comment='允许访问的用户列表'), schema='config')
    op.add_column('report_data_sources', sa.Column('cache_enabled', sa.Boolean(), nullable=True, server_default='false', comment='是否启用缓存'), schema='config')
    op.add_column('report_data_sources', sa.Column('cache_duration', sa.Integer(), nullable=True, server_default='3600', comment='缓存时长(秒)'), schema='config')
    op.add_column('report_data_sources', sa.Column('max_rows', sa.Integer(), nullable=True, server_default='10000', comment='最大返回行数'), schema='config')
    op.add_column('report_data_sources', sa.Column('is_system', sa.Boolean(), nullable=True, server_default='false', comment='是否系统内置'), schema='config')
    op.add_column('report_data_sources', sa.Column('sort_order', sa.Integer(), nullable=True, server_default='0', comment='排序顺序'), schema='config')
    op.add_column('report_data_sources', sa.Column('tags', postgresql.JSONB(astext_type=sa.Text()), nullable=True, comment='标签'), schema='config')
    op.add_column('report_data_sources', sa.Column('field_count', sa.Integer(), nullable=True, server_default='0', comment='字段数量'), schema='config')
    op.add_column('report_data_sources', sa.Column('usage_count', sa.Integer(), nullable=True, server_default='0', comment='使用次数'), schema='config')
    op.add_column('report_data_sources', sa.Column('last_used_at', sa.DateTime(timezone=True), nullable=True, comment='最后使用时间'), schema='config')
    op.add_column('report_data_sources', sa.Column('last_sync_at', sa.DateTime(timezone=True), nullable=True, comment='最后同步时间'), schema='config')
    op.add_column('report_data_sources', sa.Column('updated_by', sa.Integer(), nullable=True, comment='更新者'), schema='config')
    
    # 修改现有列
    op.alter_column('report_data_sources', 'name', type_=sa.String(length=200), comment='数据源名称', schema='config')
    op.alter_column('report_data_sources', 'table_name', nullable=True, comment='表名', schema='config')
    op.alter_column('report_data_sources', 'connection_config', type_=postgresql.JSONB(astext_type=sa.Text()), comment='连接配置信息', schema='config')
    
    # 添加唯一约束和索引
    op.create_unique_constraint('uq_report_data_sources_code', 'report_data_sources', ['code'], schema='config')
    op.create_index('idx_data_source_type_active', 'report_data_sources', ['source_type', 'is_active'], schema='config')
    op.create_index('idx_data_source_category', 'report_data_sources', ['category'], schema='config')
    op.create_index('idx_data_source_schema_table', 'report_data_sources', ['schema_name', 'table_name'], schema='config')
    
    # 添加外键约束
    op.create_foreign_key('fk_report_data_sources_updated_by', 'report_data_sources', 'users', ['updated_by'], ['id'], source_schema='config', referent_schema='security')
    
    # 2. 增强 report_data_source_fields 表
    op.add_column('report_data_source_fields', sa.Column('field_alias', sa.String(length=100), nullable=True, comment='字段别名'), schema='config')
    op.add_column('report_data_source_fields', sa.Column('data_type', sa.String(length=50), nullable=True, comment='数据库数据类型'), schema='config')
    op.add_column('report_data_source_fields', sa.Column('description', sa.Text(), nullable=True, comment='字段描述'), schema='config')
    op.add_column('report_data_source_fields', sa.Column('is_primary_key', sa.Boolean(), nullable=True, server_default='false', comment='是否主键'), schema='config')
    op.add_column('report_data_source_fields', sa.Column('is_foreign_key', sa.Boolean(), nullable=True, server_default='false', comment='是否外键'), schema='config')
    op.add_column('report_data_source_fields', sa.Column('is_indexed', sa.Boolean(), nullable=True, server_default='false', comment='是否有索引'), schema='config')
    op.add_column('report_data_source_fields', sa.Column('is_searchable', sa.Boolean(), nullable=True, server_default='true', comment='是否可搜索'), schema='config')
    op.add_column('report_data_source_fields', sa.Column('is_sortable', sa.Boolean(), nullable=True, server_default='true', comment='是否可排序'), schema='config')
    op.add_column('report_data_source_fields', sa.Column('is_filterable', sa.Boolean(), nullable=True, server_default='true', comment='是否可筛选'), schema='config')
    op.add_column('report_data_source_fields', sa.Column('is_exportable', sa.Boolean(), nullable=True, server_default='true', comment='是否可导出'), schema='config')
    op.add_column('report_data_source_fields', sa.Column('field_group', sa.String(length=50), nullable=True, comment='字段分组'), schema='config')
    op.add_column('report_data_source_fields', sa.Column('field_category', sa.String(length=50), nullable=True, comment='字段分类'), schema='config')
    op.add_column('report_data_source_fields', sa.Column('format_config', postgresql.JSONB(astext_type=sa.Text()), nullable=True, comment='格式化配置'), schema='config')
    op.add_column('report_data_source_fields', sa.Column('validation_rules', postgresql.JSONB(astext_type=sa.Text()), nullable=True, comment='验证规则'), schema='config')
    op.add_column('report_data_source_fields', sa.Column('lookup_config', postgresql.JSONB(astext_type=sa.Text()), nullable=True, comment='查找表配置'), schema='config')
    op.add_column('report_data_source_fields', sa.Column('enable_aggregation', sa.Boolean(), nullable=True, server_default='false', comment='是否启用聚合'), schema='config')
    op.add_column('report_data_source_fields', sa.Column('aggregation_functions', postgresql.JSONB(astext_type=sa.Text()), nullable=True, comment='可用聚合函数'), schema='config')
    op.add_column('report_data_source_fields', sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True, comment='创建时间'), schema='config')
    op.add_column('report_data_source_fields', sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True, comment='更新时间'), schema='config')
    
    # 修改现有列
    op.alter_column('report_data_source_fields', 'field_name', comment='原始字段名', schema='config')
    op.alter_column('report_data_source_fields', 'display_name_zh', type_=sa.String(length=200), comment='中文显示名称', schema='config')
    op.alter_column('report_data_source_fields', 'display_name_en', type_=sa.String(length=200), comment='英文显示名称', schema='config')
    
    # 删除旧的comment列
    op.drop_column('report_data_source_fields', 'comment', schema='config')
    
    # 添加索引
    op.create_index('idx_ds_field_source_name', 'report_data_source_fields', ['data_source_id', 'field_name'], schema='config')
    op.create_index('idx_ds_field_visible_sortable', 'report_data_source_fields', ['is_visible', 'sort_order'], schema='config')
    
    # 3. 创建数据源访问日志表
    op.create_table('report_data_source_access_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('data_source_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('access_type', sa.String(length=20), nullable=False, comment='访问类型: view, query, export'),
        sa.Column('access_result', sa.String(length=20), nullable=False, comment='访问结果: success, failed, denied'),
        sa.Column('query_params', postgresql.JSONB(astext_type=sa.Text()), nullable=True, comment='查询参数'),
        sa.Column('result_count', sa.Integer(), nullable=True, comment='返回记录数'),
        sa.Column('execution_time', sa.DECIMAL(precision=10, scale=3), nullable=True, comment='执行时间(秒)'),
        sa.Column('error_message', sa.Text(), nullable=True, comment='错误信息'),
        sa.Column('ip_address', sa.String(length=45), nullable=True, comment='IP地址'),
        sa.Column('user_agent', sa.String(length=500), nullable=True, comment='用户代理'),
        sa.Column('accessed_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True, comment='访问时间'),
        sa.ForeignKeyConstraint(['data_source_id'], ['config.report_data_sources.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['security.users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        schema='config'
    )
    op.create_index('idx_access_log_data_source', 'report_data_source_access_logs', ['data_source_id'], schema='config')
    op.create_index('idx_access_log_user', 'report_data_source_access_logs', ['user_id'], schema='config')
    op.create_index('idx_access_log_accessed_at', 'report_data_source_access_logs', ['accessed_at'], schema='config')


def downgrade() -> None:
    """Downgrade schema."""
    
    # 删除访问日志表
    op.drop_table('report_data_source_access_logs', schema='config')
    
    # 删除字段表的新增列和索引
    op.drop_index('idx_ds_field_visible_sortable', 'report_data_source_fields', schema='config')
    op.drop_index('idx_ds_field_source_name', 'report_data_source_fields', schema='config')
    
    op.add_column('report_data_source_fields', sa.Column('comment', sa.String(length=200), nullable=True, comment='字段注释'), schema='config')
    
    op.drop_column('report_data_source_fields', 'updated_at', schema='config')
    op.drop_column('report_data_source_fields', 'created_at', schema='config')
    op.drop_column('report_data_source_fields', 'aggregation_functions', schema='config')
    op.drop_column('report_data_source_fields', 'enable_aggregation', schema='config')
    op.drop_column('report_data_source_fields', 'lookup_config', schema='config')
    op.drop_column('report_data_source_fields', 'validation_rules', schema='config')
    op.drop_column('report_data_source_fields', 'format_config', schema='config')
    op.drop_column('report_data_source_fields', 'field_category', schema='config')
    op.drop_column('report_data_source_fields', 'field_group', schema='config')
    op.drop_column('report_data_source_fields', 'is_exportable', schema='config')
    op.drop_column('report_data_source_fields', 'is_filterable', schema='config')
    op.drop_column('report_data_source_fields', 'is_sortable', schema='config')
    op.drop_column('report_data_source_fields', 'is_searchable', schema='config')
    op.drop_column('report_data_source_fields', 'is_indexed', schema='config')
    op.drop_column('report_data_source_fields', 'is_foreign_key', schema='config')
    op.drop_column('report_data_source_fields', 'is_primary_key', schema='config')
    op.drop_column('report_data_source_fields', 'description', schema='config')
    op.drop_column('report_data_source_fields', 'data_type', schema='config')
    op.drop_column('report_data_source_fields', 'field_alias', schema='config')
    
    # 删除数据源表的新增列和索引
    op.drop_constraint('fk_report_data_sources_updated_by', 'report_data_sources', type_='foreignkey', schema='config')
    op.drop_index('idx_data_source_schema_table', 'report_data_sources', schema='config')
    op.drop_index('idx_data_source_category', 'report_data_sources', schema='config')
    op.drop_index('idx_data_source_type_active', 'report_data_sources', schema='config')
    op.drop_constraint('uq_report_data_sources_code', 'report_data_sources', type_='unique', schema='config')
    
    op.drop_column('report_data_sources', 'updated_by', schema='config')
    op.drop_column('report_data_sources', 'last_sync_at', schema='config')
    op.drop_column('report_data_sources', 'last_used_at', schema='config')
    op.drop_column('report_data_sources', 'usage_count', schema='config')
    op.drop_column('report_data_sources', 'field_count', schema='config')
    op.drop_column('report_data_sources', 'tags', schema='config')
    op.drop_column('report_data_sources', 'sort_order', schema='config')
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
    op.drop_column('report_data_sources', 'source_type', schema='config')
    op.drop_column('report_data_sources', 'custom_query', schema='config')
    op.drop_column('report_data_sources', 'view_name', schema='config')
    op.drop_column('report_data_sources', 'connection_type', schema='config')
    op.drop_column('report_data_sources', 'category', schema='config')
    op.drop_column('report_data_sources', 'code', schema='config')
    
    # 恢复原始列类型
    op.alter_column('report_data_sources', 'name', type_=sa.String(length=100), schema='config')
    op.alter_column('report_data_sources', 'table_name', nullable=False, schema='config')
    op.alter_column('report_data_sources', 'connection_config', type_=sa.JSON(), schema='config') 