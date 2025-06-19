"""
配置相关的Pydantic模型。
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Literal
from datetime import date, datetime

# LookupType Models
class LookupTypeBase(BaseModel):
    """查找类型基础模型"""
    code: str = Field(..., description="Unique code for the lookup type")
    name: str = Field(..., description="Human-readable name for the lookup type")
    description: Optional[str] = Field(None, description="Description of the lookup type")


class LookupTypeCreate(LookupTypeBase):
    """创建查找类型模型"""
    pass


class LookupTypeUpdate(BaseModel):
    """更新查找类型模型"""
    code: Optional[str] = Field(None, description="Unique code for the lookup type")
    name: Optional[str] = Field(None, description="Human-readable name for the lookup type")
    description: Optional[str] = Field(None, description="Description of the lookup type")


class LookupType(LookupTypeBase):
    """查找类型响应模型"""
    id: int = Field(..., description="Primary key")

    class Config:
        from_attributes = True


class LookupTypeListResponse(BaseModel):
    """查找类型列表响应模型"""
    data: List[LookupType]
    meta: Dict[str, Any] = Field(
        default_factory=lambda: {"page": 1, "size": 10, "total": 0, "totalPages": 1}
    )


# LookupValue Models
class LookupValueBase(BaseModel):
    """查找值基础模型"""
    lookup_type_id: int = Field(..., description="Foreign key to lookup_types")
    code: str = Field(..., description="Unique code for the lookup value within its type")
    name: str = Field(..., description="Human-readable name for the lookup value")
    description: Optional[str] = Field(None, description="Description of the lookup value")
    sort_order: int = Field(0, description="Order for displaying values")
    is_active: bool = Field(True, description="Whether the lookup value is active")
    parent_lookup_value_id: Optional[int] = Field(None, description="Foreign key to parent lookup value in the same type for hierarchical relationships")


class LookupValueCreate(LookupValueBase):
    """创建查找值模型"""
    pass


class LookupValueUpdate(BaseModel):
    """更新查找值模型"""
    lookup_type_id: Optional[int] = Field(None, description="Foreign key to lookup_types")
    code: Optional[str] = Field(None, description="Unique code for the lookup value within its type")
    name: Optional[str] = Field(None, description="Human-readable name for the lookup value")
    description: Optional[str] = Field(None, description="Description of the lookup value")
    sort_order: Optional[int] = Field(None, description="Order for displaying values")
    is_active: Optional[bool] = Field(None, description="Whether the lookup value is active")
    parent_lookup_value_id: Optional[int] = Field(None, description="Foreign key to parent lookup value in the same type for hierarchical relationships")


class LookupValue(LookupValueBase):
    """查找值响应模型"""
    id: int = Field(..., description="Primary key")
    lookup_type: Optional[LookupType] = Field(None, description="Lookup type")
    parent: Optional["LookupValue"] = Field(None, description="Parent lookup value, if any")
    children: Optional[List["LookupValue"]] = Field(None, description="Child lookup values, if any")

    class Config:
        from_attributes = True


LookupValue.update_forward_refs()


class LookupValueListResponse(BaseModel):
    """查找值列表响应模型"""
    data: List[LookupValue]
    meta: Dict[str, Any] = Field(
        default_factory=lambda: {"page": 1, "size": 10, "total": 0, "totalPages": 1}
    )


# SystemParameter Models
class SystemParameterBase(BaseModel):
    """系统参数基础模型"""
    key: str = Field(..., description="Unique parameter key")
    value: str = Field(..., description="Parameter value")
    description: Optional[str] = Field(None, description="Description of the parameter")


class SystemParameterCreate(SystemParameterBase):
    """创建系统参数模型"""
    pass


class SystemParameterUpdate(BaseModel):
    """更新系统参数模型"""
    key: Optional[str] = Field(None, description="Unique parameter key")
    value: Optional[str] = Field(None, description="Parameter value")
    description: Optional[str] = Field(None, description="Description of the parameter")


class SystemParameter(SystemParameterBase):
    """系统参数响应模型"""
    id: int = Field(..., description="Primary key")

    class Config:
        from_attributes = True


class SystemParameterListResponse(BaseModel):
    """系统参数列表响应模型"""
    data: List[SystemParameter]
    meta: Dict[str, Any] = Field(
        default_factory=lambda: {"page": 1, "size": 10, "total": 0, "totalPages": 1}
    )


# PayrollComponentDefinition Models
class PayrollComponentDefinitionBase(BaseModel):
    """工资组件定义基础模型"""
    code: str = Field(..., description="Unique code for the component")
    name: str = Field(..., description="Name of the component (e.g., Basic Salary, Income Tax)")
    type: Literal["EARNING", "DEDUCTION", "PERSONAL_DEDUCTION", "EMPLOYER_DEDUCTION", 
                 "BENEFIT", "STATUTORY", "STAT", "OTHER",
                 "CALCULATION_BASE", "CALCULATION_RATE", "CALCULATION_RESULT", "TAX"] = Field(..., description="Component type")
    calculation_method: Optional[str] = Field(None, description="Method used for calculation (e.g., FixedAmount, Percentage, Formula)")
    calculation_parameters: Optional[Dict[str, Any]] = Field(None, description="Parameters for the calculation method")
    is_taxable: bool = Field(True, description="Whether this component is subject to income tax")
    is_social_security_base: bool = Field(False, description="Whether this component contributes to social security base")
    is_housing_fund_base: bool = Field(False, description="Whether this component contributes to housing fund base")
    display_order: int = Field(0, description="Order for displaying on payslip")
    is_active: bool = Field(True, description="Whether this component is active")
    effective_date: date = Field(..., description="Definition effective date")
    end_date: Optional[date] = Field(None, description="Definition end date")


class PayrollComponentDefinitionCreate(PayrollComponentDefinitionBase):
    """创建薪资组件定义模型"""
    
    class Config:
        title = "PayrollComponentCreate"


class PayrollComponentDefinitionUpdate(BaseModel):
    """更新薪资组件定义模型 - 与Base对齐，所有字段可选"""
    code: Optional[str] = Field(None, description="Unique code for the component")
    name: Optional[str] = Field(None, description="Name of the component")
    type: Optional[Literal["EARNING", "DEDUCTION", "PERSONAL_DEDUCTION", "EMPLOYER_DEDUCTION", 
                             "BENEFIT", "STATUTORY", "STAT", "OTHER",
                             "CALCULATION_BASE", "CALCULATION_RATE", "CALCULATION_RESULT", "TAX"]] = Field(None, description="Component type")
    calculation_method: Optional[str] = Field(None, description="Method used for calculation")
    calculation_parameters: Optional[Dict[str, Any]] = Field(None, description="Parameters for the calculation method")
    is_taxable: Optional[bool] = Field(None, description="Whether this component is subject to income tax")
    is_social_security_base: Optional[bool] = Field(None, description="Whether this component contributes to social security base")
    is_housing_fund_base: Optional[bool] = Field(None, description="Whether this component contributes to housing fund base")
    display_order: Optional[int] = Field(None, description="Order for displaying on payslip")
    is_active: Optional[bool] = Field(None, description="Whether this component is active")
    effective_date: Optional[date] = Field(None, description="Definition effective date")
    end_date: Optional[date] = Field(None, description="Definition end date")
    description: Optional[str] = Field(None, description="Component description")
    
    class Config:
        title = "PayrollComponentUpdate"


class PayrollComponentDefinition(PayrollComponentDefinitionBase):
    """薪资组件定义响应模型"""
    id: int = Field(..., description="Primary key")

    # Resolved related objects
    created_by_user: Optional[dict] = Field(None, description="User who created this definition")

    class Config:
        from_attributes = True
        title = "PayrollComponent"


class PayrollComponentDefinitionListResponse(BaseModel):
    """薪资组件定义列表响应模型"""
    data: List[PayrollComponentDefinition]
    meta: Dict[str, Any] = Field(
        default_factory=lambda: {"page": 1, "size": 10, "total": 0, "totalPages": 1}
    )

    class Config:
        from_attributes = True
        title = "PayrollComponentList"


# TaxBracket Models
class TaxBracketBase(BaseModel):
    """税率档位基础模型"""
    region_code: str = Field(..., description="Region code (e.g., country or province code)")
    tax_type: str = Field(..., description="Tax type (e.g., Individual Income Tax, Corporate Tax)")
    income_range_start: float = Field(..., description="Start of income range for this bracket")
    income_range_end: Optional[float] = Field(None, description="End of income range for this bracket (null for highest bracket)")
    tax_rate: float = Field(..., description="Tax rate for this bracket (e.g., 0.03 for 3%)")
    quick_deduction: float = Field(0, description="Quick deduction amount for this bracket")
    effective_date: date = Field(..., description="Date when this tax bracket becomes effective")
    end_date: Optional[date] = Field(None, description="Date when this tax bracket expires (null if still active)")


class TaxBracketCreate(TaxBracketBase):
    """创建税率档位模型"""
    pass


class TaxBracketUpdate(BaseModel):
    """更新税率档位模型"""
    region_code: Optional[str] = Field(None, description="Region code (e.g., country or province code)")
    tax_type: Optional[str] = Field(None, description="Tax type (e.g., Individual Income Tax, Corporate Tax)")
    income_range_start: Optional[float] = Field(None, description="Start of income range for this bracket")
    income_range_end: Optional[float] = Field(None, description="End of income range for this bracket (null for highest bracket)")
    tax_rate: Optional[float] = Field(None, description="Tax rate for this bracket (e.g., 0.03 for 3%)")
    quick_deduction: Optional[float] = Field(None, description="Quick deduction amount for this bracket")
    effective_date: Optional[date] = Field(None, description="Date when this tax bracket becomes effective")
    end_date: Optional[date] = Field(None, description="Date when this tax bracket expires (null if still active)")


class TaxBracket(TaxBracketBase):
    """税率档位响应模型"""
    id: int = Field(..., description="Primary key")

    class Config:
        from_attributes = True


class TaxBracketListResponse(BaseModel):
    """税率档位列表响应模型"""
    data: List[TaxBracket]
    meta: Dict[str, Any] = Field(
        default_factory=lambda: {"page": 1, "size": 10, "total": 0, "totalPages": 1}
    )


# SocialSecurityRate Models
class SocialSecurityRateBase(BaseModel):
    """社保费率基础模型"""
    region_code: str = Field(..., description="Region code (e.g., country or province code)")
    contribution_type: str = Field(..., description="Contribution type (e.g., Pension, Medical, Unemployment)")
    participant_type: str = Field(..., description="Participant type (Employee or Employer)")
    rate: float = Field(..., description="Contribution rate (e.g., 0.08 for 8%)")
    base_min: Optional[float] = Field(None, description="Minimum base amount for calculation")
    base_max: Optional[float] = Field(None, description="Maximum base amount for calculation")
    fixed_amount: float = Field(0, description="Fixed amount contribution (if applicable)")
    effective_date: date = Field(..., description="Date when this rate becomes effective")
    end_date: Optional[date] = Field(None, description="Date when this rate expires (null if still active)")


class SocialSecurityRateCreate(SocialSecurityRateBase):
    """创建社保费率模型"""
    pass


class SocialSecurityRateUpdate(BaseModel):
    """更新社保费率模型"""
    region_code: Optional[str] = Field(None, description="Region code (e.g., country or province code)")
    contribution_type: Optional[str] = Field(None, description="Contribution type (e.g., Pension, Medical, Unemployment)")
    participant_type: Optional[str] = Field(None, description="Participant type (Employee or Employer)")
    rate: Optional[float] = Field(None, description="Contribution rate (e.g., 0.08 for 8%)")
    base_min: Optional[float] = Field(None, description="Minimum base amount for calculation")
    base_max: Optional[float] = Field(None, description="Maximum base amount for calculation")
    fixed_amount: Optional[float] = Field(None, description="Fixed amount contribution (if applicable)")
    effective_date: Optional[date] = Field(None, description="Date when this rate becomes effective")
    end_date: Optional[date] = Field(None, description="Date when this rate expires (null if still active)")


class SocialSecurityRate(SocialSecurityRateBase):
    """社保费率响应模型"""
    id: int = Field(..., description="Primary key")

    class Config:
        from_attributes = True


class SocialSecurityRateListResponse(BaseModel):
    """社保费率列表响应模型"""
    data: List[SocialSecurityRate]
    meta: Dict[str, Any] = Field(
        default_factory=lambda: {"page": 1, "size": 10, "total": 0, "totalPages": 1}
    )


# 报表管理相关模型
class ReportTemplateBase(BaseModel):
    """报表模板基础模型"""
    name: str = Field(..., description="报表名称", max_length=255)
    title: Optional[str] = Field(None, description="自定义标题", max_length=500)
    description: Optional[str] = Field(None, description="报表描述")
    category: Optional[str] = Field(None, description="报表分类", max_length=100)
    template_config: Dict[str, Any] = Field(..., description="报表配置JSON")
    is_active: bool = Field(True, description="是否激活")
    is_public: bool = Field(False, description="是否公开模板")
    sort_order: int = Field(0, description="排序顺序")


class ReportTemplateCreate(ReportTemplateBase):
    """创建报表模板请求模型"""
    pass


class ReportTemplateUpdate(BaseModel):
    """更新报表模板请求模型"""
    name: Optional[str] = Field(None, description="报表名称", max_length=255)
    title: Optional[str] = Field(None, description="自定义标题", max_length=500)
    description: Optional[str] = Field(None, description="报表描述")
    category: Optional[str] = Field(None, description="报表分类", max_length=100)
    template_config: Optional[Dict[str, Any]] = Field(None, description="报表配置JSON")
    is_active: Optional[bool] = Field(None, description="是否激活")
    is_public: Optional[bool] = Field(None, description="是否公开模板")
    sort_order: Optional[int] = Field(None, description="排序顺序")


class ReportTemplateResponse(ReportTemplateBase):
    """报表模板响应模型"""
    id: int = Field(..., description="模板ID")
    created_by: int = Field(..., description="创建者ID")
    created_at: datetime = Field(..., description="创建时间")
    updated_at: datetime = Field(..., description="更新时间")

    class Config:
        from_attributes = True


class ReportFieldBase(BaseModel):
    """报表字段基础模型"""
    field_name: str = Field(..., description="字段名称", max_length=255)
    field_alias: Optional[str] = Field(None, description="自定义字段别名", max_length=255)
    data_source: str = Field(..., description="数据源表名", max_length=255)
    field_type: str = Field(..., description="字段类型", max_length=50)
    display_order: int = Field(0, description="显示顺序")
    is_visible: bool = Field(True, description="是否可见")
    formatting_config: Optional[Dict[str, Any]] = Field(None, description="格式化配置")
    calculation_formula: Optional[str] = Field(None, description="计算公式")
    width: Optional[int] = Field(None, description="列宽度")
    is_sortable: bool = Field(True, description="是否可排序")
    is_filterable: bool = Field(True, description="是否可筛选")


class ReportFieldCreate(ReportFieldBase):
    """创建报表字段请求模型"""
    template_id: int = Field(..., description="报表模板ID")


class ReportFieldUpdate(BaseModel):
    """更新报表字段请求模型"""
    field_name: Optional[str] = Field(None, description="字段名称", max_length=255)
    field_alias: Optional[str] = Field(None, description="自定义字段别名", max_length=255)
    data_source: Optional[str] = Field(None, description="数据源表名", max_length=255)
    field_type: Optional[str] = Field(None, description="字段类型", max_length=50)
    display_order: Optional[int] = Field(None, description="显示顺序")
    is_visible: Optional[bool] = Field(None, description="是否可见")
    formatting_config: Optional[Dict[str, Any]] = Field(None, description="格式化配置")
    calculation_formula: Optional[str] = Field(None, description="计算公式")
    width: Optional[int] = Field(None, description="列宽度")
    is_sortable: Optional[bool] = Field(None, description="是否可排序")
    is_filterable: Optional[bool] = Field(None, description="是否可筛选")


class ReportFieldResponse(ReportFieldBase):
    """报表字段响应模型"""
    id: int = Field(..., description="字段ID")
    template_id: int = Field(..., description="报表模板ID")

    class Config:
        from_attributes = True


class CalculatedFieldBase(BaseModel):
    """计算字段基础模型"""
    name: str = Field(..., description="计算字段名称", max_length=255)
    alias: str = Field(..., description="字段别名", max_length=255)
    formula: str = Field(..., description="计算公式")
    return_type: str = Field(..., description="返回类型", max_length=50)
    description: Optional[str] = Field(None, description="字段描述")
    is_global: bool = Field(False, description="是否全局可用")
    is_active: bool = Field(True, description="是否激活")
    category: Optional[str] = Field(None, description="字段分类", max_length=100)


class CalculatedFieldCreate(CalculatedFieldBase):
    """创建计算字段请求模型"""
    pass


class CalculatedFieldUpdate(BaseModel):
    """更新计算字段请求模型"""
    name: Optional[str] = Field(None, description="计算字段名称", max_length=255)
    alias: Optional[str] = Field(None, description="字段别名", max_length=255)
    formula: Optional[str] = Field(None, description="计算公式")
    return_type: Optional[str] = Field(None, description="返回类型", max_length=50)
    description: Optional[str] = Field(None, description="字段描述")
    is_global: Optional[bool] = Field(None, description="是否全局可用")
    is_active: Optional[bool] = Field(None, description="是否激活")
    category: Optional[str] = Field(None, description="字段分类", max_length=100)


class CalculatedFieldResponse(CalculatedFieldBase):
    """计算字段响应模型"""
    id: int = Field(..., description="字段ID")
    created_by: int = Field(..., description="创建者ID")
    created_at: datetime = Field(..., description="创建时间")
    updated_at: datetime = Field(..., description="更新时间")

    class Config:
        from_attributes = True


class ReportDataSourceBase(BaseModel):
    """报表数据源基础模型"""
    name: str = Field(..., description="数据源名称", max_length=255)
    table_name: str = Field(..., description="数据表名", max_length=255)
    schema_name: str = Field(..., description="模式名", max_length=100)
    description: Optional[str] = Field(None, description="数据源描述")
    is_active: bool = Field(True, description="是否激活")
    sort_order: int = Field(0, description="排序顺序")
    access_permissions: Optional[Dict[str, Any]] = Field(None, description="访问权限配置")


class ReportDataSourceCreate(ReportDataSourceBase):
    """创建报表数据源请求模型"""
    pass


class ReportDataSourceUpdate(BaseModel):
    """更新报表数据源请求模型"""
    name: Optional[str] = Field(None, description="数据源名称", max_length=255)
    table_name: Optional[str] = Field(None, description="数据表名", max_length=255)
    schema_name: Optional[str] = Field(None, description="模式名", max_length=100)
    description: Optional[str] = Field(None, description="数据源描述")
    is_active: Optional[bool] = Field(None, description="是否激活")
    sort_order: Optional[int] = Field(None, description="排序顺序")
    access_permissions: Optional[Dict[str, Any]] = Field(None, description="访问权限配置")


class ReportDataSourceResponse(ReportDataSourceBase):
    """报表数据源响应模型"""
    id: int = Field(..., description="数据源ID")

    class Config:
        from_attributes = True


# 报表预览和生成相关模型
class ReportPreviewRequest(BaseModel):
    """报表预览请求模型"""
    template_id: Optional[int] = Field(None, description="模板ID")
    template_config: Optional[Dict[str, Any]] = Field(None, description="临时模板配置")
    filters: Optional[Dict[str, Any]] = Field(None, description="筛选条件")
    limit: int = Field(100, description="预览行数限制", ge=1, le=1000)


class ReportPreviewResponse(BaseModel):
    """报表预览响应模型"""
    columns: List[Dict[str, Any]] = Field(..., description="列定义")
    data: List[Dict[str, Any]] = Field(..., description="数据行")
    total_count: int = Field(..., description="总行数")
    preview_count: int = Field(..., description="预览行数")


class ReportExportRequest(BaseModel):
    """报表导出请求模型"""
    template_id: int = Field(..., description="模板ID")
    export_format: str = Field(..., description="导出格式", pattern="^(excel|csv|pdf)$")
    filters: Optional[Dict[str, Any]] = Field(None, description="筛选条件")
    filename: Optional[str] = Field(None, description="文件名")


# 数据源字段信息模型
class DataSourceFieldInfo(BaseModel):
    """数据源字段信息"""
    field_name: str = Field(..., description="字段名")
    field_type: str = Field(..., description="字段类型")
    is_nullable: bool = Field(..., description="是否可为空")
    comment: Optional[str] = Field(None, description="字段注释")


class DataSourceInfo(BaseModel):
    """数据源信息"""
    schema_name: str = Field(..., description="模式名")
    table_name: str = Field(..., description="表名")
    table_comment: Optional[str] = Field(None, description="表注释")
    fields: List[DataSourceFieldInfo] = Field(..., description="字段列表")


class ReportTemplateWithFields(ReportTemplateResponse):
    """包含字段的报表模板响应模型"""
    report_fields: List[ReportFieldResponse] = Field([], description="报表字段列表")
