"""
人事相关的CRUD操作。
"""
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, and_, inspect
from typing import List, Optional, Tuple, Dict, Any
import logging

from ..models.hr import (
    Employee, Department, PersonnelCategory, EmployeeJobHistory,
    EmployeeContract, EmployeeCompensationHistory, EmployeePayrollComponent,
    LeaveType, EmployeeLeaveBalance, EmployeeLeaveRequest, EmployeeBankAccount,
    Position, EmployeeAppraisal, Department as DepartmentModel, Employee as EmployeeModel, EmployeeAppraisal as EmployeeAppraisalModel, EmployeeJobHistory as EmployeeJobHistoryModel, PersonnelCategory as PersonnelCategoryModel, Position as PositionModel
)
from ..models.config import LookupValue

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
        # selectinload(Employee.bank_accounts)
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

    # 从 Pydantic 模型提取员工数据，排除 appraisals (如果 appraisals 在 EmployeeCreate 中)
    employee_data = employee.model_dump(exclude_none=True, exclude={"appraisals"}) # Exclude appraisals for now
    db_employee = Employee(**employee_data)
    
    db.add(db_employee)
    # 先 flush 获取 employee ID，用于创建关联的 appraisals
    try:
        db.flush() 
    except Exception as e:
        db.rollback()
        logger.error(f"Error flushing new employee: {e}")
        raise

    # 处理年度考核 appraisals (如果提供)
    if hasattr(employee, 'appraisals') and employee.appraisals:
        for appraisal_data in employee.appraisals:
            db_appraisal = EmployeeAppraisal(
                **appraisal_data.model_dump(), 
                employee_id=db_employee.id
            )
            db.add(db_appraisal)

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

    # 更新员工的直接字段
    update_data = employee.model_dump(exclude_unset=True, exclude={"appraisals"}) # appraisals is handled separately
    for key, value in update_data.items():
        if hasattr(db_employee, key):
            setattr(db_employee, key, value)
        else:
            logger.warning(f"Attempted to set non-existent attribute '{key}' on Employee model during update.")

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
