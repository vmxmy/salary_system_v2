"""
工资相关的Pydantic模型。
"""
from pydantic import BaseModel, Field, computed_field
from typing import Optional, List, Dict, Any, Literal, ForwardRef
from datetime import date, datetime
from decimal import Decimal

# 导入LookupValue模型
from .config import LookupValue

# Helper model for detail items in create/update payloads
class PayrollItemInput(BaseModel):
    amount: Decimal = Field(..., description="金额")
    # name 字段不应由客户端提供，由后端根据 code 从配置中填充

# PayrollPeriod Models
class PayrollPeriodBase(BaseModel):
    """工资周期基础模型"""
    name: str = Field(..., description="Payroll period name (e.g., 2024-01 Monthly)")
    start_date: date = Field(..., description="Period start date")
    end_date: date = Field(..., description="Period end date")
    pay_date: date = Field(..., description="Date when payment is scheduled/made")
    frequency_lookup_value_id: int = Field(..., description="Foreign key to pay frequency lookup value")
    status_lookup_value_id: Optional[int] = Field(None, description="Foreign key to status lookup value")


class PayrollPeriodCreate(PayrollPeriodBase):
    """创建工资周期模型"""
    pass


class PayrollPeriodUpdate(BaseModel):
    """更新工资周期模型"""
    name: Optional[str] = Field(None, description="Payroll period name (e.g., 2024-01 Monthly)")
    start_date: Optional[date] = Field(None, description="Period start date")
    end_date: Optional[date] = Field(None, description="Period end date")
    pay_date: Optional[date] = Field(None, description="Date when payment is scheduled/made")
    frequency_lookup_value_id: Optional[int] = Field(None, description="Foreign key to pay frequency lookup value")
    status_lookup_value_id: Optional[int] = Field(None, description="Foreign key to status lookup value")


class PayrollPeriod(PayrollPeriodBase):
    """工资周期响应模型"""
    id: int = Field(..., description="Primary key")
    
    # 添加状态关联对象 - 字段名与数据库模型保持一致
    status_lookup: Optional[LookupValue] = Field(None, description="Status lookup value details")
    
    @classmethod
    def from_orm(cls, db_obj):
        """从ORM模型创建Pydantic模型实例"""
        # 不再需要旧字段兼容处理，直接调用父类方法
        return super().from_orm(db_obj)

    class Config:
        from_attributes = True


class PayrollPeriodListResponse(BaseModel):
    """工资周期列表响应模型"""
    data: List[PayrollPeriod]
    meta: Dict[str, Any] = Field(
        default_factory=lambda: {"page": 1, "size": 10, "total": 0, "totalPages": 1}
    )


# PayrollRun Models
class PayrollRunBase(BaseModel):
    """工资运行批次基础模型"""
    payroll_period_id: int = Field(..., description="Foreign key to the payroll period")
    status_lookup_value_id: int = Field(..., description="Foreign key to run status lookup value")
    initiated_by_user_id: Optional[int] = Field(None, description="Foreign key to user who initiated the run")
    total_employees: Optional[int] = Field(None, description="Total number of employees processed in this run")
    total_net_pay: Optional[Decimal] = Field(None, description="Total net pay amount for this run")


class PayrollRunCreate(PayrollRunBase):
    """创建工资运行批次模型"""
    pass


class PayrollRunUpdate(BaseModel):
    """更新工资运行批次模型"""
    payroll_period_id: Optional[int] = Field(None, description="Foreign key to the payroll period")
    status_lookup_value_id: Optional[int] = Field(None, description="Foreign key to run status lookup value")
    initiated_by_user_id: Optional[int] = Field(None, description="Foreign key to user who initiated the run")
    total_employees: Optional[int] = Field(None, description="Total number of employees processed in this run")
    total_net_pay: Optional[Decimal] = Field(None, description="Total net pay amount for this run")


class PayrollRunPatch(BaseModel):
    """部分更新工资运行批次模型 (for PATCH operations)"""
    payroll_period_id: Optional[int] = Field(None, description="Foreign key to the payroll period")
    status_lookup_value_id: Optional[int] = Field(None, description="Foreign key to run status lookup value")
    initiated_by_user_id: Optional[int] = Field(None, description="Foreign key to user who initiated the run")
    total_employees: Optional[int] = Field(None, description="Total number of employees processed in this run")
    total_net_pay: Optional[Decimal] = Field(None, description="Total net pay amount for this run")


class PayrollRun(PayrollRunBase):
    """工资运行批次响应模型"""
    id: int = Field(..., description="Primary key")
    run_date: datetime = Field(..., description="Timestamp of the payroll run execution")
    
    # 添加关联对象
    payroll_period: Optional['PayrollPeriod'] = Field(None, description="Associated payroll period details")
    status: Optional[LookupValue] = Field(None, description="Status lookup value details")

    class Config:
        from_attributes = True


class PayrollRunListResponse(BaseModel):
    """工资运行批次列表响应模型"""
    data: List[PayrollRun]
    meta: Dict[str, Any] = Field(
        default_factory=lambda: {"page": 1, "size": 10, "total": 0, "totalPages": 1}
    )


# PayrollEntry Models
class PayrollEntryBase(BaseModel):
    """工资明细基础模型"""
    employee_id: int = Field(..., description="Foreign key to employees")
    payroll_period_id: int = Field(..., description="Foreign key to the payroll period")
    payroll_run_id: int = Field(..., description="Foreign key to the specific payroll run this result belongs to")
    gross_pay: Decimal = Field(0, description="Total gross pay (應發合計)")
    total_deductions: Decimal = Field(0, description="Total deductions (應扣合計)")
    net_pay: Decimal = Field(0, description="Total net pay (實發合計)")
    earnings_details: Dict[str, PayrollItemInput] = Field({}, description="收入项详情, e.g., {'SALARY': {'amount': 5000}}")
    deductions_details: Dict[str, PayrollItemInput] = Field({}, description="扣除项详情, e.g., {'TAX': {'amount': 500}}")
    calculation_inputs: Optional[Dict[str, Any]] = Field(None, description="Optional JSONB for storing calculation input values")
    calculation_log: Optional[Dict[str, Any]] = Field(None, description="Optional JSONB for storing calculation log/details")
    status_lookup_value_id: int = Field(..., description="Foreign key to payroll entry status")
    remarks: Optional[str] = Field(None, description="Remarks for this payroll entry")


class PayrollEntryCreate(PayrollEntryBase):
    """创建工资明细模型"""
    # 可选的员工匹配信息，用于批量导入时根据姓名+身份证匹配员工
    employee_info: Optional[Dict[str, str]] = Field(None, description="员工匹配信息，包含last_name, first_name, id_number")


class PayrollEntryUpdate(BaseModel):
    """更新工资明细模型"""
    employee_id: Optional[int] = Field(None, description="Foreign key to employees")
    payroll_period_id: Optional[int] = Field(None, description="Foreign key to the payroll period")
    payroll_run_id: Optional[int] = Field(None, description="Foreign key to the specific payroll run this result belongs to")
    gross_pay: Optional[Decimal] = Field(None, description="Total gross pay (應發合計)")
    total_deductions: Optional[Decimal] = Field(None, description="Total deductions (應扣合計)")
    net_pay: Optional[Decimal] = Field(None, description="Total net pay (實發合計)")
    earnings_details: Optional[Dict[str, PayrollItemInput]] = Field(None, description="收入项详情")
    deductions_details: Optional[Dict[str, PayrollItemInput]] = Field(None, description="扣除项详情")
    calculation_inputs: Optional[Dict[str, Any]] = Field(None, description="Optional JSONB for storing calculation input values")
    calculation_log: Optional[Dict[str, Any]] = Field(None, description="Optional JSONB for storing calculation log/details")
    status_lookup_value_id: Optional[int] = Field(None, description="Foreign key to payroll entry status")
    remarks: Optional[str] = Field(None, description="Remarks for this payroll entry")


class PayrollEntryPatch(BaseModel):
    """部分更新工资明细模型 (for PATCH operations)"""
    employee_id: Optional[int] = Field(None, description="Foreign key to employees")
    payroll_period_id: Optional[int] = Field(None, description="Foreign key to the payroll period")
    payroll_run_id: Optional[int] = Field(None, description="Foreign key to the specific payroll run this result belongs to")
    gross_pay: Optional[Decimal] = Field(None, description="Total gross pay (應發合計)")
    total_deductions: Optional[Decimal] = Field(None, description="Total deductions (應扣合計)")
    net_pay: Optional[Decimal] = Field(None, description="Total net pay (實發合計)")
    earnings_details: Optional[Dict[str, PayrollItemInput]] = Field(None, description="收入项详情, partial updates allowed")
    deductions_details: Optional[Dict[str, PayrollItemInput]] = Field(None, description="扣除项详情, partial updates allowed")
    calculation_inputs: Optional[Dict[str, Any]] = Field(None, description="Optional JSONB for storing calculation input values")
    calculation_log: Optional[Dict[str, Any]] = Field(None, description="Optional JSONB for storing calculation log/details")
    status_lookup_value_id: Optional[int] = Field(None, description="Foreign key to payroll entry status")
    remarks: Optional[str] = Field(None, description="Remarks for this payroll entry")


class PayrollEntry(PayrollEntryBase):
    """工资明细响应模型"""
    id: int = Field(..., description="Primary key")
    calculated_at: datetime = Field(..., description="Timestamp when this entry was calculated")
    employee_name: Optional[str] = Field(None, description="Employee full name (last_name + first_name)")
    
    # For response, details will include name and amount
    earnings_details: Dict[str, Any] = Field({}, description="JSONB object storing individual earning items with name and amount")
    deductions_details: Dict[str, Any] = Field({}, description="JSONB object storing individual deduction items with name and amount")

    class Config:
        from_attributes = True


class PayrollEntryListResponse(BaseModel):
    """工资明细列表响应模型"""
    data: List[PayrollEntry]
    meta: Optional[Dict[str, Any]] = None


# 批量导入相关模型
class BulkCreatePayrollEntriesPayload(BaseModel):
    """批量创建工资明细的请求模型"""
    payroll_period_id: int = Field(..., description="工资周期ID")
    entries: List[PayrollEntryCreate] = Field(..., description="工资明细列表")
    overwrite_mode: bool = Field(False, description="是否启用覆盖模式，允许更新已存在的工资明细")

class BulkCreatePayrollEntriesResult(BaseModel):
    """批量创建工资明细的响应模型"""
    success_count: int = Field(..., description="成功创建的记录数")
    error_count: int = Field(..., description="失败的记录数")
    errors: List[Dict[str, Any]] = Field([], description="错误详情列表")
    created_entries: List[PayrollEntry] = Field([], description="成功创建的工资明细列表")


# PayrollComponentDefinition Models
class PayrollComponentDefinitionBase(BaseModel):
    """薪资组件定义基础模型"""
    code: str = Field(..., description="组件唯一编码，如'BASIC_SALARY'，'HOUSING_ALLOWANCE'")
    name: str = Field(..., description="显示名称，如'基本工资'，'住房津贴'")
    type: Literal["EARNING", "DEDUCTION", "PERSONAL_DEDUCTION", "EMPLOYER_DEDUCTION", 
                 "BENEFIT", "STATUTORY", "STAT", "OTHER",
                 "CALCULATION_BASE", "CALCULATION_RATE", "CALCULATION_RESULT", "TAX"] = Field(..., description="组件类型")
    calculation_method: Optional[str] = Field(None, description="计算方法代码")
    calculation_parameters: Optional[Dict[str, Any]] = Field(None, description="计算参数")
    is_taxable: bool = Field(..., description="是否应税")
    is_social_security_base: bool = Field(..., description="是否计入社保基数")
    is_housing_fund_base: bool = Field(..., description="是否计入公积金基数")
    display_order: int = Field(..., description="显示顺序")
    is_active: bool = Field(..., description="是否启用")
    effective_date: date = Field(..., description="生效日期")
    end_date: Optional[date] = Field(None, description="结束日期")


class PayrollComponentDefinitionCreate(PayrollComponentDefinitionBase):
    """创建薪资组件定义模型"""
    pass


class PayrollComponentDefinitionUpdate(BaseModel):
    """更新薪资组件定义模型"""
    code: Optional[str] = Field(None, description="组件唯一编码")
    name: Optional[str] = Field(None, description="显示名称")
    type: Optional[Literal["EARNING", "DEDUCTION", "PERSONAL_DEDUCTION", "EMPLOYER_DEDUCTION", 
                         "BENEFIT", "STATUTORY", "STAT", "OTHER",
                         "CALCULATION_BASE", "CALCULATION_RATE", "CALCULATION_RESULT", "TAX"]] = Field(None, description="组件类型")
    calculation_method: Optional[str] = Field(None, description="计算方法代码")
    calculation_parameters: Optional[Dict[str, Any]] = Field(None, description="计算参数")
    is_taxable: Optional[bool] = Field(None, description="是否应税")
    is_social_security_base: Optional[bool] = Field(None, description="是否计入社保基数")
    is_housing_fund_base: Optional[bool] = Field(None, description="是否计入公积金基数")
    display_order: Optional[int] = Field(None, description="显示顺序")
    is_active: Optional[bool] = Field(None, description="是否启用")
    effective_date: Optional[date] = Field(None, description="生效日期")
    end_date: Optional[date] = Field(None, description="结束日期")


class PayrollComponentDefinition(PayrollComponentDefinitionBase):
    """薪资组件定义响应模型"""
    id: int = Field(..., description="主键ID")
    # 前端需要的额外字段
    data_type: Literal["numeric", "percentage", "boolean", "string"] = Field("numeric", description="数据类型")
    is_fixed: bool = Field(False, description="是否为固定值")
    is_employee_specific: bool = Field(True, description="是否员工特定")
    description: Optional[str] = Field(None, description="详细描述")
    calculation_logic: Optional[str] = Field(None, description="计算逻辑")
    created_at: Optional[datetime] = Field(None, description="创建时间")
    updated_at: Optional[datetime] = Field(None, description="更新时间")

    @computed_field
    @property
    def is_enabled(self) -> bool:
        """是否启用，等同于is_active"""
        return self.is_active

    @computed_field
    @property
    def sort_order(self) -> int:
        """排序顺序，等同于display_order"""
        return self.display_order
    
    class Config:
        from_attributes = True
        
    # @classmethod
    # def from_db_model(cls, db_model): # Comment out or remove existing from_db_model
    #     """将数据库模型转换为Pydantic模型"""
    #     data = {
    #         "id": db_model.id,
    #         "code": db_model.code,
    #         "name": db_model.name,
    #         "type": db_model.type,
    #         "calculation_method": db_model.calculation_method,
    #         "calculation_parameters": db_model.calculation_parameters,
    #         "is_taxable": db_model.is_taxable,
    #         "is_social_security_base": db_model.is_social_security_base,
    #         "is_housing_fund_base": db_model.is_housing_fund_base,
    #         "effective_date": db_model.effective_date,
    #         "end_date": db_model.end_date,
    #         "display_order": db_model.display_order, 
    #         "is_active": db_model.is_active,      
    #         # "is_enabled": db_model.is_active, # No longer needed here
    #         # "sort_order": db_model.display_order, # No longer needed here
    #         "data_type": getattr(db_model, 'data_type', "numeric"), 
    #         "is_fixed": getattr(db_model, 'is_fixed', False),
    #         "is_employee_specific": getattr(db_model, 'is_employee_specific', True),
    #         "description": getattr(db_model, 'description', None),
    #         "calculation_logic": getattr(db_model, 'calculation_logic', None),
    #         "created_at": getattr(db_model, 'created_at', None),
    #         "updated_at": getattr(db_model, 'updated_at', None),
    #     }
    #     return cls(**data)


class PayrollComponentDefinitionListResponse(BaseModel):
    """薪资组件定义列表响应模型"""
    data: List[PayrollComponentDefinition]
    meta: Dict[str, Any] = Field(
        default_factory=lambda: {"page": 1, "size": 10, "total": 0, "totalPages": 1}
    )
