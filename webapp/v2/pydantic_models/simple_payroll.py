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