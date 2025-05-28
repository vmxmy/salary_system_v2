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
    """更新薪资组件定义模型"""
    code: Optional[str] = Field(None, description="Component code, unique identifier")
    name: Optional[str] = Field(None, description="Component name")
    description: Optional[str] = Field(None, description="Component description")
    component_type: Optional[str] = Field(None, description="Component type, e.g., 'Earning', 'Deduction'")
    calculation_method: Optional[str] = Field(None, description="How the component value is calculated")
    calculation_formula: Optional[str] = Field(None, description="Formula or rules for calculating this component")
    unit_type: Optional[str] = Field(None, description="Unit type for this component (e.g., 'Amount', 'Percentage')")
    applies_to_employee_groups: Optional[str] = Field(None, description="Which employee groups this component applies to")
    tax_implications: Optional[str] = Field(None, description="Tax implications or treatment of this component")
    is_mandatory: Optional[bool] = Field(None, description="Whether this component is mandatory for payroll calculation")
    is_visible_to_employee: Optional[bool] = Field(None, description="Whether this component is visible to employees")
    is_active: Optional[bool] = Field(None, description="Whether this component definition is currently active")
    effective_date: Optional[date] = Field(None, description="Date when this component definition becomes effective")
    end_date: Optional[date] = Field(None, description="Date when this component definition expires")
    display_order: Optional[int] = Field(None, description="Order in which this component should be displayed")
    rounding_rule: Optional[str] = Field(None, description="Rules for rounding the calculated value")
    minimum_value: Optional[float] = Field(None, description="Minimum allowed value for this component")
    maximum_value: Optional[float] = Field(None, description="Maximum allowed value for this component")
    default_value: Optional[float] = Field(None, description="Default value for this component if not specified")
    approval_required: Optional[bool] = Field(None, description="Whether changes to this component require approval")
    created_by_user_id: Optional[int] = Field(None, description="ID of user who created this definition")
    
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
