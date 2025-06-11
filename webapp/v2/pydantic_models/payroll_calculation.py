"""
薪资计算相关的Pydantic模型
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime, date
from enum import Enum


class CalculationStatusEnum(str, Enum):
    """计算状态枚举"""
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


class PayrollCalculationRequest(BaseModel):
    """薪资计算请求"""
    payroll_run_id: int = Field(..., description="薪资审核ID")
    employee_ids: Optional[List[int]] = Field(None, description="指定员工ID列表，为空则计算所有员工")
    department_ids: Optional[List[int]] = Field(None, description="指定部门ID列表")
    calculation_config: Optional[Dict[str, Any]] = Field(default_factory=dict, description="计算配置参数")
    
    # 异步计算配置
    async_threshold: int = Field(50, description="异步计算阈值，超过此数量的员工将使用异步计算")
    force_async: bool = Field(False, description="强制使用异步计算")
    
    # 预览配置
    preview_limit: Optional[int] = Field(10, description="预览计算的员工数量限制")
    
    class Config:
        schema_extra = {
            "example": {
                "payroll_run_id": 1,
                "employee_ids": [1, 2, 3],
                "calculation_config": {
                    "include_overtime": True,
                    "tax_calculation_method": "progressive"
                },
                "async_threshold": 50,
                "force_async": False
            }
        }


class CalculationResult(BaseModel):
    """单个员工计算结果"""
    employee_id: int = Field(..., description="员工ID")
    employee_name: str = Field(..., description="员工姓名")
    status: Optional[str] = Field(None, description="计算状态")
    success: bool = Field(..., description="计算是否成功")
    
    # 计算结果
    basic_salary: Optional[float] = Field(None, description="基本工资")
    allowances: Optional[Dict[str, float]] = Field(None, description="津贴补贴")
    overtime_pay: Optional[float] = Field(None, description="加班费")
    gross_salary: Optional[float] = Field(None, description="应发工资")
    
    # 扣除项
    social_insurance: Optional[Dict[str, float]] = Field(None, description="社保扣除")
    housing_fund: Optional[float] = Field(None, description="公积金扣除")
    personal_tax: Optional[float] = Field(None, description="个人所得税")
    other_deductions: Optional[Dict[str, float]] = Field(None, description="其他扣除")
    total_deductions: Optional[float] = Field(None, description="扣除合计")
    
    # 最终结果
    net_salary: Optional[float] = Field(None, description="实发工资")
    
    # 计算详情
    calculation_details: Optional[Dict[str, Any]] = Field(None, description="计算详情")
    calculation_time: Optional[datetime] = Field(None, description="计算时间")
    
    # 错误信息
    error_message: Optional[str] = Field(None, description="错误信息")
    
    class Config:
        schema_extra = {
            "example": {
                "employee_id": 1,
                "employee_name": "张三",
                "success": True,
                "basic_salary": 8000.00,
                "allowances": {"交通补贴": 500.00, "餐费补贴": 300.00},
                "overtime_pay": 1200.00,
                "gross_salary": 10000.00,
                "social_insurance": {"养老保险": 640.00, "医疗保险": 200.00},
                "housing_fund": 960.00,
                "personal_tax": 345.00,
                "total_deductions": 2145.00,
                "net_salary": 7855.00
            }
        }


class PayrollCalculationResponse(BaseModel):
    """薪资计算响应"""
    task_id: Optional[str] = Field(None, description="异步任务ID")
    status: CalculationStatusEnum = Field(..., description="计算状态")
    message: str = Field(..., description="响应消息")
    
    # 统计信息
    total_employees: int = Field(..., description="总员工数")
    successful_count: Optional[int] = Field(None, description="成功计算数量")
    failed_count: Optional[int] = Field(None, description="失败计算数量")
    
    # 计算结果（同步计算时返回）
    results: Optional[List[CalculationResult]] = Field(None, description="计算结果列表")
    
    # 时间信息
    start_time: Optional[datetime] = Field(None, description="开始时间")
    end_time: Optional[datetime] = Field(None, description="结束时间")
    
    # 是否异步
    is_async: bool = Field(False, description="是否为异步计算")


class PayrollCalculationPreview(BaseModel):
    """薪资计算预览"""
    payroll_run_id: int = Field(..., description="薪资审核ID")
    preview_count: int = Field(..., description="预览员工数量")
    total_employees: int = Field(..., description="总员工数量")
    
    # 预览结果
    results: List[CalculationResult] = Field(..., description="预览计算结果")
    
    # 配置信息
    calculation_config: Dict[str, Any] = Field(..., description="计算配置")
    
    # 汇总信息
    summary: Optional[Dict[str, Any]] = Field(None, description="预览汇总信息")


class CalculationStatus(BaseModel):
    """计算任务状态"""
    task_id: str = Field(..., description="任务ID")
    status: CalculationStatusEnum = Field(..., description="任务状态")
    progress: float = Field(0.0, description="进度百分比 (0-100)")
    
    # 统计信息
    total_employees: int = Field(..., description="总员工数")
    processed_employees: int = Field(0, description="已处理员工数")
    successful_count: int = Field(0, description="成功数量")
    failed_count: int = Field(0, description="失败数量")
    
    # 时间信息
    start_time: Optional[datetime] = Field(None, description="开始时间")
    end_time: Optional[datetime] = Field(None, description="结束时间")
    estimated_completion: Optional[datetime] = Field(None, description="预计完成时间")
    
    # 错误信息
    error_message: Optional[str] = Field(None, description="错误信息")
    
    # 当前处理信息
    current_employee: Optional[str] = Field(None, description="当前处理员工")


class CalculationSummary(BaseModel):
    """计算汇总信息"""
    payroll_run_id: int = Field(..., description="薪资审核ID")
    calculation_date: datetime = Field(..., description="计算日期")
    
    # 统计信息
    total_employees: int = Field(..., description="总员工数")
    calculated_employees: int = Field(..., description="已计算员工数")
    successful_count: int = Field(..., description="成功数量")
    failed_count: int = Field(..., description="失败数量")
    
    # 金额汇总
    total_gross_salary: float = Field(..., description="应发工资总额")
    total_deductions: float = Field(..., description="扣除总额")
    total_net_salary: float = Field(..., description="实发工资总额")
    
    # 分类汇总
    department_summary: Optional[List[Dict[str, Any]]] = Field(None, description="部门汇总")
    component_summary: Optional[Dict[str, float]] = Field(None, description="薪资组件汇总")
    
    # 状态信息
    calculation_status: CalculationStatusEnum = Field(..., description="整体计算状态")
    last_updated: datetime = Field(..., description="最后更新时间")


class CalculationConfigRequest(BaseModel):
    """计算配置请求"""
    rule_set_id: Optional[int] = Field(None, description="计算规则集ID")
    config_name: str = Field(..., description="配置名称")
    config_data: Dict[str, Any] = Field(..., description="配置数据")
    applicable_departments: Optional[List[int]] = Field(None, description="适用部门")
    applicable_positions: Optional[List[int]] = Field(None, description="适用职位")
    effective_date: date = Field(..., description="生效日期")
    end_date: Optional[date] = Field(None, description="结束日期")


class CalculationConfigResponse(BaseModel):
    """计算配置响应"""
    id: int = Field(..., description="配置ID")
    config_name: str = Field(..., description="配置名称")
    config_data: Dict[str, Any] = Field(..., description="配置数据")
    is_active: bool = Field(..., description="是否启用")
    effective_date: date = Field(..., description="生效日期")
    end_date: Optional[date] = Field(None, description="结束日期")
    created_at: datetime = Field(..., description="创建时间")
    updated_at: Optional[datetime] = Field(None, description="更新时间") 