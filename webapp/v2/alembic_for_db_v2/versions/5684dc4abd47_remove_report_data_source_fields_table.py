"""remove_report_data_source_fields_table

Revision ID: 5684dc4abd47
Revises: 5c29e9d84d6f
Create Date: 2025-06-09 03:44:01.234567

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '5684dc4abd47'
down_revision: Union[str, None] = '5c29e9d84d6f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """移除 report_data_source_fields 表，改为动态获取字段"""
    
    print("🗑️ 移除 report_data_source_fields 表...")
    
    # 1. 删除 report_data_source_fields 表
    op.drop_table('report_data_source_fields', schema='config')
    
    # 2. 在 report_data_sources 表中添加配置字段
    print("📝 在数据源表中添加配置字段...")
    
    op.add_column('report_data_sources', 
                  sa.Column('field_config', postgresql.JSONB(astext_type=sa.Text()), 
                           nullable=True, comment='字段显示配置'), 
                  schema='config')
    
    op.add_column('report_data_sources', 
                  sa.Column('enable_dynamic_fields', sa.Boolean(), 
                           nullable=False, server_default='true', comment='是否启用动态字段获取'), 
                  schema='config')
    
    op.add_column('report_data_sources', 
                  sa.Column('field_grouping_enabled', sa.Boolean(), 
                           nullable=False, server_default='true', comment='是否启用字段分组'), 
                  schema='config')
    
    op.add_column('report_data_sources', 
                  sa.Column('auto_infer_categories', sa.Boolean(), 
                           nullable=False, server_default='true', comment='是否自动推断字段分类'), 
                  schema='config')
    
    print("✅ 迁移完成：已移除字段表，改为动态获取")


def downgrade() -> None:
    """回滚：重新创建 report_data_source_fields 表"""
    
    print("🔄 回滚：重新创建 report_data_source_fields 表...")
    
    # 1. 移除新增的配置字段
    op.drop_column('report_data_sources', 'auto_infer_categories', schema='config')
    op.drop_column('report_data_sources', 'field_grouping_enabled', schema='config')
    op.drop_column('report_data_sources', 'enable_dynamic_fields', schema='config')
    op.drop_column('report_data_sources', 'field_config', schema='config')
    
    # 2. 重新创建 report_data_source_fields 表
    op.create_table('report_data_source_fields',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('data_source_id', sa.BigInteger(), nullable=False),
        sa.Column('field_name', sa.String(length=100), nullable=False, comment='原始字段名'),
        sa.Column('field_alias', sa.String(length=100), nullable=True, comment='字段别名'),
        sa.Column('field_type', sa.String(length=50), nullable=False, comment='字段类型'),
        sa.Column('data_type', sa.String(length=50), nullable=True, comment='数据库数据类型'),
        sa.Column('display_name_zh', sa.String(length=200), nullable=True, comment='中文显示名称'),
        sa.Column('display_name_en', sa.String(length=200), nullable=True, comment='英文显示名称'),
        sa.Column('description', sa.Text(), nullable=True, comment='字段描述'),
        sa.Column('is_nullable', sa.Boolean(), nullable=True, comment='是否可为空'),
        sa.Column('is_primary_key', sa.Boolean(), nullable=True, comment='是否主键'),
        sa.Column('is_foreign_key', sa.Boolean(), nullable=True, comment='是否外键'),
        sa.Column('is_indexed', sa.Boolean(), nullable=True, comment='是否有索引'),
        sa.Column('is_visible', sa.Boolean(), nullable=True, comment='是否可见'),
        sa.Column('is_searchable', sa.Boolean(), nullable=True, comment='是否可搜索'),
        sa.Column('is_sortable', sa.Boolean(), nullable=True, comment='是否可排序'),
        sa.Column('is_filterable', sa.Boolean(), nullable=True, comment='是否可筛选'),
        sa.Column('is_exportable', sa.Boolean(), nullable=True, comment='是否可导出'),
        sa.Column('field_group', sa.String(length=50), nullable=True, comment='字段分组'),
        sa.Column('field_category', sa.String(length=50), nullable=True, comment='字段分类'),
        sa.Column('sort_order', sa.Integer(), nullable=True, comment='排序顺序'),
        sa.Column('format_config', postgresql.JSONB(astext_type=sa.Text()), nullable=True, comment='格式化配置'),
        sa.Column('validation_rules', postgresql.JSONB(astext_type=sa.Text()), nullable=True, comment='验证规则'),
        sa.Column('lookup_config', postgresql.JSONB(astext_type=sa.Text()), nullable=True, comment='查找表配置'),
        sa.Column('enable_aggregation', sa.Boolean(), nullable=True, comment='是否启用聚合'),
        sa.Column('aggregation_functions', postgresql.ARRAY(sa.String()), nullable=True, comment='可用聚合函数'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False, comment='创建时间'),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False, comment='更新时间'),
        sa.ForeignKeyConstraint(['data_source_id'], ['config.report_data_sources.id'], ),
        sa.PrimaryKeyConstraint('id'),
        schema='config'
    )
    
    # 创建索引
    op.create_index('idx_ds_field_source_name', 'report_data_source_fields', ['data_source_id', 'field_name'], unique=False, schema='config')
    op.create_index('idx_ds_field_visible_sortable', 'report_data_source_fields', ['is_visible', 'sort_order'], unique=False, schema='config')
    
    print("✅ 回滚完成：已重新创建字段表")
