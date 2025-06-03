"""
薪资条目相关的CRUD操作。
"""
from sqlalchemy.orm import Session, selectinload, joinedload
from sqlalchemy import func, or_, select
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
    include_employee_details: bool = False, 
    include_payroll_period: bool = False, 
    skip: int = 0,
    limit: int = 100
) -> Tuple[List[PayrollEntry], int]:
    """
    获取薪资条目列表
    
    Args:
        db: 数据库会话
        employee_id: 员工ID筛选
        period_id: 薪资周期ID筛选
        run_id: 薪资审核ID筛选
        status_id: 状态ID筛选
        search_term: 搜索关键词
        department_name: 部门名称筛选
        personnel_category_name: 人员类别筛选
        min_gross_pay: 最小应发工资筛选
        max_gross_pay: 最大应发工资筛选
        min_net_pay: 最小实发工资筛选
        max_net_pay: 最大实发工资筛选
        sort_by: 排序字段
        sort_order: 排序顺序（asc/desc）
        include_employee_details: 是否包含员工详细信息
        include_payroll_period: 是否包含薪资周期信息
        skip: 跳过的记录数
        limit: 限制返回的记录数
        
    Returns:
        薪资条目列表和总数的元组
    """
    query = db.query(PayrollEntry)

    if employee_id:
        query = query.filter(PayrollEntry.employee_id == employee_id)
    if period_id:
        query = query.filter(PayrollEntry.payroll_period_id == period_id)
    if run_id:
        query = query.filter(PayrollEntry.payroll_run_id == run_id)
    if status_id:
        query = query.filter(PayrollEntry.status_lookup_value_id == status_id)
    
    # 薪资范围筛选
    if min_gross_pay is not None:
        query = query.filter(PayrollEntry.gross_pay >= min_gross_pay)
    if max_gross_pay is not None:
        query = query.filter(PayrollEntry.gross_pay <= max_gross_pay)
    if min_net_pay is not None:
        query = query.filter(PayrollEntry.net_pay >= min_net_pay)
    if max_net_pay is not None:
        query = query.filter(PayrollEntry.net_pay <= max_net_pay)
    
    # 需要join Employee表的筛选条件
    need_employee_join = (
        search_term or 
        department_name or 
        personnel_category_name or 
        include_employee_details
    )
    
    if need_employee_join:
        query = query.join(PayrollEntry.employee)
        
        # 部门筛选
        if department_name:
            query = query.join(Employee.current_department).filter(
                Department.name.ilike(f"%{department_name}%")
            )
        
        # 人员类别筛选
        if personnel_category_name:
            query = query.join(Employee.personnel_category).filter(
                PersonnelCategory.name.ilike(f"%{personnel_category_name}%")
            )
    
    # 搜索筛选
    if search_term:
        if search_term.isdigit():
            query = query.filter(PayrollEntry.employee_id == int(search_term))
        else:
            query = query.filter(
                or_(
                    Employee.first_name.ilike(f"%{search_term}%"), 
                    Employee.last_name.ilike(f"%{search_term}%"),
                    (Employee.first_name + " " + Employee.last_name).ilike(f"%{search_term}%"),
                    (Employee.last_name + " " + Employee.first_name).ilike(f"%{search_term}%"),
                    PayrollEntry.remarks.ilike(f"%{search_term}%")
                )
            )

    total = query.count()
    
    # 排序处理
    if sort_by:
        sort_column = None
        if sort_by == 'employee_name':
            # 按员工姓名排序
            if need_employee_join:
                sort_column = Employee.last_name
            else:
                query = query.join(PayrollEntry.employee)
                sort_column = Employee.last_name
        elif sort_by == 'department':
            # 按部门排序
            if not department_name:  # 如果还没有join Department
                query = query.join(PayrollEntry.employee).join(Employee.current_department)
            sort_column = Department.name
        elif sort_by == 'personnel_category':
            # 按人员类别排序
            if not personnel_category_name:  # 如果还没有join PersonnelCategory
                query = query.join(PayrollEntry.employee).join(Employee.personnel_category)
            sort_column = PersonnelCategory.name
        elif hasattr(PayrollEntry, sort_by):
            # PayrollEntry表的直接字段
            sort_column = getattr(PayrollEntry, sort_by)
        
        if sort_column is not None:
            if sort_order.lower() == 'desc':
                query = query.order_by(sort_column.desc())
            else:
                query = query.order_by(sort_column.asc())
        else:
            # 默认排序
            query = query.order_by(PayrollEntry.id.desc())
    else:
        query = query.order_by(PayrollEntry.id.desc())

    options = []
    if include_employee_details:
        options.append(
            selectinload(PayrollEntry.employee).options(
                joinedload(Employee.current_department),
                selectinload(Employee.personnel_category),
                selectinload(Employee.actual_position),
                selectinload(Employee.status), # For Employee.status -> LookupValue
                selectinload(Employee.gender), # For Employee.gender -> LookupValue
                selectinload(Employee.job_position_level), # Eager load job_position_level for EmployeeWithNames
                # Add any other relationships needed for EmployeeWithNames or its base Employee fields
            )
        )
    
    # Always load payroll_run, and conditionally its period
    if include_payroll_period:
        options.append(selectinload(PayrollEntry.payroll_run).selectinload(PayrollRun.payroll_period).selectinload(PayrollPeriod.status_lookup))
    else:
        options.append(selectinload(PayrollEntry.payroll_run).selectinload(PayrollRun.status))
        
    # Always load entry's own status
    options.append(selectinload(PayrollEntry.status))

    if options:
        query = query.options(*options)
        
    entries = query.offset(skip).limit(limit).all()
    
    # 处理每个entry的JSONB字段，确保正确序列化
    for entry in entries:
        # 确保JSONB字段被正确处理 - 避免直接修改ORM对象的属性
        if hasattr(entry, 'earnings_details') and entry.earnings_details is not None:
            # 创建一个新的字典而不是直接修改ORM对象
            if isinstance(entry.earnings_details, dict):
                entry.earnings_details = convert_decimals_to_float(entry.earnings_details)
            elif isinstance(entry.earnings_details, str):
                # 如果是字符串，尝试解析为JSON
                try:
                    parsed_earnings = json.loads(entry.earnings_details)
                    entry.earnings_details = convert_decimals_to_float(parsed_earnings)
                except (json.JSONDecodeError, TypeError):
                    entry.earnings_details = {}
        
        if hasattr(entry, 'deductions_details') and entry.deductions_details is not None:
            if isinstance(entry.deductions_details, dict):
                entry.deductions_details = convert_decimals_to_float(entry.deductions_details)
            elif isinstance(entry.deductions_details, str):
                try:
                    parsed_deductions = json.loads(entry.deductions_details)
                    entry.deductions_details = convert_decimals_to_float(parsed_deductions)
                except (json.JSONDecodeError, TypeError):
                    entry.deductions_details = {}
        
        if hasattr(entry, 'calculation_inputs') and entry.calculation_inputs is not None:
            if isinstance(entry.calculation_inputs, dict):
                entry.calculation_inputs = convert_decimals_to_float(entry.calculation_inputs)
            elif isinstance(entry.calculation_inputs, str):
                try:
                    parsed_inputs = json.loads(entry.calculation_inputs)
                    entry.calculation_inputs = convert_decimals_to_float(parsed_inputs)
                except (json.JSONDecodeError, TypeError):
                    entry.calculation_inputs = {}
        
        if hasattr(entry, 'calculation_log') and entry.calculation_log is not None:
            if isinstance(entry.calculation_log, dict):
                entry.calculation_log = convert_decimals_to_float(entry.calculation_log)
            elif isinstance(entry.calculation_log, str):
                try:
                    parsed_log = json.loads(entry.calculation_log)
                    entry.calculation_log = convert_decimals_to_float(parsed_log)
                except (json.JSONDecodeError, TypeError):
                    entry.calculation_log = {}
            
        # 如果需要员工详情，添加员工姓名
        if include_employee_details and entry.employee:
            last_name = entry.employee.last_name or ''
            first_name = entry.employee.first_name or ''
            if last_name and first_name:
                entry.employee_name = f"{last_name} {first_name}"
            else:
                entry.employee_name = (last_name + first_name).strip()
        else:
            entry.employee_name = None
    
    return entries, total


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
    
    earning_query = select(PayrollComponentDefinition).where(
        PayrollComponentDefinition.type.in_(['EARNING', 'STAT']),
        PayrollComponentDefinition.is_active == True
    ).order_by(PayrollComponentDefinition.display_order.asc())
    
    all_personal_deduction_components = db.execute(personal_deduction_query).scalars().all()
    all_employer_deduction_components = db.execute(employer_deduction_query).scalars().all()
    all_earning_components = db.execute(earning_query).scalars().all()
    
    component_map = {comp.code: comp.name for comp in all_personal_deduction_components}
    component_map.update({comp.code: comp.name for comp in all_employer_deduction_components})
    component_map.update({comp.code: comp.name for comp in all_earning_components})

    # 添加调试日志
    logger.info(f"个人扣除项组件数量: {len(all_personal_deduction_components)}")
    logger.info(f"个人扣除项代码列表: {[comp.code for comp in all_personal_deduction_components]}")
    logger.info(f"雇主扣除项组件数量: {len(all_employer_deduction_components)}")
    logger.info(f"收入项组件数量: {len(all_earning_components)}")
    logger.info(f"component_map包含的所有代码: {list(component_map.keys())}")
    
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