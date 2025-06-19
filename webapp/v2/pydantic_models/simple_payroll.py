"""
极简工资报表系统Pydantic模型定义
"""

from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel, Field
from datetime import datetime, date
from decimal import Decimal

# =============================================================================
# 基础响应模型
# =============================================================================

class PayrollPeriodResponse(BaseModel):
    """工资期间响应模型"""
    id: int
    name: str
    description: Optional[str] = None
    frequency_id: int
    frequency_name: str
    status_id: int
    status_name: str
    is_active: bool
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    runs_count: int = 0
    entries_count: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class PayrollRunResponse(BaseModel):
    """工资运行版本响应模型"""
    id: int
    period_id: int
    period_name: str
    version_number: int
    status_id: int
    status_name: str
    total_entries: int = 0
    total_gross_pay: Decimal = Decimal('0.00')
    total_net_pay: Decimal = Decimal('0.00')
    total_deductions: Decimal = Decimal('0.00')
    initiated_by_user_id: int
    initiated_by_username: str
    initiated_at: datetime
    calculated_at: Optional[datetime] = None
    approved_at: Optional[datetime] = None
    description: Optional[str] = None

    class Config:
        from_attributes = True

# =============================================================================
# 工资生成请求模型
# =============================================================================

class PayrollSourceData(BaseModel):
    """工资生成源数据"""
    file_data: Optional[List[Dict[str, Any]]] = None
    source_period_id: Optional[int] = None
    initial_entries: Optional[List[Dict[str, Any]]] = None

class PayrollGenerationRequest(BaseModel):
    """工资生成请求"""
    period_id: int
    generation_type: Literal['import', 'copy_previous', 'manual']
    source_data: Optional[PayrollSourceData] = None
    description: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "period_id": 1,
                "generation_type": "copy_previous",
                "source_data": {
                    "source_period_id": 2
                },
                "description": "复制2024年1月数据"
            }
        }

class CopyPreviousPayrollRequest(BaseModel):
    """复制上月工资数据请求模型"""
    target_period_id: int = Field(..., description="目标期间ID")
    source_period_id: int = Field(..., description="源期间ID")
    description: Optional[str] = Field(None, description="复制说明")
    force_overwrite: Optional[bool] = Field(False, description="是否强制覆盖现有数据")

    class Config:
        json_schema_extra = {
            "example": {
                "target_period_id": 54,
                "source_period_id": 51,
                "description": "复制2025年9月数据到2025年12月",
                "force_overwrite": False
            }
        }

# =============================================================================
# 批量调整请求模型
# =============================================================================

class BatchAdjustment(BaseModel):
    """批量调整项"""
    type: Literal['department', 'personnel_category', 'position', 'all']
    target_ids: Optional[List[int]] = None
    component_code: str
    component_name: str
    adjustment_type: Literal['fixed_amount', 'percentage', 'replace_value']
    adjustment_value: Decimal
    reason: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "type": "department",
                "target_ids": [1, 2, 3],
                "component_code": "basic_salary",
                "component_name": "基本工资",
                "adjustment_type": "percentage",
                "adjustment_value": 1.05,
                "reason": "年度调薪5%"
            }
        }

class BatchAdjustmentRequest(BaseModel):
    """批量调整请求"""
    payroll_run_id: int
    adjustments: List[BatchAdjustment]

# =============================================================================
# 审核相关模型
# =============================================================================

class AuditAnomalyResponse(BaseModel):
    """审核异常响应模型"""
    id: str
    employee_id: int
    employee_name: str
    employee_code: str
    anomaly_type: Literal['CALCULATION_CONSISTENCY_CHECK', 'MINIMUM_WAGE_CHECK', 'TAX_CALCULATION_CHECK', 'SOCIAL_SECURITY_CHECK', 'SALARY_VARIANCE_CHECK', 'MISSING_DATA_CHECK']
    severity: Literal['error', 'warning', 'info']
    message: str
    details: str
    suggested_action: Optional[str] = None
    current_value: Optional[Decimal] = None
    expected_value: Optional[Decimal] = None
    can_auto_fix: bool = False
    is_ignored: bool = False
    ignore_reason: Optional[str] = None
    fix_applied: bool = False
    created_at: datetime

class AuditSummaryResponse(BaseModel):
    """审核汇总响应模型"""
    payroll_run_id: int
    total_entries: int
    total_anomalies: int
    error_count: int
    warning_count: int
    info_count: int
    auto_fixable_count: int
    manually_ignored_count: int
    audit_status: Literal['PENDING', 'PASSED', 'WARNING', 'FAILED']
    audit_type: Literal['BASIC', 'ADVANCED', 'MANUAL']
    anomalies_by_type: Dict[str, Dict[str, Any]]
    total_gross_pay: Decimal
    total_net_pay: Decimal
    total_deductions: Decimal
    comparison_with_previous: Optional[Dict[str, Decimal]] = None
    audit_completed_at: Optional[datetime] = None

    class Config:
        json_schema_extra = {
            "example": {
                "payroll_run_id": 1,
                "total_entries": 150,
                "total_anomalies": 5,
                "error_count": 2,
                "warning_count": 3,
                "info_count": 0,
                "auto_fixable_count": 3,
                "manually_ignored_count": 0,
                "audit_status": "WARNING",
                "audit_type": "BASIC",
                "anomalies_by_type": {
                    "MINIMUM_WAGE_CHECK": {
                        "count": 1,
                        "rule_name": "最低工资标准检查",
                        "severity": "error"
                    },
                    "TAX_CALCULATION_CHECK": {
                        "count": 2,
                        "rule_name": "个税计算检查",
                        "severity": "warning"
                    }
                },
                "total_gross_pay": 500000.00,
                "total_net_pay": 420000.00,
                "total_deductions": 80000.00
            }
        }

class AuditRequest(BaseModel):
    """审核请求模型"""
    payroll_run_id: int
    audit_type: Literal['BASIC', 'ADVANCED', 'MANUAL'] = 'BASIC'
    auto_fix: bool = False

class AuditAnomalyListResponse(BaseModel):
    """审核异常列表响应模型"""
    data: List[AuditAnomalyResponse]
    meta: Dict[str, Any]

class MonthlySnapshotResponse(BaseModel):
    """月度快照响应模型"""
    id: int
    period_id: int
    employee_id: int
    employee_code: str
    employee_name: str
    department_name: str
    position_name: str
    gross_pay: Decimal
    total_deductions: Decimal
    net_pay: Decimal
    earnings_details: Dict[str, Decimal]
    deductions_details: Dict[str, Decimal]
    audit_status: str
    snapshot_date: datetime

    class Config:
        from_attributes = True

# =============================================================================
# 报表生成请求模型
# =============================================================================

class ReportFilters(BaseModel):
    """报表过滤条件"""
    department_ids: Optional[List[int]] = None
    employee_ids: Optional[List[int]] = None
    personnel_category_ids: Optional[List[int]] = None

class ReportGenerationRequest(BaseModel):
    """报表生成请求"""
    report_ids: List[int]
    period_id: int
    payroll_run_id: Optional[int] = None
    output_format: Literal['excel', 'pdf', 'csv'] = 'excel'
    include_details: bool = True
    filters: Optional[ReportFilters] = None

    class Config:
        json_schema_extra = {
            "example": {
                "report_ids": [1, 2, 3],
                "period_id": 1,
                "payroll_run_id": 5,
                "output_format": "excel",
                "include_details": True,
                "filters": {
                    "department_ids": [1, 2]
                }
            }
        }

class ReportDefinitionResponse(BaseModel):
    """报表定义响应模型"""
    id: int
    name: str
    description: Optional[str] = None
    category: str
    template_type: Literal['table', 'summary', 'detailed']
    output_formats: List[str]
    is_active: bool
    required_permissions: List[str]

# =============================================================================
# 进度和状态模型
# =============================================================================

class GenerationProgress(BaseModel):
    """工资生成进度"""
    step: Literal['uploading', 'validating', 'processing', 'completed', 'failed']
    progress: int = Field(ge=0, le=100)
    message: str
    errors: Optional[List[str]] = None
    warnings: Optional[List[str]] = None

class ExportStatus(BaseModel):
    """导出状态"""
    task_id: str
    status: Literal['pending', 'processing', 'completed', 'failed']
    progress: int = Field(ge=0, le=100)
    file_url: Optional[str] = None
    error_message: Optional[str] = None
    created_at: datetime

# =============================================================================
# 工资条目相关模型
# =============================================================================

class PayrollEntryResponse(BaseModel):
    """工资条目响应模型"""
    id: int
    employee_id: int
    employee_code: str
    employee_name: str
    department_name: str
    position_name: str
    personnel_category_name: str
    payroll_run_id: int
    period_id: int
    period_name: str
    gross_pay: Decimal
    net_pay: Decimal
    total_deductions: Decimal
    earnings_details: Dict[str, Decimal]
    deductions_details: Dict[str, Decimal]
    calculated_at: Optional[datetime] = None
    updated_at: datetime

    class Config:
        from_attributes = True

# =============================================================================
# 通用列表模型
# =============================================================================

class DepartmentResponse(BaseModel):
    """部门响应模型"""
    id: int
    name: str
    code: str
    is_active: bool

class PersonnelCategoryResponse(BaseModel):
    """人员类别响应模型"""
    id: int
    name: str
    code: str
    is_active: bool

class PayrollComponentResponse(BaseModel):
    """薪资组件响应模型"""
    id: int
    code: str
    name: str
    type: str
    is_active: bool

# =============================================================================
# 批量调整高级模型
# =============================================================================

class BatchAdjustmentRule(BaseModel):
    """批量调整规则"""
    component: str = Field(..., description="薪资组件代码")
    operation: Literal['add', 'subtract', 'multiply', 'set'] = Field(..., description="操作类型")
    value: Decimal = Field(..., description="调整数值")
    description: Optional[str] = Field(None, description="规则描述")

class BatchAdjustmentPreviewRequest(BaseModel):
    """批量调整预览请求"""
    payroll_run_id: int = Field(..., description="工资运行ID")
    employee_codes: List[str] = Field(..., description="员工编号列表")
    adjustment_rules: List[BatchAdjustmentRule] = Field(..., description="调整规则列表")

class BatchAdjustmentRequestAdvanced(BaseModel):
    """高级批量调整请求"""
    payroll_run_id: int = Field(..., description="工资运行ID")
    employee_codes: List[str] = Field(..., description="员工编号列表")
    adjustment_rules: List[BatchAdjustmentRule] = Field(..., description="调整规则列表")
    description: Optional[str] = Field(None, description="调整说明")

class AdjustmentEntry(BaseModel):
    """调整条目"""
    employee_code: str = Field(..., description="员工编号")
    employee_name: str = Field(..., description="员工姓名")
    component_code: str = Field(..., description="组件代码")
    component_name: str = Field(..., description="组件名称")
    old_value: float = Field(..., description="调整前数值")
    new_value: float = Field(..., description="调整后数值")
    difference: float = Field(..., description="差额")

class BatchAdjustmentPreview(BaseModel):
    """批量调整预览结果"""
    affected_entries: List[AdjustmentEntry] = Field(..., description="受影响的条目")
    total_affected: int = Field(..., description="影响条目总数")

class BatchAdjustmentResult(BaseModel):
    """批量调整结果"""
    affected_count: int = Field(..., description="影响条目数量")
    description: str = Field(..., description="调整描述")
    task_id: Optional[str] = Field(None, description="任务ID")

# =============================================================================
# 统计分析响应模型
# =============================================================================

class DepartmentCostData(BaseModel):
    """部门成本数据"""
    department_id: Optional[int] = Field(None, description="部门ID")
    department_name: str = Field(..., description="部门名称")
    current_cost: Decimal = Field(..., description="应发合计")
    current_deductions: Decimal = Field(Decimal('0.00'), description="扣发合计")
    current_net_pay: Decimal = Field(..., description="实发合计")
    previous_cost: Optional[Decimal] = Field(None, description="上期应发合计")
    previous_deductions: Optional[Decimal] = Field(None, description="上期扣发合计")
    previous_net_pay: Optional[Decimal] = Field(None, description="上期实发合计")
    employee_count: int = Field(..., description="员工数量")
    avg_cost_per_employee: Decimal = Field(..., description="人均应发成本")
    avg_deductions_per_employee: Decimal = Field(Decimal('0.00'), description="人均扣发")
    avg_net_pay_per_employee: Decimal = Field(..., description="人均实发")
    percentage: float = Field(..., description="应发成本占比")
    cost_change: Optional[Decimal] = Field(None, description="应发成本变化")
    cost_change_rate: Optional[float] = Field(None, description="应发成本变化率")
    net_pay_change: Optional[Decimal] = Field(None, description="实发成本变化")
    net_pay_change_rate: Optional[float] = Field(None, description="实发成本变化率")

class DepartmentCostAnalysisResponse(BaseModel):
    """部门成本分析响应"""
    period_id: int = Field(..., description="期间ID")
    period_name: str = Field(..., description="期间名称")
    total_cost: Decimal = Field(..., description="总应发成本")
    total_deductions: Decimal = Field(Decimal('0.00'), description="总扣发")
    total_net_pay: Decimal = Field(..., description="总实发")
    total_employees: int = Field(..., description="总员工数")
    departments: List[DepartmentCostData] = Field(..., description="部门成本列表")

class EmployeeTypeData(BaseModel):
    """员工类型数据"""
    personnel_category_id: int = Field(..., description="人员类别ID")
    type_name: str = Field(..., description="类型名称")
    employee_count: int = Field(..., description="员工数量")
    percentage: float = Field(..., description="人员占比")
    avg_salary: Decimal = Field(..., description="平均薪资")
    total_cost: Decimal = Field(..., description="总成本")
    previous_count: Optional[int] = Field(None, description="上期人数")
    count_change: Optional[int] = Field(None, description="人数变化")
    new_hires: Optional[int] = Field(None, description="新入职")
    departures: Optional[int] = Field(None, description="离职")

class EmployeeTypeAnalysisResponse(BaseModel):
    """员工编制分析响应"""
    period_id: int = Field(..., description="期间ID")
    period_name: str = Field(..., description="期间名称")
    total_employees: int = Field(..., description="总员工数")
    total_cost: Decimal = Field(..., description="总成本")
    employee_types: List[EmployeeTypeData] = Field(..., description="员工类型列表")

class SalaryTrendDataPoint(BaseModel):
    """工资趋势数据点"""
    period_id: int = Field(..., description="期间ID")
    period_name: str = Field(..., description="期间名称")
    year_month: str = Field(..., description="年月(YYYY-MM)")
    employee_count: int = Field(..., description="员工数量")
    gross_salary: Decimal = Field(..., description="应发工资")
    deductions: Decimal = Field(..., description="扣除金额")
    net_salary: Decimal = Field(..., description="实发工资")
    avg_gross_salary: Decimal = Field(..., description="平均应发工资")
    avg_net_salary: Decimal = Field(..., description="平均实发工资")

class SalaryTrendAnalysisResponse(BaseModel):
    """工资趋势分析响应"""
    time_range: str = Field(..., description="时间范围")
    data_points: List[SalaryTrendDataPoint] = Field(..., description="趋势数据点")
    trend_summary: Dict[str, Any] = Field(..., description="趋势摘要")

# =============================================================================
# 综合统计响应模型
# =============================================================================

class PayrollAnalyticsResponse(BaseModel):
    """薪资分析统计响应"""
    department_cost_analysis: DepartmentCostAnalysisResponse
    employee_type_analysis: EmployeeTypeAnalysisResponse
    salary_trend_analysis: SalaryTrendAnalysisResponse 


# =============================================================================
# 月度状态概览模型
# =============================================================================

class MonthlyRecordStatusSummary(BaseModel):
    """月度工资记录状态汇总"""
    not_calculated: int = Field(0, description="未计算数量")
    pending_audit: int = Field(0, description="待审计数量")
    approved: int = Field(0, description="已核准数量")
    
class MonthlyPayrollSummary(BaseModel):
    """月度薪资状态概览"""
    year: int = Field(..., description="年份")
    month: int = Field(..., description="月份")
    has_payroll_run: bool = Field(False, description="是否存在薪资运行")
    record_status_summary: MonthlyRecordStatusSummary = Field(default_factory=MonthlyRecordStatusSummary, description="工资记录状态汇总") 