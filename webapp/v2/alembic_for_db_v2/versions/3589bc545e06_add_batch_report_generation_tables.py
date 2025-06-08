"""add_batch_report_generation_tables

Revision ID: 3589bc545e06
Revises: fd0b00beab27
Create Date: 2025-06-08 03:29:19.065198

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '3589bc545e06'
down_revision: Union[str, None] = 'fd0b00beab27'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # 创建批量报表生成任务表
    op.create_table('batch_report_tasks',
        sa.Column('id', sa.BigInteger(), nullable=False, comment='主键'),
        sa.Column('task_name', sa.String(length=255), nullable=False, comment='任务名称'),
        sa.Column('description', sa.Text(), nullable=True, comment='任务描述'),
        sa.Column('task_type', sa.String(length=50), nullable=False, server_default='batch_export', comment='任务类型'),
        sa.Column('source_config', postgresql.JSONB(astext_type=sa.Text()), nullable=False, comment='数据源配置'),
        sa.Column('export_config', postgresql.JSONB(astext_type=sa.Text()), nullable=False, comment='导出配置'),
        sa.Column('filter_config', postgresql.JSONB(astext_type=sa.Text()), nullable=True, comment='筛选条件配置'),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='pending', comment='任务状态: pending, running, completed, failed, cancelled'),
        sa.Column('progress', sa.Integer(), nullable=True, server_default='0', comment='进度百分比(0-100)'),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True, comment='开始执行时间'),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True, comment='完成时间'),
        sa.Column('execution_time', sa.DECIMAL(precision=10, scale=3), nullable=True, comment='执行时间(秒)'),
        sa.Column('total_reports', sa.Integer(), nullable=True, server_default='0', comment='总报表数量'),
        sa.Column('completed_reports', sa.Integer(), nullable=True, server_default='0', comment='已完成报表数量'),
        sa.Column('failed_reports', sa.Integer(), nullable=True, server_default='0', comment='失败报表数量'),
        sa.Column('output_directory', sa.String(length=500), nullable=True, comment='输出目录'),
        sa.Column('archive_file_path', sa.String(length=500), nullable=True, comment='打包文件路径'),
        sa.Column('archive_file_size', sa.BigInteger(), nullable=True, comment='打包文件大小(字节)'),
        sa.Column('error_message', sa.Text(), nullable=True, comment='错误信息'),
        sa.Column('error_details', postgresql.JSONB(astext_type=sa.Text()), nullable=True, comment='详细错误信息'),
        sa.Column('created_by', sa.BigInteger(), nullable=False, comment='创建者'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False, comment='创建时间'),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False, comment='更新时间'),
        sa.ForeignKeyConstraint(['created_by'], ['security.users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        schema='config'
    )
    
    # 创建索引
    op.create_index('idx_batch_task_status', 'batch_report_tasks', ['status'], unique=False, schema='config')
    op.create_index('idx_batch_task_created', 'batch_report_tasks', ['created_at'], unique=False, schema='config')
    op.create_index('idx_batch_task_user', 'batch_report_tasks', ['created_by'], unique=False, schema='config')

    # 创建批量报表任务项表
    op.create_table('batch_report_task_items',
        sa.Column('id', sa.BigInteger(), nullable=False, comment='主键'),
        sa.Column('task_id', sa.BigInteger(), nullable=False, comment='任务ID'),
        sa.Column('report_type', sa.String(length=50), nullable=False, comment='报表类型'),
        sa.Column('report_name', sa.String(length=255), nullable=False, comment='报表名称'),
        sa.Column('report_config', postgresql.JSONB(astext_type=sa.Text()), nullable=False, comment='报表配置'),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='pending', comment='状态: pending, running, completed, failed, skipped'),
        sa.Column('execution_order', sa.Integer(), nullable=True, server_default='0', comment='执行顺序'),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True, comment='开始时间'),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True, comment='完成时间'),
        sa.Column('execution_time', sa.DECIMAL(precision=10, scale=3), nullable=True, comment='执行时间(秒)'),
        sa.Column('result_count', sa.Integer(), nullable=True, comment='结果数量'),
        sa.Column('file_path', sa.String(length=500), nullable=True, comment='生成文件路径'),
        sa.Column('file_size', sa.BigInteger(), nullable=True, comment='文件大小(字节)'),
        sa.Column('file_format', sa.String(length=20), nullable=True, comment='文件格式'),
        sa.Column('error_message', sa.Text(), nullable=True, comment='错误信息'),
        sa.Column('error_details', postgresql.JSONB(astext_type=sa.Text()), nullable=True, comment='详细错误信息'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False, comment='创建时间'),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False, comment='更新时间'),
        sa.ForeignKeyConstraint(['task_id'], ['config.batch_report_tasks.id'], ),
        sa.PrimaryKeyConstraint('id'),
        schema='config'
    )
    
    # 创建索引
    op.create_index('idx_batch_item_task', 'batch_report_task_items', ['task_id'], unique=False, schema='config')
    op.create_index('idx_batch_item_status', 'batch_report_task_items', ['status'], unique=False, schema='config')

    # 创建报表文件管理表
    op.create_table('report_file_manager',
        sa.Column('id', sa.BigInteger(), nullable=False, comment='主键'),
        sa.Column('file_name', sa.String(length=255), nullable=False, comment='文件名'),
        sa.Column('file_path', sa.String(length=500), nullable=False, comment='文件路径'),
        sa.Column('file_size', sa.BigInteger(), nullable=True, comment='文件大小(字节)'),
        sa.Column('file_type', sa.String(length=50), nullable=False, comment='文件类型: report, archive, temp'),
        sa.Column('file_format', sa.String(length=20), nullable=True, comment='文件格式: xlsx, csv, pdf, zip'),
        sa.Column('source_type', sa.String(length=50), nullable=True, comment='来源类型: single_report, batch_task, manual_export'),
        sa.Column('source_id', sa.BigInteger(), nullable=True, comment='来源ID'),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='active', comment='状态: active, archived, deleted'),
        sa.Column('is_temporary', sa.Boolean(), nullable=True, server_default='false', comment='是否临时文件'),
        sa.Column('access_level', sa.String(length=20), nullable=True, server_default='private', comment='访问级别: public, private, restricted'),
        sa.Column('download_count', sa.Integer(), nullable=True, server_default='0', comment='下载次数'),
        sa.Column('last_accessed_at', sa.DateTime(timezone=True), nullable=True, comment='最后访问时间'),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True, comment='过期时间'),
        sa.Column('auto_cleanup', sa.Boolean(), nullable=True, server_default='true', comment='是否自动清理'),
        sa.Column('metadata_info', postgresql.JSONB(astext_type=sa.Text()), nullable=True, comment='文件元数据'),
        sa.Column('checksum', sa.String(length=64), nullable=True, comment='文件校验和'),
        sa.Column('created_by', sa.BigInteger(), nullable=True, comment='创建者'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False, comment='创建时间'),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False, comment='更新时间'),
        sa.ForeignKeyConstraint(['created_by'], ['security.users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        schema='config'
    )
    
    # 创建索引
    op.create_index('idx_file_manager_type', 'report_file_manager', ['file_type'], unique=False, schema='config')
    op.create_index('idx_file_manager_created', 'report_file_manager', ['created_at'], unique=False, schema='config')
    op.create_index('idx_file_manager_expires', 'report_file_manager', ['expires_at'], unique=False, schema='config')


def downgrade() -> None:
    """Downgrade schema."""
    # 删除索引
    op.drop_index('idx_file_manager_expires', table_name='report_file_manager', schema='config')
    op.drop_index('idx_file_manager_created', table_name='report_file_manager', schema='config')
    op.drop_index('idx_file_manager_type', table_name='report_file_manager', schema='config')
    
    op.drop_index('idx_batch_item_status', table_name='batch_report_task_items', schema='config')
    op.drop_index('idx_batch_item_task', table_name='batch_report_task_items', schema='config')
    
    op.drop_index('idx_batch_task_user', table_name='batch_report_tasks', schema='config')
    op.drop_index('idx_batch_task_created', table_name='batch_report_tasks', schema='config')
    op.drop_index('idx_batch_task_status', table_name='batch_report_tasks', schema='config')
    
    # 删除表
    op.drop_table('report_file_manager', schema='config')
    op.drop_table('batch_report_task_items', schema='config')
    op.drop_table('batch_report_tasks', schema='config') 