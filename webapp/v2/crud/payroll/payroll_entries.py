"""
薪资条目相关的CRUD操作。
"""
from sqlalchemy.orm import Session, selectinload, joinedload
from sqlalchemy import func, or_, select, text
from typing import List, Optional, Tuple
from datetime import datetime
import json
import logging

from ...models.payroll import PayrollEntry, PayrollRun, PayrollPeriod
from ...models.hr import Employee, Department, PersonnelCategory  
from ...models.config import PayrollComponentDefinition
from ...pydantic_models.payroll import PayrollEntryCreate, PayrollEntryUpdate, PayrollEntryPatch
from ..config import get_payroll_component_definitions
from .utils import convert_decimals_to_float

logger = logging.getLogger(__name__)


def get_payroll_entries(
    db: Session,
    employee_id: Optional[int] = None,
    period_id: Optional[int] = None, 
    run_id: Optional[int] = None, 
    status_id: Optional[int] = None, 
    search_term: Optional[str] = None,
    department_name: Optional[str] = None,
    personnel_category_name: Optional[str] = None,
    min_gross_pay: Optional[float] = None,
    max_gross_pay: Optional[float] = None,
    min_net_pay: Optional[float] = None,
    max_net_pay: Optional[float] = None,
    sort_by: Optional[str] = None,
    sort_order: Optional[str] = "asc",
    skip: int = 0,
    limit: int = 100
) -> Tuple[List[dict], int]:
    """
    使用视图优化的薪资条目查询
    
    使用 v_comprehensive_employee_payroll 视图，包含完整的员工信息和薪资明细
    
    Returns:
        薪资条目字典列表和总数的元组
    """
    try:
        logger.info(f"🔍 开始视图查询: employee_id={employee_id}, period_id={period_id}, run_id={run_id}")
        
        # 构建查询条件
        conditions = []
        params = {}
        
        # 基础筛选条件
        if employee_id:
            conditions.append('"员工id" = :employee_id')
            params['employee_id'] = employee_id
            
        if period_id:
            conditions.append('"薪资期间id" = :period_id')
            params['period_id'] = period_id
            
        if run_id:
            conditions.append('"薪资运行id" = :run_id')
            params['run_id'] = run_id
            
        # 部门筛选
        if department_name:
            conditions.append('"部门名称" ILIKE :department_name')
            params['department_name'] = f"%{department_name}%"
            
        # 人员类别筛选
        if personnel_category_name:
            conditions.append('"人员类别" ILIKE :personnel_category_name')
            params['personnel_category_name'] = f"%{personnel_category_name}%"
            
        # 工资范围筛选
        if min_gross_pay is not None:
            conditions.append('"应发合计" >= :min_gross_pay')
            params['min_gross_pay'] = min_gross_pay
            
        if max_gross_pay is not None:
            conditions.append('"应发合计" <= :max_gross_pay')
            params['max_gross_pay'] = max_gross_pay
            
        if min_net_pay is not None:
            conditions.append('"实发合计" >= :min_net_pay')
            params['min_net_pay'] = min_net_pay
            
        if max_net_pay is not None:
            conditions.append('"实发合计" <= :max_net_pay')
            params['max_net_pay'] = max_net_pay
            
        # 搜索筛选
        if search_term:
            if search_term.isdigit():
                conditions.append('"薪资条目id" = :search_entry_id')
                params['search_entry_id'] = int(search_term)
            else:
                conditions.append("""(
                    "名" ILIKE :search_term OR 
                    "姓" ILIKE :search_term OR 
                    "姓名" ILIKE :search_term OR
                    "员工编号" ILIKE :search_term
                )""")
                params['search_term'] = f"%{search_term}%"
        
        # 构建WHERE子句
        where_clause = ""
        if conditions:
            where_clause = "WHERE " + " AND ".join(conditions)
        
        # 排序处理
        order_clause = 'ORDER BY "薪资条目id" DESC'  # 默认排序
        if sort_by:
            sort_direction = "DESC" if sort_order.lower() == 'desc' else "ASC"
            
            # 映射排序字段到视图中实际存在的字段
            sort_field_mapping = {
                'employee_name': '"姓名"',
                'department': '"部门名称"',
                'gross_pay': '"应发合计"',
                'net_pay': '"实发合计"',
                'calculated_at': '"计算时间"'
            }
            
            if sort_by in sort_field_mapping:
                order_clause = f"ORDER BY {sort_field_mapping[sort_by]} {sort_direction}"
            elif sort_by == 'id':
                order_clause = f'ORDER BY "薪资条目id" {sort_direction}'
        
        # 分页参数
        params['limit'] = limit
        params['offset'] = skip
        
        # 查询总数
        count_sql = f"""
            SELECT COUNT(*) as total
            FROM reports.v_comprehensive_employee_payroll
            {where_clause}
        """
        
        count_result = db.execute(text(count_sql), params).fetchone()
        total = count_result.total if count_result else 0
        
        # 查询数据 - 使用正确的中文列名
        data_sql = f"""
            SELECT 
                "薪资条目id" as id,
                "员工id" as employee_id,
                "薪资期间id" as payroll_period_id,
                "薪资运行id" as payroll_run_id,
                "员工编号" as employee_code,
                "名" as first_name,
                "姓" as last_name,
                "姓名" as employee_name,
                "部门名称" as department_name,
                "职位名称" as position_name,
                "人员类别" as personnel_category_name,
                "根人员类别" as root_personnel_category_name,
                "薪资期间名称" as payroll_period_name,
                "应发合计" as gross_pay,
                "实发合计" as net_pay,
                "扣除合计" as total_deductions,
                
                -- 应发项目
                "基本工资" as basic_salary,
                "奖励性绩效工资" as performance_bonus,
                "基础性绩效工资" as basic_performance_salary,
                "岗位工资" as position_salary,
                "级别工资" as grade_salary,
                "薪级工资" as salary_grade,
                "补助" as allowance,
                "津贴" as general_allowance,
                "公务交通补贴" as traffic_allowance,
                "独生子女父母奖励金" as only_child_bonus,
                "乡镇工作补贴" as township_allowance,
                "岗位职务补贴" as position_allowance,
                "公务员规范后津补贴" as civil_standard_allowance,
                "补发工资" as back_pay,
                "绩效工资" as performance_salary,
                "月奖励绩效" as monthly_performance_bonus,
                
                -- 个人扣除项目
                "个人所得税" as personal_income_tax,
                "养老保险个人应缴金额" as pension_personal,
                "医疗保险个人缴纳金额" as medical_personal,
                "失业保险个人应缴金额" as unemployment_personal,
                "个人缴住房公积金" as housing_fund_personal,
                "职业年金个人应缴费额" as annuity_personal,
                "一次性补扣发" as one_time_adjustment,
                "补扣社保" as social_insurance_adjustment,
                
                -- 单位扣除项目
                "养老保险单位应缴金额" as pension_employer_amount,
                "医疗保险单位缴纳金额" as medical_ins_employer_amount,
                "单位缴住房公积金" as housing_fund_employer,
                
                -- 原始JSONB数据
                "原始应发明细" as earnings_details,
                "原始扣除明细" as deductions_details,
                
                -- 时间字段
                "计算时间" as calculated_at,
                "更新时间" as updated_at
            FROM reports.v_comprehensive_employee_payroll
            {where_clause}
            {order_clause}
            LIMIT :limit OFFSET :offset
        """
        
        result = db.execute(text(data_sql), params).fetchall()
        
        # 转换为字典列表
        entries = []
        for row in result:
            entry_dict = {
                'id': row.id,
                'employee_id': row.employee_id,
                'payroll_period_id': row.payroll_period_id,
                'payroll_run_id': row.payroll_run_id,
                'status_lookup_value_id': None,  # 需要从原表查询
                'employee_code': row.employee_code,
                'employee_name': row.employee_name,
                'first_name': row.first_name,
                'last_name': row.last_name,
                'department_name': row.department_name,
                'position_name': row.position_name,
                'personnel_category_name': row.personnel_category_name,
                'root_personnel_category_name': row.root_personnel_category_name,
                'payroll_period_name': row.payroll_period_name,
                'gross_pay': float(row.gross_pay) if row.gross_pay else 0.0,
                'net_pay': float(row.net_pay) if row.net_pay else 0.0,
                'total_deductions': float(row.total_deductions) if row.total_deductions else 0.0,
                
                # 展开的薪资组件
                'basic_salary': float(row.basic_salary) if row.basic_salary else 0.0,
                'performance_bonus': float(row.performance_bonus) if row.performance_bonus else 0.0,
                'basic_performance_salary': float(row.basic_performance_salary) if row.basic_performance_salary else 0.0,
                'position_salary': float(row.position_salary) if row.position_salary else 0.0,
                'grade_salary': float(row.grade_salary) if row.grade_salary else 0.0,
                'salary_grade': float(row.salary_grade) if row.salary_grade else 0.0,
                'allowance': float(row.allowance) if row.allowance else 0.0,
                'traffic_allowance': float(row.traffic_allowance) if row.traffic_allowance else 0.0,
                'only_child_bonus': float(row.only_child_bonus) if row.only_child_bonus else 0.0,
                'township_allowance': float(row.township_allowance) if row.township_allowance else 0.0,
                'position_allowance': float(row.position_allowance) if row.position_allowance else 0.0,
                'back_pay': float(row.back_pay) if row.back_pay else 0.0,
                
                # 扣除项目
                'personal_income_tax': float(row.personal_income_tax) if row.personal_income_tax else 0.0,
                'pension_personal': float(row.pension_personal) if row.pension_personal else 0.0,
                'medical_personal': float(row.medical_personal) if row.medical_personal else 0.0,
                'unemployment_personal': float(row.unemployment_personal) if row.unemployment_personal else 0.0,
                'housing_fund_personal': float(row.housing_fund_personal) if row.housing_fund_personal else 0.0,
                'annuity_personal': float(row.annuity_personal) if row.annuity_personal else 0.0,
                
                # 原始JSONB数据（保持兼容性）
                'earnings_details': row.earnings_details or {},
                'deductions_details': row.deductions_details or {},
                
                'calculated_at': row.calculated_at,
                'updated_at': row.updated_at
            }
            entries.append(entry_dict)
        
        logger.info(f"✅ 视图查询完成: 返回 {len(entries)} 条记录，总计 {total} 条")
        return entries, total
        
    except Exception as e:
        logger.error(f"❌ 视图查询失败: {e}", exc_info=True)
        # 如果新视图查询失败，可以考虑回退到传统方法
        raise e


def get_payroll_entry(db: Session, entry_id: int, include_employee_details: bool = True) -> Optional[PayrollEntry]:
    """
    根据ID获取单个薪资条目
    
    Args:
        db: 数据库会话
        entry_id: 薪资条目ID
        include_employee_details: 是否包含员工详细信息
        
    Returns:
        薪资条目对象或None
    """
    query = db.query(PayrollEntry).filter(PayrollEntry.id == entry_id)
    
    # 如果需要包含员工详情，使用options加载关联的员工数据
    if include_employee_details:
        query = query.options(
            selectinload(PayrollEntry.employee).load_only(
                Employee.id, Employee.first_name, Employee.last_name, Employee.employee_code
            )
        )
    
    # 执行查询
    entry = query.first()
    
    # 如果找到了entry
    if entry:
        # 处理员工姓名
        if include_employee_details and entry.employee:
            # 合并姓和名为全名，添加空格分隔
            last_name = entry.employee.last_name or ''
            first_name = entry.employee.first_name or ''
            if last_name and first_name:
                entry.employee_name = f"{last_name} {first_name}"
            else:
                entry.employee_name = (last_name + first_name).strip()
        else:
            # 如果没有关联的员工信息或不需要员工详情，则employee_name设为None
            # 这可以确保 Pydantic 模型在序列化时，如果 employee_name 是 Optional 才不会报错
            if hasattr(entry, 'employee_name'):
                 entry.employee_name = None

        # 获取所有激活的扣除和法定类型的薪资字段定义，并创建映射
        personal_deduction_result = get_payroll_component_definitions(
            db, 
            component_type='PERSONAL_DEDUCTION', 
            is_active=True, 
            limit=1000 # 假设组件定义不会超过1000个
        )
        employer_deduction_result = get_payroll_component_definitions(
            db,
            component_type='EMPLOYER_DEDUCTION',
            is_active=True,
            limit=1000
        )
        
        all_personal_deduction_components = personal_deduction_result["data"]
        all_employer_deduction_components = employer_deduction_result["data"]
        
        component_map = {comp.code: comp.name for comp in all_personal_deduction_components}
        component_map.update({comp.code: comp.name for comp in all_employer_deduction_components})

        # 为 earnings_details 也从 component_map 更新/确认 name (如果需要统一来源)
        # 注意：当前 earnings_details 在DB中本身就可能包含 name 和 amount
        if entry.earnings_details and isinstance(entry.earnings_details, dict):
            new_earnings_details = {}
            for code, earn_value in entry.earnings_details.items():
                # earn_value 可能是 {name: 'xxx', amount: 123} 或直接是 amount (虽然不符合当前已知结构)
                current_amount = 0
                current_name_from_db = code # 默认用code作为name

                if isinstance(earn_value, dict):
                    current_amount = earn_value.get('amount', 0)
                    current_name_from_db = earn_value.get('name', code)
                elif isinstance(earn_value, (int, float)):
                    current_amount = earn_value
                
                # 优先使用 component_map 中的规范名称
                component_name = component_map.get(code, current_name_from_db)
                
                new_earnings_details[code] = {
                    "name": component_name,
                    "amount": current_amount
                }
            entry.earnings_details = new_earnings_details

        # 修改 deductions_details，从 component_map 获取 name
        if entry.deductions_details and isinstance(entry.deductions_details, dict):
            new_deductions_details = {}
            for code, amount_val in entry.deductions_details.items():
                # amount_val 可能是 amount 数字，或罕见情况下是 {name: 'xxx', amount: 123}
                actual_amount = 0
                name_from_db_if_complex = code

                if isinstance(amount_val, dict): # 虽然当前deductions是 code: amount 结构
                    actual_amount = amount_val.get('amount', 0)
                    name_from_db_if_complex = amount_val.get('name', code)
                elif isinstance(amount_val, (int, float)):
                    actual_amount = amount_val

                component_name = component_map.get(code, name_from_db_if_complex) 
                new_deductions_details[code] = {
                    "name": component_name,
                    "amount": actual_amount
                }
            entry.deductions_details = new_deductions_details
            
    return entry


def _get_component_mapping(db: Session) -> dict:
    """
    获取薪资组件代码到名称的映射
    
    Args:
        db: 数据库会话
        
    Returns:
        组件代码到名称的映射字典
    """
    # 直接使用SQLAlchemy查询，避免CRUD函数可能的问题
    personal_deduction_query = select(PayrollComponentDefinition).where(
        PayrollComponentDefinition.type == 'PERSONAL_DEDUCTION',
        PayrollComponentDefinition.is_active == True
    ).order_by(PayrollComponentDefinition.display_order.asc())
    
    employer_deduction_query = select(PayrollComponentDefinition).where(
        PayrollComponentDefinition.type == 'EMPLOYER_DEDUCTION',
        PayrollComponentDefinition.is_active == True
    ).order_by(PayrollComponentDefinition.display_order.asc())
    
    # 更全面的查询：包含所有可能用作薪资组件的类型
    all_components_query = select(PayrollComponentDefinition).where(
        PayrollComponentDefinition.is_active == True
    ).order_by(PayrollComponentDefinition.display_order.asc())
    
    all_components = db.execute(all_components_query).scalars().all()
    
    # 按类型分组（用于调试日志）
    components_by_type = {}
    for comp in all_components:
        if comp.type not in components_by_type:
            components_by_type[comp.type] = []
        components_by_type[comp.type].append(comp.code)
    
    # 创建统一的映射
    component_map = {comp.code: comp.name for comp in all_components}

    # 添加调试日志
    logger.info(f"所有激活组件总数: {len(all_components)}")
    for comp_type, codes in components_by_type.items():
        logger.info(f"{comp_type} 类型组件 {len(codes)} 个: {', '.join(codes[:5])}{'...' if len(codes) > 5 else ''}")
    logger.info(f"component_map包含的所有代码: {len(component_map)} 个")
    
    return component_map


def create_payroll_entry(db: Session, payroll_entry_data: PayrollEntryCreate) -> PayrollEntry:
    """
    创建新的薪资条目
    
    Args:
        db: 数据库会话
        payroll_entry_data: 薪资条目创建数据
        
    Returns:
        创建的薪资条目对象
        
    Raises:
        ValueError: 当薪资组件代码无效时
    """
    # 获取组件定义映射
    component_map = _get_component_mapping(db)
    
    # 强制刷新会话，确保获取最新数据
    try:
        db.expire_all() # 使所有持久化实例过期，下次访问时会从数据库重新加载
        logger.info("数据库会话已强制刷新 (expire_all)")
    except Exception as e:
        logger.error(f"强制刷新会话时出错: {e}")
    
    # 排除 employee_info 字段，因为它不是 PayrollEntry 模型的字段
    db_data_dict = payroll_entry_data.model_dump(exclude={'employee_info'})

    # 规范化 earnings_details
    if "earnings_details" in db_data_dict and isinstance(db_data_dict["earnings_details"], dict):
        processed_earnings = {}
        for code, item_input in db_data_dict["earnings_details"].items(): # item_input is now PayrollItemInput
            component_name = component_map.get(code)
            if component_name is None:
                raise ValueError(f"无效的收入项代码: {code}")
            
            processed_earnings[code] = {
                "name": component_name, 
                "amount": float(item_input['amount']) # Convert Decimal to float for JSON serialization
            }
        db_data_dict["earnings_details"] = convert_decimals_to_float(processed_earnings)

    # 规范化 deductions_details
    if "deductions_details" in db_data_dict and isinstance(db_data_dict["deductions_details"], dict):
        processed_deductions = {}
        for code, item_input in db_data_dict["deductions_details"].items(): # item_input is now PayrollItemInput
            component_name = component_map.get(code)
            if component_name is None:
                raise ValueError(f"无效的扣除项代码: {code}")
            
            processed_deductions[code] = {
                "name": component_name,
                "amount": float(item_input['amount']) # Convert Decimal to float for JSON serialization
            }
        db_data_dict["deductions_details"] = convert_decimals_to_float(processed_deductions)
        
    db_payroll_entry = PayrollEntry(**db_data_dict)
    # Ensure `calculated_at` and `updated_at` (if added to model with server_default) are handled by DB
    db.add(db_payroll_entry)
    db.commit()
    db.refresh(db_payroll_entry)
    return db_payroll_entry


def update_payroll_entry(db: Session, entry_id: int, payroll_entry_data: PayrollEntryUpdate) -> Optional[PayrollEntry]:
    """
    更新薪资条目
    
    Args:
        db: 数据库会话
        entry_id: 薪资条目ID
        payroll_entry_data: 薪资条目更新数据
        
    Returns:
        更新后的薪资条目对象或None
        
    Raises:
        ValueError: 当薪资组件代码无效时
    """
    db_payroll_entry = db.query(PayrollEntry).filter(PayrollEntry.id == entry_id).first()
    if not db_payroll_entry:
        return None

    # 获取组件定义映射
    component_map = _get_component_mapping(db)

    update_data = payroll_entry_data.model_dump(exclude_unset=True, exclude={'employee_info'})

    # 规范化 earnings_details (如果存在于 update_data)
    if "earnings_details" in update_data and isinstance(update_data["earnings_details"], dict):
        processed_earnings = {}
        for code, item_input in update_data["earnings_details"].items():
            component_name = component_map.get(code)
            if component_name is None:
                raise ValueError(f"无效的收入项代码: {code}")
            processed_earnings[code] = {"name": component_name, "amount": float(item_input['amount'])}
        update_data["earnings_details"] = convert_decimals_to_float(processed_earnings)

    # 规范化 deductions_details (如果存在于 update_data)
    if "deductions_details" in update_data and isinstance(update_data["deductions_details"], dict):
        processed_deductions = {}
        for code, item_input in update_data["deductions_details"].items():
            component_name = component_map.get(code)
            if component_name is None:
                raise ValueError(f"无效的扣除项代码: {code}")
            processed_deductions[code] = {"name": component_name, "amount": float(item_input['amount'])}
        update_data["deductions_details"] = convert_decimals_to_float(processed_deductions)

    for key, value in update_data.items():
        # 确保所有值都经过Decimal转换处理
        converted_value = convert_decimals_to_float(value)
        setattr(db_payroll_entry, key, converted_value)
    
    if hasattr(db_payroll_entry, 'updated_at'):
        db_payroll_entry.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(db_payroll_entry)
    return db_payroll_entry


def patch_payroll_entry(db: Session, entry_id: int, entry_data: PayrollEntryPatch) -> Optional[PayrollEntry]:
    """
    部分更新薪资条目
    
    Args:
        db: 数据库会话
        entry_id: 薪资条目ID
        entry_data: 薪资条目部分更新数据
        
    Returns:
        更新后的薪资条目对象或None
        
    Raises:
        ValueError: 当薪资组件代码无效时
        Exception: 当数据库操作失败时
    """
    db_payroll_entry = db.query(PayrollEntry).filter(PayrollEntry.id == entry_id).first()
    if not db_payroll_entry:
        return None

    # 获取组件定义映射
    component_map = _get_component_mapping(db)
    
    update_values = entry_data.model_dump(exclude_unset=True, exclude={'employee_info'})
    changed_fields = False

    # 规范化传入的 details 字段 (如果存在)
    if "earnings_details" in update_values and isinstance(update_values["earnings_details"], dict):
        processed_earnings_patch = {}
        for code, item_input in update_values["earnings_details"].items():
            component_name = component_map.get(code)
            if component_name is None:
                raise ValueError(f"无效的收入项代码(PATCH): {code}")
            processed_earnings_patch[code] = {"name": component_name, "amount": float(item_input['amount'])}
        
        current_earnings = getattr(db_payroll_entry, "earnings_details", {}) or {}
        # 确保现有数据也转换为float
        current_earnings = convert_decimals_to_float(current_earnings)
        current_earnings.update(processed_earnings_patch) # Merge
        # 再次确保合并后的数据也完全转换为float
        current_earnings = convert_decimals_to_float(current_earnings)
        setattr(db_payroll_entry, "earnings_details", current_earnings)
        update_values.pop("earnings_details") 
        changed_fields = True 

    if "deductions_details" in update_values and isinstance(update_values["deductions_details"], dict):
        processed_deductions_patch = {}
        for code, item_input in update_values["deductions_details"].items():
            component_name = component_map.get(code)
            if component_name is None:
                raise ValueError(f"无效的扣除项代码(PATCH): {code}")
            processed_deductions_patch[code] = {"name": component_name, "amount": float(item_input['amount'])}

        current_deductions = getattr(db_payroll_entry, "deductions_details", {}) or {}
        # 确保现有数据也转换为float
        current_deductions = convert_decimals_to_float(current_deductions)
        current_deductions.update(processed_deductions_patch) # Merge
        # 再次确保合并后的数据也完全转换为float
        current_deductions = convert_decimals_to_float(current_deductions)
        setattr(db_payroll_entry, "deductions_details", current_deductions)
        update_values.pop("deductions_details")
        changed_fields = True

    for key, value in update_values.items():
        current_db_value = getattr(db_payroll_entry, key)
        # 确保所有值都经过Decimal转换处理
        converted_value = convert_decimals_to_float(value)
        if current_db_value != converted_value:
            setattr(db_payroll_entry, key, converted_value)
            changed_fields = True
    
    if changed_fields and hasattr(db_payroll_entry, 'updated_at'):
        db_payroll_entry.updated_at = datetime.utcnow()

    if changed_fields:
        try:
            db.commit()
            db.refresh(db_payroll_entry)
            return db_payroll_entry
        except Exception as e:
            db.rollback()
            raise
    return db_payroll_entry


def delete_payroll_entry(db: Session, entry_id: int) -> bool:
    """
    删除薪资条目
    
    Args:
        db: 数据库会话
        entry_id: 薪资条目ID
        
    Returns:
        删除是否成功
    """
    entry = db.query(PayrollEntry).filter(PayrollEntry.id == entry_id).first()
    if not entry:
        return False
    
    db.delete(entry)
    db.commit()
    return True 