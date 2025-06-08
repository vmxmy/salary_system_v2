"""add_report_type_definitions_and_presets

Revision ID: 5eea6b8a2298
Revises: 3589bc545e06
Create Date: 2025-06-08 17:48:22.730763

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '5eea6b8a2298'
down_revision: Union[str, None] = '3589bc545e06'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    
    # 1. 创建报表类型定义表
    op.create_table(
        'report_type_definitions',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('code', sa.String(50), nullable=False, comment='报表类型编码'),
        sa.Column('name', sa.String(100), nullable=False, comment='报表名称'),
        sa.Column('description', sa.Text(), nullable=True, comment='报表描述'),
        sa.Column('category', sa.String(50), nullable=True, comment='报表分类'),
        
        # 生成配置
        sa.Column('generator_class', sa.String(200), nullable=True, comment='生成器类名'),
        sa.Column('generator_module', sa.String(200), nullable=True, comment='生成器模块路径'),
        sa.Column('template_config', postgresql.JSONB(), nullable=True, comment='模板配置'),
        sa.Column('default_config', postgresql.JSONB(), nullable=True, comment='默认配置'),
        sa.Column('validation_rules', postgresql.JSONB(), nullable=True, comment='验证规则'),
        
        # 权限和状态
        sa.Column('required_permissions', postgresql.JSONB(), nullable=True, comment='所需权限'),
        sa.Column('allowed_roles', postgresql.JSONB(), nullable=True, comment='允许的角色'),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True, comment='是否激活'),
        sa.Column('is_system', sa.Boolean(), nullable=False, default=False, comment='是否系统内置'),
        sa.Column('sort_order', sa.Integer(), nullable=False, default=0, comment='排序顺序'),
        
        # 使用统计
        sa.Column('usage_count', sa.Integer(), nullable=False, default=0, comment='使用次数'),
        sa.Column('last_used_at', sa.DateTime(timezone=True), nullable=True, comment='最后使用时间'),
        
        # 审计字段
        sa.Column('created_by', sa.BigInteger(), nullable=True, comment='创建者'),
        sa.Column('updated_by', sa.BigInteger(), nullable=True, comment='更新者'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('code', name='uq_report_type_definitions_code'),
        schema='reports'
    )
    
    # 2. 创建报表字段定义表
    op.create_table(
        'report_field_definitions',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('report_type_id', sa.BigInteger(), nullable=False),
        
        # 字段基本信息
        sa.Column('field_name', sa.String(100), nullable=False, comment='字段名称'),
        sa.Column('field_alias', sa.String(100), nullable=True, comment='字段别名'),
        sa.Column('field_type', sa.String(50), nullable=False, comment='字段类型'),
        sa.Column('data_source', sa.String(100), nullable=True, comment='数据源'),
        sa.Column('source_column', sa.String(100), nullable=True, comment='源字段名'),
        
        # 显示配置
        sa.Column('display_name', sa.String(200), nullable=True, comment='显示名称'),
        sa.Column('display_order', sa.Integer(), nullable=False, default=0, comment='显示顺序'),
        sa.Column('is_visible', sa.Boolean(), nullable=False, default=True, comment='是否可见'),
        sa.Column('is_required', sa.Boolean(), nullable=False, default=False, comment='是否必填'),
        sa.Column('is_sortable', sa.Boolean(), nullable=False, default=True, comment='是否可排序'),
        sa.Column('is_filterable', sa.Boolean(), nullable=False, default=True, comment='是否可筛选'),
        
        # 格式化配置
        sa.Column('format_config', postgresql.JSONB(), nullable=True, comment='格式化配置'),
        sa.Column('validation_rules', postgresql.JSONB(), nullable=True, comment='验证规则'),
        sa.Column('default_value', sa.String(500), nullable=True, comment='默认值'),
        sa.Column('calculation_formula', sa.Text(), nullable=True, comment='计算公式'),
        
        # 样式配置
        sa.Column('width', sa.Integer(), nullable=True, comment='列宽度'),
        sa.Column('alignment', sa.String(20), nullable=True, comment='对齐方式'),
        sa.Column('style_config', postgresql.JSONB(), nullable=True, comment='样式配置'),
        
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['report_type_id'], ['reports.report_type_definitions.id'], ondelete='CASCADE'),
        schema='reports'
    )
    
    # 3. 创建报表配置预设表
    op.create_table(
        'report_config_presets',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('name', sa.String(100), nullable=False, comment='预设名称'),
        sa.Column('description', sa.Text(), nullable=True, comment='预设描述'),
        sa.Column('category', sa.String(50), nullable=True, comment='预设分类'),
        
        # 预设配置
        sa.Column('report_types', postgresql.JSONB(), nullable=False, comment='包含的报表类型'),
        sa.Column('default_config', postgresql.JSONB(), nullable=True, comment='默认配置'),
        sa.Column('filter_config', postgresql.JSONB(), nullable=True, comment='筛选配置'),
        sa.Column('export_config', postgresql.JSONB(), nullable=True, comment='导出配置'),
        
        # 权限和状态
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True, comment='是否激活'),
        sa.Column('is_public', sa.Boolean(), nullable=False, default=False, comment='是否公开'),
        sa.Column('sort_order', sa.Integer(), nullable=False, default=0, comment='排序顺序'),
        
        # 使用统计
        sa.Column('usage_count', sa.Integer(), nullable=False, default=0, comment='使用次数'),
        sa.Column('last_used_at', sa.DateTime(timezone=True), nullable=True, comment='最后使用时间'),
        
        # 审计字段
        sa.Column('created_by', sa.BigInteger(), nullable=True, comment='创建者'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        
        sa.PrimaryKeyConstraint('id'),
        schema='reports'
    )
    
    # 4. 创建索引
    op.create_index('idx_report_type_definitions_code', 'report_type_definitions', ['code'], schema='reports')
    op.create_index('idx_report_type_definitions_category', 'report_type_definitions', ['category'], schema='reports')
    op.create_index('idx_report_type_definitions_active', 'report_type_definitions', ['is_active'], schema='reports')
    
    op.create_index('idx_report_field_definitions_type', 'report_field_definitions', ['report_type_id'], schema='reports')
    op.create_index('idx_report_field_definitions_order', 'report_field_definitions', ['display_order'], schema='reports')
    
    op.create_index('idx_report_config_presets_category', 'report_config_presets', ['category'], schema='reports')
    op.create_index('idx_report_config_presets_active', 'report_config_presets', ['is_active'], schema='reports')


def downgrade() -> None:
    """Downgrade schema."""
    
    # 删除索引
    op.drop_index('idx_report_config_presets_active', table_name='report_config_presets', schema='reports')
    op.drop_index('idx_report_config_presets_category', table_name='report_config_presets', schema='reports')
    op.drop_index('idx_report_field_definitions_order', table_name='report_field_definitions', schema='reports')
    op.drop_index('idx_report_field_definitions_type', table_name='report_field_definitions', schema='reports')
    op.drop_index('idx_report_type_definitions_active', table_name='report_type_definitions', schema='reports')
    op.drop_index('idx_report_type_definitions_category', table_name='report_type_definitions', schema='reports')
    op.drop_index('idx_report_type_definitions_code', table_name='report_type_definitions', schema='reports')
    
    # 删除表
    op.drop_table('report_config_presets', schema='reports')
    op.drop_table('report_field_definitions', schema='reports')
    op.drop_table('report_type_definitions', schema='reports')
