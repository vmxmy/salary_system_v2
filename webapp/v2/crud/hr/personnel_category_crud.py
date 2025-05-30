"""
人员类别相关的CRUD操作。
"""
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import List, Optional, Tuple

from ...models.hr import PersonnelCategory, EmployeeJobHistory
from ...pydantic_models.hr import PersonnelCategoryCreate, PersonnelCategoryUpdate

# Placeholder for logger if needed in the future
# import logging
# logger = logging.getLogger(__name__)

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
def _get_personnel_category_by_name(db: Session, name: str) -> Optional[PersonnelCategory]:
    """
    Helper function to get personnel category by name (case-insensitive).
    """
    return db.query(PersonnelCategory).filter(func.lower(PersonnelCategory.name) == func.lower(name)).first()