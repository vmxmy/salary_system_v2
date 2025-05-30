"""
部门相关的CRUD操作。
"""
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import List, Optional, Tuple

from ...models.hr import Department, EmployeeJobHistory
from ...pydantic_models.hr import DepartmentCreate, DepartmentUpdate

import logging
logger = logging.getLogger(__name__)

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
def _get_department_by_name(db: Session, name: str) -> Optional[Department]:
    """
    Helper function to get department by name (case-insensitive).
    """
    return db.query(Department).filter(func.lower(Department.name) == func.lower(name)).first()