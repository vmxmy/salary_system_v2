"""
人事相关的CRUD操作。
"""
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, and_, inspect, select
from typing import List, Optional, Tuple, Dict, Any
import logging

from ..models.hr import (
    Employee, Department, PersonnelCategory, EmployeeJobHistory,
    EmployeeContract, EmployeeCompensationHistory, EmployeePayrollComponent,
    LeaveType, EmployeeLeaveBalance, EmployeeLeaveRequest, EmployeeBankAccount,
    Position, EmployeeAppraisal, Department as DepartmentModel, Employee as EmployeeModel, EmployeeAppraisal as EmployeeAppraisalModel, EmployeeJobHistory as EmployeeJobHistoryModel, PersonnelCategory as PersonnelCategoryModel, Position as PositionModel
)
from ..models.config import LookupValue, LookupType

from ..pydantic_models.hr import (
    EmployeeCreate, EmployeeUpdate, DepartmentCreate, DepartmentUpdate,
    PersonnelCategoryCreate, PersonnelCategoryUpdate, EmployeeJobHistoryCreate, EmployeeJobHistoryUpdate,
    PositionCreate, PositionUpdate, EmployeeAppraisalCreate, EmployeeAppraisalUpdate
)

logger = logging.getLogger(__name__)

# Employee CRUD
def get_employees(
    db: Session,
    search: Optional[str] = None,
    status_id: Optional[int] = None,
    department_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100
) -> Tuple[List[Employee], int]:
    """
    获取员工列表，包含完整的关联对象。

    Args:
        db: 数据库会话
        search: 搜索关键字
        status_id: 员工状态ID
        department_id: 部门ID
        skip: 跳过的记录数
        limit: 返回的记录数

    Returns:
        员工对象列表 (已预加载关联数据) 和总记录数
    """
    from sqlalchemy.orm import selectinload, joinedload

    query = db.query(Employee)

    # 应用过滤条件
    if status_id:
        query = query.filter(Employee.status_lookup_value_id == status_id)

    # department_id 过滤直接作用于 Employee.department_id
    if department_id:
        query = query.filter(Employee.department_id == department_id)

    # 应用搜索过滤
    if search:
        search_term = f"%{search}%"
        employee_filters = [
            Employee.employee_code.ilike(search_term),
            Employee.first_name.ilike(search_term),
            Employee.last_name.ilike(search_term),
            Employee.id_number.ilike(search_term),
            Employee.email.ilike(search_term),
            Employee.phone_number.ilike(search_term)
        ]
        # 如果需要基于 current_department 的名称进行搜索，可以添加 join
        # query = query.outerjoin(Employee.current_department)
        # employee_filters.append(Department.name.ilike(search_term))
        query = query.filter(or_(*employee_filters))


    # 获取总记录数 (在应用 options 和分页之前)
    count_query = db.query(func.count(Employee.id))
    if status_id:
        count_query = count_query.filter(Employee.status_lookup_value_id == status_id)
    if department_id:
        count_query = count_query.filter(Employee.department_id == department_id) # Filter count query by department_id directly
    if search:
        # Apply the same search filters to count_query
        # This also needs to handle joins if search spans related tables.
        count_query = count_query.filter(or_(*employee_filters)) # Simplified search for count

    total = count_query.scalar()

    # 应用 eager loading options to the main query
    query = query.options(
        selectinload(Employee.gender),
        selectinload(Employee.status),
        selectinload(Employee.employment_type),
        selectinload(Employee.education_level),
        selectinload(Employee.marital_status),
        selectinload(Employee.political_status),
        selectinload(Employee.contract_type),
        selectinload(Employee.current_department),
        selectinload(Employee.personnel_category),
        selectinload(Employee.actual_position).selectinload(Position.parent_position),
        selectinload(Employee.appraisals).selectinload(EmployeeAppraisal.appraisal_result),
        selectinload(Employee.bank_accounts),
        selectinload(Employee.job_history).options( 
            selectinload(EmployeeJobHistory.department),
            selectinload(EmployeeJobHistory.position_detail).selectinload(Position.parent_position),
            selectinload(EmployeeJobHistory.personnel_category_detail).selectinload(PersonnelCategory.parent_category),
            selectinload(EmployeeJobHistory.manager)
        )
    )

    # 应用排序和分页
    query = query.order_by(Employee.last_name, Employee.first_name)
    query = query.offset(skip).limit(limit)

    results = query.all()

    return results, total


def get_employee(db: Session, employee_id: int) -> Optional[Employee]:
    """
    根据ID获取员工。

    Args:
        db: 数据库会话
        employee_id: 员工ID

    Returns:
        员工对象，如果不存在则返回None
    """
    from sqlalchemy.orm import selectinload, joinedload

    return db.query(Employee).options(
        # Eager load direct LookupValue relationships
        selectinload(Employee.gender),
        selectinload(Employee.status),
        selectinload(Employee.employment_type),
        selectinload(Employee.education_level),
        selectinload(Employee.marital_status),
        selectinload(Employee.political_status),
        selectinload(Employee.contract_type),
        
        # Eager load related main objects
        selectinload(Employee.current_department),
        selectinload(Employee.personnel_category),
        selectinload(Employee.actual_position).selectinload(Position.parent_position),
        
        # Eager load list-based relationships
        selectinload(Employee.appraisals).selectinload(EmployeeAppraisal.appraisal_result),
        selectinload(Employee.job_history).options(
            selectinload(EmployeeJobHistory.department),
            selectinload(EmployeeJobHistory.position_detail).selectinload(Position.parent_position),
            selectinload(EmployeeJobHistory.personnel_category_detail).selectinload(PersonnelCategory.parent_category),
            selectinload(EmployeeJobHistory.manager)
        ),
        selectinload(Employee.bank_accounts),
        # selectinload(Employee.contracts)
        # selectinload(Employee.compensation_history)
        # selectinload(Employee.payroll_components)

    ).filter(Employee.id == employee_id).first()


def get_employee_by_code(db: Session, employee_code: str) -> Optional[Employee]:
    """
    根据员工代码获取员工。

    Args:
        db: 数据库会话
        employee_code: 员工代码

    Returns:
        员工对象，如果不存在则返回None
    """
    return db.query(Employee).filter(Employee.employee_code == employee_code).first()


def get_employee_by_id_number(db: Session, id_number: str) -> Optional[Employee]:
    """
    根据身份证号获取员工。

    Args:
        db: 数据库会话
        id_number: 身份证号

    Returns:
        员工对象，如果不存在则返回None
    """
    return db.query(Employee).filter(Employee.id_number == id_number).first()


def create_employee(db: Session, employee: EmployeeCreate) -> Employee:
    """
    创建员工。

    Args:
        db: 数据库会话
        employee: 员工创建模型

    Returns:
        创建的员工对象
    """
    # 检查员工代码是否已存在
    existing_code = get_employee_by_code(db, employee.employee_code)
    if existing_code:
        raise ValueError(f"Employee with code '{employee.employee_code}' already exists")

    # 如果提供了身份证号，检查是否已存在
    if employee.id_number:
        existing_id = get_employee_by_id_number(db, employee.id_number)
        if existing_id:
            raise ValueError(f"Employee with ID number '{employee.id_number}' already exists")

    # 保存银行信息以便稍后创建银行账户记录
    bank_name = employee.bank_name
    bank_account_number = employee.bank_account_number

    # 从 Pydantic 模型提取员工数据，排除不属于 Employee 模型的字段
    fields_to_exclude = {
        "appraisals", 
        # 排除银行相关字段，因为这些字段不在 Employee 模型中
        "bank_name", 
        "bank_account_number",
        # 排除其他用于解析的名称字段
        "gender_lookup_value_name", 
        "status_lookup_value_name",
        "employment_type_lookup_value_name", 
        "education_level_lookup_value_name",
        "marital_status_lookup_value_name", 
        "political_status_lookup_value_name",
        "contract_type_lookup_value_name", 
        "department_name", 
        "position_name",
        "personnel_category_name"
    }
    
    employee_data = employee.model_dump(exclude_none=True, exclude=fields_to_exclude)

    # 处理lookup fields，将名称转换为ID
    # 必须处理status_lookup_value_name，因为status_lookup_value_id是必填字段
    if not employee_data.get('status_lookup_value_id') and employee.status_lookup_value_name:
        status_id = _resolve_lookup_id(db, employee.status_lookup_value_name, "EMPLOYEE_STATUS")
        if status_id is None:
            raise ValueError(f"Status '{employee.status_lookup_value_name}' could not be resolved or is missing.")
        employee_data['status_lookup_value_id'] = status_id
    
    # 处理其他可选lookup fields
    if not employee_data.get('gender_lookup_value_id') and employee.gender_lookup_value_name:
        employee_data['gender_lookup_value_id'] = _resolve_lookup_id(db, employee.gender_lookup_value_name, "GENDER")
    
    if not employee_data.get('employment_type_lookup_value_id') and employee.employment_type_lookup_value_name:
        employee_data['employment_type_lookup_value_id'] = _resolve_lookup_id(db, employee.employment_type_lookup_value_name, "EMPLOYMENT_TYPE")
    
    if not employee_data.get('education_level_lookup_value_id') and employee.education_level_lookup_value_name:
        employee_data['education_level_lookup_value_id'] = _resolve_lookup_id(db, employee.education_level_lookup_value_name, "EDUCATION_LEVEL")
    
    if not employee_data.get('marital_status_lookup_value_id') and employee.marital_status_lookup_value_name:
        employee_data['marital_status_lookup_value_id'] = _resolve_lookup_id(db, employee.marital_status_lookup_value_name, "MARITAL_STATUS")
    
    if not employee_data.get('political_status_lookup_value_id') and employee.political_status_lookup_value_name:
        employee_data['political_status_lookup_value_id'] = _resolve_lookup_id(db, employee.political_status_lookup_value_name, "POLITICAL_STATUS")
    
    if not employee_data.get('contract_type_lookup_value_id') and employee.contract_type_lookup_value_name:
        employee_data['contract_type_lookup_value_id'] = _resolve_lookup_id(db, employee.contract_type_lookup_value_name, "CONTRACT_TYPE")
    
    # 处理department和position
    if not employee_data.get('department_id') and employee.department_name:
        dept = _get_department_by_name(db, employee.department_name)
        if dept:
            employee_data['department_id'] = dept.id
    
    if not employee_data.get('actual_position_id') and employee.position_name:
        pos = _get_position_by_name(db, employee.position_name)
        if pos:
            employee_data['actual_position_id'] = pos.id
    
    if not employee_data.get('personnel_category_id') and employee.personnel_category_name:
        pc = _get_personnel_category_by_name(db, employee.personnel_category_name)
        if pc:
            employee_data['personnel_category_id'] = pc.id
    
    db_employee = Employee(**employee_data)
    
    db.add(db_employee)
    # 先 flush 获取 employee ID，用于创建关联的记录
    try:
        db.flush() 
    except Exception as e:
        db.rollback()
        logger.error(f"Error flushing new employee: {e}")
        raise

    # 如果提供了银行信息，创建银行账户记录
    if bank_name and bank_account_number:
        try:
            # 创建银行账户记录
            bank_account = EmployeeBankAccount(
                employee_id=db_employee.id,
                bank_name=bank_name,
                account_number=bank_account_number,
                account_holder_name=f"{db_employee.last_name} {db_employee.first_name}".strip(),  # 使用员工姓名作为账户持有人
                is_primary=True  # 设为主要账户
            )
            db.add(bank_account)
            logger.info(f"Created bank account for employee {db_employee.id}: {bank_name}, {bank_account_number}")
        except Exception as e:
            db.rollback()
            logger.error(f"Error creating bank account for employee {db_employee.id}: {e}")
            raise ValueError(f"Failed to create bank account: {str(e)}")

    # 处理年度考核 appraisals (如果提供)
    if hasattr(employee, 'appraisals') and employee.appraisals:
        for appraisal_data in employee.appraisals:
            db_appraisal = EmployeeAppraisal(
                **appraisal_data.model_dump(), 
                employee_id=db_employee.id
            )
            db.add(db_appraisal)
    
    # 创建初始工作历史记录
    if db_employee.actual_position_id:
        try:
            from datetime import date
            today = date.today()
            
            # 确定effective_date
            effective_date = db_employee.current_position_start_date or db_employee.hire_date or today
            
            # 如果不存在career_position_level_date，则将其设置为effective_date
            if not db_employee.career_position_level_date:
                db_employee.career_position_level_date = effective_date
                
            # 创建工作历史记录
            job_history = EmployeeJobHistory(
                employee_id=db_employee.id,
                department_id=db_employee.department_id,
                position_id=db_employee.actual_position_id,
                personnel_category_id=db_employee.personnel_category_id,
                effective_date=effective_date,
                end_date=None  # 开放结束日期，直到职位变更
            )
            db.add(job_history)
            logger.info(f"Created initial job history record for new employee {db_employee.id}")
        except Exception as e:
            logger.error(f"Error creating initial job history record for employee {db_employee.id}: {e}")

    db.commit()
    db.refresh(db_employee)
    # Re-query to load all relationships for the response, as per Pydantic model expectations
    # This ensures that the returned object is fully populated.
    return get_employee(db, db_employee.id) # Use existing get_employee to load relations


def update_employee(db: Session, employee_id: int, employee: EmployeeUpdate) -> Optional[Employee]:
    """
    更新员工。

    Args:
        db: 数据库会话
        employee_id: 员工ID
        employee: 员工更新模型

    Returns:
        更新后的员工对象，如果不存在则返回None
    """
    # 获取要更新的员工
    db_employee = get_employee(db, employee_id)
    if not db_employee:
        return None

    logger.info(f"--- CRUD LOG: update_employee (hr.py) ---")
    logger.info(f"Updating employee_id: {employee_id}")
    logger.info(f"Data from Pydantic model (EmployeeUpdate): {employee.model_dump_json(indent=2)}")

    # 如果员工代码发生变化，检查新代码是否已存在
    if employee.employee_code is not None and employee.employee_code != db_employee.employee_code:
        existing = get_employee_by_code(db, employee.employee_code)
        if existing:
            raise ValueError(f"Employee with code '{employee.employee_code}' already exists")

    # 如果身份证号发生变化，检查新身份证号是否已存在
    if employee.id_number is not None and employee.id_number != db_employee.id_number:
        existing = get_employee_by_id_number(db, employee.id_number)
        if existing:
            raise ValueError(f"Employee with ID number '{employee.id_number}' already exists")

    # 保存银行信息以便稍后处理
    bank_name = employee.bank_name
    bank_account_number = employee.bank_account_number

    # 检查职位变更情况，记录职位变更前的值
    position_changed = (
        employee.actual_position_id is not None and 
        employee.actual_position_id != db_employee.actual_position_id
    )
    old_position_id = db_employee.actual_position_id

    # 更新员工的直接字段，排除不属于Employee模型的字段
    fields_to_exclude = {
        "appraisals", 
        # 排除银行相关字段，因为这些字段不在Employee模型中
        "bank_name", 
        "bank_account_number"
    }
    update_data = employee.model_dump(exclude_unset=True, exclude=fields_to_exclude)
    
    for key, value in update_data.items():
        if hasattr(db_employee, key):
            setattr(db_employee, key, value)
        else:
            logger.warning(f"Attempted to set non-existent attribute '{key}' on Employee model during update.")

    # 处理银行账户信息更新
    if bank_name is not None and bank_account_number is not None:
        # 查找员工的主要银行账户
        primary_account = None
        for account in db_employee.bank_accounts:
            if account.is_primary:
                primary_account = account
                break
        
        if not primary_account and db_employee.bank_accounts:
            # 如果没有主要账户但有其他账户，使用第一个
            primary_account = db_employee.bank_accounts[0]
        
        if primary_account:
            # 更新现有账户
            primary_account.bank_name = bank_name
            primary_account.account_number = bank_account_number
            primary_account.account_holder_name = f"{db_employee.last_name} {db_employee.first_name}".strip()
            primary_account.is_primary = True
            logger.info(f"Updated bank account for employee {employee_id}: {bank_name}, {bank_account_number}")
        else:
            # 创建新账户
            new_account = EmployeeBankAccount(
                employee_id=employee_id,
                bank_name=bank_name,
                account_number=bank_account_number,
                account_holder_name=f"{db_employee.last_name} {db_employee.first_name}".strip(),
                is_primary=True
            )
            db.add(new_account)
            logger.info(f"Created new bank account for employee {employee_id}: {bank_name}, {bank_account_number}")
    
    # 如果职位发生变更，自动创建一条工作历史记录
    if position_changed:
        from datetime import date
        # 设置当前职位的起始时间
        today = date.today()
        
        # 检查是否提供了current_position_start_date，如果没有则默认使用当前日期
        if employee.current_position_start_date:
            effective_date = employee.current_position_start_date
        else:
            effective_date = today
            # 同时更新员工的current_position_start_date字段
            db_employee.current_position_start_date = today
        
        # 检查是否是员工首次担任该职位，如果是则更新career_position_level_date
        first_time_in_position = True
        for history in db_employee.job_history:
            if history.position_id == employee.actual_position_id:
                first_time_in_position = False
                break
        
        if first_time_in_position and not db_employee.career_position_level_date:
            db_employee.career_position_level_date = effective_date
        
        # 结束之前的工作历史记录(如果有)
        for job_history in db_employee.job_history:
            if job_history.end_date is None:
                job_history.end_date = effective_date
                break
        
        # 获取必要的关联ID
        department_id = db_employee.department_id
        personnel_category_id = db_employee.personnel_category_id
        
        # 创建新的工作历史记录
        try:
            new_job_history = EmployeeJobHistory(
                employee_id=employee_id,
                department_id=department_id,
                position_id=employee.actual_position_id,
                personnel_category_id=personnel_category_id,
                effective_date=effective_date,
                end_date=None  # 开放结束日期，直到下次职位变更
            )
            db.add(new_job_history)
            logger.info(f"Created job history record for employee {employee_id}: "
                        f"position change from {old_position_id} to {employee.actual_position_id} "
                        f"effective {effective_date}")
        except Exception as e:
            logger.error(f"Error creating job history record for employee {employee_id}: {e}")
    
    # 处理年度考核 appraisals 的更新
    # Only proceed if 'appraisals' key was provided in the payload and is not None.
    # If employee.appraisals is an empty list [], it means to delete all existing and add no new ones.
    # If employee.appraisals is None, existing appraisals are not touched.
    if employee.appraisals is not None:
        # 1. 删除该员工所有现有的年度考核记录
        logger.info(f"Updating appraisals for employee {employee_id}. Deleting existing ones first.")
        db.query(EmployeeAppraisal).filter(EmployeeAppraisal.employee_id == employee_id).delete(synchronize_session=False)
        
        # 2. 如果传入了新的 appraisals 数据 (i.e., list is not empty), 则创建它们
        if employee.appraisals: # This ensures the list itself is not empty
            logger.info(f"Adding {len(employee.appraisals)} new appraisal records.")
            for appraisal_data_pydantic in employee.appraisals: # appraisal_data_pydantic is EmployeeAppraisalUpdate
                # For new appraisals, id might not be present.
                # Since current strategy is delete all then add all from payload, id from payload item is ignored.
                appraisal_dict = appraisal_data_pydantic.model_dump(exclude_unset=True) 
                
                # Ensure 'id' and 'employee_id' from payload item are not used when creating new ORM instances
                appraisal_dict.pop('id', None) 
                appraisal_dict.pop('employee_id', None) # employee_id will be set from the main employee_id

                db_appraisal = EmployeeAppraisal(
                    **appraisal_dict, 
                    employee_id=employee_id 
                )
                db.add(db_appraisal)
        else:
            logger.info(f"Payload contained empty list for appraisals. All existing appraisals for employee {employee_id} were deleted and no new ones added.")
    else:
        logger.info(f"'appraisals' field was not provided or was null in the payload for employee {employee_id}. Existing appraisals remain untouched.")
    
    try:
        db.commit()
        db.refresh(db_employee)
    except Exception as e:
        db.rollback()
        logger.error(f"Error committing employee update for ID {employee_id}: {e}")
        raise
        
    # Re-query to load all relationships for the response
    return get_employee(db, employee_id)


def delete_employee(db: Session, employee_id: int) -> bool:
    """
    删除员工。

    Args:
        db: 数据库会话
        employee_id: 员工ID

    Returns:
        是否成功删除
    """
    # 获取要删除的员工
    db_employee = get_employee(db, employee_id)
    if not db_employee:
        return False

    # 删除员工
    db.delete(db_employee)
    db.commit()
    return True


# Department CRUD
def get_departments(
    db: Session,
    parent_id: Optional[int] = None,
    is_active: Optional[bool] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
) -> Tuple[List[Department], int]:
    """
    获取部门列表。

    Args:
        db: 数据库会话
        parent_id: 父部门ID
        is_active: 是否激活
        search: 搜索关键字
        skip: 跳过的记录数
        limit: 返回的记录数

    Returns:
        部门列表和总记录数
    """
    query = db.query(Department)

    # 应用过滤条件
    if parent_id is not None:
        query = query.filter(Department.parent_department_id == parent_id)

    if is_active is not None:
        query = query.filter(Department.is_active == is_active)

    # 应用搜索过滤
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Department.code.ilike(search_term),
                Department.name.ilike(search_term)
            )
        )

    # 获取总记录数
    total = query.count()

    # 应用排序和分页
    query = query.order_by(Department.name)
    query = query.offset(skip).limit(limit)

    return query.all(), total


def get_department(db: Session, department_id: int) -> Optional[Department]:
    """
    根据ID获取部门。

    Args:
        db: 数据库会话
        department_id: 部门ID

    Returns:
        部门对象，如果不存在则返回None
    """
    return db.query(Department).filter(Department.id == department_id).first()


def get_department_by_code(db: Session, code: str) -> Optional[Department]:
    """
    根据代码获取部门。

    Args:
        db: 数据库会话
        code: 部门代码

    Returns:
        部门对象，如果不存在则返回None
    """
    return db.query(Department).filter(Department.code == code).first()


def create_department(db: Session, department: DepartmentCreate) -> Department:
    """
    创建部门。

    Args:
        db: 数据库会话
        department: 部门创建模型

    Returns:
        创建的部门对象
    """
    # 检查部门代码是否已存在
    existing = get_department_by_code(db, department.code)
    if existing:
        raise ValueError(f"Department with code '{department.code}' already exists")

    # 创建新的部门
    db_department = Department(**department.model_dump())
    db.add(db_department)
    db.commit()
    db.refresh(db_department)
    return db_department


def update_department(db: Session, department_id: int, department: DepartmentUpdate) -> Optional[Department]:
    """
    更新部门。

    Args:
        db: 数据库会话
        department_id: 部门ID
        department: 部门更新模型

    Returns:
        更新后的部门对象，如果不存在则返回None
    """
    # 获取要更新的部门
    db_department = get_department(db, department_id)
    if not db_department:
        return None

    # 如果部门代码发生变化，检查新代码是否已存在
    if department.code is not None and department.code != db_department.code:
        existing = get_department_by_code(db, department.code)
        if existing:
            raise ValueError(f"Department with code '{department.code}' already exists")

    # 更新部门
    update_data = department.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_department, key, value)

    db.commit()
    db.refresh(db_department)
    return db_department


def delete_department(db: Session, department_id: int) -> bool:
    """
    删除部门。

    Args:
        db: 数据库会话
        department_id: 部门ID

    Returns:
        是否成功删除
    """
    # 获取要删除的部门
    db_department = get_department(db, department_id)
    if not db_department:
        return False

    # 检查是否有员工工作历史引用了该部门
    job_history_count = db.query(EmployeeJobHistory).filter(EmployeeJobHistory.department_id == department_id).count()
    if job_history_count > 0:
        raise ValueError(f"Cannot delete department with ID {department_id} because it is referenced by {job_history_count} employee job history records")

    # 检查是否有子部门引用了该部门
    child_department_count = db.query(Department).filter(Department.parent_department_id == department_id).count()
    if child_department_count > 0:
        raise ValueError(f"Cannot delete department with ID {department_id} because it has {child_department_count} child departments")

    # 删除部门
    db.delete(db_department)
    db.commit()
    return True


# PersonnelCategory CRUD (人员类别 CRUD)
def get_personnel_categories(
    db: Session,
    parent_id: Optional[int] = None,
    is_active: Optional[bool] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
) -> Tuple[List[PersonnelCategory], int]:
    """
    获取人员类别列表。

    Args:
        db: 数据库会话
        parent_id: 父人员类别ID
        is_active: 是否激活
        search: 搜索关键字
        skip: 跳过的记录数
        limit: 返回的记录数

    Returns:
        人员类别列表和总记录数
    """
    query = db.query(PersonnelCategory)

    # 应用过滤条件
    if parent_id is not None:
        query = query.filter(PersonnelCategory.parent_category_id == parent_id)
    # parent_id为None时，不加parent_category_id过滤，返回所有人员类别

    if is_active is not None:
        query = query.filter(PersonnelCategory.is_active == is_active)

    # 应用搜索过滤
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                PersonnelCategory.code.ilike(search_term),
                PersonnelCategory.name.ilike(search_term),
                PersonnelCategory.description.ilike(search_term)
            )
        )

    # 获取总记录数
    total = query.count()

    # 应用排序和分页
    query = query.order_by(PersonnelCategory.name)
    query = query.offset(skip).limit(limit)

    return query.all(), total


def get_personnel_category(db: Session, personnel_category_id: int) -> Optional[PersonnelCategory]:
    """
    根据ID获取人员类别。

    Args:
        db: 数据库会话
        personnel_category_id: 人员类别ID

    Returns:
        人员类别对象，如果不存在则返回None
    """
    return db.query(PersonnelCategory).filter(PersonnelCategory.id == personnel_category_id).first()


def get_personnel_category_by_code(db: Session, code: str) -> Optional[PersonnelCategory]:
    """
    根据代码获取人员类别。

    Args:
        db: 数据库会话
        code: 人员类别代码

    Returns:
        人员类别对象，如果不存在则返回None
    """
    return db.query(PersonnelCategory).filter(PersonnelCategory.code == code).first()


def create_personnel_category(db: Session, personnel_category: PersonnelCategoryCreate) -> PersonnelCategory:
    """
    创建人员类别。

    Args:
        db: 数据库会话
        personnel_category: 人员类别创建模型

    Returns:
        创建的人员类别对象
    """
    # 检查人员类别代码是否已存在
    existing = get_personnel_category_by_code(db, personnel_category.code)
    if existing:
        raise ValueError(f"PersonnelCategory with code '{personnel_category.code}' already exists")

    # 创建新的人员类别
    db_personnel_category = PersonnelCategory(**personnel_category.model_dump())
    db.add(db_personnel_category)
    db.commit()
    db.refresh(db_personnel_category)
    return db_personnel_category


def update_personnel_category(db: Session, personnel_category_id: int, personnel_category: PersonnelCategoryUpdate) -> Optional[PersonnelCategory]:
    """
    更新人员类别。

    Args:
        db: 数据库会话
        personnel_category_id: 人员类别ID
        personnel_category: 人员类别更新模型

    Returns:
        更新后的人员类别对象，如果不存在则返回None
    """
    # 获取要更新的人员类别
    db_personnel_category = get_personnel_category(db, personnel_category_id)
    if not db_personnel_category:
        return None

    # 如果人员类别代码发生变化，检查新代码是否已存在
    if personnel_category.code is not None and personnel_category.code != db_personnel_category.code:
        existing = get_personnel_category_by_code(db, personnel_category.code)
        if existing:
            raise ValueError(f"PersonnelCategory with code '{personnel_category.code}' already exists")

    # 更新人员类别
    update_data = personnel_category.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_personnel_category, key, value)

    db.commit()
    db.refresh(db_personnel_category)
    return db_personnel_category


def delete_personnel_category(db: Session, personnel_category_id: int) -> bool:
    """
    删除人员类别。

    Args:
        db: 数据库会话
        personnel_category_id: 人员类别ID

    Returns:
        是否成功删除
    """
    # 获取要删除的人员类别
    db_personnel_category = get_personnel_category(db, personnel_category_id)
    if not db_personnel_category:
        return False

    # 检查是否有员工工作历史引用了该人员类别
    job_history_count = db.query(EmployeeJobHistory).filter(EmployeeJobHistory.personnel_category_id == personnel_category_id).count()
    if job_history_count > 0:
        raise ValueError(f"Cannot delete PersonnelCategory with ID {personnel_category_id} because it is referenced by {job_history_count} employee job history records")

    # 检查是否有子人员类别引用了该人员类别
    child_category_count = db.query(PersonnelCategory).filter(PersonnelCategory.parent_category_id == personnel_category_id).count()
    if child_category_count > 0:
        raise ValueError(f"Cannot delete PersonnelCategory with ID {personnel_category_id} because it has {child_category_count} child categories")

    # 删除人员类别
    db.delete(db_personnel_category)
    db.commit()
    return True

# ADDED FUNCTION for getting positions
def get_positions(
    db: Session,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    is_active: Optional[bool] = None
) -> Tuple[List[PositionModel], int]:
    """    
    获取实际任职列表，支持分页、搜索和按激活状态过滤。
    """
    query = db.query(PositionModel)

    if is_active is not None:
        query = query.filter(PositionModel.is_active == is_active)

    if search:
        search_term = f"%{search.lower()}%"
        query = query.filter(
            or_(
                func.lower(PositionModel.name).like(search_term),
                func.lower(PositionModel.code).like(search_term) 
            )
        )
    
    total = query.count()
    positions = query.order_by(PositionModel.name).offset(skip).limit(limit).all()
    return positions, total

def _get_position_by_name(db: Session, name: str) -> Optional[PositionModel]:
    return db.query(PositionModel).filter(func.lower(PositionModel.name) == func.lower(name)).first()

# Helper function to get personnel category by name (NEW)
def _get_personnel_category_by_name(db: Session, name: str) -> Optional[PersonnelCategoryModel]:
    return db.query(PersonnelCategoryModel).filter(func.lower(PersonnelCategoryModel.name) == func.lower(name)).first()

# region Helper functions for resolving IDs
def _resolve_lookup_id(db: Session, text_value: Optional[str], type_code: str) -> Optional[int]:
    """
    Resolves a text value for a lookup to its corresponding ID using the LookupType code.
    Example: text_value="男", type_code="GENDER" -> returns the ID of "男" in lookup_values.
    """
    if not text_value:
        return None
    
    from ..models.config import LookupType, LookupValue 
    # from sqlalchemy import func # Not used in this specific query yet

    # New SQLAlchemy 2.0 style query
    stmt = select(LookupValue.id)\
        .join(LookupType, LookupValue.lookup_type_id == LookupType.id)\
        .where(LookupType.code == type_code)\
        .where(LookupValue.name == text_value)
    
    # lookup_value_id = db.scalar_one_or_none(stmt) # Original attempt for 2.0 style
    result = db.execute(stmt) # Execute the statement first
    lookup_value_id = result.scalar_one_or_none() # Then get the scalar from the result

    if lookup_value_id is None:
        logger.warning(f"Lookup value not found for text: '{text_value}' with type_code: '{type_code}'. A new one might be created if applicable or this will be skipped.")
    return lookup_value_id

def create_bulk_employees(db: Session, employees_in: List[EmployeeCreate], overwrite_mode: bool = False) -> List[Employee]:
    """
    批量创建员工。

    Args:
        db: 数据库会话
        employees_in: 员工创建模型列表 (包含 *_name fields for lookups and department/position)
        overwrite_mode: 是否启用覆盖模式，允许更新已存在的员工记录（根据身份证号和员工代码匹配）

    Returns:
        成功创建的员工对象列表

    Raises:
        ValueError: If data validation fails (e.g., duplicate employee_code or id_number,
                    unresolved mandatory lookups, unresolved department/position if name provided but not found).
        Exception: If a database operation fails.
    """
    created_employees: List[Employee] = []
    errors: List[Dict[str, Any]] = [] # To collect errors for records

    # For checking uniqueness within the batch
    seen_employee_codes_in_batch = set()
    seen_id_numbers_in_batch = set()

    db_employees_to_add: List[Employee] = []
    # 保存银行账户信息，稍后创建
    bank_accounts_to_add: List[Tuple[int, dict]] = []  # (employee_index, bank_account_data)

    for index, emp_in in enumerate(employees_in):
        current_record_errors = []
        try:
            # 1. Validate uniqueness within the batch and against DB for non-empty employee_code
            if emp_in.employee_code: # Only validate if employee_code is not None and not empty string
                if emp_in.employee_code in seen_employee_codes_in_batch:
                    current_record_errors.append(f"Duplicate employee_code '{emp_in.employee_code}' in batch.")
                seen_employee_codes_in_batch.add(emp_in.employee_code)
                
                # Check against DB only if employee_code is provided
                # The get_employee_by_code function expects a string, so this check is implicitly for non-None codes.
                # If the DB allows multiple NULLs but unique non-NULLs, this is fine.
                # If DB has unique constraint that treats multiple empty strings as duplicate, that's a DB level concern.
                existing_in_db = get_employee_by_code(db, emp_in.employee_code)
                if existing_in_db:
                    if overwrite_mode:
                        # 在覆盖模式下，保存现有员工ID用于更新
                        emp_in.id = existing_in_db.id
                        logger.info(f"Overwrite mode: Found existing employee with code '{emp_in.employee_code}', will update.")
                    else:
                        current_record_errors.append(f"Employee_code '{emp_in.employee_code}' already exists in DB.")

            if emp_in.id_number:
                if emp_in.id_number in seen_id_numbers_in_batch:
                    current_record_errors.append(f"Duplicate id_number '{emp_in.id_number}' in batch.")
                seen_id_numbers_in_batch.add(emp_in.id_number)
                existing_employee = get_employee_by_id_number(db, emp_in.id_number)
                if existing_employee:
                    if overwrite_mode:
                        # 如果之前没有通过employee_code找到，则通过id_number找到
                        if not hasattr(emp_in, 'id') or emp_in.id is None:
                            emp_in.id = existing_employee.id
                            logger.info(f"Overwrite mode: Found existing employee with ID number '{emp_in.id_number}', will update.")
                    else:
                        current_record_errors.append(f"Id_number '{emp_in.id_number}' already exists in DB.")

            # 保存银行信息以便稍后创建
            bank_name = emp_in.bank_name
            bank_account_number = emp_in.bank_account_number

            # 2. Prepare data for Employee ORM model
            # Start with fields that don't need special resolution from EmployeeCreate
            # Exclude _name fields as they are resolved to _id fields, and exclude appraisals.
            fields_to_exclude = {
                "appraisals", 
                "gender_lookup_value_name", 
                "status_lookup_value_name",
                "employment_type_lookup_value_name", 
                "education_level_lookup_value_name",
                "marital_status_lookup_value_name", 
                "political_status_lookup_value_name",
                "contract_type_lookup_value_name", 
                "department_name", 
                "position_name",
                "personnel_category_name", 
                # 排除银行相关字段，因为这些字段不在 Employee 模型中
                "bank_name", 
                "bank_account_number"
            }
            employee_orm_data = emp_in.model_dump(exclude_none=True, exclude=fields_to_exclude)

            # Ensure employee_code is None if it's an empty string, to play well with DB unique constraints on NULL vs ''
            if "employee_code" in employee_orm_data and employee_orm_data["employee_code"] == "":
                employee_orm_data["employee_code"] = None
            elif emp_in.employee_code == "": # also catch case where it was not excluded by model_dump due to exclude_none=False or not being None
                employee_orm_data["employee_code"] = None

            # Resolve lookups
            employee_orm_data["gender_lookup_value_id"] = _resolve_lookup_id(db, emp_in.gender_lookup_value_name, "GENDER")
            
            status_id = _resolve_lookup_id(db, emp_in.status_lookup_value_name, "EMPLOYEE_STATUS")
            if status_id is None: # status_lookup_value_id is mandatory in EmployeeBase
                current_record_errors.append(f"Status '{emp_in.status_lookup_value_name}' could not be resolved or is missing.")
            employee_orm_data["status_lookup_value_id"] = status_id
            
            employee_orm_data["employment_type_lookup_value_id"] = _resolve_lookup_id(db, emp_in.employment_type_lookup_value_name, "EMPLOYMENT_TYPE")
            employee_orm_data["education_level_lookup_value_id"] = _resolve_lookup_id(db, emp_in.education_level_lookup_value_name, "EDUCATION_LEVEL")
            employee_orm_data["marital_status_lookup_value_id"] = _resolve_lookup_id(db, emp_in.marital_status_lookup_value_name, "MARITAL_STATUS")
            employee_orm_data["political_status_lookup_value_id"] = _resolve_lookup_id(db, emp_in.political_status_lookup_value_name, "POLITICAL_STATUS")
            employee_orm_data["contract_type_lookup_value_id"] = _resolve_lookup_id(db, emp_in.contract_type_lookup_value_name, "CONTRACT_TYPE")

            # Resolve department and position
            if emp_in.department_name:
                dept = _get_department_by_name(db, emp_in.department_name)
                if dept:
                    employee_orm_data["department_id"] = dept.id
                else:
                    current_record_errors.append(f"Department '{emp_in.department_name}' not found.")
            elif "department_id" not in employee_orm_data and emp_in.department_id is not None: # If ID was directly provided
                 employee_orm_data["department_id"] = emp_in.department_id


            if emp_in.position_name:
                pos = _get_position_by_name(db, emp_in.position_name)
                if pos:
                    employee_orm_data["actual_position_id"] = pos.id # Assuming field name is actual_position_id
                else:
                    current_record_errors.append(f"Position '{emp_in.position_name}' not found.")
            elif "actual_position_id" not in employee_orm_data and emp_in.actual_position_id is not None: # If ID was directly provided
                 employee_orm_data["actual_position_id"] = emp_in.actual_position_id
            
            # Resolve personnel category by name (NEW)
            if emp_in.personnel_category_name:
                pc = _get_personnel_category_by_name(db, emp_in.personnel_category_name)
                if pc:
                    employee_orm_data["personnel_category_id"] = pc.id
                else:
                    current_record_errors.append(f"Personnel Category '{emp_in.personnel_category_name}' not found.")
            elif "personnel_category_id" not in employee_orm_data and emp_in.personnel_category_id is not None: # If ID was directly provided
                employee_orm_data["personnel_category_id"] = emp_in.personnel_category_id

            # If company_id is None, try to set from context or default (placeholder logic)
            if employee_orm_data.get("company_id") is None:
                # Add logic here if company_id needs to be set from user context or a default
                # For now, we'll assume it might be optional or handled by DB default if not in emp_in
                pass


            if current_record_errors:
                errors.append({"record_index": index, "employee_code": emp_in.employee_code, "errors": current_record_errors})
                continue # Skip this record

            # 在覆盖模式下，处理更新现有员工的情况
            if overwrite_mode and hasattr(emp_in, 'id') and emp_in.id is not None:
                # 查找现有员工
                existing_employee = get_employee(db, emp_in.id)
                if existing_employee:
                    # 更新现有员工的字段
                    for key, value in employee_orm_data.items():
                        setattr(existing_employee, key, value)
                    db_employee = existing_employee
                    logger.info(f"Overwrite mode: Updating existing employee with ID {emp_in.id}")
                else:
                    # 如果找不到员工（不应该发生），创建新员工
                    db_employee = Employee(**employee_orm_data)
                    logger.warning(f"Overwrite mode: Could not find employee with ID {emp_in.id}, creating new.")
            else:
                # 正常创建新员工
                db_employee = Employee(**employee_orm_data)
            
            db_employees_to_add.append(db_employee)
            if overwrite_mode and hasattr(emp_in, 'id') and emp_in.id is not None:
                # 对于已存在的记录，不需要add，会自动更新
                pass
            else:
                db.add(db_employee)
            
            # 如果提供了银行信息，保存以便稍后创建
            if bank_name and bank_account_number:
                bank_accounts_to_add.append((index, {
                    "bank_name": bank_name,
                    "account_number": bank_account_number,
                    "first_name": emp_in.first_name,
                    "last_name": emp_in.last_name
                }))

        except Exception as e_rec:
            logger.error(f"Error processing record {index} ({emp_in.employee_code if emp_in else 'N/A'}): {e_rec}", exc_info=True)
            errors.append({"record_index": index, "employee_code": (emp_in.employee_code if emp_in else 'N/A'), "errors": [str(e_rec)]})


    if not db_employees_to_add: # If all records had errors or input was empty
        if errors: # If there were errors, raise them or return them
             # Depending on API design, you might raise an exception or return error details
            raise ValueError(f"Employee bulk creation failed with errors: {errors}")
        return [] # No employees to create, no errors, return empty list


    try:
        db.flush() # Flush all valid employees

        # 创建银行账户
        for idx, bank_data in bank_accounts_to_add:
            employee = db_employees_to_add[idx]
            try:
                bank_account = EmployeeBankAccount(
                    employee_id=employee.id,
                    bank_name=bank_data["bank_name"],
                    account_number=bank_data["account_number"],
                    account_holder_name=f"{bank_data['last_name']} {bank_data['first_name']}".strip(),
                    is_primary=True
                )
                db.add(bank_account)
                logger.info(f"Created bank account for employee {employee.id}: {bank_data['bank_name']}, {bank_data['account_number']}")
            except Exception as e:
                logger.error(f"Error creating bank account for employee {employee.id}: {e}")
                # 这里不抛出错误，我们继续处理其他记录
        
        # 为每个员工创建初始工作历史记录
        from datetime import date
        today = date.today()
        
        for employee in db_employees_to_add:
            if employee.actual_position_id and employee.department_id and employee.personnel_category_id:
                try:
                    # 确定effective_date
                    effective_date = employee.current_position_start_date or employee.hire_date or today
                    
                    # 如果不存在career_position_level_date，则将其设置为effective_date
                    if not employee.career_position_level_date:
                        employee.career_position_level_date = effective_date
                    
                    # 创建工作历史记录
                    job_history = EmployeeJobHistory(
                        employee_id=employee.id,
                        department_id=employee.department_id,
                        position_id=employee.actual_position_id,
                        personnel_category_id=employee.personnel_category_id,
                        effective_date=effective_date,
                        end_date=None  # 开放结束日期，直到职位变更
                    )
                    db.add(job_history)
                    logger.info(f"Created initial job history record for bulk-created employee {employee.id}")
                except Exception as e:
                    logger.error(f"Error creating initial job history record for employee {employee.id}: {e}")
                    # 这里不抛出错误，我们继续处理其他记录

        # Appraisals are explicitly not handled in this bulk employee creation
        # If they were, logic would go here, iterating emp_in and db_employees_to_add

        db.commit()

        for db_emp in db_employees_to_add:
            db.refresh(db_emp)
            # For consistency with single create, re-query. Consider optimizing for bulk.
            refreshed_emp = get_employee(db, db_emp.id) 
            if refreshed_emp:
                created_employees.append(refreshed_emp)
            else: # Should not happen
                logger.error(f"Failed to re-fetch employee with ID {db_emp.id} after bulk commit.")
                # Potentially add the original db_emp to created_employees as a fallback
                # or handle this as a more critical error.
    
    except Exception as e_commit:
        db.rollback()
        logger.error(f"Error during bulk employee commit phase: {e_commit}", exc_info=True)
        # Add commit phase errors to the list or raise a general exception
        # For now, re-raise to be handled by API route
        raise ValueError(f"Commit phase failed: {e_commit}. Errors from validation phase: {errors}")

    if errors: # If there were validation errors for some records, but others committed
        # Log them or include them in a more complex response structure
        logger.warning(f"Partial success in bulk employee creation. Errors: {errors}")
        # Depending on API contract, you might still return created_employees
        # and have a way to communicate partial failure.

    return created_employees
