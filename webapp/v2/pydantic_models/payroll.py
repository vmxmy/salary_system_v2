"""
工资相关的Pydantic模型。
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import date, datetime
from decimal import Decimal

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


class PayrollPeriod(PayrollPeriodBase):
    """工资周期响应模型"""
    id: int = Field(..., description="Primary key")

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
    pass


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
    meta: Dict[str, Any] = Field(
        default_factory=lambda: {"page": 1, "size": 10, "total": 0, "totalPages": 1}
    )
