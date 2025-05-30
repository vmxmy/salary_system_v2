from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from pydantic import BaseModel, Field, validator
from decimal import Decimal


# 数据源访问日志模型
class ReportDataSourceAccessLogBase(BaseModel):
    access_type: str = Field(..., description="访问类型")
    access_result: str = Field(..., description="访问结果")
    query_params: Optional[Dict[str, Any]] = Field(None, description="查询参数")
    result_count: Optional[int] = Field(None, description="返回记录数")
    execution_time: Optional[Decimal] = Field(None, description="执行时间")
    error_message: Optional[str] = Field(None, description="错误信息")
    ip_address: Optional[str] = Field(None, description="IP地址")
    user_agent: Optional[str] = Field(None, description="用户代理")


class ReportDataSourceAccessLog(ReportDataSourceAccessLogBase):
    id: int
    data_source_id: int
    user_id: int
    accessed_at: datetime
    
    class Config:
        from_attributes = True


# 数据源字段相关模型
class ReportDataSourceFieldBase(BaseModel):
    field_name: str = Field(..., description="原始字段名", max_length=100)
    field_alias: Optional[str] = Field(None, description="字段别名", max_length=100)
    field_type: str = Field(..., description="字段类型", max_length=50)
    data_type: Optional[str] = Field(None, description="数据库数据类型", max_length=50)
    
    # 显示配置
    display_name_zh: Optional[str] = Field(None, description="中文显示名称", max_length=200)
    display_name_en: Optional[str] = Field(None, description="英文显示名称", max_length=200)
    description: Optional[str] = Field(None, description="字段描述")
    
    # 字段属性
    is_nullable: bool = Field(True, description="是否可为空")
    is_primary_key: bool = Field(False, description="是否主键")
    is_foreign_key: bool = Field(False, description="是否外键")
    is_indexed: bool = Field(False, description="是否有索引")
    
    # 显示和权限控制
    is_visible: bool = Field(True, description="是否可见")
    is_searchable: bool = Field(True, description="是否可搜索")
    is_sortable: bool = Field(True, description="是否可排序")
    is_filterable: bool = Field(True, description="是否可筛选")
    is_exportable: bool = Field(True, description="是否可导出")
    
    # 分组和分类
    field_group: Optional[str] = Field(None, description="字段分组", max_length=50)
    field_category: Optional[str] = Field(None, description="字段分类", max_length=50)
    sort_order: int = Field(0, description="排序顺序")
    
    # 格式化配置
    format_config: Optional[Dict[str, Any]] = Field(None, description="格式化配置")
    validation_rules: Optional[Dict[str, Any]] = Field(None, description="验证规则")
    lookup_config: Optional[Dict[str, Any]] = Field(None, description="查找表配置")
    
    # 统计配置
    enable_aggregation: bool = Field(False, description="是否启用聚合")
    aggregation_functions: Optional[List[str]] = Field(None, description="可用聚合函数")


class ReportDataSourceFieldCreate(ReportDataSourceFieldBase):
    data_source_id: int = Field(..., description="数据源ID")


class ReportDataSourceFieldUpdate(BaseModel):
    field_alias: Optional[str] = Field(None, description="字段别名")
    display_name_zh: Optional[str] = Field(None, description="中文显示名称")
    display_name_en: Optional[str] = Field(None, description="英文显示名称")
    description: Optional[str] = Field(None, description="字段描述")
    is_visible: Optional[bool] = Field(None, description="是否可见")
    is_searchable: Optional[bool] = Field(None, description="是否可搜索")
    is_sortable: Optional[bool] = Field(None, description="是否可排序")
    is_filterable: Optional[bool] = Field(None, description="是否可筛选")
    is_exportable: Optional[bool] = Field(None, description="是否可导出")
    field_group: Optional[str] = Field(None, description="字段分组")
    field_category: Optional[str] = Field(None, description="字段分类")
    sort_order: Optional[int] = Field(None, description="排序顺序")
    format_config: Optional[Dict[str, Any]] = Field(None, description="格式化配置")
    validation_rules: Optional[Dict[str, Any]] = Field(None, description="验证规则")
    lookup_config: Optional[Dict[str, Any]] = Field(None, description="查找表配置")
    enable_aggregation: Optional[bool] = Field(None, description="是否启用聚合")
    aggregation_functions: Optional[List[str]] = Field(None, description="可用聚合函数")


class ReportDataSourceField(ReportDataSourceFieldBase):
    id: int
    data_source_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# 数据源相关模型
class ReportDataSourceBase(BaseModel):
    # 基础信息
    name: str = Field(..., description="数据源名称", max_length=200)
    code: str = Field(..., description="数据源编码", max_length=100)
    description: Optional[str] = Field(None, description="数据源描述")
    category: Optional[str] = Field(None, description="数据源分类", max_length=50)
    
    # 数据库连接信息
    connection_type: str = Field("postgresql", description="连接类型", max_length=50)
    schema_name: str = Field("public", description="模式名", max_length=100)
    table_name: Optional[str] = Field(None, description="表名", max_length=100)
    view_name: Optional[str] = Field(None, description="视图名", max_length=100)
    custom_query: Optional[str] = Field(None, description="自定义查询SQL")
    
    # 数据源类型
    source_type: str = Field("table", description="数据源类型")
    
    # 连接配置
    connection_config: Optional[Dict[str, Any]] = Field(None, description="连接配置信息")
    
    # 字段映射和配置
    field_mapping: Optional[Dict[str, Any]] = Field(None, description="字段映射配置")
    default_filters: Optional[Dict[str, Any]] = Field(None, description="默认筛选条件")
    sort_config: Optional[Dict[str, Any]] = Field(None, description="默认排序配置")
    
    # 权限和访问控制
    access_level: str = Field("public", description="访问级别")
    allowed_roles: Optional[List[str]] = Field(None, description="允许访问的角色列表")
    allowed_users: Optional[List[int]] = Field(None, description="允许访问的用户列表")
    
    # 缓存和性能配置
    cache_enabled: bool = Field(False, description="是否启用缓存")
    cache_duration: int = Field(3600, description="缓存时长(秒)")
    max_rows: int = Field(10000, description="最大返回行数")
    
    # 状态和显示
    is_active: bool = Field(True, description="是否激活")
    is_system: bool = Field(False, description="是否系统内置")
    sort_order: int = Field(0, description="排序顺序")
    tags: Optional[List[str]] = Field(None, description="标签")

    @validator('source_type')
    def validate_source_type(cls, v):
        allowed_types = ['table', 'view', 'query', 'procedure']
        if v not in allowed_types:
            raise ValueError(f'source_type must be one of {allowed_types}')
        return v

    @validator('access_level')
    def validate_access_level(cls, v):
        allowed_levels = ['public', 'private', 'restricted']
        if v not in allowed_levels:
            raise ValueError(f'access_level must be one of {allowed_levels}')
        return v


class ReportDataSourceCreate(ReportDataSourceBase):
    fields: Optional[List[ReportDataSourceFieldCreate]] = Field(default_factory=list, description="字段列表")


class ReportDataSourceUpdate(BaseModel):
    name: Optional[str] = Field(None, description="数据源名称", max_length=200)
    description: Optional[str] = Field(None, description="数据源描述")
    category: Optional[str] = Field(None, description="数据源分类")
    connection_type: Optional[str] = Field(None, description="连接类型")
    schema_name: Optional[str] = Field(None, description="模式名")
    table_name: Optional[str] = Field(None, description="表名")
    view_name: Optional[str] = Field(None, description="视图名")
    custom_query: Optional[str] = Field(None, description="自定义查询SQL")
    source_type: Optional[str] = Field(None, description="数据源类型")
    connection_config: Optional[Dict[str, Any]] = Field(None, description="连接配置信息")
    field_mapping: Optional[Dict[str, Any]] = Field(None, description="字段映射配置")
    default_filters: Optional[Dict[str, Any]] = Field(None, description="默认筛选条件")
    sort_config: Optional[Dict[str, Any]] = Field(None, description="默认排序配置")
    access_level: Optional[str] = Field(None, description="访问级别")
    allowed_roles: Optional[List[str]] = Field(None, description="允许访问的角色列表")
    allowed_users: Optional[List[int]] = Field(None, description="允许访问的用户列表")
    cache_enabled: Optional[bool] = Field(None, description="是否启用缓存")
    cache_duration: Optional[int] = Field(None, description="缓存时长(秒)")
    max_rows: Optional[int] = Field(None, description="最大返回行数")
    is_active: Optional[bool] = Field(None, description="是否激活")
    sort_order: Optional[int] = Field(None, description="排序顺序")
    tags: Optional[List[str]] = Field(None, description="标签")


class ReportDataSource(ReportDataSourceBase):
    id: int
    field_count: int = Field(0, description="字段数量")
    usage_count: int = Field(0, description="使用次数")
    last_used_at: Optional[datetime] = Field(None, description="最后使用时间")
    last_sync_at: Optional[datetime] = Field(None, description="最后同步时间")
    created_by: Optional[int] = Field(None, description="创建者ID")
    updated_by: Optional[int] = Field(None, description="更新者ID")
    created_at: datetime
    updated_at: datetime
    
    # 关联数据
    fields: Optional[List[ReportDataSourceField]] = Field(None, description="字段列表")

    class Config:
        from_attributes = True


# 字段检测相关模型
class DetectedField(BaseModel):
    field_name: str = Field(..., description="字段名")
    field_type: str = Field(..., description="字段类型")
    data_type: str = Field(..., description="数据库数据类型")
    is_nullable: bool = Field(True, description="是否可为空")
    is_primary_key: bool = Field(False, description="是否主键")
    is_foreign_key: bool = Field(False, description="是否外键")
    is_indexed: bool = Field(False, description="是否有索引")
    comment: Optional[str] = Field(None, description="字段注释")
    max_length: Optional[int] = Field(None, description="最大长度")
    default_value: Optional[str] = Field(None, description="默认值")


class DataSourceFieldDetection(BaseModel):
    schema_name: str = Field("public", description="模式名")
    table_name: Optional[str] = Field(None, description="表名")
    view_name: Optional[str] = Field(None, description="视图名")
    custom_query: Optional[str] = Field(None, description="自定义查询")
    connection_config: Optional[Dict[str, Any]] = Field(None, description="连接配置")


class DataSourceFieldDetectionResponse(BaseModel):
    fields: List[DetectedField] = Field(..., description="检测到的字段列表")
    total_count: int = Field(..., description="总字段数")
    table_info: Optional[Dict[str, Any]] = Field(None, description="表信息")


# 连接测试模型
class DataSourceConnectionTest(BaseModel):
    connection_type: str = Field(..., description="连接类型")
    connection_config: Dict[str, Any] = Field(..., description="连接配置")
    schema_name: Optional[str] = Field("public", description="模式名")
    table_name: Optional[str] = Field(None, description="测试表名")


class DataSourceConnectionTestResponse(BaseModel):
    success: bool = Field(..., description="连接是否成功")
    message: str = Field(..., description="连接结果消息")
    response_time: Optional[float] = Field(None, description="响应时间(毫秒)")
    table_count: Optional[int] = Field(None, description="可访问表数量")
    error_details: Optional[str] = Field(None, description="错误详情")


# 数据源统计模型
class DataSourceStatistics(BaseModel):
    data_source_id: int
    total_records: Optional[int] = Field(None, description="总记录数")
    last_record_time: Optional[datetime] = Field(None, description="最后记录时间")
    data_size: Optional[str] = Field(None, description="数据大小")
    index_count: Optional[int] = Field(None, description="索引数量")
    field_statistics: Optional[Dict[str, Any]] = Field(None, description="字段统计信息")


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


# Corresponds to frontend ReportField.formatting_config
class FormattingConfigPydantic(BaseModel):
    format_type: Optional[str] = None # 'number' | 'currency' | 'percentage' | 'date' | 'text'
    decimal_places: Optional[int] = None
    prefix: Optional[str] = None
    suffix: Optional[str] = None
    date_format: Optional[str] = None
    thousand_separator: Optional[bool] = None

    class Config:
        from_attributes = True

# Corresponds to frontend ReportField
class ReportFieldPydantic(BaseModel):
    id: str
    field_name: str
    field_alias: str
    data_source: str # This is the source_data_source_id in the frontend, needs careful mapping
    field_type: str
    display_order: int
    is_visible: bool
    is_sortable: bool
    is_filterable: bool
    width: Optional[int] = None
    formatting_config: Optional[FormattingConfigPydantic] = None
    calculation_formula: Optional[str] = None
    aggregation: Optional[str] = None # 'sum' | 'avg' | 'count' | 'min' | 'max'
    qualified_field_name: Optional[str] = None
    source_data_source_id: Optional[str] = None # Matches frontend type more directly
    # Frontend also has is_related_display and related_join_config, omitting for now for simplicity
    # but can be added if needed.

    class Config:
        from_attributes = True

# Corresponds to frontend DataSourceJoin
class DataSourceJoinPydantic(BaseModel):
    id: str
    left_data_source_id: str
    left_field_name: str
    right_data_source_id: str
    right_field_name: str
    join_type: str # 'inner' | 'left' | 'right' | 'full'
    condition: Optional[str] = None

    class Config:
        from_attributes = True

# New model for the structure of ReportTemplate.template_config
class ReportDesignerConfigPydantic(BaseModel):
    reportTitle: Optional[str] = None
    reportDescription: Optional[str] = None
    selectedDataSourceIds: List[str] = Field(default_factory=list)
    mainDataSourceId: Optional[str] = None # Keep this for now, might be redundant if selectedDataSourceIds[0] is always main
    joins: List[DataSourceJoinPydantic] = Field(default_factory=list)
    fields: List[ReportFieldPydantic] = Field(default_factory=list)
    multiSelectMode: bool = False
    version: int = 1

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
    data_source_id: Optional[int] = Field(None, description="主数据源ID, 关联到 report_data_sources.id")
    template_config: Optional[ReportDesignerConfigPydantic] = Field(None, description="报表设计器完整配置")
    is_active: bool = Field(True, description="是否激活")
    is_public: bool = Field(False, description="是否公开")
    sort_order: int = Field(0, description="排序顺序")


class ReportTemplateCreate(ReportTemplateBase):
    pass


class ReportTemplateUpdate(BaseModel):
    name: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    data_source_id: Optional[int] = None
    template_config: Optional[ReportDesignerConfigPydantic] = None
    is_active: Optional[bool] = None
    is_public: Optional[bool] = None
    sort_order: Optional[int] = None


class ReportTemplate(ReportTemplateBase):
    id: int
    usage_count: int
    created_by: Optional[int]
    created_at: datetime
    updated_at: datetime
    related_fields: List[ReportTemplateField] = Field([], alias="fields", description="通过外键关联的模板字段定义（可能与 template_config.fields 不同步）")

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


# New Pydantic model for listing report templates (summary view)
class ReportTemplateListItem(BaseModel):
    id: int
    name: str
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    is_public: bool
    updated_at: datetime
    created_by: Optional[int] = None # Or a User nested model if needed

    class Config:
        from_attributes = True 