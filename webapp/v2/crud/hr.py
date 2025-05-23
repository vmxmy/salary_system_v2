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
    logger.debug(f"原始字段值 - 部门名称: '{employee.department_name}', 职位名称: '{employee.position_name}', 人员类别: '{employee.personnel_category_name}'")
    
    if employee.department_name:
        dept = _get_department_by_name(db, employee.department_name)
        if dept:
            employee_data['department_id'] = dept.id
            logger.debug(f"成功解析部门 '{employee.department_name}' 为ID: {dept.id}")
        else:
            logger.warning(f"无法找到部门 '{employee.department_name}'")
    elif "department_id" not in employee_data and employee.department_id is not None: # If ID was directly provided
         employee_data["department_id"] = employee.department_id
         logger.debug(f"使用直接提供的部门ID: {employee.department_id}")


    if employee.position_name:
        pos = _get_position_by_name(db, employee.position_name)
        if pos:
            employee_data["actual_position_id"] = pos.id # Assuming field name is actual_position_id
            logger.debug(f"成功解析职位 '{employee.position_name}' 为ID: {pos.id}")
        else:
            logger.warning(f"无法找到职位 '{employee.position_name}'")
    elif "actual_position_id" not in employee_data and employee.actual_position_id is not None: # If ID was directly provided
         employee_data["actual_position_id"] = employee.actual_position_id
         logger.debug(f"使用直接提供的职位ID: {employee.actual_position_id}")
    
    # Resolve personnel category by name (NEW)
    if employee.personnel_category_name:
        pc = _get_personnel_category_by_name(db, employee.personnel_category_name)
        if pc:
            employee_data["personnel_category_id"] = pc.id
            logger.debug(f"成功解析人员类别 '{employee.personnel_category_name}' 为ID: {pc.id}")
        else:
            logger.warning(f"无法找到人员类别 '{employee.personnel_category_name}'")
    elif "personnel_category_id" not in employee_data and employee.personnel_category_id is not None: # If ID was directly provided
        employee_data["personnel_category_id"] = employee.personnel_category_id
        logger.debug(f"使用直接提供的人员类别ID: {employee.personnel_category_id}")

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
    logger.info(f"尝试创建员工工作历史，员工ID: {db_employee.id}, 部门ID: {db_employee.department_id}, 职位ID: {db_employee.actual_position_id}, 人员类别ID: {db_employee.personnel_category_id}")
    
    if db_employee.actual_position_id and db_employee.department_id and db_employee.personnel_category_id:
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
    elif db_employee.actual_position_id:
        # 当有职位但缺少部门或人员类别时记录警告
        missing_fields = []
        if not db_employee.department_id:
            missing_fields.append("department_id")
        if not db_employee.personnel_category_id:
            missing_fields.append("personnel_category_id")
        logger.warning(f"无法为员工 {db_employee.id} 创建工作历史记录，缺少必要字段: {', '.join(missing_fields)}")

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

    try:
        # 只处理循环引用问题 - 清除该员工作为其他员工管理者的关系
        # 将所有以此员工为manager的工作历史记录的manager_id设为NULL
        db.query(EmployeeJobHistory).filter(
            EmployeeJobHistory.manager_id == employee_id
        ).update({EmployeeJobHistory.manager_id: None}, synchronize_session=False)
        
        # 处理请假申请中的批准人关系 
        # 将所有以此员工为批准人的请假申请的approved_by_employee_id设为NULL
        db.query(EmployeeLeaveRequest).filter(
            EmployeeLeaveRequest.approved_by_employee_id == employee_id
        ).update({EmployeeLeaveRequest.approved_by_employee_id: None}, synchronize_session=False)
        
        # 提交这些预处理更新
        db.flush()
        
        # 删除员工 - ORM级联删除会自动处理相关记录
        db.delete(db_employee)
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting employee {employee_id}: {e}", exc_info=True)
        raise


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

# Helper function to get department by name
def _get_department_by_name(db: Session, name: str) -> Optional[DepartmentModel]:
    return db.query(DepartmentModel).filter(func.lower(DepartmentModel.name) == func.lower(name)).first()

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

def create_bulk_employees(db: Session, employees_in: List[EmployeeCreate], overwrite_mode: bool = False) -> Tuple[List[Employee], List[Dict]]:
    """批量创建员工，返回成功和失败记录的详细信息"""
    created_employees = []
    failed_records = []
    seen_employee_codes_in_batch = set()
    seen_id_numbers_in_batch = set()
    
    # 定义处理结果的记录类
    class RecordResult:
        def __init__(self):
            self.errors = []
            self.success_employee_id = None
    

    logger.info(f"开始批量创建员工, 数量: {len(employees_in)}, 覆盖模式: {overwrite_mode}")

    for index, emp_in in enumerate(employees_in):
        try:
            current_record_errors = []
            record_result = RecordResult()
            logger.debug(f"处理第{index+1}条记录, 员工代码: {emp_in.employee_code}, 身份证号: {emp_in.id_number}")

            # 1. Validate basic constraints
            # Ensure employee_code uniqueness within batch and DB
            if emp_in.employee_code:
                if emp_in.employee_code in seen_employee_codes_in_batch:
                    current_record_errors.append(f"批次中存在重复的员工代码 '{emp_in.employee_code}'")
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
                        logger.info(f"覆盖模式: 找到已存在的员工代码 '{emp_in.employee_code}', ID: {emp_in.id}, 将进行更新")
                    else:
                        current_record_errors.append(f"员工代码 '{emp_in.employee_code}' 已存在于数据库中")
                        logger.warning(f"员工代码 '{emp_in.employee_code}' 已存在，但不在覆盖模式，跳过")

            if emp_in.id_number:
                if emp_in.id_number in seen_id_numbers_in_batch:
                    current_record_errors.append(f"批次中存在重复的身份证号 '{emp_in.id_number}'")
                    logger.warning(f"批次中存在重复的身份证号 '{emp_in.id_number}'")
                seen_id_numbers_in_batch.add(emp_in.id_number)
                existing_employee = get_employee_by_id_number(db, emp_in.id_number)
                if existing_employee:
                    if overwrite_mode:
                        # 如果之前没有通过employee_code找到，则通过id_number找到
                        if not hasattr(emp_in, 'id') or emp_in.id is None:
                            emp_in.id = existing_employee.id
                            logger.info(f"覆盖模式: 通过身份证号 '{emp_in.id_number}' 找到已存在的员工, ID: {emp_in.id}, 将进行更新")
                    else:
                        current_record_errors.append(f"身份证号 '{emp_in.id_number}' 已存在于数据库中")
                        logger.warning(f"身份证号 '{emp_in.id_number}' 已存在，但不在覆盖模式，跳过")

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
                "bank_account_number",
                # 排除新增的lookup name字段
                "salary_level_lookup_value_name",
                "salary_grade_lookup_value_name",
                "ref_salary_level_lookup_value_name"
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
                current_record_errors.append(f"员工状态 '{emp_in.status_lookup_value_name}' 无法解析或缺失")
            employee_orm_data["status_lookup_value_id"] = status_id
            
            employee_orm_data["employment_type_lookup_value_id"] = _resolve_lookup_id(db, emp_in.employment_type_lookup_value_name, "EMPLOYMENT_TYPE")
            employee_orm_data["education_level_lookup_value_id"] = _resolve_lookup_id(db, emp_in.education_level_lookup_value_name, "EDUCATION_LEVEL")
            employee_orm_data["marital_status_lookup_value_id"] = _resolve_lookup_id(db, emp_in.marital_status_lookup_value_name, "MARITAL_STATUS")
            employee_orm_data["political_status_lookup_value_id"] = _resolve_lookup_id(db, emp_in.political_status_lookup_value_name, "POLITICAL_STATUS")
            employee_orm_data["contract_type_lookup_value_id"] = _resolve_lookup_id(db, emp_in.contract_type_lookup_value_name, "CONTRACT_TYPE")

            # Resolve department and position
            logger.debug(f"原始字段值 - 部门名称: '{emp_in.department_name}', 职位名称: '{emp_in.position_name}', 人员类别: '{emp_in.personnel_category_name}'")
            
            if emp_in.department_name:
                dept = _get_department_by_name(db, emp_in.department_name)
                if dept:
                    employee_orm_data["department_id"] = dept.id
                    logger.debug(f"成功解析部门 '{emp_in.department_name}' 为ID: {dept.id}")
                else:
                    # 尝试模糊匹配部门名称
                    similar_depts = db.query(DepartmentModel).filter(
                        func.lower(DepartmentModel.name).like(f"%{emp_in.department_name.lower()}%")
                    ).all()
                    
                    if similar_depts and len(similar_depts) == 1:
                        # 如果只找到一个相似部门，使用它
                        employee_orm_data["department_id"] = similar_depts[0].id
                        logger.info(f"使用模糊匹配找到部门 '{similar_depts[0].name}' (ID: {similar_depts[0].id}) 代替 '{emp_in.department_name}'")
                    else:
                        # 在覆盖模式下，如果是更新现有员工，允许跳过部门验证
                        if overwrite_mode and hasattr(emp_in, 'id') and emp_in.id is not None:
                            logger.warning(f"无法找到部门 '{emp_in.department_name}'，但在覆盖模式下继续更新员工")
                        else:
                            current_record_errors.append(f"部门 '{emp_in.department_name}' 在数据库中未找到")
                            logger.warning(f"无法找到部门 '{emp_in.department_name}'")
            elif "department_id" not in employee_orm_data and emp_in.department_id is not None: # If ID was directly provided
                 employee_orm_data["department_id"] = emp_in.department_id
                 logger.debug(f"使用直接提供的部门ID: {emp_in.department_id}")


            if emp_in.position_name:
                pos = _get_position_by_name(db, emp_in.position_name)
                if pos:
                    employee_orm_data["actual_position_id"] = pos.id # Assuming field name is actual_position_id
                    logger.debug(f"成功解析职位 '{emp_in.position_name}' 为ID: {pos.id}")
                else:
                    # 尝试模糊匹配职位名称
                    similar_positions = db.query(PositionModel).filter(
                        func.lower(PositionModel.name).like(f"%{emp_in.position_name.lower()}%")
                    ).all()
                    
                    if similar_positions and len(similar_positions) == 1:
                        # 如果只找到一个相似职位，使用它
                        employee_orm_data["actual_position_id"] = similar_positions[0].id
                        logger.info(f"使用模糊匹配找到职位 '{similar_positions[0].name}' (ID: {similar_positions[0].id}) 代替 '{emp_in.position_name}'")
                    else:
                        # 在覆盖模式下，如果是更新现有员工，允许跳过职位验证
                        if overwrite_mode and hasattr(emp_in, 'id') and emp_in.id is not None:
                            logger.warning(f"无法找到职位 '{emp_in.position_name}'，但在覆盖模式下继续更新员工")
                        else:
                            current_record_errors.append(f"职位 '{emp_in.position_name}' 在数据库中未找到")
                            logger.warning(f"无法找到职位 '{emp_in.position_name}'")
            elif "actual_position_id" not in employee_orm_data and emp_in.actual_position_id is not None: # If ID was directly provided
                 employee_orm_data["actual_position_id"] = emp_in.actual_position_id
                 logger.debug(f"使用直接提供的职位ID: {emp_in.actual_position_id}")
            
            # Resolve personnel category by name (NEW)
            if emp_in.personnel_category_name:
                pc = _get_personnel_category_by_name(db, emp_in.personnel_category_name)
                if pc:
                    employee_orm_data["personnel_category_id"] = pc.id
                    logger.debug(f"成功解析人员类别 '{emp_in.personnel_category_name}' 为ID: {pc.id}")
                else:
                    # 尝试模糊匹配人员类别名称
                    similar_categories = db.query(PersonnelCategoryModel).filter(
                        func.lower(PersonnelCategoryModel.name).like(f"%{emp_in.personnel_category_name.lower()}%")
                    ).all()
                    
                    if similar_categories and len(similar_categories) == 1:
                        # 如果只找到一个相似人员类别，使用它
                        employee_orm_data["personnel_category_id"] = similar_categories[0].id
                        logger.info(f"使用模糊匹配找到人员类别 '{similar_categories[0].name}' (ID: {similar_categories[0].id}) 代替 '{emp_in.personnel_category_name}'")
                    else:
                        # 在覆盖模式下，如果是更新现有员工，允许跳过人员类别验证
                        if overwrite_mode and hasattr(emp_in, 'id') and emp_in.id is not None:
                            logger.warning(f"无法找到人员类别 '{emp_in.personnel_category_name}'，但在覆盖模式下继续更新员工")
                        else:
                            current_record_errors.append(f"人员类别 '{emp_in.personnel_category_name}' 在数据库中未找到")
                            logger.warning(f"无法找到人员类别 '{emp_in.personnel_category_name}'")
            elif "personnel_category_id" not in employee_orm_data and emp_in.personnel_category_id is not None: # If ID was directly provided
                employee_orm_data["personnel_category_id"] = emp_in.personnel_category_id
                logger.debug(f"使用直接提供的人员类别ID: {emp_in.personnel_category_id}")

            # If company_id is None, try to set from context or default (placeholder logic)
            if employee_orm_data.get("company_id") is None:
                # Add logic here if company_id needs to be set from user context or a default
                # For now, we'll assume it might be optional or handled by DB default if not in emp_in
                pass

            # 处理lookup字段
            logger.debug(f"处理lookup字段: 工资级别: {emp_in.salary_level_lookup_value_name}, 工资档次: {emp_in.salary_grade_lookup_value_name}, 参照正编薪级: {emp_in.ref_salary_level_lookup_value_name}")
            
            # 处理新增的lookup字段，并记录日志
            if not employee_orm_data.get('salary_level_lookup_value_id') and emp_in.salary_level_lookup_value_name:
                salary_level_id = _resolve_lookup_id(db, emp_in.salary_level_lookup_value_name, "SALARY_LEVEL")
                if salary_level_id is None:
                    logger.warning(f"无法解析工资级别 '{emp_in.salary_level_lookup_value_name}'")
                else:
                    logger.debug(f"成功解析工资级别 '{emp_in.salary_level_lookup_value_name}' 为ID: {salary_level_id}")
                    employee_orm_data['salary_level_lookup_value_id'] = salary_level_id
                
            if not employee_orm_data.get('salary_grade_lookup_value_id') and emp_in.salary_grade_lookup_value_name:
                salary_grade_id = _resolve_lookup_id(db, emp_in.salary_grade_lookup_value_name, "SALARY_GRADE")
                if salary_grade_id is None:
                    logger.warning(f"无法解析工资档次 '{emp_in.salary_grade_lookup_value_name}'")
                else:
                    logger.debug(f"成功解析工资档次 '{emp_in.salary_grade_lookup_value_name}' 为ID: {salary_grade_id}")
                    employee_orm_data['salary_grade_lookup_value_id'] = salary_grade_id
                
            if not employee_orm_data.get('ref_salary_level_lookup_value_id') and emp_in.ref_salary_level_lookup_value_name:
                ref_salary_level_id = _resolve_lookup_id(db, emp_in.ref_salary_level_lookup_value_name, "REF_SALARY_LEVEL")
                if ref_salary_level_id is None:
                    logger.warning(f"无法解析参照正编薪级 '{emp_in.ref_salary_level_lookup_value_name}'")
                else:
                    logger.debug(f"成功解析参照正编薪级 '{emp_in.ref_salary_level_lookup_value_name}' 为ID: {ref_salary_level_id}")
                    employee_orm_data['ref_salary_level_lookup_value_id'] = ref_salary_level_id

            # Determine if we are updating an existing employee or creating a new one
            db_employee_to_process: Optional[Employee] = None
            is_new_employee_creation = True

            if overwrite_mode:
                if emp_in.employee_code:
                    existing_by_code = get_employee_by_code(db, emp_in.employee_code)
                    if existing_by_code:
                        db_employee_to_process = existing_by_code
                        logger.info(f"覆写模式: 找到已存在的员工代码 '{emp_in.employee_code}', ID: {db_employee_to_process.id}, 将进行更新")
                        is_new_employee_creation = False
                if not db_employee_to_process and emp_in.id_number:
                    existing_by_id_number = get_employee_by_id_number(db, emp_in.id_number)
                    if existing_by_id_number:
                        if db_employee_to_process and db_employee_to_process.id != existing_by_id_number.id:
                            current_record_errors.append(f"Data inconsistency: Employee code '{emp_in.employee_code}' and ID number '{emp_in.id_number}' point to different existing employees.")
                            logger.error(f"数据不一致: 员工代码 '{emp_in.employee_code}' (ID: {db_employee_to_process.id}) 和身份证号 '{emp_in.id_number}' (ID: {existing_by_id_number.id}) 指向不同的现有员工。")
                        else:
                            db_employee_to_process = existing_by_id_number
                            logger.info(f"覆写模式: 通过身份证号 '{emp_in.id_number}' 找到已存在的员工, ID: {db_employee_to_process.id}, 将进行更新")
                            is_new_employee_creation = False
            
            if current_record_errors: 
                record_result.errors.extend(current_record_errors)
            else: # No pre-check errors, proceed with create/update and then sub-operations
                if db_employee_to_process: # Update existing employee
                    logger.info(f"覆写模式: 更新员工 ID {db_employee_to_process.id} 的信息")
                    old_actual_position_id = db_employee_to_process.actual_position_id
                    old_department_id = db_employee_to_process.department_id
                    old_personnel_category_id = db_employee_to_process.personnel_category_id
                    for key, value in employee_orm_data.items():
                        setattr(db_employee_to_process, key, value)
                    job_history_relevant_change_detected = (
                        db_employee_to_process.actual_position_id != old_actual_position_id or
                        db_employee_to_process.department_id != old_department_id or
                        db_employee_to_process.personnel_category_id != old_personnel_category_id
                    )
                    logger.info(f"员工 {db_employee_to_process.id} - 工作历史相关字段变更: {job_history_relevant_change_detected}")
                    if job_history_relevant_change_detected:
                        if db_employee_to_process.actual_position_id and db_employee_to_process.department_id and db_employee_to_process.personnel_category_id:
                            from datetime import date
                            today = date.today()
                            effective_date = employee_orm_data.get('current_position_start_date') or db_employee_to_process.current_position_start_date or db_employee_to_process.hire_date or today
                            if db_employee_to_process.current_position_start_date != effective_date:
                                db_employee_to_process.current_position_start_date = effective_date
                            is_first_time_in_new_position = True
                            if db_employee_to_process.job_history:
                                for history_item in db_employee_to_process.job_history:
                                    if history_item.position_id == db_employee_to_process.actual_position_id:
                                        is_first_time_in_new_position = False
                                        break
                            if is_first_time_in_new_position and (db_employee_to_process.career_position_level_date is None or db_employee_to_process.career_position_level_date > effective_date):
                                 db_employee_to_process.career_position_level_date = effective_date
                            if db_employee_to_process.job_history:
                                for history_item in db_employee_to_process.job_history:
                                    if history_item.end_date is None:
                                        history_item.end_date = effective_date
                                        logger.info(f"覆写模式: 结束员工 {db_employee_to_process.id} 的旧工作历史记录 ID {history_item.id}，end_date 设置为 {effective_date}")
                            new_job_history_entry = EmployeeJobHistory(
                                employee_id=db_employee_to_process.id,
                                department_id=db_employee_to_process.department_id,
                                position_id=db_employee_to_process.actual_position_id,
                                personnel_category_id=db_employee_to_process.personnel_category_id,
                                effective_date=effective_date,
                                end_date=None
                            )
                            db.add(new_job_history_entry)
                            logger.info(f"覆写模式: 为员工 {db_employee_to_process.id} 创建了新的工作历史记录，生效日期 {effective_date}")
                        else:
                            logger.warning(f"覆写模式: 员工 {db_employee_to_process.id} 职位相关变更但缺少关键信息，未创建工作历史。")
                    else:
                        logger.info(f"覆写模式: 员工 {db_employee_to_process.id} 职位相关信息无变更，不处理工作历史。")
                else: # Create new employee (db_employee_to_process was None initially)
                    logger.info(f"创建新员工: {emp_in.first_name} {emp_in.last_name}")
                    db_employee_to_process = Employee(**employee_orm_data)
                    db.add(db_employee_to_process)
                
                # This check is vital: if after create/update, db_employee_to_process is still None, something is wrong.
                # This should only happen if current_record_errors got populated inside this 'else' block (which it shouldn't)
                # or if db.add failed silently (unlikely for most DBs without flush and error).
                if not db_employee_to_process: 
                    current_record_errors.append("内部逻辑错误: 员工ORM对象在创建/更新后仍为空。")
                    logger.error(f"内部逻辑错误: 员工记录 {index} 的ORM对象在创建/更新后仍为空，即使没有预检查错误。")
                
                # Proceed with flush and sub-object creation only if no NEW errors AND db_employee_to_process is valid
                if not current_record_errors and db_employee_to_process: # Ensure no errors so far from this block AND instance is valid
                    db.flush() 
                    record_result.success_employee_id = db_employee_to_process.id

                    if bank_name and bank_account_number:
                        primary_bank_account = db.query(EmployeeBankAccount).filter(
                            EmployeeBankAccount.employee_id == db_employee_to_process.id,
                            EmployeeBankAccount.is_primary == True
                        ).first()
                        if primary_bank_account:
                            primary_bank_account.bank_name = bank_name
                            primary_bank_account.account_number = bank_account_number
                            primary_bank_account.account_holder_name = f"{emp_in.last_name} {emp_in.first_name}".strip()
                            logger.info(f"更新了员工 {db_employee_to_process.id} 的银行账户信息。")
                        else:
                            new_bank_account = EmployeeBankAccount(
                                employee_id=db_employee_to_process.id,
                                bank_name=bank_name,
                                account_number=bank_account_number,
                                account_holder_name=f"{emp_in.last_name} {emp_in.first_name}".strip(),
                                is_primary=True
                            )
                            db.add(new_bank_account)
                            logger.info(f"为员工 {db_employee_to_process.id} 创建了新的银行账户信息。")
                    
                    if emp_in.appraisals is not None:
                        db.query(EmployeeAppraisal).filter(EmployeeAppraisal.employee_id == db_employee_to_process.id).delete(synchronize_session=False)
                        if emp_in.appraisals:
                            for appraisal_data_pydantic in emp_in.appraisals:
                                appraisal_dict = appraisal_data_pydantic.model_dump(exclude_unset=True, exclude={'id', 'employee_id'})
                                db_appraisal = EmployeeAppraisal(**appraisal_dict, employee_id=db_employee_to_process.id)
                                db.add(db_appraisal)
                            logger.info(f"为员工 {db_employee_to_process.id} 添加/更新了 {len(emp_in.appraisals)} 条年度考核记录。")
                        else:
                            logger.info(f"为员工 {db_employee_to_process.id} 删除了所有年度考核记录。")

                    if is_new_employee_creation: 
                        logger.info(f"尝试为新员工 {db_employee_to_process.id} 创建初始工作历史记录")
                        if db_employee_to_process.actual_position_id and db_employee_to_process.department_id and db_employee_to_process.personnel_category_id:
                            from datetime import date
                            today = date.today()
                            effective_date_initial = db_employee_to_process.current_position_start_date or db_employee_to_process.hire_date or today
                            if not db_employee_to_process.career_position_level_date:
                                db_employee_to_process.career_position_level_date = effective_date_initial
                            initial_job_history = EmployeeJobHistory(
                                employee_id=db_employee_to_process.id,
                                department_id=db_employee_to_process.department_id,
                                position_id=db_employee_to_process.actual_position_id,
                                personnel_category_id=db_employee_to_process.personnel_category_id,
                                effective_date=effective_date_initial,
                                end_date=None
                            )
                            db.add(initial_job_history)
                            logger.info(f"为新员工 {db_employee_to_process.id} 创建了初始工作历史记录，生效日期 {effective_date_initial}")
                        else:
                            logger.warning(f"无法为新员工 {db_employee_to_process.id} 创建初始工作历史记录，缺少关键字段。")
                # else: # This means current_record_errors got populated (either pre-check or during this block)
                #    If errors occurred, they should already be in record_result.errors by now.
                #    The initial current_record_errors extend is at the top of the outer else.
                #    Any new errors from this block should also be appended.
                #    The original: if current_record_errors: record_result.errors.extend(current_record_errors) will handle it later.
                #    It might be better to put that final extend inside this outer else block if it's specific to operations here.

            # This final check for current_record_errors handles errors from all stages for the current record.       
            if current_record_errors: 
                 record_result.errors.extend(list(set(current_record_errors))) # Use set to avoid duplicate error messages if any
            
            # 如果没有错误且成功创建了员工记录，则添加到成功列表
            if not record_result.errors and record_result.success_employee_id:
                successful_employee = get_employee(db, record_result.success_employee_id)
                if successful_employee:
                    created_employees.append(successful_employee)
                    logger.info(f"成功处理员工记录 {index+1}，ID: {record_result.success_employee_id}")
                else:
                    logger.warning(f"员工记录 {index+1} 创建成功但无法获取详情，ID: {record_result.success_employee_id}")
            
            # 如果有错误，收集失败记录信息
            if record_result.errors:
                failed_record = {
                    "original_index": index,
                    "employee_code": emp_in.employee_code,
                    "id_number": emp_in.id_number,
                    "first_name": emp_in.first_name,
                    "last_name": emp_in.last_name,
                    "errors": record_result.errors
                }
                failed_records.append(failed_record)
                logger.warning(f"员工记录 {index+1} 处理失败，错误: {record_result.errors}")

        except ValueError as ve:
            # 捕获并记录验证错误
            logger.error(f"处理第{index+1}条记录时发生ValueError异常: {ve}")
            failed_record = {
                "original_index": index,
                "employee_code": getattr(emp_in, 'employee_code', None),
                "id_number": getattr(emp_in, 'id_number', None),
                "first_name": getattr(emp_in, 'first_name', None),
                "last_name": getattr(emp_in, 'last_name', None),
                "errors": [f"验证错误: {str(ve)}"]
            }
            failed_records.append(failed_record)
        except Exception as e:
            # 捕获其他未预期的错误
            logger.error(f"处理第{index+1}条记录时发生未预期异常: {e}")
            failed_record = {
                "original_index": index,
                "employee_code": getattr(emp_in, 'employee_code', None),
                "id_number": getattr(emp_in, 'id_number', None),
                "first_name": getattr(emp_in, 'first_name', None),
                "last_name": getattr(emp_in, 'last_name', None),
                "errors": [f"系统错误: {str(e)}"]
            }
            failed_records.append(failed_record)

    # 提交更改并返回
    total_count = len(employees_in)
    success_count = len(created_employees)
    failed_count = len(failed_records)
    
    if failed_count > 0:
        logger.warning(f"批量员工创建部分成功。总计: {total_count}, 成功: {success_count}, 失败: {failed_count}")
    else:
        logger.info(f"批量员工创建完全成功，共创建/更新 {success_count} 条记录")
    
    db.commit()
    return created_employees, failed_records
