"""create_report_auxiliary_tables

Revision ID: create_report_auxiliary_tables
Revises: complete_report_models_migration
Create Date: 2025-01-27 15:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'create_report_auxiliary_tables'
down_revision: Union[str, None] = 'complete_report_models_migration'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - 创建报表辅助表."""
    
    # 2. 创建数据源字段表
    print("🔄 创建 report_data_source_fields 表...")
    op.create_table('report_data_source_fields',
        sa.Column('id', sa.BigInteger(), sa.Identity(always=True), nullable=False),
        sa.Column('data_source_id', sa.BigInteger(), nullable=False),
        
        # 基础字段信息
        sa.Column('field_name', sa.String(length=100), nullable=False, comment='原始字段名'),
        sa.Column('field_alias', sa.String(length=100), nullable=True, comment='字段别名'),
        sa.Column('field_type', sa.String(length=50), nullable=False, comment='字段类型'),
        sa.Column('data_type', sa.String(length=50), nullable=True, comment='数据库数据类型'),
        
        # 显示配置
        sa.Column('display_name_zh', sa.String(length=200), nullable=True, comment='中文显示名称'),
        sa.Column('display_name_en', sa.String(length=200), nullable=True, comment='英文显示名称'),
        sa.Column('description', sa.Text(), nullable=True, comment='字段描述'),
        
        # 字段属性
        sa.Column('is_nullable', sa.Boolean(), nullable=True, server_default='true', comment='是否可为空'),
        sa.Column('is_primary_key', sa.Boolean(), nullable=True, server_default='false', comment='是否主键'),
        sa.Column('is_foreign_key', sa.Boolean(), nullable=True, server_default='false', comment='是否外键'),
        sa.Column('is_indexed', sa.Boolean(), nullable=True, server_default='false', comment='是否有索引'),
        
        # 显示和权限控制
        sa.Column('is_visible', sa.Boolean(), nullable=True, server_default='true', comment='是否可见'),
        sa.Column('is_searchable', sa.Boolean(), nullable=True, server_default='true', comment='是否可搜索'),
        sa.Column('is_sortable', sa.Boolean(), nullable=True, server_default='true', comment='是否可排序'),
        sa.Column('is_filterable', sa.Boolean(), nullable=True, server_default='true', comment='是否可筛选'),
        sa.Column('is_exportable', sa.Boolean(), nullable=True, server_default='true', comment='是否可导出'),
        
        # 分组和分类
        sa.Column('field_group', sa.String(length=50), nullable=True, comment='字段分组'),
        sa.Column('field_category', sa.String(length=50), nullable=True, comment='字段分类'),
        sa.Column('sort_order', sa.Integer(), nullable=True, server_default='0', comment='排序顺序'),
        
        # 格式化配置
        sa.Column('format_config', postgresql.JSONB(astext_type=sa.Text()), nullable=True, comment='格式化配置'),
        sa.Column('validation_rules', postgresql.JSONB(astext_type=sa.Text()), nullable=True, comment='验证规则'),
        sa.Column('lookup_config', postgresql.JSONB(astext_type=sa.Text()), nullable=True, comment='查找表配置'),
        
        # 统计配置
        sa.Column('enable_aggregation', sa.Boolean(), nullable=True, server_default='false', comment='是否启用聚合'),
        sa.Column('aggregation_functions', postgresql.JSONB(astext_type=sa.Text()), nullable=True, comment='可用聚合函数'),
        
        # 审计字段
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True, comment='创建时间'),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True, comment='更新时间'),
        
        sa.ForeignKeyConstraint(['data_source_id'], ['config.report_data_sources.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        schema='config'
    )
    
    # 3. 增强报表模板表
    print("🔄 增强 report_templates 表...")
    op.add_column('report_templates', sa.Column('data_source_id', sa.BigInteger(), nullable=True, comment='数据源ID'), schema='config')
    op.create_foreign_key('fk_report_templates_data_source', 'report_templates', 'report_data_sources', ['data_source_id'], ['id'], source_schema='config', referent_schema='config')
    
    # 4. 创建报表执行记录表
    print("🔄 创建 report_executions 表...")
    op.create_table('report_executions',
        sa.Column('id', sa.BigInteger(), sa.Identity(always=True), nullable=False),
        sa.Column('template_id', sa.BigInteger(), nullable=False),
        
        # 执行参数
        sa.Column('execution_params', postgresql.JSONB(astext_type=sa.Text()), nullable=True, comment='执行参数'),
        
        # 执行状态
        sa.Column('status', sa.String(length=20), nullable=True, server_default='pending', comment='执行状态'),
        sa.Column('result_count', sa.Integer(), nullable=True, comment='结果数量'),
        sa.Column('execution_time', sa.DECIMAL(precision=10, scale=3), nullable=True, comment='执行时间(秒)'),
        sa.Column('error_message', sa.Text(), nullable=True, comment='错误信息'),
        
        # 文件信息
        sa.Column('file_path', sa.String(length=500), nullable=True, comment='导出文件路径'),
        sa.Column('file_size', sa.BigInteger(), nullable=True, comment='文件大小(字节)'),
        sa.Column('file_format', sa.String(length=20), nullable=True, comment='文件格式'),
        
        # 审计字段
        sa.Column('executed_by', sa.BigInteger(), nullable=True, comment='执行者'),
        sa.Column('executed_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True, comment='执行时间'),
        
        sa.ForeignKeyConstraint(['template_id'], ['config.report_templates.id'], ),
        sa.ForeignKeyConstraint(['executed_by'], ['security.users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        schema='config'
    )
    
    # 5. 创建数据源访问日志表
    print("🔄 创建 report_data_source_access_logs 表...")
    op.create_table('report_data_source_access_logs',
        sa.Column('id', sa.BigInteger(), sa.Identity(always=True), nullable=False),
        sa.Column('data_source_id', sa.BigInteger(), nullable=False),
        sa.Column('user_id', sa.BigInteger(), nullable=False),
        
        # 访问信息
        sa.Column('access_type', sa.String(length=20), nullable=False, comment='访问类型'),
        sa.Column('access_result', sa.String(length=20), nullable=False, comment='访问结果'),
        
        # 查询信息
        sa.Column('query_params', postgresql.JSONB(astext_type=sa.Text()), nullable=True, comment='查询参数'),
        sa.Column('result_count', sa.Integer(), nullable=True, comment='返回记录数'),
        sa.Column('execution_time', sa.DECIMAL(precision=10, scale=3), nullable=True, comment='执行时间(秒)'),
        sa.Column('error_message', sa.Text(), nullable=True, comment='错误信息'),
        
        # 客户端信息
        sa.Column('ip_address', sa.String(length=45), nullable=True, comment='IP地址'),
        sa.Column('user_agent', sa.String(length=500), nullable=True, comment='用户代理'),
        
        # 时间戳
        sa.Column('accessed_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True, comment='访问时间'),
        
        sa.ForeignKeyConstraint(['data_source_id'], ['config.report_data_sources.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['security.users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        schema='config'
    )
    
    # 6. 创建报表权限表
    print("🔄 创建 report_permissions 表...")
    op.create_table('report_permissions',
        sa.Column('id', sa.BigInteger(), sa.Identity(always=True), nullable=False),
        
        # 权限主体
        sa.Column('subject_type', sa.String(length=20), nullable=False, comment='主体类型'),
        sa.Column('subject_id', sa.BigInteger(), nullable=False, comment='主体ID'),
        
        # 权限对象
        sa.Column('object_type', sa.String(length=20), nullable=False, comment='对象类型'),
        sa.Column('object_id', sa.BigInteger(), nullable=False, comment='对象ID'),
        
        # 权限类型
        sa.Column('permission_type', sa.String(length=20), nullable=False, comment='权限类型'),
        
        # 权限配置
        sa.Column('is_granted', sa.Boolean(), nullable=True, server_default='true', comment='是否授权'),
        sa.Column('conditions', postgresql.JSONB(astext_type=sa.Text()), nullable=True, comment='权限条件'),
        
        # 审计字段
        sa.Column('granted_by', sa.BigInteger(), nullable=True, comment='授权者'),
        sa.Column('granted_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True, comment='授权时间'),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True, comment='过期时间'),
        
        sa.ForeignKeyConstraint(['granted_by'], ['security.users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        schema='config'
    )
    
    # 7. 创建用户偏好设置表
    print("🔄 创建 report_user_preferences 表...")
    op.create_table('report_user_preferences',
        sa.Column('id', sa.BigInteger(), sa.Identity(always=True), nullable=False),
        sa.Column('user_id', sa.BigInteger(), nullable=False),
        
        # 偏好类型
        sa.Column('preference_type', sa.String(length=50), nullable=False, comment='偏好类型'),
        sa.Column('object_type', sa.String(length=20), nullable=True, comment='对象类型'),
        sa.Column('object_id', sa.BigInteger(), nullable=True, comment='对象ID'),
        
        # 偏好配置
        sa.Column('preference_config', postgresql.JSONB(astext_type=sa.Text()), nullable=False, comment='偏好配置'),
        
        # 审计字段
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True, comment='创建时间'),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True, comment='更新时间'),
        
        sa.ForeignKeyConstraint(['user_id'], ['security.users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'preference_type', 'object_type', 'object_id', name='uq_user_preference'),
        schema='config'
    )
    
    # 8. 创建索引
    print("🔄 创建索引...")
    
    # 数据源字段表索引
    op.create_index('idx_ds_field_source_name', 'report_data_source_fields', ['data_source_id', 'field_name'], schema='config')
    op.create_index('idx_ds_field_visible_sortable', 'report_data_source_fields', ['is_visible', 'sort_order'], schema='config')
    
    # 执行记录表索引
    op.create_index('idx_report_executions_template', 'report_executions', ['template_id'], schema='config')
    op.create_index('idx_report_executions_user_time', 'report_executions', ['executed_by', 'executed_at'], schema='config')
    op.create_index('idx_report_executions_status', 'report_executions', ['status'], schema='config')
    
    # 访问日志表索引
    op.create_index('idx_access_log_data_source', 'report_data_source_access_logs', ['data_source_id'], schema='config')
    op.create_index('idx_access_log_user', 'report_data_source_access_logs', ['user_id'], schema='config')
    op.create_index('idx_access_log_accessed_at', 'report_data_source_access_logs', ['accessed_at'], schema='config')
    op.create_index('idx_access_log_type_result', 'report_data_source_access_logs', ['access_type', 'access_result'], schema='config')
    
    # 权限表索引
    op.create_index('idx_report_permissions_subject', 'report_permissions', ['subject_type', 'subject_id'], schema='config')
    op.create_index('idx_report_permissions_object', 'report_permissions', ['object_type', 'object_id'], schema='config')
    op.create_index('idx_report_permissions_type', 'report_permissions', ['permission_type'], schema='config')
    
    # 用户偏好表索引
    op.create_index('idx_user_preferences_user', 'report_user_preferences', ['user_id'], schema='config')
    op.create_index('idx_user_preferences_type', 'report_user_preferences', ['preference_type'], schema='config')


def downgrade() -> None:
    """Downgrade schema."""
    
    # 删除索引
    op.drop_index('idx_user_preferences_type', 'report_user_preferences', schema='config')
    op.drop_index('idx_user_preferences_user', 'report_user_preferences', schema='config')
    op.drop_index('idx_report_permissions_type', 'report_permissions', schema='config')
    op.drop_index('idx_report_permissions_object', 'report_permissions', schema='config')
    op.drop_index('idx_report_permissions_subject', 'report_permissions', schema='config')
    op.drop_index('idx_access_log_type_result', 'report_data_source_access_logs', schema='config')
    op.drop_index('idx_access_log_accessed_at', 'report_data_source_access_logs', schema='config')
    op.drop_index('idx_access_log_user', 'report_data_source_access_logs', schema='config')
    op.drop_index('idx_access_log_data_source', 'report_data_source_access_logs', schema='config')
    op.drop_index('idx_report_executions_status', 'report_executions', schema='config')
    op.drop_index('idx_report_executions_user_time', 'report_executions', schema='config')
    op.drop_index('idx_report_executions_template', 'report_executions', schema='config')
    op.drop_index('idx_ds_field_visible_sortable', 'report_data_source_fields', schema='config')
    op.drop_index('idx_ds_field_source_name', 'report_data_source_fields', schema='config')
    
    # 删除表
    op.drop_table('report_user_preferences', schema='config')
    op.drop_table('report_permissions', schema='config')
    op.drop_table('report_data_source_access_logs', schema='config')
    op.drop_table('report_executions', schema='config')
    
    # 删除报表模板表的新增字段
    op.drop_constraint('fk_report_templates_data_source', 'report_templates', schema='config', type_='foreignkey')
    op.drop_column('report_templates', 'data_source_id', schema='config')
    
    # 删除数据源字段表
    op.drop_table('report_data_source_fields', schema='config') 