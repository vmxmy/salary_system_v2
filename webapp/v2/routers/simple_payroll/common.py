"""
Simple Payroll 子模块公共导入
包含所有子模块需要的通用导入、依赖和工具函数
"""

import logging
from typing import Dict, List, Optional, Any, Union
from datetime import datetime, date
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel

# 数据库依赖
from ...database import get_db_v2

# 数据库模型
from ...models.config import LookupValue
from ...models.payroll import PayrollEntry, PayrollRun

# 权限和认证
from webapp.auth import require_permissions

# Pydantic 响应模型
from ...pydantic_models.common import (
    DataResponse, 
    PaginationResponse, 
    PaginationMeta,
    ErrorDetail
)

# Config 相关模型
from ...pydantic_models.config import ReportTemplateResponse

# Simple Payroll 相关 Pydantic 模型 - 只导入确实存在的
try:
    from ...pydantic_models.simple_payroll import (
        PayrollPeriodResponse,
        PayrollRunResponse,
        PayrollEntryResponse,
        PayrollGenerationRequest,
        AuditSummaryResponse,
        AuditAnomalyResponse,
        ReportGenerationRequest,
        BatchAdjustmentPreviewRequest,
        BatchAdjustmentRequestAdvanced,
        BatchAdjustmentPreview,
        BatchAdjustmentResult
    )
except ImportError:
    # 如果simple_payroll模型不存在，使用payroll模型
    from ...pydantic_models.payroll import (
        PayrollPeriod as PayrollPeriodResponse,
        PayrollRun as PayrollRunResponse,
        PayrollEntry as PayrollEntryResponse
    )
    
    # 定义缺失的模型
    class PayrollGenerationRequest(BaseModel):
        period_id: int
        generation_type: str
        source_data: Optional[Dict[str, Any]] = None
        description: Optional[str] = None
    
    class AuditSummaryResponse(BaseModel):
        payroll_run_id: int
        total_entries: int
        total_anomalies: int
        error_count: int
        warning_count: int
        info_count: int
        auto_fixable_count: int
        manually_ignored_count: int
        audit_status: str
        audit_type: str
        anomalies_by_type: Dict[str, Dict[str, Any]]
        total_gross_pay: Decimal
        total_net_pay: Decimal
        total_deductions: Decimal
        comparison_with_previous: Optional[Dict[str, Decimal]] = None
        audit_completed_at: Optional[datetime] = None
    
    class AuditAnomalyResponse(BaseModel):
        id: str
        employee_id: int
        employee_name: str
        employee_code: str
        anomaly_type: str
        severity: str
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
    
    class ReportGenerationRequest(BaseModel):
        report_ids: List[int]
        period_id: int
        payroll_run_id: Optional[int] = None
        output_format: str = 'excel'
        include_details: bool = True
        filters: Optional[Dict[str, Any]] = None
    
    class BatchAdjustmentPreviewRequest(BaseModel):
        payroll_run_id: int
        employee_codes: List[str]
        adjustment_rules: List[Dict[str, Any]]
    
    class BatchAdjustmentRequestAdvanced(BaseModel):
        payroll_run_id: int
        employee_codes: List[str]
        adjustment_rules: List[Dict[str, Any]]
        description: Optional[str] = None
    
    class BatchAdjustmentPreview(BaseModel):
        affected_entries: List[Dict[str, Any]]
        total_affected: int
    
    class BatchAdjustmentResult(BaseModel):
        affected_count: int
        description: str
        task_id: Optional[str] = None

# 定义其他可能缺失的模型
class SalaryConfigResponse(BaseModel):
    id: int
    employee_id: int
    component_code: str
    amount: Decimal
    
class BatchAdjustmentRequest(BaseModel):
    payroll_run_id: int
    adjustments: List[Dict[str, Any]]
    
class BatchAdjustmentPreview(BaseModel):
    affected_entries: List[Dict[str, Any]]
    total_impact: Decimal
    
class BatchAdjustmentResult(BaseModel):
    affected_count: int
    total_amount: Decimal
    
class AuditRequest(BaseModel):
    payroll_run_id: int
    audit_rules: Optional[List[str]] = None
    
class AuditResponse(BaseModel):
    audit_id: str
    status: str
    findings: List[Dict[str, Any]]

# 服务层 - 可选导入
try:
    from ...services.simple_payroll.payroll_service import SimplePayrollService
except ImportError:
    SimplePayrollService = None

try:
    from ...services.simple_payroll.payroll_audit_service import PayrollAuditService
except ImportError:
    PayrollAuditService = None

try:
    from ...services.simple_payroll.batch_adjustment_service import BatchAdjustmentService
except ImportError:
    BatchAdjustmentService = None

# 错误处理工具
from ...utils.common import create_error_response

# 日志配置
logger = logging.getLogger(__name__)

# 公共常量
DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100

# 公共工具函数
def validate_date_string(date_str: str) -> date:
    """验证并转换日期字符串"""
    try:
        return datetime.strptime(date_str, '%Y-%m-%d').date()
    except ValueError:
        try:
            return datetime.strptime(date_str, '%Y-%m').date().replace(day=1)
        except ValueError:
            raise ValueError(f"Invalid date format: {date_str}. Expected YYYY-MM-DD or YYYY-MM")

def format_decimal(value: Optional[Decimal], default: str = "0.00") -> str:
    """格式化金额，保留两位小数"""
    if value is None:
        return default
    return f"{value:.2f}"

def safe_decimal_convert(value: Any) -> Decimal:
    """安全转换为Decimal类型"""
    if value is None:
        return Decimal('0')
    if isinstance(value, Decimal):
        return value
    try:
        return Decimal(str(value))
    except (ValueError, TypeError):
        return Decimal('0') 