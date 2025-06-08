"""
视图层API路由
为数据库视图提供RESTful API端点，简化前端API调用并提高性能
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import text

from webapp.database import get_db as get_session
from webapp.v2.utils.auth import get_current_user_id

router = APIRouter(prefix="/views", tags=["Views"])

# =============================================================================
# 响应模型定义
# =============================================================================

class PayrollPeriodDetailResponse(BaseModel):
    """薪资周期详情响应模型"""
    id: int
    name: str
    description: Optional[str] = None
    frequency_name: str
    status_name: str
    is_active: bool
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    runs_count: int = 0
    entries_count: int = 0
    created_at: str
    updated_at: str

class PayrollRunDetailResponse(BaseModel):
    """薪资运行详情响应模型"""
    id: int
    period_id: int
    period_name: str
    period_description: Optional[str] = None
    status_name: str
    initiated_by_username: Optional[str] = None
    total_entries: int = 0
    total_gross_pay: float = 0.0
    total_net_pay: float = 0.0
    total_deductions: float = 0.0
    initiated_at: str
    calculated_at: Optional[str] = None
    approved_at: Optional[str] = None

class EmployeeBasicResponse(BaseModel):
    """员工基础信息响应模型"""
    id: int
    employee_code: Optional[str] = None  # Allow None for cases where employee_code is NULL in database
    first_name: str
    last_name: str
    full_name: str
    phone_number: Optional[str] = None
    email: Optional[str] = None
    department_name: Optional[str] = None
    position_name: Optional[str] = None
    personnel_category_name: Optional[str] = None
    employee_status: str
    hire_date: Optional[str] = None

class PayrollComponentBasicResponse(BaseModel):
    """薪资组件基础响应模型"""
    id: int
    name: str
    description: Optional[str] = None
    component_type: str
    calculation_method: str
    is_active: bool
    config_params: Optional[Dict[str, Any]] = None
    employees_count: int = 0
    created_at: str
    updated_at: str

class PayrollEntryBasicResponse(BaseModel):
    """薪资条目基础响应模型"""
    id: int
    employee_id: int
    employee_code: str
    employee_name: str
    department_name: Optional[str] = None
    position_name: Optional[str] = None
    period_id: int
    period_name: str
    gross_pay: float = 0.0
    net_pay: float = 0.0
    total_deductions: float = 0.0
    earnings_details: Optional[Dict[str, Any]] = None
    deductions_details: Optional[Dict[str, Any]] = None
    created_at: str
    updated_at: str

class PayrollEntryDetailedResponse(BaseModel):
    """薪资条目详情响应模型 (包含JSONB展开字段)"""
    id: int
    employee_id: int
    employee_code: Optional[str] = None
    employee_name: str
    department_name: Optional[str] = None
    position_name: Optional[str] = None
    period_id: int
    period_name: str
    gross_pay: float = 0.0
    net_pay: float = 0.0
    total_deductions: float = 0.0

    # Expanded earnings
    basic_salary: float = Field(default=0.0, description="基本工资")
    performance_salary: float = Field(default=0.0, description="绩效工资")
    position_salary: float = Field(default=0.0, description="岗位工资")
    grade_salary: float = Field(default=0.0, description="级别工资")
    allowance: float = Field(default=0.0, description="综合津补贴")
    subsidy: float = Field(default=0.0, description="补贴")
    basic_performance_salary: float = Field(default=0.0, description="基础绩效")
    performance_wage: float = Field(default=0.0, description="绩效工资") # Note: duplicate description with performance_salary, consider clarifying if different fields
    traffic_allowance: float = Field(default=0.0, description="交通补贴")
    only_child_bonus: float = Field(default=0.0, description="独生子女父母奖励费")
    township_allowance: float = Field(default=0.0, description="乡镇工作补贴")
    position_allowance: float = Field(default=0.0, description="岗位津贴")
    civil_servant_allowance: float = Field(default=0.0, description="公务员规范津补贴")
    back_pay: float = Field(default=0.0, description="补发工资")
    monthly_performance_bonus: float = Field(default=0.0, description="月度绩效奖金")
    position_tech_grade_salary: float = Field(default=0.0, description="职务技术等级工资")
    grade_position_level_salary: float = Field(default=0.0, description="级别职务层次工资")
    basic_performance_award: float = Field(default=0.0, description="基础绩效奖")
    performance_bonus_back_pay: float = Field(default=0.0, description="绩效奖金补发")
    quarterly_performance_assessment: float = Field(default=0.0, description="季度绩效考核")
    reform_allowance_1993: float = Field(default=0.0, description="1993年改革津贴")
    probation_salary: float = Field(default=0.0, description="试用期工资")
    staff_salary_grade: float = Field(default=0.0, description="职员薪级工资")
    salary_grade: float = Field(default=0.0, description="薪级工资")
    basic_performance: float = Field(default=0.0, description="基础绩效")
    petition_allowance: float = Field(default=0.0, description="信访津贴")
    quarterly_performance_q1: float = Field(default=0.0, description="第一季度绩效")

    # Expanded deductions
    personal_income_tax: float = Field(default=0.0, description="个人所得税")
    pension_personal: float = Field(default=0.0, description="养老保险个人")
    medical_personal: float = Field(default=0.0, description="医疗保险个人")
    unemployment_personal: float = Field(default=0.0, description="失业保险个人")
    housing_fund_personal: float = Field(default=0.0, description="住房公积金个人")
    annuity_personal: float = Field(default=0.0, description="职业年金个人")
    adjustment_deduction: float = Field(default=0.0, description="调整扣款")
    social_security_adjustment: float = Field(default=0.0, description="社保调整")
    medical_ins_personal_total: float = Field(default=0.0, description="医疗保险个人合计")
    performance_bonus_adjustment: float = Field(default=0.0, description="绩效奖金调整")
    reward_performance_adjustment: float = Field(default=0.0, description="奖励绩效调整")
    performance_bonus_deduction_adjustment: float = Field(default=0.0, description="绩效奖金扣除调整")
    medical_2022_deduction_adjustment: float = Field(default=0.0, description="2022年医疗扣除调整")
    refund_deduction_adjustment: float = Field(default=0.0, description="退款扣除调整")




    
    personnel_category_name: Optional[str] = None
    calculated_at: Optional[str] = None # In view as calculated_at
    updated_at: str # In view as updated_at, in PayrollEntryBasicResponse was created_at & updated_at. Assuming updated_at is the primary one.

class PayrollComponentUsageResponse(BaseModel):
    """薪资组件使用统计响应模型"""
    id: int
    code: str
    name: str
    component_type: str
    is_active: bool
    earnings_usage_count: int
    deductions_usage_count: int
    total_amount: float
    average_amount: float
    display_order: Optional[int] = None
    effective_date: Optional[str] = None
    end_date: Optional[str] = None

class PayrollSummaryAnalysisResponse(BaseModel):
    """薪资汇总分析响应模型"""
    period_id: int
    period_name: str
    department_id: Optional[int] = None # department_id can be NULL if some entries don't have it
    department_name: Optional[str] = None
    employee_count: int
    unique_employee_count: int
    total_gross_pay: float
    total_net_pay: float
    total_deductions: float
    avg_gross_pay: float
    avg_net_pay: float
    avg_deductions: float
    total_basic_salary: float
    total_performance_salary: float
    total_allowance: float
    total_subsidy: float
    total_income_tax: float
    total_pension_deduction: float
    total_medical_deduction: float
    total_housing_fund_deduction: float
    first_entry_date: Optional[str] = None
    last_updated_date: Optional[str] = None

# =============================================================================
# 薪资周期详情视图 API
# =============================================================================

@router.get("/payroll-periods", response_model=List[PayrollPeriodDetailResponse])
async def get_payroll_periods_detail(
    is_active: Optional[bool] = Query(None, description="是否活跃"),
    limit: int = Query(100, le=200, description="返回记录数限制"),
    offset: int = Query(0, ge=0, description="偏移量"),
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id)
):
    """
    获取薪资周期详情列表
    使用 v_payroll_periods_detail 视图，包含状态映射和统计信息
    """
    try:
        # 构建查询条件
        conditions = []
        if is_active is not None:
            conditions.append(f"is_active = {is_active}")
        
        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
        
        query = f"""
        SELECT 
            id, name, description, frequency_name, status_name, is_active,
            start_date::text, end_date::text, runs_count, entries_count,
            created_at::text, updated_at::text
        FROM v_payroll_periods_detail
        {where_clause}
        ORDER BY created_at DESC
        LIMIT {limit} OFFSET {offset}
        """
        
        result = session.execute(text(query))
        
        periods = []
        for row in result:
            periods.append(PayrollPeriodDetailResponse(
                id=row.id,
                name=row.name,
                description=row.description,
                frequency_name=row.frequency_name,
                status_name=row.status_name,
                is_active=row.is_active,
                start_date=row.start_date,
                end_date=row.end_date,
                runs_count=row.runs_count,
                entries_count=row.entries_count,
                created_at=row.created_at,
                updated_at=row.updated_at
            ))
        
        return periods
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"查询薪资周期详情失败: {str(e)}")

@router.get("/payroll-periods/{period_id}", response_model=PayrollPeriodDetailResponse)
async def get_payroll_period_detail(
    period_id: int,
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id)
):
    """获取单个薪资周期详情"""
    try:
        query = """
        SELECT 
            id, name, description, frequency_name, status_name, is_active,
            start_date::text, end_date::text, runs_count, entries_count,
            created_at::text, updated_at::text
        FROM v_payroll_periods_detail
        WHERE id = :period_id
        """
        
        result = session.execute(text(query), {"period_id": period_id}).first()
        
        if not result:
            raise HTTPException(status_code=404, detail="薪资周期不存在")
        
        return PayrollPeriodDetailResponse(
            id=result.id,
            name=result.name,
            description=result.description,
            frequency_name=result.frequency_name,
            status_name=result.status_name,
            is_active=result.is_active,
            start_date=result.start_date,
            end_date=result.end_date,
            runs_count=result.runs_count,
            entries_count=result.entries_count,
            created_at=result.created_at,
            updated_at=result.updated_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"查询薪资周期详情失败: {str(e)}")

# =============================================================================
# 薪资运行详情视图 API
# =============================================================================

@router.get("/payroll-runs", response_model=List[PayrollRunDetailResponse])
async def get_payroll_runs_detail(
    period_id: Optional[int] = Query(None, description="薪资周期ID"),
    status_id: Optional[int] = Query(None, description="状态ID"),
    limit: int = Query(100, le=200, description="返回记录数限制"),
    offset: int = Query(0, ge=0, description="偏移量"),
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id)
):
    """
    获取薪资运行详情列表
    使用 v_payroll_runs_detail 视图，包含周期信息和统计数据
    """
    try:
        # 构建查询条件
        conditions = []
        params = {}
        
        if period_id is not None:
            conditions.append("period_id = :period_id")
            params["period_id"] = period_id
            
        if status_id is not None:
            conditions.append("status_id = :status_id")
            params["status_id"] = status_id
        
        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
        
        query = f"""
        SELECT 
            id, period_id, period_name, period_description, status_name,
            initiated_by_username, total_entries, total_gross_pay, total_net_pay, total_deductions,
            initiated_at::text, calculated_at::text, approved_at::text
        FROM v_payroll_runs_detail
        {where_clause}
        ORDER BY initiated_at DESC
        LIMIT {limit} OFFSET {offset}
        """
        
        result = session.execute(text(query), params)
        
        runs = []
        for row in result:
            runs.append(PayrollRunDetailResponse(
                id=row.id,
                period_id=row.period_id,
                period_name=row.period_name,
                period_description=row.period_description,
                status_name=row.status_name,
                initiated_by_username=row.initiated_by_username,
                total_entries=row.total_entries or 0,
                total_gross_pay=float(row.total_gross_pay or 0),
                total_net_pay=float(row.total_net_pay or 0),
                total_deductions=float(row.total_deductions or 0),
                initiated_at=row.initiated_at,
                calculated_at=row.calculated_at,
                approved_at=None  # PayrollRun 模型没有 approved_at 字段
            ))
        
        return runs
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"查询薪资运行详情失败: {str(e)}")

# =============================================================================
# 员工基础信息视图 API  
# =============================================================================

@router.get("/employees", response_model=List[EmployeeBasicResponse])
async def get_employees_basic(
    department_id: Optional[int] = Query(None, description="部门ID"),
    position_id: Optional[int] = Query(None, description="职位ID"),
    is_active: Optional[bool] = Query(None, description="是否在职"),
    search: Optional[str] = Query(None, description="搜索关键词（姓名、工号）"),
    limit: int = Query(100, le=200, description="返回记录数限制"),
    offset: int = Query(0, ge=0, description="偏移量"),
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id)
):
    """
    获取员工基础信息列表
    使用 v_employees_basic 视图，包含部门、职位、状态信息
    """
    try:
        # 构建查询条件
        conditions = []
        params = {}
        
        if department_id is not None:
            conditions.append("department_id = :department_id")
            params["department_id"] = department_id
            
        if position_id is not None:
            conditions.append("actual_position_id = :position_id")
            params["position_id"] = position_id
            
        if is_active is not None:
            if is_active:
                conditions.append("employee_status = '在职'")
            else:
                conditions.append("employee_status != '在职'")
                
        if search:
            conditions.append("(full_name ILIKE :search OR employee_code ILIKE :search)")
            params["search"] = f"%{search}%"
        
        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
        
        query = f"""
        SELECT 
            id, employee_code, first_name, last_name, full_name,
            phone_number, email, department_name, position_name, 
            personnel_category_name, employee_status,
            hire_date::text
        FROM v_employees_basic
        {where_clause}
        ORDER BY employee_code
        LIMIT {limit} OFFSET {offset}
        """
        
        result = session.execute(text(query), params)
        
        employees = []
        for row in result:
            employees.append(EmployeeBasicResponse(
                id=row.id,
                employee_code=row.employee_code,
                first_name=row.first_name,
                last_name=row.last_name,
                full_name=row.full_name,
                phone_number=row.phone_number,
                email=row.email,
                department_name=row.department_name,
                position_name=row.position_name,
                personnel_category_name=row.personnel_category_name,
                employee_status=row.employee_status,
                hire_date=row.hire_date
            ))
        
        return employees
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"查询员工基础信息失败: {str(e)}")

# =============================================================================
# 薪资组件基础视图 API
# =============================================================================

@router.get("/payroll-components", response_model=List[PayrollComponentBasicResponse])
async def get_payroll_components_basic(
    component_type: Optional[str] = Query(None, description="组件类型"),
    is_active: Optional[bool] = Query(None, description="是否活跃"),
    limit: int = Query(100, le=200, description="返回记录数限制"),
    offset: int = Query(0, ge=0, description="偏移量"),
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id)
):
    """
    获取薪资组件基础信息列表
    使用 v_payroll_components_basic 视图，包含类型、方法和使用统计
    """
    try:
        # 构建查询条件
        conditions = []
        params = {}
        
        if component_type:
            conditions.append("component_type = :component_type")
            params["component_type"] = component_type
            
        if is_active is not None:
            conditions.append("is_active = :is_active")
            params["is_active"] = is_active
        
        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
        
        query = f"""
        SELECT 
            id, name, description, component_type, calculation_method,
            is_active, config_params, employees_count,
            created_at::text, updated_at::text
        FROM v_payroll_components_basic
        {where_clause}
        ORDER BY component_type, name
        LIMIT {limit} OFFSET {offset}
        """
        
        result = session.execute(text(query), params)
        
        components = []
        for row in result:
            components.append(PayrollComponentBasicResponse(
                id=row.id,
                name=row.name,
                description=row.description,
                component_type=row.component_type,
                calculation_method=row.calculation_method,
                is_active=row.is_active,
                config_params=row.config_params,
                employees_count=row.employees_count or 0,
                created_at=row.created_at,
                updated_at=row.updated_at
            ))
        
        return components
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"查询薪资组件基础信息失败: {str(e)}")

# =============================================================================
# 薪资条目基础视图 API
# =============================================================================

@router.get("/payroll-entries")
async def get_payroll_entries_detailed(
    period_id: Optional[int] = Query(None, description="薪资周期ID"),
    employee_id: Optional[int] = Query(None, description="员工ID"),
    department_id: Optional[int] = Query(None, description="部门ID"),
    limit: int = Query(100, le=200, description="返回记录数限制"),
    offset: int = Query(0, ge=0, description="偏移量"),
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id)
):
    """
    获取薪资条目详细信息列表
    使用 v_comprehensive_employee_payroll 视图，包含完整的员工信息和展开的薪资明细
    """
    try:
        # 构建查询条件
        conditions = []
        params = {}
        
        if period_id is not None:
            conditions.append("payroll_period_id = :period_id")
            params["period_id"] = period_id
            
        if employee_id is not None:
            conditions.append("employee_id = :employee_id")
            params["employee_id"] = employee_id
            
        if department_id is not None:
            conditions.append("department_id = :department_id") 
            params["department_id"] = department_id
        
        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
        
                # 动态获取薪资组件定义
        component_query = """
        SELECT code, name, type 
        FROM config.payroll_component_definitions 
        WHERE is_active = true 
        AND type IN ('EARNING', 'PERSONAL_DEDUCTION', 'EMPLOYER_DEDUCTION', 'CALCULATION_BASE', 'CALCULATION_RATE', 'CALCULATION_RESULT')
        ORDER BY type, code
        """
        component_result = session.execute(text(component_query))
        components = list(component_result)
        
        # 构建动态字段列表
        dynamic_fields = []
        for comp in components:
            field_name = comp.code.lower()
            dynamic_fields.append(f"COALESCE({field_name}, 0) as {field_name}")
        
        # 使用动态字段构建查询
        query = f"""
        SELECT 
            payroll_entry_id as id, employee_id, employee_code, full_name as employee_name, 
            id_number, department_name, position_name,
            payroll_period_id as period_id, payroll_period_name as period_name, 
            gross_pay, net_pay, total_deductions,
            
            -- 动态薪资组件字段
            {', '.join(dynamic_fields)},
            
            personnel_category_name, calculated_at::text, updated_at::text
        FROM reports.v_comprehensive_employee_payroll
        {where_clause}
        ORDER BY employee_code, payroll_entry_id
        LIMIT {limit} OFFSET {offset}
        """
        
        result = session.execute(text(query), params)
        
        entries = []
        for row_proxy in result:
            row = dict(row_proxy._mapping) # Convert RowProxy to dict for easier access
            
            # 构建基础信息
            entry_data = {
                "id": row['id'],
                "employee_id": row['employee_id'],
                "employee_code": row['employee_code'],
                "employee_name": row['employee_name'],
                "id_number": row.get('id_number'),
                "department_name": row.get('department_name'),
                "position_name": row.get('position_name'),
                "period_id": row['period_id'],
                "period_name": row['period_name'],
                "gross_pay": float(row.get('gross_pay', 0) or 0),
                "net_pay": float(row.get('net_pay', 0) or 0),
                "total_deductions": float(row.get('total_deductions', 0) or 0),
                "personnel_category_name": row.get('personnel_category_name'),
                "calculated_at": row.get('calculated_at'),
                "updated_at": row['updated_at']
            }
            
            # 动态添加薪资组件字段（只返回字段值）
            for comp in components:
                field_name = comp.code.lower()
                field_value = float(row.get(field_name, 0) or 0)
                
                # 只添加字段值，不添加复杂对象
                entry_data[field_name] = field_value
            
            entries.append(entry_data)
        
        return entries
        
    except Exception as e:
        # Log the error for debugging
        print(f"Error in get_payroll_entries_detailed: {str(e)}") 
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"查询薪资条目详细信息失败: {str(e)}")

# =============================================================================
# 薪资组件使用统计视图 API
# =============================================================================

@router.get("/payroll-components-usage", response_model=List[PayrollComponentUsageResponse])
async def get_payroll_components_usage(
    component_type: Optional[str] = Query(None, description="组件类型 (e.g., EARNING, DEDUCTION)"),
    is_active: Optional[bool] = Query(None, description="组件是否活跃"),
    min_usage_count: Optional[int] = Query(None, description="最小使用次数（收入或扣除）"),
    limit: int = Query(100, le=200, description="返回记录数限制"), # Increased limit for this analytical view
    offset: int = Query(0, ge=0, description="偏移量"),
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id)
):
    """
    获取薪资组件使用统计信息列表。
    使用 v_payroll_component_usage 视图。
    """
    try:
        conditions = []
        params = {}

        if component_type:
            conditions.append("component_type = :component_type")
            params["component_type"] = component_type
        
        if is_active is not None:
            conditions.append("is_active = :is_active")
            params["is_active"] = is_active

        if min_usage_count is not None:
            conditions.append("(earnings_usage_count >= :min_usage OR deductions_usage_count >= :min_usage)")
            params["min_usage"] = min_usage_count
            
        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
        
        query = f"""
        SELECT 
            id, code, name, component_type, is_active, 
            earnings_usage_count, deductions_usage_count, 
            total_amount, average_amount, 
            display_order, effective_date::text, end_date::text
        FROM v_payroll_component_usage
        {where_clause}
        ORDER BY component_type, COALESCE(display_order, 0), name
        LIMIT {limit} OFFSET {offset}
        """
        
        result = session.execute(text(query), params)
        
        usage_stats = []
        for row_proxy in result:
            row = dict(row_proxy.items())
            usage_stats.append(PayrollComponentUsageResponse(
                id=row['id'],
                code=row['code'],
                name=row['name'],
                component_type=row['component_type'],
                is_active=row['is_active'],
                earnings_usage_count=row.get('earnings_usage_count', 0),
                deductions_usage_count=row.get('deductions_usage_count', 0),
                total_amount=float(row.get('total_amount', 0.0) or 0.0),
                average_amount=float(row.get('average_amount', 0.0) or 0.0),
                display_order=row.get('display_order'),
                effective_date=row.get('effective_date'),
                end_date=row.get('end_date')
            ))
        return usage_stats

    except Exception as e:
        print(f"Error in get_payroll_components_usage: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"查询薪资组件使用统计失败: {str(e)}")

# =============================================================================
# 薪资汇总分析视图 API
# =============================================================================

@router.get("/analysis/payroll-summary", response_model=List[PayrollSummaryAnalysisResponse])
async def get_payroll_summary_analysis(
    period_id: Optional[int] = Query(None, description="薪资周期ID"),
    department_id: Optional[int] = Query(None, description="部门ID"),
    limit: int = Query(100, le=500, description="返回记录数限制"), # Higher limit for summary data
    offset: int = Query(0, ge=0, description="偏移量"),
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id)
):
    """
    获取薪资汇总分析数据。
    使用 v_payroll_summary_analysis 视图，按周期和部门分组。
    """
    try:
        conditions = []
        params = {}

        if period_id is not None:
            conditions.append("period_id = :period_id")
            params["period_id"] = period_id
        
        if department_id is not None:
            conditions.append("department_id = :department_id")
            params["department_id"] = department_id
            
        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
        
        query = f"""
        SELECT 
            period_id, period_name, department_id, department_name,
            employee_count, unique_employee_count,
            total_gross_pay, total_net_pay, total_deductions,
            avg_gross_pay, avg_net_pay, avg_deductions,
            total_basic_salary, total_performance_salary, total_allowance, total_subsidy,
            total_income_tax, total_pension_deduction, total_medical_deduction, total_housing_fund_deduction,
            first_entry_date::text, last_updated_date::text
        FROM v_payroll_summary_analysis
        {where_clause}
        ORDER BY period_name DESC, department_name
        LIMIT {limit} OFFSET {offset}
        """
        
        result = session.execute(text(query), params)
        
        summary_data = []
        for row_proxy in result:
            row = dict(row_proxy.items())
            summary_data.append(PayrollSummaryAnalysisResponse(**row))
        
        return summary_data

    except Exception as e:
        print(f"Error in get_payroll_summary_analysis: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"查询薪资汇总分析失败: {str(e)}")

# =============================================================================
# 统计信息 API
# =============================================================================

@router.get("/stats/summary")
async def get_views_stats_summary(
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id)
):
    """获取视图层统计摘要信息"""
    try:
        query = """
        SELECT 
            (SELECT COUNT(*) FROM v_payroll_periods_detail WHERE is_active = true) as active_periods,
            (SELECT COUNT(*) FROM v_payroll_runs_detail) as total_runs,
            (SELECT COUNT(*) FROM v_employees_basic WHERE employee_status = '在职') as active_employees,
            (SELECT COUNT(*) FROM v_payroll_components_basic WHERE is_active = true) as active_components,
            (SELECT COUNT(*) FROM v_payroll_entries_basic) as total_entries,
            (SELECT COALESCE(SUM(gross_pay), 0) FROM v_payroll_entries_basic) as total_gross_pay
        """
        
        result = session.execute(text(query)).first()
        
        return {
            "active_periods": result.active_periods,
            "total_runs": result.total_runs,
            "active_employees": result.active_employees,
            "active_components": result.active_components,
            "total_entries": result.total_entries,
            "total_gross_pay": float(result.total_gross_pay)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取统计信息失败: {str(e)}") 