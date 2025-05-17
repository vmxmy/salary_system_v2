"""
人事相关的CRUD操作。
"""
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, and_, inspect
from typing import List, Optional, Tuple, Dict, Any
import logging

from ..models.hr import (
    Employee, Department, JobTitle, EmployeeJobHistory,
    EmployeeContract, EmployeeCompensationHistory, EmployeePayrollComponent,
    LeaveType, EmployeeLeaveBalance, EmployeeLeaveRequest, EmployeeBankAccount
)
from ..pydantic_models.hr import (
    EmployeeCreate, EmployeeUpdate, DepartmentCreate, DepartmentUpdate,
    JobTitleCreate, JobTitleUpdate, EmployeeJobHistoryCreate, EmployeeJobHistoryUpdate
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
) -> Tuple[List[Tuple[Employee, Optional[str], Optional[str]]], int]:
    """
    获取员工列表，包括当前部门和职位名称。

    Args:
        db: 数据库会话
        search: 搜索关键字
        status_id: 员工状态ID
        department_id: 部门ID
        skip: 跳过的记录数
        limit: 返回的记录数

    Returns:
        员工列表 (包含Employee对象、部门名称、职位名称的元组) 和总记录数
    """
    # Base query with joins for current job history, department, and job title
    query = db.query(
        Employee,
        Department.name.label("department_name"),
        JobTitle.name.label("job_title_name")
    ).join(
        EmployeeJobHistory,
        and_(
            Employee.id == EmployeeJobHistory.employee_id,
            EmployeeJobHistory.end_date == None # Filter for current job history
        ),
        isouter=True # Use isouter=True to include employees without job history
    ).join(
        Department,
        EmployeeJobHistory.department_id == Department.id,
        isouter=True # Use isouter=True to include employees without a department in job history
    ).join(
        JobTitle,
        EmployeeJobHistory.job_title_id == JobTitle.id,
        isouter=True # Use isouter=True to include employees without a job title in job history
    )

    # 应用过滤条件
    if status_id:
        query = query.filter(Employee.status_lookup_value_id == status_id)

    # 应用搜索过滤
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Employee.employee_code.ilike(search_term),
                Employee.first_name.ilike(search_term),
                Employee.last_name.ilike(search_term),
                Employee.id_number.ilike(search_term),
                Employee.email.ilike(search_term),
                Employee.phone_number.ilike(search_term),
                # Include department and job title names in search
                Department.name.ilike(search_term),
                JobTitle.name.ilike(search_term)
            )
        )

    # 如果指定了部门ID，则需要通过员工工作历史关联查询
    if department_id:
        # Filter by department ID in the current job history
        query = query.filter(EmployeeJobHistory.department_id == department_id)


    # Get total count before applying limit and offset
    # To get the correct total count with joins and filters, we need to count the primary entity (Employee)
    # while considering the applied filters. Using a subquery or distinct count might be necessary
    # depending on the complexity and potential for duplicate rows due to joins.
    # A simpler approach for total count with filters applied to the joined tables:
    total_query = db.query(func.count(Employee.id)).select_from(Employee).join(
        EmployeeJobHistory,
        and_(
            Employee.id == EmployeeJobHistory.employee_id,
            EmployeeJobHistory.end_date == None
        ),
        isouter=True
    ).join(
        Department,
        EmployeeJobHistory.department_id == Department.id,
        isouter=True
    ).join(
        JobTitle,
        EmployeeJobHistory.job_title_id == JobTitle.id,
        isouter=True
    )

    if status_id:
        total_query = total_query.filter(Employee.status_lookup_value_id == status_id)

    if search:
        search_term = f"%{search}%"
        total_query = total_query.filter(
            or_(
                Employee.employee_code.ilike(search_term),
                Employee.first_name.ilike(search_term),
                Employee.last_name.ilike(search_term),
                Employee.id_number.ilike(search_term),
                Employee.email.ilike(search_term),
                Employee.phone_number.ilike(search_term),
                Department.name.ilike(search_term),
                JobTitle.name.ilike(search_term)
            )
        )

    if department_id:
        total_query = total_query.filter(EmployeeJobHistory.department_id == department_id)

    total = total_query.scalar()


    # 应用排序和分页
    query = query.order_by(Employee.last_name, Employee.first_name)
    query = query.offset(skip).limit(limit)

    # Execute the query and return results as list of tuples
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
    return db.query(Employee).filter(Employee.id == employee_id).first()


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

    # 创建新的员工
    db_employee = Employee(**employee.model_dump())
    db.add(db_employee)
    db.commit()
    db.refresh(db_employee)
    return db_employee


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

    # 更新员工
    update_data = employee.model_dump(exclude_unset=True)
    logger.info(f"Data to be set on ORM model (exclude_unset=True): {update_data}")
    
    if 'home_address' in update_data:
        logger.info(f"CRUD LOG: 'home_address' IS IN update_data with value: '{update_data['home_address']}'")
    else:
        logger.warning("CRUD LOG: 'home_address' IS NOT IN update_data dictionary!")

    for key, value in update_data.items():
        logger.debug(f"CRUD LOG: Setting attribute: {key} = {value} (type: {type(value)}) precon_value: {getattr(db_employee, key, 'AttributeNotExists')}")
        setattr(db_employee, key, value)
        logger.debug(f"CRUD LOG: Setting attribute: {key} = {value} (type: {type(value)}) post_value: {getattr(db_employee, key, 'AttributeNotExists')}")

    # === Begin SQLAlchemy Inspect for home_address specifically AFTER loop ===
    try:
        attr_state_after_set = inspect(db_employee).attrs.get('home_address')
        if attr_state_after_set:
            logger.info(f"CRUD LOG (After Setattr Loop): Attribute 'home_address' state: value='{attr_state_after_set.value}', history_changed='{attr_state_after_set.history.has_changes()}', history='{attr_state_after_set.history}'")
        else:
            logger.warning("CRUD LOG (After Setattr Loop): FAILED to get attribute state for 'home_address'.")
    except Exception as e_inspect_attr:
        logger.error(f"CRUD LOG (After Setattr Loop): Error during SQLAlchemy inspect of home_address attribute: {e_inspect_attr}")
    # === End SQLAlchemy Inspect for home_address ===

    # 处理银行账户信息
    bank_account_instance_for_logging = None # 用来存储银行账户实例以供日志记录
    if employee.bank_account_number:
        if not employee.bank_name:
            logger.error(f"CRUD LOG: Bank name is missing for employee_id: {db_employee.id} while bank_account_number is provided.")
            raise ValueError("Bank name is required if bank account number is provided.")
        
        # 尝试查找现有的银行账户记录
        bank_account = db.query(EmployeeBankAccount).filter(EmployeeBankAccount.employee_id == db_employee.id).first()
        account_holder_name_to_set = f"{db_employee.first_name} {db_employee.last_name}" # 默认账户持有人姓名

        if bank_account:
            logger.info(f"CRUD LOG: Updating bank account for employee_id: {db_employee.id}")
            bank_account.bank_name = employee.bank_name
            bank_account.account_number = employee.bank_account_number
            bank_account.account_holder_name = account_holder_name_to_set # 确保账户持有人姓名也更新或设置
            bank_account_instance_for_logging = bank_account
            # 其他银行账户字段可以按需更新，例如：
            # bank_account.branch_name = employee.branch_name # 如果Pydantic模型中有
            # bank_account.bank_code = employee.bank_code     # 如果Pydantic模型中有
            # bank_account.is_primary = True # 根据业务逻辑设置
        else:
            logger.info(f"CRUD LOG: Creating new bank account for employee_id: {db_employee.id}")
            new_bank_account = EmployeeBankAccount(
                employee_id=db_employee.id,
                bank_name=employee.bank_name,
                account_number=employee.bank_account_number,
                account_holder_name=account_holder_name_to_set,
                is_primary=True # 通常第一个添加的银行账户设为主要
                # 其他必须字段或有默认值的字段，例如 bank_code, branch_name, account_type_lookup_value_id
            )
            db.add(new_bank_account)
            bank_account_instance_for_logging = new_bank_account
    # 如果 bank_account_number 为空或None，当前逻辑是不删除现有银行账户。
    # 如果需要删除，可以在此处添加 else: db.delete(bank_account) (在找到bank_account之后)

    logger.info(f"CRUD LOG: Values before commit: dob={db_employee.date_of_birth}, email={db_employee.email}, phone={db_employee.phone_number}, home_address={db_employee.home_address}")
    if bank_account_instance_for_logging:
        logger.info(f"CRUD LOG: Bank account (instance for logging) before commit: name='{bank_account_instance_for_logging.bank_name}', number='{bank_account_instance_for_logging.account_number}'")
    
    # === Begin SQLAlchemy Inspect ===
    try:
        session_instance = inspect(db_employee).session
        if session_instance:
            logger.info(f"CRUD LOG: Employee object is in session: {session_instance}")
            if db_employee in session_instance.dirty:
                logger.info("CRUD LOG: Employee object IS marked as dirty in session.")
            else:
                logger.info("CRUD LOG: Employee object is NOT marked as dirty in session.")
            
            # Detailed attribute state
            attr_state = inspect(db_employee).attrs.get('home_address')
            if attr_state:
                logger.info(f"CRUD LOG: Attribute 'home_address' state: value='{attr_state.value}', history_changed='{attr_state.history.has_changes()}'")
        else:
            logger.info("CRUD LOG: Employee object is NOT in a session.")
    except Exception as e_inspect:
        logger.error(f"CRUD LOG: Error during SQLAlchemy inspect: {e_inspect}")
    # === End SQLAlchemy Inspect ===

    db.commit()
    logger.info(f"CRUD LOG: Values after commit, before refresh: dob={db_employee.date_of_birth}, email={db_employee.email}, phone={db_employee.phone_number}, home_address={db_employee.home_address}")
    db.refresh(db_employee)
    logger.info(f"CRUD LOG: Values after refresh: dob={db_employee.date_of_birth}, email={db_employee.email}, phone={db_employee.phone_number}, home_address={db_employee.home_address}")

    # 重新查询银行账户信息以确认持久化状态
    final_bank_account_check = db.query(EmployeeBankAccount).filter(EmployeeBankAccount.employee_id == db_employee.id).first()
    if final_bank_account_check:
        logger.info(f"CRUD LOG: Bank account (final check after refresh) for employee_id {db_employee.id}: name='{final_bank_account_check.bank_name}', number='{final_bank_account_check.account_number}'")
    else:
        logger.info(f"CRUD LOG: No bank account found (final check after refresh) for employee_id {db_employee.id}")
        
    return db_employee


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


# JobTitle CRUD
def get_job_titles(
    db: Session,
    parent_id: Optional[int] = None,
    is_active: Optional[bool] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
) -> Tuple[List[JobTitle], int]:
    """
    获取职位列表。

    Args:
        db: 数据库会话
        parent_id: 父职位ID
        is_active: 是否激活
        search: 搜索关键字
        skip: 跳过的记录数
        limit: 返回的记录数

    Returns:
        职位列表和总记录数
    """
    query = db.query(JobTitle)

    # 应用过滤条件
    if parent_id is not None:
        query = query.filter(JobTitle.parent_job_title_id == parent_id)
    # parent_id为None时，不加parent_job_title_id过滤，返回所有职位

    if is_active is not None:
        query = query.filter(JobTitle.is_active == is_active)

    # 应用搜索过滤
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                JobTitle.code.ilike(search_term),
                JobTitle.name.ilike(search_term),
                JobTitle.description.ilike(search_term)
            )
        )

    # 获取总记录数
    total = query.count()

    # 应用排序和分页
    query = query.order_by(JobTitle.name)
    query = query.offset(skip).limit(limit)

    return query.all(), total


def get_job_title(db: Session, job_title_id: int) -> Optional[JobTitle]:
    """
    根据ID获取职位。

    Args:
        db: 数据库会话
        job_title_id: 职位ID

    Returns:
        职位对象，如果不存在则返回None
    """
    return db.query(JobTitle).filter(JobTitle.id == job_title_id).first()


def get_job_title_by_code(db: Session, code: str) -> Optional[JobTitle]:
    """
    根据代码获取职位。

    Args:
        db: 数据库会话
        code: 职位代码

    Returns:
        职位对象，如果不存在则返回None
    """
    return db.query(JobTitle).filter(JobTitle.code == code).first()


def create_job_title(db: Session, job_title: JobTitleCreate) -> JobTitle:
    """
    创建职位。

    Args:
        db: 数据库会话
        job_title: 职位创建模型

    Returns:
        创建的职位对象
    """
    # 检查职位代码是否已存在
    existing = get_job_title_by_code(db, job_title.code)
    if existing:
        raise ValueError(f"Job title with code '{job_title.code}' already exists")

    # 创建新的职位
    db_job_title = JobTitle(**job_title.model_dump())
    db.add(db_job_title)
    db.commit()
    db.refresh(db_job_title)
    return db_job_title


def update_job_title(db: Session, job_title_id: int, job_title: JobTitleUpdate) -> Optional[JobTitle]:
    """
    更新职位。

    Args:
        db: 数据库会话
        job_title_id: 职位ID
        job_title: 职位更新模型

    Returns:
        更新后的职位对象，如果不存在则返回None
    """
    # 获取要更新的职位
    db_job_title = get_job_title(db, job_title_id)
    if not db_job_title:
        return None

    # 如果职位代码发生变化，检查新代码是否已存在
    if job_title.code is not None and job_title.code != db_job_title.code:
        existing = get_job_title_by_code(db, job_title.code)
        if existing:
            raise ValueError(f"Job title with code '{job_title.code}' already exists")

    # 更新职位
    update_data = job_title.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_job_title, key, value)

    db.commit()
    db.refresh(db_job_title)
    return db_job_title


def delete_job_title(db: Session, job_title_id: int) -> bool:
    """
    删除职位。

    Args:
        db: 数据库会话
        job_title_id: 职位ID

    Returns:
        是否成功删除
    """
    # 获取要删除的职位
    db_job_title = get_job_title(db, job_title_id)
    if not db_job_title:
        return False

    # 检查是否有员工工作历史引用了该职位
    job_history_count = db.query(EmployeeJobHistory).filter(EmployeeJobHistory.job_title_id == job_title_id).count()
    if job_history_count > 0:
        raise ValueError(f"Cannot delete job title with ID {job_title_id} because it is referenced by {job_history_count} employee job history records")

    # 检查是否有子职位引用了该职位
    child_job_title_count = db.query(JobTitle).filter(JobTitle.parent_job_title_id == job_title_id).count()
    if child_job_title_count > 0:
        raise ValueError(f"Cannot delete job title with ID {job_title_id} because it has {child_job_title_count} child job titles")

    # 删除职位
    db.delete(db_job_title)
    db.commit()
    return True
