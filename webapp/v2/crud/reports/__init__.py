"""
报表系统CRUD操作模块

提供统一的接口导入所有报表相关的CRUD操作类
"""

# 数据源统一操作接口（兼容原有接口）
from .report_data_source_crud import ReportDataSourceCRUD

# 数据源细分操作模块（内部使用）
from .data_source_basic_crud import ReportDataSourceBasicCRUD
from .data_source_field_operations import ReportDataSourceFieldOperations
from .data_source_connection import ReportDataSourceConnection
from .report_data_source_field_crud import ReportDataSourceFieldCRUD

# 其他CRUD操作
from .report_calculated_field_crud import ReportCalculatedFieldCRUD
from .report_template_crud import ReportTemplateCRUD
from .report_template_field_crud import ReportTemplateFieldCRUD
from .report_execution_crud import ReportExecutionCRUD
from .report_view_crud import ReportViewCRUD
from .report_view_execution_crud import ReportViewExecutionCRUD

# 数据源统计和预览功能
from .data_source_statistics import ReportDataSourceStatistics
from .data_source_preview import ReportDataSourcePreview

# 报表配置管理CRUD操作
from .report_config_management import (
    # 报表类型定义
    get_report_type_definitions,
    get_report_type_definition,
    create_report_type_definition,
    update_report_type_definition,
    delete_report_type_definition,
    
    # 报表字段定义
    get_report_field_definitions,
    get_report_field_definition,
    create_report_field_definition,
    update_report_field_definition,
    delete_report_field_definition,
    
    # 报表配置预设
    get_report_config_presets,
    get_report_config_preset,
    create_report_config_preset,
    update_report_config_preset,
    delete_report_config_preset,
    
    # 使用统计更新
    update_report_type_usage,
    update_preset_usage,
)

__all__ = [
    # 主要对外接口
    'ReportDataSourceCRUD',
    
    # 数据源细分模块（内部使用）
    'ReportDataSourceBasicCRUD',
    'ReportDataSourceFieldOperations', 
    'ReportDataSourceConnection',
    'ReportDataSourceFieldCRUD',
    
    # 其他CRUD
    'ReportCalculatedFieldCRUD',
    'ReportTemplateCRUD',
    'ReportTemplateFieldCRUD',
    'ReportExecutionCRUD',
    'ReportViewCRUD',
    'ReportViewExecutionCRUD',
    
    # 数据源高级功能
    'ReportDataSourceStatistics',
    'ReportDataSourcePreview',

    # 报表配置管理CRUD操作
    'get_report_type_definitions',
    'get_report_type_definition',
    'create_report_type_definition',
    'update_report_type_definition',
    'delete_report_type_definition',
    'get_report_field_definitions',
    'get_report_field_definition',
    'create_report_field_definition',
    'update_report_field_definition',
    'delete_report_field_definition',
    'get_report_config_presets',
    'get_report_config_preset',
    'create_report_config_preset',
    'update_report_config_preset',
    'delete_report_config_preset',
    'update_report_type_usage',
    'update_preset_usage',
] 