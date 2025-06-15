"""
工资相关的Pydantic模型。
"""
from pydantic import BaseModel, Field, computed_field, validator
from typing import Optional, List, Dict, Any, Literal, ForwardRef, Union
from datetime import date, datetime
from decimal import Decimal
from enum import Enum

# 导入LookupValue模型
from .config import LookupValue
# 导入 EmployeeWithNames 模型
from .hr import EmployeeWithNames
from .common import PaginationResponse, PaginationMeta

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
    
    # 添加员工数统计字段
    employee_count: Optional[int] = Field(None, description="该期间的不重复员工数统计")
    
    @classmethod
    def from_orm(cls, db_obj):
        """从ORM模型创建Pydantic模型实例"""
        # 不再需要旧字段兼容处理，直接调用父类方法
        return super().from_orm(db_obj)

    class Config:
        from_attributes = True


class PayrollPeriodListResponse(PaginationResponse[PayrollPeriod]):
    """工资周期列表响应模型"""
    pass


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


class PayrollRunListResponse(PaginationResponse[PayrollRun]):
    """工资运行批次列表响应模型"""
    pass


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
    status_lookup_value_id: Optional[int] = Field(None, description="Foreign key to payroll entry status")
    remarks: Optional[str] = Field(None, description="Remarks for this payroll entry")


class PayrollEntryCreate(BaseModel):
    """创建工资明细模型"""
    # 员工ID可选，如果未提供则通过employee_info进行匹配
    employee_id: Optional[int] = Field(None, description="Foreign key to employees, optional for bulk import")
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
    calculated_at: Optional[datetime] = Field(None, description="Timestamp when this entry was calculated")
    
    # 添加关联对象
    payroll_run: Optional['PayrollRun'] = Field(None, description="Associated payroll run details")
    employee: Optional[EmployeeWithNames] = Field(None, description="Associated employee details with names")
    
    # 简化的员工信息字段（从数据库视图中直接提取）
    employee_code: Optional[str] = Field(None, description="员工编号")
    employee_name: Optional[str] = Field(None, description="员工姓名")
    first_name: Optional[str] = Field(None, description="名")
    last_name: Optional[str] = Field(None, description="姓")
    department_name: Optional[str] = Field(None, description="部门名称")
    personnel_category_name: Optional[str] = Field(None, description="人员类别名称")
    position_name: Optional[str] = Field(None, description="职位名称")
    
    # For response, details will include name and amount
    earnings_details: Dict[str, Any] = Field({}, description="JSONB object storing individual earning items with name and amount")
    deductions_details: Dict[str, Any] = Field({}, description="JSONB object storing individual deduction items with name and amount")

    class Config:
        from_attributes = True


class PayrollEntryListResponse(PaginationResponse[PayrollEntry]):
    """工资明细列表响应模型"""
    pass


# 新增：覆写模式枚举
class OverwriteMode(str, Enum):
    """覆写模式枚举"""
    NONE = "none"           # 不覆写，重复记录报错
    FULL = "full"           # 全量覆写，完全替换现有记录
    PARTIAL = "partial"     # 部分覆写，只更新导入的字段


# 批量导入相关模型
class BulkValidatePayrollEntriesPayload(BaseModel):
    """批量验证薪资明细的请求模型"""
    payroll_period_id: int = Field(..., description="薪资周期ID")
    entries: List[PayrollEntryCreate] = Field(..., description="待验证的薪资明细列表")
    overwrite_mode: OverwriteMode = Field(..., description="覆写模式")

class BulkValidatePayrollEntriesResult(BaseModel):
    """批量验证薪资明细的响应模型"""
    total: int = Field(..., description="总记录数")
    valid: int = Field(..., description="有效记录数")
    invalid: int = Field(..., description="无效记录数")
    warnings: int = Field(..., description="警告记录数")
    errors: List[str] = Field([], description="全局错误信息列表")
    validatedData: List[Dict[str, Any]] = Field([], description="验证后的数据列表，包含验证状态和错误信息")

class BulkCreatePayrollEntriesPayload(BaseModel):
    """批量创建工资明细的请求模型"""
    payroll_period_id: int = Field(..., description="工资周期ID")
    entries: List[PayrollEntryCreate] = Field(..., description="工资明细列表")
    overwrite_mode: OverwriteMode = Field(..., description="覆写模式")

class BulkCreatePayrollEntriesResult(BaseModel):
    """批量创建工资明细的响应模型"""
    success_count: int = Field(..., description="成功创建的记录数")
    error_count: int = Field(..., description="失败的记录数")
    errors: List[Dict[str, Any]] = Field([], description="错误详情列表")
    created_entries: List[PayrollEntry] = Field([], description="成功创建的工资明细列表")


# PayrollComponentDefinition Models
class PayrollComponentDefinitionBase(BaseModel):
    """薪资字段定义基础模型"""
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
    """创建薪资字段定义模型"""
    pass


class PayrollComponentDefinitionUpdate(BaseModel):
    """更新薪资字段定义模型"""
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
    """薪资字段定义响应模型"""
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


class PayrollComponentDefinitionListResponse(PaginationResponse[PayrollComponentDefinition]):
    """薪资字段定义列表响应模型"""
    pass


# 缴费基数批量导入相关模型
class SalaryBaseUpdate(BaseModel):
    """缴费基数更新模型"""
    employee_id: Optional[int] = Field(None, description="员工ID，可选，如果未提供则通过employee_info匹配")
    social_insurance_base: Optional[Decimal] = Field(None, description="社保缴费基数", ge=0)
    housing_fund_base: Optional[Decimal] = Field(None, description="公积金缴费基数", ge=0)
    # 员工匹配信息，用于批量导入时根据姓名+身份证匹配员工
    employee_info: Optional[Dict[str, str]] = Field(None, description="员工匹配信息，包含last_name, first_name, id_number")
    # 客户端标识，用于前端跟踪
    clientId: Optional[str] = Field(None, description="客户端生成的唯一标识")


class SalaryBaseBatchValidationRequest(BaseModel):
    """缴费基数批量验证请求模型"""
    period_id: int = Field(..., description="薪资周期ID")
    base_updates: List[SalaryBaseUpdate] = Field(..., description="缴费基数更新列表")
    overwrite_mode: bool = Field(False, description="是否覆盖现有配置")


class SalaryBaseValidationResult(BaseModel):
    """单条缴费基数验证结果"""
    employee_id: Optional[int] = Field(None, description="员工ID")
    employee_name: Optional[str] = Field(None, description="员工姓名")
    social_insurance_base: Optional[Decimal] = Field(None, description="社保缴费基数")
    housing_fund_base: Optional[Decimal] = Field(None, description="公积金缴费基数")
    is_valid: bool = Field(..., description="是否验证通过")
    errors: List[str] = Field([], description="验证错误信息")
    warnings: List[str] = Field([], description="验证警告信息")
    clientId: Optional[str] = Field(None, description="客户端生成的唯一标识")
    originalIndex: Optional[int] = Field(None, description="原始数据索引")


class SalaryBaseBatchValidationResponse(BaseModel):
    """缴费基数批量验证响应模型"""
    total: int = Field(..., description="总记录数")
    valid: int = Field(..., description="有效记录数")
    invalid: int = Field(..., description="无效记录数")
    warnings: int = Field(..., description="警告记录数")
    errors: List[str] = Field([], description="全局错误信息列表")
    validated_data: List[SalaryBaseValidationResult] = Field([], description="验证后的数据列表")


class SalaryBaseBatchUpdateRequest(BaseModel):
    """缴费基数批量更新请求模型"""
    period_id: int = Field(..., description="薪资周期ID")
    base_updates: List[SalaryBaseUpdate] = Field(..., description="缴费基数更新列表")
    overwrite_mode: bool = Field(False, description="是否覆盖现有配置")


class SalaryBaseBatchUpdateResponse(BaseModel):
    """缴费基数批量更新响应模型"""
    success_count: int = Field(..., description="成功更新的记录数")
    failed_count: int = Field(..., description="失败的记录数")
    created_count: int = Field(..., description="新创建的记录数")
    updated_count: int = Field(..., description="更新的记录数")
    errors: List[Dict[str, Any]] = Field([], description="错误详情列表")
    message: str = Field(..., description="操作结果消息")


# 模态框数据模型
class PayrollModalBasicInfo(BaseModel):
    """薪资模态框基础信息"""
    员工编号: Optional[str] = Field(None, description="员工编号")
    员工姓名: Optional[str] = Field(None, description="员工姓名")
    部门名称: Optional[str] = Field(None, description="部门名称")
    职位名称: Optional[str] = Field(None, description="职位名称")
    人员类别: Optional[str] = Field(None, description="人员类别")
    编制: Optional[str] = Field(None, description="编制")
    薪资期间名称: Optional[str] = Field(None, description="薪资期间名称")
    期间开始日期: Optional[date] = Field(None, description="期间开始日期")
    期间结束日期: Optional[date] = Field(None, description="期间结束日期")


class PayrollModalSummary(BaseModel):
    """薪资模态框汇总信息"""
    应发合计: Decimal = Field(0, description="应发合计")
    扣除合计: Decimal = Field(0, description="扣除合计")
    实发合计: Decimal = Field(0, description="实发合计")


class PayrollModalEarnings(BaseModel):
    """薪资模态框应发明细"""
    # 标准应发明细字段
    基本工资: Optional[Decimal] = Field(None, description="基本工资")
    岗位工资: Optional[Decimal] = Field(None, description="岗位工资")
    绩效工资: Optional[Decimal] = Field(None, description="绩效工资")
    补助: Optional[Decimal] = Field(None, description="补助")
    信访岗位津贴: Optional[Decimal] = Field(None, description="信访岗位津贴")
    基础绩效: Optional[Decimal] = Field(None, description="基础绩效")
    津贴: Optional[Decimal] = Field(None, description="津贴")
    职务技术等级工资: Optional[Decimal] = Field(None, description="职务/技术等级工资")
    级别岗位级别工资: Optional[Decimal] = Field(None, description="级别/岗位级别工资")
    九三年工改保留补贴: Optional[Decimal] = Field(None, description="93年工改保留补贴")
    独生子女父母奖励金: Optional[Decimal] = Field(None, description="独生子女父母奖励金")
    公务员规范性津贴补贴: Optional[Decimal] = Field(None, description="公务员规范性津贴补贴")
    公务交通补贴: Optional[Decimal] = Field(None, description="公务交通补贴")
    基础绩效奖: Optional[Decimal] = Field(None, description="基础绩效奖")
    薪级工资: Optional[Decimal] = Field(None, description="薪级工资")
    见习试用期工资: Optional[Decimal] = Field(None, description="见习试用期工资")
    月基础绩效: Optional[Decimal] = Field(None, description="月基础绩效")
    月奖励绩效: Optional[Decimal] = Field(None, description="月奖励绩效")
    岗位职务补贴: Optional[Decimal] = Field(None, description="岗位职务补贴")
    信访工作人员岗位津贴: Optional[Decimal] = Field(None, description="信访工作人员岗位津贴")
    乡镇工作补贴: Optional[Decimal] = Field(None, description="乡镇工作补贴")
    补扣社保: Optional[Decimal] = Field(None, description="补扣社保")
    一次性补扣发: Optional[Decimal] = Field(None, description="一次性补扣发")
    绩效奖金补扣发: Optional[Decimal] = Field(None, description="绩效奖金补扣发")
    奖励绩效补扣发: Optional[Decimal] = Field(None, description="奖励绩效补扣发")
    # 其他应发项目
    其他应发项目: Dict[str, Decimal] = Field({}, description="其他应发项目")


class PayrollModalPersonalDeductions(BaseModel):
    """个人扣缴项目"""
    养老保险个人应缴费额: Optional[Decimal] = Field(None, description="养老保险个人应缴费额")
    医疗保险个人应缴费额: Optional[Decimal] = Field(None, description="医疗保险个人应缴费额")
    失业保险个人应缴费额: Optional[Decimal] = Field(None, description="失业保险个人应缴费额")
    职业年金个人应缴费额: Optional[Decimal] = Field(None, description="职业年金个人应缴费额")
    住房公积金个人应缴费额: Optional[Decimal] = Field(None, description="住房公积金个人应缴费额")
    个人所得税: Optional[Decimal] = Field(None, description="个人所得税")
    其他个人扣缴: Dict[str, Decimal] = Field({}, description="其他个人扣缴项目")


class PayrollModalEmployerDeductions(BaseModel):
    """单位扣缴项目"""
    养老保险单位应缴费额: Optional[Decimal] = Field(None, description="养老保险单位应缴费额")
    医疗保险单位应缴总额: Optional[Decimal] = Field(None, description="医疗保险单位应缴总额")
    医疗保险单位应缴费额: Optional[Decimal] = Field(None, description="医疗保险单位应缴费额")
    大病医疗单位应缴费额: Optional[Decimal] = Field(None, description="大病医疗单位应缴费额")
    失业保险单位应缴费额: Optional[Decimal] = Field(None, description="失业保险单位应缴费额")
    工伤保险单位应缴费额: Optional[Decimal] = Field(None, description="工伤保险单位应缴费额")
    职业年金单位应缴费额: Optional[Decimal] = Field(None, description="职业年金单位应缴费额")
    住房公积金单位应缴费额: Optional[Decimal] = Field(None, description="住房公积金单位应缴费额")
    其他单位扣缴: Dict[str, Decimal] = Field({}, description="其他单位扣缴项目")


class PayrollModalDeductions(BaseModel):
    """薪资模态框扣除明细"""
    个人扣缴项目: PayrollModalPersonalDeductions = Field(..., description="个人扣缴项目")
    单位扣缴项目: PayrollModalEmployerDeductions = Field(..., description="单位扣缴项目")


class PayrollModalCalculations(BaseModel):
    """薪资模态框计算参数"""
    社保缴费基数: Optional[Decimal] = Field(None, description="社保缴费基数")
    住房公积金缴费基数: Optional[Decimal] = Field(None, description="住房公积金缴费基数")
    养老保险个人费率: Optional[Decimal] = Field(None, description="养老保险个人费率")
    医疗保险个人费率: Optional[Decimal] = Field(None, description="医疗保险个人费率")
    住房公积金个人费率: Optional[Decimal] = Field(None, description="住房公积金个人费率")
    其他计算参数: Dict[str, Decimal] = Field({}, description="其他计算参数")


# 员工详细信息相关模型
class PayrollModalContactInfo(BaseModel):
    """联系信息"""
    电话: Optional[str] = Field(None, description="电话")
    邮箱: Optional[str] = Field(None, description="邮箱")
    家庭住址: Optional[str] = Field(None, description="家庭住址")
    紧急联系人: Optional[str] = Field(None, description="紧急联系人")
    紧急联系电话: Optional[str] = Field(None, description="紧急联系电话")


class PayrollModalPersonalInfo(BaseModel):
    """个人信息"""
    身份证号: Optional[str] = Field(None, description="身份证号")
    出生日期: Optional[date] = Field(None, description="出生日期")
    性别: Optional[str] = Field(None, description="性别")
    民族: Optional[str] = Field(None, description="民族")
    民族详情: Optional[str] = Field(None, description="民族详情")
    婚姻状况: Optional[str] = Field(None, description="婚姻状况")
    学历: Optional[str] = Field(None, description="学历")
    政治面貌: Optional[str] = Field(None, description="政治面貌")


class PayrollModalWorkInfo(BaseModel):
    """工作信息"""
    入职日期: Optional[date] = Field(None, description="入职日期")
    首次工作日期: Optional[date] = Field(None, description="首次工作日期")
    现职位开始日期: Optional[date] = Field(None, description="现职位开始日期")
    中断服务年限: Optional[Decimal] = Field(None, description="中断服务年限")
    员工状态: Optional[str] = Field(None, description="员工状态")
    用工类型: Optional[str] = Field(None, description="用工类型")
    合同类型: Optional[str] = Field(None, description="合同类型")
    薪级: Optional[str] = Field(None, description="薪级")
    薪档: Optional[str] = Field(None, description="薪档")
    职位等级: Optional[str] = Field(None, description="职位等级")


class PayrollModalSocialSecurityInfo(BaseModel):
    """社保公积金信息"""
    社保客户号: Optional[str] = Field(None, description="社保客户号")
    住房公积金客户号: Optional[str] = Field(None, description="住房公积金客户号")


class PayrollModalBankInfo(BaseModel):
    """银行账号信息"""
    开户银行: Optional[str] = Field(None, description="开户银行")
    账户持有人: Optional[str] = Field(None, description="账户持有人")
    银行账号: Optional[str] = Field(None, description="银行账号")
    开户支行: Optional[str] = Field(None, description="开户支行")
    银行代码: Optional[str] = Field(None, description="银行代码")
    账户类型: Optional[str] = Field(None, description="账户类型")


class PayrollModalEmployeeDetails(BaseModel):
    """员工详细信息"""
    联系信息: PayrollModalContactInfo = Field(..., description="联系信息")
    个人信息: PayrollModalPersonalInfo = Field(..., description="个人信息")
    工作信息: PayrollModalWorkInfo = Field(..., description="工作信息")
    社保公积金信息: PayrollModalSocialSecurityInfo = Field(..., description="社保公积金信息")
    银行账号信息: PayrollModalBankInfo = Field(..., description="银行账号信息")


class PayrollModalData(BaseModel):
    """薪资模态框完整数据"""
    薪资条目id: int = Field(..., description="薪资条目ID")
    基础信息: PayrollModalBasicInfo = Field(..., description="基础信息")
    员工详细信息: Optional[PayrollModalEmployeeDetails] = Field(None, description="员工详细信息")
    汇总信息: PayrollModalSummary = Field(..., description="汇总信息")
    应发明细: PayrollModalEarnings = Field(..., description="应发明细")
    扣除明细: PayrollModalDeductions = Field(..., description="扣除明细")
    计算参数: PayrollModalCalculations = Field(..., description="计算参数")
    
    class Config:
        from_attributes = True
