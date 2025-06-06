"""
基于视图的薪资API路由 (v2)

新的API设计原则：
1. 基于核心视图，不直接查询源表
2. 统一的服务层抽象
3. 标准化的响应格式
4. 高性能的数据访问
"""

from typing import Optional, List, Dict, Any, Union
from fastapi import APIRouter, Depends, HTTPException, Query, status, UploadFile, File
from sqlalchemy.orm import Session
from datetime import datetime, date
import json

from ..database import get_db_v2
from webapp.auth import require_permissions
from ..services.payroll import PayrollBusinessService
from ..utils.common import create_error_response
from ..pydantic_models.common import PaginationResponse, DataResponse, SuccessResponse

router = APIRouter(prefix="/v2/payroll", tags=["Payroll V2 (View-Based)"])


# =============================================================================
# 薪资周期API - 基于视图
# =============================================================================

@router.get("/periods", response_model=PaginationResponse)
async def get_payroll_periods_v2(
    # 过滤参数
    frequency_id: Optional[int] = Query(None, description="频率ID"),
    status_id: Optional[int] = Query(None, description="状态ID"),
    is_active: Optional[bool] = Query(None, description="是否活跃"),
    
    # 分页参数
    page: int = Query(1, ge=1, description="页码"),
    size: int = Query(50, ge=1, le=200, description="每页记录数"),
    
    # 依赖注入
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["payroll_period:view"]))
):
    """
    获取薪资周期列表 (基于视图)
    
    ✅ 优势：
    - 包含统计信息（运行次数、条目数量）
    - 状态和频率自动映射为名称
    - 高性能查询，无需复杂JOIN
    - 标准化响应格式
    """
    try:
        # 使用业务服务
        payroll_service = PayrollBusinessService(db)
        
        # 构建过滤条件
        filters = {}
        if frequency_id is not None:
            filters["frequency_id"] = frequency_id
        if status_id is not None:
            filters["status_id"] = status_id
        if is_active is not None:
            filters["is_active"] = is_active
        
        # 获取数据
        result = payroll_service.periods.get_periods_with_stats(
            page=page,
            size=size,
            **filters
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="获取薪资周期列表失败",
                details=str(e)
            )
        )


@router.get("/periods/{period_id}", response_model=DataResponse)
async def get_payroll_period_v2(
    period_id: int,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["payroll_period:view"]))
):
    """
    获取薪资周期详情 (基于视图)
    
    ✅ 优势：
    - 包含完整的统计信息
    - 自动的状态和频率映射
    """
    try:
        payroll_service = PayrollBusinessService(db)
        
        # 使用视图获取详情
        period = payroll_service.periods.get_detail_data(period_id, use_view=True)
        
        if not period:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="薪资周期不存在",
                    details=f"Period ID {period_id} not found"
                )
            )
        
        return DataResponse(data=period)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="获取薪资周期详情失败",
                details=str(e)
            )
        )


# =============================================================================
# 薪资运行API - 基于视图
# =============================================================================

@router.get("/runs", response_model=PaginationResponse)
async def get_payroll_runs_v2(
    # 过滤参数
    period_id: Optional[int] = Query(None, description="薪资周期ID"),
    status_id: Optional[int] = Query(None, description="状态ID"),
    
    # 分页参数
    page: int = Query(1, ge=1, description="页码"),
    size: int = Query(50, ge=1, le=200, description="每页记录数"),
    
    # 依赖注入
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["payroll_run:view"]))
):
    """
    获取薪资运行列表 (基于视图)
    
    ✅ 优势：
    - 包含金额汇总（总收入、总扣除、净发工资）
    - 包含周期信息和发起人信息
    - 预计算的统计数据，无需实时聚合
    """
    try:
        payroll_service = PayrollBusinessService(db)
        
        # 构建过滤条件
        filters = {}
        if period_id is not None:
            filters["period_id"] = period_id
        if status_id is not None:
            filters["status_id"] = status_id
        
        # 获取数据
        result = payroll_service.runs.get_runs_with_summary(
            page=page,
            size=size,
            **filters
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="获取薪资运行列表失败",
                details=str(e)
            )
        )


# =============================================================================
# 薪资条目API - 基于视图
# =============================================================================

@router.get("/entries", response_model=PaginationResponse)
async def get_payroll_entries_v2(
    # 过滤参数
    period_id: Optional[int] = Query(None, description="薪资周期ID"),
    run_id: Optional[int] = Query(None, description="薪资运行ID"),
    employee_id: Optional[int] = Query(None, description="员工ID"),
    department_id: Optional[int] = Query(None, description="部门ID"),
    
    # 分页参数
    page: int = Query(1, ge=1, description="页码"),
    size: int = Query(50, ge=1, le=100, description="每页记录数"),
    
    # 依赖注入
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["payroll_entry:view"]))
):
    """
    获取薪资条目列表 (基于视图)
    
    ✅ 优势：
    - JSONB字段完全展开为结构化列
    - 包含员工、部门、职位信息
    - 包含所有收入和扣除明细
    - 包含计算衍生字段（各类合计）
    - 高性能查询，无需复杂JOIN
    """
    try:
        payroll_service = PayrollBusinessService(db)
        
        # 构建过滤条件
        filters = {}
        if period_id is not None:
            filters["period_id"] = period_id
        if run_id is not None:
            filters["run_id"] = run_id
        if employee_id is not None:
            filters["employee_id"] = employee_id
        if department_id is not None:
            filters["department_id"] = department_id
        
        # 获取详细条目数据
        result = payroll_service.entries.get_detailed_entries(
            page=page,
            size=size,
            **filters
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="获取薪资条目列表失败",
                details=str(e)
            )
        )


# =============================================================================
# 薪资组件API - 基于视图
# =============================================================================

@router.get("/components", response_model=PaginationResponse)
async def get_payroll_components_v2(
    # 过滤参数
    component_type: Optional[str] = Query(None, description="组件类型"),
    is_active: Optional[bool] = Query(None, description="是否活跃"),
    
    # 分页参数
    page: int = Query(1, ge=1, description="页码"),
    size: int = Query(50, ge=1, le=100, description="每页记录数"),
    
    # 依赖注入
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["payroll_component:view"]))
):
    """
    获取薪资组件列表 (基于视图)
    
    ✅ 优势：
    - 包含使用统计（员工数量）
    - 包含计算方法和配置参数
    - 按类型和名称排序
    """
    try:
        payroll_service = PayrollBusinessService(db)
        
        # 构建过滤条件
        filters = {}
        if component_type is not None:
            filters["component_type"] = component_type
        if is_active is not None:
            filters["is_active"] = is_active
        
        # 获取组件数据
        result = payroll_service.components.get_components_with_usage(
            page=page,
            size=size,
            **filters
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="获取薪资组件列表失败",
                details=str(e)
            )
        )


# =============================================================================
# 薪资分析API - 基于视图
# =============================================================================

@router.get("/analysis/summary", response_model=PaginationResponse)
async def get_payroll_summary_analysis_v2(
    # 过滤参数
    period_id: Optional[int] = Query(None, description="薪资周期ID"),
    department_id: Optional[int] = Query(None, description="部门ID"),
    
    # 分页参数
    page: int = Query(1, ge=1, description="页码"),
    size: int = Query(100, ge=1, le=500, description="每页记录数"),
    
    # 依赖注入
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["payroll_entry:view"]))
):
    """
    获取薪资汇总分析 (基于视图)
    
    ✅ 优势：
    - 按周期和部门分组的汇总统计
    - 包含平均值和总计
    - 包含主要收入和扣除项目分类
    - 高性能的预聚合数据
    """
    try:
        payroll_service = PayrollBusinessService(db)
        
        # 构建过滤条件
        filters = {}
        if period_id is not None:
            filters["period_id"] = period_id
        if department_id is not None:
            filters["department_id"] = department_id
        
        # 获取汇总分析数据
        summary_service = payroll_service.entries.get_entry_summary_by_department(
            period_id=period_id
        )
        
        # 简单分页处理
        start = (page - 1) * size
        end = start + size
        paginated_data = summary_service[start:end]
        total = len(summary_service)
        
        return payroll_service.format_pagination_response(
            paginated_data, total, page, size
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="获取薪资汇总分析失败",
                details=str(e)
            )
        )


# =============================================================================
# 薪资仪表板API
# =============================================================================

@router.get("/dashboard", response_model=DataResponse)
async def get_payroll_dashboard_v2(
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["payroll_entry:view"]))
):
    """
    获取薪资仪表板数据 (基于视图)
    
    ✅ 优势：
    - 整合多个视图的汇总数据
    - 提供关键指标概览
    - 高性能的预聚合查询
    """
    try:
        payroll_service = PayrollBusinessService(db)
        
        # 获取仪表板汇总数据
        dashboard_data = payroll_service.get_dashboard_summary()
        
        return DataResponse(data=dashboard_data)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="获取薪资仪表板数据失败",
                details=str(e)
            )
        )


# =============================================================================
# 员工薪资历史API - 基于视图
# =============================================================================

@router.get("/employee-salary-history", response_model=PaginationResponse)
async def get_employee_salary_history_v2(
    # 过滤参数
    employee_id: Optional[int] = Query(None, description="员工ID"),
    period_id: Optional[int] = Query(None, description="薪资周期ID"),
    department_id: Optional[int] = Query(None, description="部门ID"),
    start_date: Optional[str] = Query(None, description="开始日期 (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="结束日期 (YYYY-MM-DD)"),
    min_gross_pay: Optional[float] = Query(None, description="最低应发工资"),
    max_gross_pay: Optional[float] = Query(None, description="最高应发工资"),
    
    # 分页参数
    page: int = Query(1, ge=1, description="页码"),
    size: int = Query(50, ge=1, le=200, description="每页记录数"),
    
    # 排序参数
    order_by: Optional[str] = Query(None, description="排序字段"),
    
    # 依赖注入
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["payroll_entry:view"]))
):
    """
    获取员工薪资历史列表 (基于视图)
    
    ✅ 优势：
    - 包含完整的薪资组件明细
    - 支持多维度过滤和搜索
    - 包含排名和统计信息
    - 高性能查询，无需复杂JOIN
    """
    try:
        # 使用业务服务
        payroll_service = PayrollBusinessService(db)
        
        # 获取薪资历史数据
        data, total = payroll_service.salary_history.get_employee_salary_history(
            employee_id=employee_id,
            period_id=period_id,
            department_id=department_id,
            start_date=start_date,
            end_date=end_date,
            min_gross_pay=min_gross_pay,
            max_gross_pay=max_gross_pay,
            page=page,
            size=size,
            order_by=order_by
        )
        
        # 格式化响应
        return payroll_service.format_pagination_response(data, total, page, size)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="获取员工薪资历史失败",
                details=str(e)
            )
        )


@router.get("/employee-salary-trend/{employee_id}", response_model=DataResponse)
async def get_employee_salary_trend_v2(
    employee_id: int,
    limit: int = Query(12, ge=1, le=24, description="返回记录数限制"),
    
    # 依赖注入
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["payroll_entry:view"]))
):
    """
    获取员工薪资趋势数据 (基于视图)
    
    ✅ 优势：
    - 专门用于图表展示的薪资趋势
    - 包含关键薪资指标的时间序列
    - 轻量级查询，适合前端图表
    """
    try:
        # 使用业务服务
        payroll_service = PayrollBusinessService(db)
        
        # 获取薪资趋势数据
        trend_data = payroll_service.salary_history.get_employee_salary_trend(
            employee_id=employee_id,
            limit=limit
        )
        
        return DataResponse(
            success=True,
            data=trend_data,
            message=f"成功获取员工 {employee_id} 的薪资趋势数据"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="获取员工薪资趋势失败",
                details=str(e)
            )
        )


@router.get("/salary-statistics", response_model=DataResponse)
async def get_salary_statistics_v2(
    period_id: Optional[int] = Query(None, description="薪资周期ID"),
    department_id: Optional[int] = Query(None, description="部门ID"),
    
    # 依赖注入
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["payroll_entry:view"]))
):
    """
    获取薪资统计数据 (基于视图)
    
    ✅ 优势：
    - 基于薪资历史视图的统计分析
    - 包含部门、周期等维度的统计
    - 适合仪表板展示
    """
    try:
        # 使用业务服务
        payroll_service = PayrollBusinessService(db)
        
        # 构建过滤条件
        filters = {}
        if period_id is not None:
            filters["period_id"] = period_id
        if department_id is not None:
            filters["department_id"] = department_id
        
        # 获取统计数据
        from sqlalchemy import text
        
        # 基础统计查询
        stats_query = """
        SELECT 
            COUNT(*) as total_entries,
            COUNT(DISTINCT employee_id) as unique_employees,
            COUNT(DISTINCT period_id) as unique_periods,
            COUNT(DISTINCT department_id) as unique_departments,
            AVG(gross_pay) as avg_gross_pay,
            MIN(gross_pay) as min_gross_pay,
            MAX(gross_pay) as max_gross_pay,
            SUM(gross_pay) as total_gross_pay,
            AVG(net_pay) as avg_net_pay,
            SUM(net_pay) as total_net_pay,
            AVG(total_deductions) as avg_deductions,
            SUM(total_deductions) as total_deductions
        FROM v_employee_salary_history
        WHERE 1=1
        """
        
        params = {}
        if period_id is not None:
            stats_query += " AND period_id = :period_id"
            params["period_id"] = period_id
        if department_id is not None:
            stats_query += " AND department_id = :department_id"
            params["department_id"] = department_id
        
        result = db.execute(text(stats_query), params)
        stats = dict(result.mappings().first())
        
        # 格式化数值
        for key, value in stats.items():
            if value is not None and isinstance(value, (int, float)):
                if 'avg_' in key or 'total_' in key or 'min_' in key or 'max_' in key:
                    stats[key] = round(float(value), 2)
        
        return DataResponse(
            success=True,
            data=stats,
            message="成功获取薪资统计数据"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="获取薪资统计数据失败",
                details=str(e)
            )
        ) 