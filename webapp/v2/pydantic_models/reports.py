from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
from decimal import Decimal


# 数据源相关模型
class ReportDataSourceFieldBase(BaseModel):
    field_name: str = Field(..., description="字段名")
    field_type: str = Field(..., description="字段类型")
    is_nullable: bool = Field(True, description="是否可为空")
    comment: Optional[str] = Field(None, description="字段注释")
    display_name_zh: Optional[str] = Field(None, description="中文显示名称")
    display_name_en: Optional[str] = Field(None, description="英文显示名称")
    is_visible: bool = Field(True, description="是否可见")
    sort_order: int = Field(0, description="排序顺序")


class ReportDataSourceFieldCreate(ReportDataSourceFieldBase):
    data_source_id: int = Field(..., description="数据源ID")


class ReportDataSourceFieldUpdate(BaseModel):
    field_name: Optional[str] = None
    field_type: Optional[str] = None
    is_nullable: Optional[bool] = None
    comment: Optional[str] = None
    display_name_zh: Optional[str] = None
    display_name_en: Optional[str] = None
    is_visible: Optional[bool] = None
    sort_order: Optional[int] = None


class ReportDataSourceField(ReportDataSourceFieldBase):
    id: int
    data_source_id: int

    class Config:
        from_attributes = True


class ReportDataSourceBase(BaseModel):
    name: str = Field(..., description="数据源名称")
    table_name: str = Field(..., description="表名")
    schema_name: str = Field("public", description="模式名")
    description: Optional[str] = Field(None, description="描述")
    connection_config: Optional[Dict[str, Any]] = Field(None, description="连接配置")
    is_active: bool = Field(True, description="是否激活")


class ReportDataSourceCreate(ReportDataSourceBase):
    fields: Optional[List[ReportDataSourceFieldBase]] = Field([], description="字段列表")


class ReportDataSourceUpdate(BaseModel):
    name: Optional[str] = None
    table_name: Optional[str] = None
    schema_name: Optional[str] = None
    description: Optional[str] = None
    connection_config: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None


class ReportDataSource(ReportDataSourceBase):
    id: int
    created_by: Optional[int]
    created_at: datetime
    updated_at: datetime
    fields: List[ReportDataSourceField] = []

    class Config:
        from_attributes = True


# 计算字段相关模型
class ReportCalculatedFieldBase(BaseModel):
    name: str = Field(..., description="字段名称")
    alias: str = Field(..., description="字段别名")
    formula: str = Field(..., description="计算公式")
    return_type: str = Field(..., description="返回类型")
    description: Optional[str] = Field(None, description="描述")
    display_name_zh: Optional[str] = Field(None, description="中文显示名称")
    display_name_en: Optional[str] = Field(None, description="英文显示名称")
    is_global: bool = Field(True, description="是否全局字段")
    is_active: bool = Field(True, description="是否激活")
    category: Optional[str] = Field(None, description="分类")


class ReportCalculatedFieldCreate(ReportCalculatedFieldBase):
    pass


class ReportCalculatedFieldUpdate(BaseModel):
    name: Optional[str] = None
    alias: Optional[str] = None
    formula: Optional[str] = None
    return_type: Optional[str] = None
    description: Optional[str] = None
    display_name_zh: Optional[str] = None
    display_name_en: Optional[str] = None
    is_global: Optional[bool] = None
    is_active: Optional[bool] = None
    category: Optional[str] = None


class ReportCalculatedField(ReportCalculatedFieldBase):
    id: int
    created_by: Optional[int]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# 报表模板字段相关模型
class ReportTemplateFieldBase(BaseModel):
    field_name: str = Field(..., description="字段名")
    field_alias: Optional[str] = Field(None, description="字段别名")
    data_source: str = Field(..., description="数据源类型")
    field_type: str = Field(..., description="字段类型")
    display_order: int = Field(0, description="显示顺序")
    is_visible: bool = Field(True, description="是否可见")
    is_sortable: bool = Field(True, description="是否可排序")
    is_filterable: bool = Field(True, description="是否可筛选")
    width: Optional[int] = Field(None, description="列宽")
    formatting_config: Optional[Dict[str, Any]] = Field(None, description="格式化配置")
    calculation_formula: Optional[str] = Field(None, description="计算公式")


class ReportTemplateFieldCreate(ReportTemplateFieldBase):
    template_id: int = Field(..., description="模板ID")


class ReportTemplateFieldUpdate(BaseModel):
    field_name: Optional[str] = None
    field_alias: Optional[str] = None
    data_source: Optional[str] = None
    field_type: Optional[str] = None
    display_order: Optional[int] = None
    is_visible: Optional[bool] = None
    is_sortable: Optional[bool] = None
    is_filterable: Optional[bool] = None
    width: Optional[int] = None
    formatting_config: Optional[Dict[str, Any]] = None
    calculation_formula: Optional[str] = None


class ReportTemplateField(ReportTemplateFieldBase):
    id: int
    template_id: int

    class Config:
        from_attributes = True


# 报表模板相关模型
class ReportTemplateBase(BaseModel):
    name: str = Field(..., description="模板名称")
    title: Optional[str] = Field(None, description="自定义标题")
    description: Optional[str] = Field(None, description="描述")
    category: Optional[str] = Field(None, description="分类")
    data_source_id: Optional[int] = Field(None, description="数据源ID")
    template_config: Optional[Dict[str, Any]] = Field(None, description="模板配置")
    is_active: bool = Field(True, description="是否激活")
    is_public: bool = Field(False, description="是否公开")
    sort_order: int = Field(0, description="排序顺序")


class ReportTemplateCreate(ReportTemplateBase):
    fields: Optional[List[ReportTemplateFieldBase]] = Field([], description="字段列表")


class ReportTemplateUpdate(BaseModel):
    name: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    data_source_id: Optional[int] = None
    template_config: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None
    is_public: Optional[bool] = None
    sort_order: Optional[int] = None


class ReportTemplate(ReportTemplateBase):
    id: int
    usage_count: int
    created_by: Optional[int]
    created_at: datetime
    updated_at: datetime
    fields: List[ReportTemplateField] = []

    class Config:
        from_attributes = True


# 报表执行相关模型
class ReportExecutionBase(BaseModel):
    template_id: int = Field(..., description="模板ID")
    execution_params: Optional[Dict[str, Any]] = Field(None, description="执行参数")


class ReportExecutionCreate(ReportExecutionBase):
    pass


class ReportExecution(ReportExecutionBase):
    id: int
    status: str
    result_count: Optional[int]
    execution_time: Optional[Decimal]
    error_message: Optional[str]
    file_path: Optional[str]
    executed_by: Optional[int]
    executed_at: datetime

    class Config:
        from_attributes = True


# 报表查询和响应模型
class ReportQuery(BaseModel):
    template_id: int = Field(..., description="模板ID")
    filters: Optional[Dict[str, Any]] = Field(None, description="筛选条件")
    sort_by: Optional[str] = Field(None, description="排序字段")
    sort_order: Optional[str] = Field("asc", description="排序方向")
    page: int = Field(1, description="页码")
    page_size: int = Field(20, description="每页大小")


class ReportData(BaseModel):
    columns: List[Dict[str, Any]] = Field(..., description="列定义")
    data: List[Dict[str, Any]] = Field(..., description="数据行")
    total: int = Field(..., description="总数量")
    page: int = Field(..., description="当前页")
    page_size: int = Field(..., description="每页大小")


# 数据源字段检测模型
class DataSourceFieldDetection(BaseModel):
    table_name: str = Field(..., description="表名")
    schema_name: str = Field("public", description="模式名")


class DetectedField(BaseModel):
    field_name: str
    field_type: str
    is_nullable: bool
    comment: Optional[str] = None 