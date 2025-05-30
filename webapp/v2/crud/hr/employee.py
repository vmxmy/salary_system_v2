"""
员工相关的CRUD操作。
"""
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import func, or_
from typing import List, Optional, Tuple
import logging
from datetime import date

from ...models.hr import (
    Employee, EmployeeJobHistory, EmployeeAppraisal, 
    EmployeeBankAccount, Position, PersonnelCategory
)
from ...pydantic_models.hr import EmployeeCreate, EmployeeUpdate
from .utils import (
    _get_department_by_name, 
    _get_position_by_name, 
    _get_personnel_category_by_name, 
    _resolve_lookup_id
)

logger = logging.getLogger(__name__)


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
    query = db.query(Employee)

    # 应用过滤条件
    if status_id:
        query = query.filter(Employee.status_lookup_value_id == status_id)

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
        query = query.filter(or_(*employee_filters))

    # 获取总记录数
    count_query = db.query(func.count(Employee.id))
    if status_id:
        count_query = count_query.filter(Employee.status_lookup_value_id == status_id)
    if department_id:
        count_query = count_query.filter(Employee.department_id == department_id)
    if search:
        count_query = count_query.filter(or_(*employee_filters))

    total = count_query.scalar()

    # 应用 eager loading options
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


def get_employee_by_name_and_id_number(
    db: Session, 
    last_name: str, 
    first_name: str, 
    id_number: str
) -> Optional[Employee]:
    """
    根据姓名和身份证号获取员工。

    Args:
        db: 数据库会话
        last_name: 姓
        first_name: 名
        id_number: 身份证号

    Returns:
        员工对象，如果不存在则返回None
    """
    return db.query(Employee).filter(
        Employee.last_name == last_name,
        Employee.first_name == first_name,
        Employee.id_number == id_number
    ).first()


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
        # 处理循环引用问题 - 清除该员工作为其他员工管理者的关系
        db.query(EmployeeJobHistory).filter(
            EmployeeJobHistory.manager_id == employee_id
        ).update({EmployeeJobHistory.manager_id: None}, synchronize_session=False)
        
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


# 从其他模块导入创建和更新函数
from .employee_create import create_employee
from .employee_update import update_employee 