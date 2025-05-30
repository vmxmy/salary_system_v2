"""create_report_views_tables

Revision ID: create_report_views_tables
Revises: enhance_report_data_source_models
Create Date: 2025-01-27 15:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'create_report_views_tables'
down_revision: Union[str, None] = 'enhance_report_data_source_models'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    
    # 1. 创建 reports schema（如果不存在）
    op.execute("CREATE SCHEMA IF NOT EXISTS reports")
    
    # 2. 创建 report_views 表
    op.create_table('report_views',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False, comment='报表名称'),
        sa.Column('description', sa.Text(), nullable=True, comment='报表描述'),
        sa.Column('view_name', sa.String(length=100), nullable=False, comment='视图名称'),
        sa.Column('sql_query', sa.Text(), nullable=False, comment='SQL查询语句'),
        sa.Column('schema_name', sa.String(length=50), nullable=False, server_default='reports', comment='视图所在模式'),
        
        # 报表配置
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true', comment='是否激活'),
        sa.Column('is_public', sa.Boolean(), nullable=False, server_default='false', comment='是否公开'),
        sa.Column('category', sa.String(length=100), nullable=True, comment='报表分类'),
        
        # 视图状态
        sa.Column('view_status', sa.String(length=20), nullable=True, server_default='draft', comment='视图状态: draft, created, error'),
        sa.Column('last_sync_at', sa.DateTime(timezone=True), nullable=True, comment='最后同步时间'),
        sa.Column('sync_error', sa.Text(), nullable=True, comment='同步错误信息'),
        
        # 使用统计
        sa.Column('usage_count', sa.Integer(), nullable=False, server_default='0', comment='使用次数'),
        sa.Column('last_used_at', sa.DateTime(timezone=True), nullable=True, comment='最后使用时间'),
        
        # 审计字段
        sa.Column('created_by', sa.BigInteger(), nullable=True, comment='创建者'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False, comment='创建时间'),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False, comment='更新时间'),
        
        sa.ForeignKeyConstraint(['created_by'], ['security.users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('view_name', name='uq_report_views_view_name'),
        schema='config'
    )
    
    # 3. 创建 report_view_executions 表
    op.create_table('report_view_executions',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('report_view_id', sa.BigInteger(), nullable=False),
        
        # 执行参数
        sa.Column('execution_params', postgresql.JSONB(astext_type=sa.Text()), nullable=True, comment='执行参数(筛选条件等)'),
        sa.Column('result_count', sa.Integer(), nullable=True, comment='结果数量'),
        sa.Column('execution_time', sa.DECIMAL(precision=10, scale=3), nullable=True, comment='执行时间(秒)'),
        
        # 执行状态
        sa.Column('status', sa.String(length=20), nullable=True, server_default='success', comment='执行状态: success, error'),
        sa.Column('error_message', sa.Text(), nullable=True, comment='错误信息'),
        
        # 导出信息
        sa.Column('export_format', sa.String(length=20), nullable=True, comment='导出格式: excel, csv, pdf'),
        sa.Column('file_path', sa.String(length=500), nullable=True, comment='导出文件路径'),
        sa.Column('file_size', sa.BigInteger(), nullable=True, comment='文件大小(字节)'),
        
        # 审计字段
        sa.Column('executed_by', sa.BigInteger(), nullable=True, comment='执行者'),
        sa.Column('executed_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False, comment='执行时间'),
        
        sa.ForeignKeyConstraint(['executed_by'], ['security.users.id'], ),
        sa.ForeignKeyConstraint(['report_view_id'], ['config.report_views.id'], ),
        sa.PrimaryKeyConstraint('id'),
        schema='config'
    )
    
    # 4. 创建索引
    op.create_index('idx_report_views_name', 'report_views', ['name'], schema='config')
    op.create_index('idx_report_views_category', 'report_views', ['category'], schema='config')
    op.create_index('idx_report_views_status', 'report_views', ['view_status'], schema='config')
    op.create_index('idx_report_views_created_by', 'report_views', ['created_by'], schema='config')
    
    op.create_index('idx_report_view_executions_view_id', 'report_view_executions', ['report_view_id'], schema='config')
    op.create_index('idx_report_view_executions_executed_by', 'report_view_executions', ['executed_by'], schema='config')
    op.create_index('idx_report_view_executions_executed_at', 'report_view_executions', ['executed_at'], schema='config')


def downgrade() -> None:
    """Downgrade schema."""
    
    # 删除索引
    op.drop_index('idx_report_view_executions_executed_at', table_name='report_view_executions', schema='config')
    op.drop_index('idx_report_view_executions_executed_by', table_name='report_view_executions', schema='config')
    op.drop_index('idx_report_view_executions_view_id', table_name='report_view_executions', schema='config')
    
    op.drop_index('idx_report_views_created_by', table_name='report_views', schema='config')
    op.drop_index('idx_report_views_status', table_name='report_views', schema='config')
    op.drop_index('idx_report_views_category', table_name='report_views', schema='config')
    op.drop_index('idx_report_views_name', table_name='report_views', schema='config')
    
    # 删除表
    op.drop_table('report_view_executions', schema='config')
    op.drop_table('report_views', schema='config')
    
    # 删除 reports schema（如果为空）
    op.execute("DROP SCHEMA IF EXISTS reports CASCADE") 