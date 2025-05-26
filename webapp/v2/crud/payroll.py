"""
工资相关的CRUD操作。
"""
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, and_, select
from typing import List, Optional, Tuple, Dict, Any
from datetime import date, datetime
from sqlalchemy.orm import selectinload

from ..models.payroll import PayrollPeriod, PayrollRun, PayrollEntry
from ..pydantic_models.payroll import (
    PayrollPeriodCreate, PayrollPeriodUpdate,
    PayrollRunCreate, PayrollRunUpdate, PayrollRunPatch,
    PayrollEntryCreate, PayrollEntryUpdate, PayrollEntryPatch
)
from ..models.hr import Employee
from .config import get_payroll_component_definitions # 新增导入
from .hr import get_employee_by_name_and_id_number, get_employee
from ..models.config import PayrollComponentDefinition

# PayrollPeriod CRUD
def get_payroll_periods(
    db: Session,
    frequency_id: Optional[int] = None,
    status_lookup_value_id: Optional[int] = None,  # 新增状态过滤参数
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
) -> Tuple[List[PayrollPeriod], int]:
    query = db.query(PayrollPeriod)
    if frequency_id:
        query = query.filter(PayrollPeriod.frequency_lookup_value_id == frequency_id)
    if status_lookup_value_id:
        query = query.filter(PayrollPeriod.status_lookup_value_id == status_lookup_value_id)
    if start_date:
        query = query.filter(PayrollPeriod.start_date >= start_date)
    if end_date:
        query = query.filter(PayrollPeriod.end_date <= end_date)
    if search:
        search_term = f"%{search}%"
        query = query.filter(PayrollPeriod.name.ilike(search_term))
    
    # 默认按开始日期倒序排序
    query = query.order_by(PayrollPeriod.start_date.desc())
    
    total = query.count()
    
    # 预加载关联的 status_lookup 和 frequency 数据
    query = query.options(
        selectinload(PayrollPeriod.status_lookup),
        selectinload(PayrollPeriod.frequency)
    ).offset(skip).limit(limit)
    
    return query.all(), total

def get_payroll_period(db: Session, period_id: int) -> Optional[PayrollPeriod]:
    return db.query(PayrollPeriod).options(
        selectinload(PayrollPeriod.status_lookup),
        selectinload(PayrollPeriod.frequency)
    ).filter(PayrollPeriod.id == period_id).first()

def create_payroll_period(db: Session, payroll_period: PayrollPeriodCreate) -> PayrollPeriod:
    existing = db.query(PayrollPeriod).filter(
        PayrollPeriod.start_date == payroll_period.start_date,
        PayrollPeriod.end_date == payroll_period.end_date,
        PayrollPeriod.frequency_lookup_value_id == payroll_period.frequency_lookup_value_id
    ).first()
    if existing:
        raise ValueError(f"Payroll period with the same date range and frequency already exists")
    db_payroll_period = PayrollPeriod(**payroll_period.model_dump())
    db.add(db_payroll_period)
    db.commit()
    db.refresh(db_payroll_period)
    
    # 重新查询以获取关联数据
    return get_payroll_period(db, db_payroll_period.id)

def update_payroll_period(db: Session, period_id: int, payroll_period: PayrollPeriodUpdate) -> Optional[PayrollPeriod]:
    db_payroll_period = get_payroll_period(db, period_id)
    if not db_payroll_period:
        return None
    if (payroll_period.start_date is not None or
        payroll_period.end_date is not None or
        payroll_period.frequency_lookup_value_id is not None):
        start_date = payroll_period.start_date or db_payroll_period.start_date
        end_date = payroll_period.end_date or db_payroll_period.end_date
        frequency_id = payroll_period.frequency_lookup_value_id or db_payroll_period.frequency_lookup_value_id
        existing = db.query(PayrollPeriod).filter(
            PayrollPeriod.id != period_id,
            PayrollPeriod.start_date == start_date,
            PayrollPeriod.end_date == end_date,
            PayrollPeriod.frequency_lookup_value_id == frequency_id
        ).first()
        if existing:
            raise ValueError(f"Payroll period with the same date range and frequency already exists")
    update_data = payroll_period.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_payroll_period, key, value)
    db.commit()
    db.refresh(db_payroll_period)
    
    # 重新查询以获取关联数据
    return get_payroll_period(db, period_id)

def delete_payroll_period(db: Session, period_id: int) -> bool:
    db_payroll_period = get_payroll_period(db, period_id)
    if not db_payroll_period:
        return False
    has_runs = db.query(PayrollRun).filter(PayrollRun.payroll_period_id == period_id).first() is not None
    if has_runs:
        raise ValueError(f"Cannot delete payroll period with associated payroll runs")
    db.delete(db_payroll_period)
    db.commit()
    return True

# PayrollRun CRUD
def get_payroll_runs(
    db: Session,
    period_id: Optional[int] = None,
    status_id: Optional[int] = None,
    initiated_by_user_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100
) -> Tuple[List[PayrollRun], int]:
    query = db.query(PayrollRun)
    if period_id:
        query = query.filter(PayrollRun.payroll_period_id == period_id)
    if status_id:
        query = query.filter(PayrollRun.status_lookup_value_id == status_id)
    if initiated_by_user_id:
        query = query.filter(PayrollRun.initiated_by_user_id == initiated_by_user_id)
    total = query.count()
    
    # 加载关联的 payroll_period 和 status 数据
    query = query.options(
        selectinload(PayrollRun.payroll_period),
        selectinload(PayrollRun.status)
    ).order_by(PayrollRun.run_date.desc()).offset(skip).limit(limit)
    
    runs = query.all()
    
    # 计算每个 run 的员工数量
    for run in runs:
        # 计算该 run 下的员工数量
        employee_count = db.query(PayrollEntry.employee_id).filter(
            PayrollEntry.payroll_run_id == run.id
        ).distinct().count()
        
        # 动态添加 total_employees 属性
        run.total_employees = employee_count
    
    return runs, total

def get_payroll_run(db: Session, run_id: int) -> Optional[PayrollRun]:
    run = db.query(PayrollRun).options(
        selectinload(PayrollRun.payroll_period),
        selectinload(PayrollRun.status)
    ).filter(PayrollRun.id == run_id).first()
    
    if run:
        # 计算该 run 下的员工数量
        employee_count = db.query(PayrollEntry.employee_id).filter(
            PayrollEntry.payroll_run_id == run.id
        ).distinct().count()
        
        # 动态添加 total_employees 属性
        run.total_employees = employee_count
    
    return run

def create_payroll_run(db: Session, payroll_run: PayrollRunCreate, initiated_by_user_id: Optional[int] = None) -> PayrollRun:
    run_data = payroll_run.model_dump()
    if initiated_by_user_id:
        run_data['initiated_by_user_id'] = initiated_by_user_id
    
    db_payroll_run = PayrollRun(**run_data)
    db.add(db_payroll_run)
    db.commit()
    db.refresh(db_payroll_run)
    
    # 加载关联数据并返回
    return get_payroll_run(db, db_payroll_run.id)

def update_payroll_run(db: Session, run_id: int, payroll_run: PayrollRunUpdate) -> Optional[PayrollRun]:
    db_payroll_run = get_payroll_run(db, run_id)
    if not db_payroll_run:
        return None
    update_data = payroll_run.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_payroll_run, key, value)
    db.commit()
    db.refresh(db_payroll_run)
    return db_payroll_run

def patch_payroll_run(db: Session, run_id: int, run_data: PayrollRunPatch) -> Optional[PayrollRun]:
    db_payroll_run = db.query(PayrollRun).filter(PayrollRun.id == run_id).first()
    if not db_payroll_run:
        return None
    update_values = run_data.model_dump(exclude_unset=True)
    for key, value in update_values.items():
        if value is None and key not in run_data.model_fields_set: # Allow explicit None if set by user
            continue
        setattr(db_payroll_run, key, value)
    try:
        db.commit()
        db.refresh(db_payroll_run)
        # Audit logging: log_audit(f"PayrollRun {run_id} patched. Fields: {list(update_values.keys())}")
        return db_payroll_run
    except Exception as e:
        db.rollback()
        raise

def delete_payroll_run(db: Session, run_id: int) -> bool:
    db_payroll_run = get_payroll_run(db, run_id)
    if not db_payroll_run:
        return False
    # Consider if deletion should be blocked if entries exist
    # has_entries = db.query(PayrollEntry).filter(PayrollEntry.payroll_run_id == run_id).first() is not None
    # if has_entries:
    #     raise ValueError("Cannot delete payroll run with associated payroll entries")
    db.delete(db_payroll_run)
    db.commit()
    return True

# PayrollEntry CRUD
def get_payroll_entries(
    db: Session,
    employee_id: Optional[int] = None,
    period_id: Optional[int] = None,
    run_id: Optional[int] = None,
    status_id: Optional[int] = None,
    search: Optional[str] = None, # For employee name/code search
    include_employee_details: bool = False, # 新增参数，控制是否关联员工详情
    include_payroll_period: bool = False, # 新增参数，控制是否关联工资周期信息
    skip: int = 0,
    limit: int = 100
) -> Tuple[List[PayrollEntry], int]:
    query = db.query(PayrollEntry)
    
    # 如果需要包含员工详情，则JOIN Employee表
    if include_employee_details:
        query = query.join(Employee, PayrollEntry.employee_id == Employee.id)
        
    # 应用过滤条件
    if employee_id:
        query = query.filter(PayrollEntry.employee_id == employee_id)
    if period_id:
        query = query.filter(PayrollEntry.payroll_period_id == period_id)
    if run_id:
        query = query.filter(PayrollEntry.payroll_run_id == run_id)
    if status_id:
        query = query.filter(PayrollEntry.status_lookup_value_id == status_id)
    
    # 如果提供了搜索关键词且关联了Employee表，添加名称搜索条件
    if search and include_employee_details:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Employee.first_name.ilike(search_term),
                Employee.last_name.ilike(search_term),
                Employee.employee_code.ilike(search_term)
            )
        )
    
    # 获取总记录数
    total = query.count()
    
    # 排序并应用分页
    query = query.order_by(PayrollEntry.id.desc()).offset(skip).limit(limit)
    
    # 如果需要包含员工详情，使用options加载关联的员工数据，包括员工姓名
    if include_employee_details:
        query = query.options(
            selectinload(PayrollEntry.employee).load_only(
                Employee.id, Employee.first_name, Employee.last_name, Employee.employee_code
            )
        )
    
    # 如果需要包含工资周期信息，使用options加载关联的工资周期和运行批次数据
    if include_payroll_period:
        query = query.options(
            selectinload(PayrollEntry.payroll_run).selectinload(PayrollRun.payroll_period)
        )
    
    return query.all(), total

def get_payroll_entry(db: Session, entry_id: int, include_employee_details: bool = True) -> Optional[PayrollEntry]:
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

        # 获取所有激活的扣除和法定类型的薪资组件定义，并创建映射
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

def create_payroll_entry(db: Session, payroll_entry_data: PayrollEntryCreate) -> PayrollEntry:
    # 获取组件定义 - 使用更可靠的查询方式
    from sqlalchemy import select
    from ..models.config import PayrollComponentDefinition
    
    # 直接使用SQLAlchemy查询，避免CRUD函数可能的问题
    personal_deduction_query = select(PayrollComponentDefinition).where(
        PayrollComponentDefinition.type == 'PERSONAL_DEDUCTION',
        PayrollComponentDefinition.is_active == True
    ).order_by(PayrollComponentDefinition.display_order.asc())
    
    # 打印生成的SQL
    import logging
    logger = logging.getLogger(__name__)
    try:
        compiled_sql = personal_deduction_query.compile(compile_kwargs={"literal_binds": True})
        logger.info(f"编译后的个人扣除项SQL: {compiled_sql}")
    except Exception as e:
        logger.error(f"编译SQL时出错: {e}")
        
    # 强制刷新会话，确保获取最新数据
    try:
        db.expire_all() # 使所有持久化实例过期，下次访问时会从数据库重新加载
        logger.info("数据库会话已强制刷新 (expire_all)")
    except Exception as e:
        logger.error(f"强制刷新会话时出错: {e}")

    employer_deduction_query = select(PayrollComponentDefinition).where(
        PayrollComponentDefinition.type == 'EMPLOYER_DEDUCTION',
        PayrollComponentDefinition.is_active == True
    ).order_by(PayrollComponentDefinition.display_order.asc())
    
    earning_query = select(PayrollComponentDefinition).where(
        PayrollComponentDefinition.type == 'EARNING',
        PayrollComponentDefinition.is_active == True
    ).order_by(PayrollComponentDefinition.display_order.asc())
    
    all_personal_deduction_components = db.execute(personal_deduction_query).scalars().all()
    all_employer_deduction_components = db.execute(employer_deduction_query).scalars().all()
    all_earning_components = db.execute(earning_query).scalars().all()
    
    component_map = {comp.code: comp.name for comp in all_personal_deduction_components}
    component_map.update({comp.code: comp.name for comp in all_employer_deduction_components})
    component_map.update({comp.code: comp.name for comp in all_earning_components})

    # 添加调试日志
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"个人扣除项组件数量: {len(all_personal_deduction_components)}")
    logger.info(f"个人扣除项代码列表: {[comp.code for comp in all_personal_deduction_components]}")
    logger.info(f"雇主扣除项组件数量: {len(all_employer_deduction_components)}")
    logger.info(f"收入项组件数量: {len(all_earning_components)}")
    logger.info(f"component_map包含的所有代码: {list(component_map.keys())}")
    logger.info(f"是否包含SOCIAL_INSURANCE_ADJUSTMENT: {'SOCIAL_INSURANCE_ADJUSTMENT' in component_map}")
    
    # 排除 employee_info 字段，因为它不是 PayrollEntry 模型的字段
    db_data_dict = payroll_entry_data.model_dump(exclude={'employee_info'})

    # 规范化 earnings_details
    if "earnings_details" in db_data_dict and isinstance(db_data_dict["earnings_details"], dict):
        processed_earnings = {}
        for code, item_input in db_data_dict["earnings_details"].items(): # item_input is now PayrollItemInput
            component_name = component_map.get(code)
            if component_name is None:
                # 或者根据策略 logging.warning(f"未找到薪资项代码 {code} 的定义，将使用原始代码作为名称")
                # component_name = code
                raise ValueError(f"无效的收入项代码: {code}")
            
            processed_earnings[code] = {
                "name": component_name, 
                "amount": float(item_input['amount']) # Convert Decimal to float for JSON serialization
            }
        db_data_dict["earnings_details"] = processed_earnings

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
        db_data_dict["deductions_details"] = processed_deductions
        
    db_payroll_entry = PayrollEntry(**db_data_dict)
    # Ensure `calculated_at` and `updated_at` (if added to model with server_default) are handled by DB
    db.add(db_payroll_entry)
    db.commit()
    db.refresh(db_payroll_entry)
    return db_payroll_entry

def update_payroll_entry(db: Session, entry_id: int, payroll_entry_data: PayrollEntryUpdate) -> Optional[PayrollEntry]:
    db_payroll_entry = db.query(PayrollEntry).filter(PayrollEntry.id == entry_id).first() # Changed from get_payroll_entry to avoid re-fetching transformed data
    if not db_payroll_entry:
        return None

    # 获取组件定义 - 使用直接查询方式
    personal_deduction_query = select(PayrollComponentDefinition).where(
        PayrollComponentDefinition.type == 'PERSONAL_DEDUCTION',
        PayrollComponentDefinition.is_active == True
    ).order_by(PayrollComponentDefinition.display_order.asc())
    
    employer_deduction_query = select(PayrollComponentDefinition).where(
        PayrollComponentDefinition.type == 'EMPLOYER_DEDUCTION',
        PayrollComponentDefinition.is_active == True
    ).order_by(PayrollComponentDefinition.display_order.asc())
    
    earning_query = select(PayrollComponentDefinition).where(
        PayrollComponentDefinition.type == 'EARNING',
        PayrollComponentDefinition.is_active == True
    ).order_by(PayrollComponentDefinition.display_order.asc())
    
    all_personal_deduction_components = db.execute(personal_deduction_query).scalars().all()
    all_employer_deduction_components = db.execute(employer_deduction_query).scalars().all()
    all_earning_components = db.execute(earning_query).scalars().all()
    
    component_map = {comp.code: comp.name for comp in all_personal_deduction_components}
    component_map.update({comp.code: comp.name for comp in all_employer_deduction_components})
    component_map.update({comp.code: comp.name for comp in all_earning_components})

    update_data = payroll_entry_data.model_dump(exclude_unset=True, exclude={'employee_info'})

    # 规范化 earnings_details (如果存在于 update_data)
    if "earnings_details" in update_data and isinstance(update_data["earnings_details"], dict):
        processed_earnings = {}
        for code, item_input in update_data["earnings_details"].items():
            component_name = component_map.get(code)
            if component_name is None:
                raise ValueError(f"无效的收入项代码: {code}")
            processed_earnings[code] = {"name": component_name, "amount": float(item_input['amount'])}
        update_data["earnings_details"] = processed_earnings

    # 规范化 deductions_details (如果存在于 update_data)
    if "deductions_details" in update_data and isinstance(update_data["deductions_details"], dict):
        processed_deductions = {}
        for code, item_input in update_data["deductions_details"].items():
            component_name = component_map.get(code)
            if component_name is None:
                raise ValueError(f"无效的扣除项代码: {code}")
            processed_deductions[code] = {"name": component_name, "amount": float(item_input['amount'])}
        update_data["deductions_details"] = processed_deductions

    for key, value in update_data.items():
        setattr(db_payroll_entry, key, value)
    
    if hasattr(db_payroll_entry, 'updated_at'):
        db_payroll_entry.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(db_payroll_entry)
    return db_payroll_entry

def patch_payroll_entry(db: Session, entry_id: int, entry_data: PayrollEntryPatch) -> Optional[PayrollEntry]:
    db_payroll_entry = db.query(PayrollEntry).filter(PayrollEntry.id == entry_id).first()
    if not db_payroll_entry:
        return None

    # 获取组件定义 - 使用直接查询方式
    personal_deduction_query = select(PayrollComponentDefinition).where(
        PayrollComponentDefinition.type == 'PERSONAL_DEDUCTION',
        PayrollComponentDefinition.is_active == True
    ).order_by(PayrollComponentDefinition.display_order.asc())
    
    employer_deduction_query = select(PayrollComponentDefinition).where(
        PayrollComponentDefinition.type == 'EMPLOYER_DEDUCTION',
        PayrollComponentDefinition.is_active == True
    ).order_by(PayrollComponentDefinition.display_order.asc())
    
    earning_query = select(PayrollComponentDefinition).where(
        PayrollComponentDefinition.type == 'EARNING',
        PayrollComponentDefinition.is_active == True
    ).order_by(PayrollComponentDefinition.display_order.asc())
    
    all_personal_deduction_components = db.execute(personal_deduction_query).scalars().all()
    all_employer_deduction_components = db.execute(employer_deduction_query).scalars().all()
    all_earning_components = db.execute(earning_query).scalars().all()
    
    component_map = {comp.code: comp.name for comp in all_personal_deduction_components}
    component_map.update({comp.code: comp.name for comp in all_employer_deduction_components})
    component_map.update({comp.code: comp.name for comp in all_earning_components})
    
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
        current_earnings.update(processed_earnings_patch) # Merge
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
        current_deductions.update(processed_deductions_patch) # Merge
        setattr(db_payroll_entry, "deductions_details", current_deductions)
        update_values.pop("deductions_details")
        changed_fields = True

    for key, value in update_values.items():
        # if value is None and key not in entry_data.model_fields_set: 
        #     continue
        current_db_value = getattr(db_payroll_entry, key)
        if current_db_value != value:
            setattr(db_payroll_entry, key, value)
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
    """删除工资明细"""
    entry = db.query(PayrollEntry).filter(PayrollEntry.id == entry_id).first()
    if not entry:
        return False
    
    db.delete(entry)
    db.commit()
    return True

def get_payroll_entries_for_bank_export(
    db: Session, 
    run_id: int
) -> List[Tuple[PayrollEntry, Optional[str], Optional[str], Optional[str], Optional[str]]]: 
    # Tuple: (PayrollEntry, employee_code, employee_name, bank_account_number, bank_name)
    """
    获取指定工资计算批次中所有符合条件的工资条目，用于银行代发文件生成。
    包含员工工号、姓名和银行账户信息（优先获取主账户）。

    Args:
        db: 数据库会话
        run_id: 工资计算批次ID

    Returns:
        一个元组列表: (PayrollEntry对象, 员工工号, 员工姓名, 银行账号, 开户行名称)
        银行信息字段可能为 None 如果员工无此信息或无主账户。
    """
    from ..models.hr import Employee, EmployeeBankAccount # Import new model

    # Subquery to get the primary bank account for each employee
    # If no primary, it could be extended to pick any, or be None
    primary_bank_account_sq = (
        db.query(
            EmployeeBankAccount.employee_id,
            EmployeeBankAccount.account_number.label("primary_account_number"),
            EmployeeBankAccount.bank_name.label("primary_bank_name")
        )
        .filter(EmployeeBankAccount.is_primary == True)
        .subquery('primary_bank_account_sq')
    )

    results = (
        db.query(
            PayrollEntry,
            Employee.employee_code, # Assuming Employee model has employee_code
            Employee.first_name,
            Employee.last_name,
            primary_bank_account_sq.c.primary_account_number,
            primary_bank_account_sq.c.primary_bank_name
        )
        .join(Employee, PayrollEntry.employee_id == Employee.id)
        .outerjoin(
            primary_bank_account_sq, 
            Employee.id == primary_bank_account_sq.c.employee_id
        )
        .filter(PayrollEntry.payroll_run_id == run_id)
        # TODO: Add filter for PayrollEntry.status_lookup_value_id to select only approved/payable entries
        # e.g., .filter(PayrollEntry.status_lookup_value_id == get_lookup_value_id_by_code(db, 'PAYROLL_ENTRY_STATUS', 'APPROVED_FOR_PAYMENT'))
        .order_by(Employee.employee_code) 
        .all()
    )

    formatted_results = []
    for entry, emp_code, first_name, last_name, acc_number, bank_name_val in results:
        full_name = f"{last_name or ''} {first_name or ''}".strip()
        formatted_results.append( (entry, emp_code, full_name, acc_number, bank_name_val) )
    
    return formatted_results

def bulk_create_payroll_entries(
    db: Session, 
    payroll_period_id: int, 
    entries: List[PayrollEntryCreate], 
    overwrite_mode: bool = False
) -> Tuple[List[PayrollEntry], List[Dict[str, Any]]]:
    """
    批量创建工资明细
    
    Args:
        db: 数据库会话
        payroll_period_id: 工资周期ID
        entries: 工资明细创建数据列表
        overwrite_mode: 是否启用覆盖模式
    
    Returns:
        Tuple[成功创建的工资明细列表, 错误信息列表]
    """
    created_entries = []
    errors = []
    
    # 验证工资周期是否存在
    period = db.query(PayrollPeriod).filter(PayrollPeriod.id == payroll_period_id).first()
    if not period:
        raise ValueError(f"Payroll period with ID {payroll_period_id} not found")
    
    # 获取或创建默认的PayrollRun
    default_run = db.query(PayrollRun).filter(
        PayrollRun.payroll_period_id == payroll_period_id
    ).first()
    
    if not default_run:
        # 创建默认的PayrollRun
        from datetime import datetime
        from .config import get_lookup_value_by_code, get_lookup_type_by_code
        
        # 获取"待计算"状态的ID
        # 首先获取PAYROLL_RUN_STATUS类型的ID
        payroll_run_status_type = get_lookup_type_by_code(db, "PAYROLL_RUN_STATUS")
        if not payroll_run_status_type:
            raise ValueError("PAYROLL_RUN_STATUS lookup type not found")
        
        pending_status = get_lookup_value_by_code(db, payroll_run_status_type.id, "PRUN_PENDING_CALC")
        if not pending_status:
            raise ValueError("PAYROLL_RUN_STATUS lookup value 'PRUN_PENDING_CALC' not found")
        
        run_data = PayrollRunCreate(
            payroll_period_id=payroll_period_id,
            status_lookup_value_id=pending_status.id
        )
        default_run = create_payroll_run(db, run_data)
    
    for i, entry_data in enumerate(entries):
        try:
            # 首先尝试根据employee_id获取员工
            employee = None
            if hasattr(entry_data, 'employee_id') and entry_data.employee_id:
                employee = get_employee(db, entry_data.employee_id)
            
            # 如果没有提供employee_id或找不到员工，尝试使用姓名+身份证匹配
            if not employee and hasattr(entry_data, 'employee_info') and entry_data.employee_info:
                info = entry_data.employee_info
                if info.get('last_name') and info.get('first_name') and info.get('id_number'):
                    employee = get_employee_by_name_and_id_number(
                        db, 
                        info['last_name'], 
                        info['first_name'], 
                        info['id_number']
                    )
                    if employee:
                        entry_data.employee_id = employee.id
            
            # 如果还是找不到员工，记录错误
            if not employee:
                errors.append({
                    "index": i,
                    "employee_id": getattr(entry_data, 'employee_id', None),
                    "error": "Employee not found"
                })
                continue
                
            # 设置payroll_run_id和payroll_period_id
            entry_data.payroll_run_id = default_run.id
            entry_data.payroll_period_id = payroll_period_id
            
            # 创建一个不包含employee_info的数据字典，用于传递给create_payroll_entry
            entry_dict = entry_data.dict(exclude={'employee_info'})
            clean_entry_data = PayrollEntryCreate(**entry_dict)
            
            # 检查是否已存在相同的工资明细
            existing_entry = None
            if overwrite_mode:
                existing_entry = db.query(PayrollEntry).filter(
                    PayrollEntry.employee_id == clean_entry_data.employee_id,
                    PayrollEntry.payroll_period_id == payroll_period_id,
                    PayrollEntry.payroll_run_id == default_run.id
                ).first()
            
            if existing_entry and overwrite_mode:
                # 更新现有记录
                for field, value in clean_entry_data.dict(exclude_unset=True).items():
                    if hasattr(existing_entry, field):
                        setattr(existing_entry, field, value)
                existing_entry.updated_at = func.now()
                db.commit()
                db.refresh(existing_entry)
                created_entries.append(existing_entry)
            elif existing_entry and not overwrite_mode:
                # 记录错误：记录已存在
                errors.append({
                    "index": i,
                    "employee_id": clean_entry_data.employee_id,
                    "error": f"Payroll entry already exists for employee {clean_entry_data.employee_id} in this period"
                })
            else:
                # 创建新记录
                db_entry = create_payroll_entry(db, clean_entry_data)
                created_entries.append(db_entry)
                
        except Exception as e:
            # 记录错误
            errors.append({
                "index": i,
                "employee_id": getattr(entry_data, 'employee_id', None),
                "error": str(e)
            })
            # 回滚当前事务中的更改
            db.rollback()
    
    return created_entries, errors
