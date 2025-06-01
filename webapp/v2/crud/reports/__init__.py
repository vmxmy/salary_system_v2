"""
报表系统CRUD操作模块

提供统一的接口导入所有报表相关的CRUD操作类
"""

# 数据源统一操作接口（兼容原有接口）
from .data_source_unified import ReportDataSourceCRUD

# 数据源细分操作模块（内部使用）
from .data_source_basic_crud import ReportDataSourceBasicCRUD
from .data_source_field_operations import ReportDataSourceFieldOperations
from .data_source_connection import ReportDataSourceConnection
from .data_source_field_crud import ReportDataSourceFieldCRUD

# 其他CRUD操作
from .calculated_field_crud import ReportCalculatedFieldCRUD
from .template_crud import ReportTemplateCRUD
from .template_field_crud import ReportTemplateFieldCRUD
from .execution_crud import ReportExecutionCRUD
from .view_crud import ReportViewCRUD
from .view_execution_crud import ReportViewExecutionCRUD

# 数据源统计和预览功能
from .data_source_statistics import ReportDataSourceStatistics
from .data_source_preview import ReportDataSourcePreview

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
    'ReportDataSourcePreview'
] 