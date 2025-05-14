"""
安全相关的CRUD操作。
"""
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, and_
from typing import List, Optional, Tuple, Dict, Any
from passlib.context import CryptContext

from ..models.security import User, Role, Permission, user_roles, role_permissions
from ..pydantic_models.security import UserCreate, UserUpdate, RoleCreate, RoleUpdate, PermissionCreate, PermissionUpdate, UserRoleCreate, RolePermissionCreate

# 密码哈希工具
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# User CRUD
def get_users(
    db: Session,
    is_active: Optional[bool] = None,
    role_id: Optional[int] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
) -> Tuple[List[User], int]:
    """
    获取用户列表。

    Args:
        db: 数据库会话
        is_active: 是否激活
        role_id: 角色ID
        search: 搜索关键字
        skip: 跳过的记录数
        limit: 返回的记录数

    Returns:
        用户列表和总记录数
    """
    query = db.query(User)

    # 应用过滤条件
    if is_active is not None:
        query = query.filter(User.is_active == is_active)

    # 如果指定了角色ID，则需要通过用户角色关联表查询
    if role_id:
        query = query.join(user_roles).filter(user_roles.c.role_id == role_id)

    # 应用搜索过滤
    if search:
        search_term = f"%{search}%"
        query = query.filter(User.username.ilike(search_term))

    # 获取总记录数
    total = query.count()

    # 应用排序和分页
    query = query.order_by(User.username)
    query = query.offset(skip).limit(limit)

    return query.all(), total


def get_user(db: Session, user_id: int) -> Optional[User]:
    """
    根据ID获取用户。

    Args:
        db: 数据库会话
        user_id: 用户ID

    Returns:
        用户对象，如果不存在则返回None
    """
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_username(db: Session, username: str) -> Optional[User]:
    """
    根据用户名获取用户。

    Args:
        db: 数据库会话
        username: 用户名

    Returns:
        用户对象，如果不存在则返回None
    """
    return db.query(User).filter(User.username == username).first()


def get_user_by_employee_id(db: Session, employee_id: int) -> Optional[User]:
    """
    根据员工ID获取用户。

    Args:
        db: 数据库会话
        employee_id: 员工ID

    Returns:
        用户对象，如果不存在则返回None
    """
    return db.query(User).filter(User.employee_id == employee_id).first()


def create_user(db: Session, user: UserCreate) -> User:
    """
    创建用户。

    Args:
        db: 数据库会话
        user: 用户创建模型

    Returns:
        创建的用户对象
    """
    # 检查用户名是否已存在
    existing_username = get_user_by_username(db, user.username)
    if existing_username:
        raise ValueError(f"User with username '{user.username}' already exists")

    # 如果提供了员工ID，检查是否已存在关联用户
    if user.employee_id:
        existing_employee = get_user_by_employee_id(db, user.employee_id)
        if existing_employee:
            raise ValueError(f"User with employee ID '{user.employee_id}' already exists")

    # 创建新的用户
    user_data = user.model_dump(exclude={"password"})
    hashed_password = pwd_context.hash(user.password)
    db_user = User(**user_data, password_hash=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def update_user(db: Session, user_id: int, user: UserUpdate) -> Optional[User]:
    """
    更新用户。

    Args:
        db: 数据库会话
        user_id: 用户ID
        user: 用户更新模型

    Returns:
        更新后的用户对象，如果不存在则返回None
    """
    # 获取要更新的用户
    db_user = get_user(db, user_id)
    if not db_user:
        return None

    # 如果用户名发生变化，检查新用户名是否已存在
    if user.username is not None and user.username != db_user.username:
        existing = get_user_by_username(db, user.username)
        if existing:
            raise ValueError(f"User with username '{user.username}' already exists")

    # 如果员工ID发生变化，检查新员工ID是否已存在关联用户
    if user.employee_id is not None and user.employee_id != db_user.employee_id:
        existing = get_user_by_employee_id(db, user.employee_id)
        if existing:
            raise ValueError(f"User with employee ID '{user.employee_id}' already exists")

    # 更新用户
    update_data = user.model_dump(exclude_unset=True, exclude={"password"})
    for key, value in update_data.items():
        setattr(db_user, key, value)

    # 如果提供了密码，更新密码哈希
    if user.password:
        db_user.password_hash = pwd_context.hash(user.password)

    db.commit()
    db.refresh(db_user)
    return db_user


def delete_user(db: Session, user_id: int) -> bool:
    """
    删除用户。

    Args:
        db: 数据库会话
        user_id: 用户ID

    Returns:
        是否成功删除
    """
    # 获取要删除的用户
    db_user = get_user(db, user_id)
    if not db_user:
        return False

    # 删除用户
    db.delete(db_user)
    db.commit()
    return True


# Role CRUD
def get_roles(
    db: Session,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
) -> Tuple[List[Role], int]:
    """
    获取角色列表。

    Args:
        db: 数据库会话
        search: 搜索关键字
        skip: 跳过的记录数
        limit: 返回的记录数

    Returns:
        角色列表和总记录数
    """
    query = db.query(Role)

    # 应用搜索过滤
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Role.code.ilike(search_term),
                Role.name.ilike(search_term)
            )
        )

    # 获取总记录数
    total = query.count()

    # 应用排序和分页
    query = query.order_by(Role.name)
    query = query.offset(skip).limit(limit)

    return query.all(), total


def get_role(db: Session, role_id: int) -> Optional[Role]:
    """
    根据ID获取角色。

    Args:
        db: 数据库会话
        role_id: 角色ID

    Returns:
        角色对象，如果不存在则返回None
    """
    return db.query(Role).filter(Role.id == role_id).first()


def get_role_by_code(db: Session, code: str) -> Optional[Role]:
    """
    根据代码获取角色。

    Args:
        db: 数据库会话
        code: 角色代码

    Returns:
        角色对象，如果不存在则返回None
    """
    return db.query(Role).filter(Role.code == code).first()


def create_role(db: Session, role: RoleCreate) -> Role:
    """
    创建角色。

    Args:
        db: 数据库会话
        role: 角色创建模型

    Returns:
        创建的角色对象
    """
    # 检查代码是否已存在
    existing = get_role_by_code(db, role.code)
    if existing:
        raise ValueError(f"Role with code '{role.code}' already exists")

    # 创建新的角色
    db_role = Role(**role.model_dump())
    db.add(db_role)
    db.commit()
    db.refresh(db_role)
    return db_role


def update_role(db: Session, role_id: int, role: RoleUpdate) -> Optional[Role]:
    """
    更新角色。

    Args:
        db: 数据库会话
        role_id: 角色ID
        role: 角色更新模型

    Returns:
        更新后的角色对象，如果不存在则返回None
    """
    # 获取要更新的角色
    db_role = get_role(db, role_id)
    if not db_role:
        return None

    # 如果代码发生变化，检查新代码是否已存在
    if role.code is not None and role.code != db_role.code:
        existing = get_role_by_code(db, role.code)
        if existing:
            raise ValueError(f"Role with code '{role.code}' already exists")

    # 更新角色
    update_data = role.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_role, key, value)

    db.commit()
    db.refresh(db_role)
    return db_role


def delete_role(db: Session, role_id: int) -> bool:
    """
    删除角色。

    Args:
        db: 数据库会话
        role_id: 角色ID

    Returns:
        是否成功删除
    """
    # 获取要删除的角色
    db_role = get_role(db, role_id)
    if not db_role:
        return False

    # 删除角色
    db.delete(db_role)
    db.commit()
    return True


# Permission CRUD
def get_permissions(
    db: Session,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
) -> Tuple[List[Permission], int]:
    """
    获取权限列表。

    Args:
        db: 数据库会话
        search: 搜索关键字
        skip: 跳过的记录数
        limit: 返回的记录数

    Returns:
        权限列表和总记录数
    """
    query = db.query(Permission)

    # 应用搜索过滤
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Permission.code.ilike(search_term),
                Permission.description.ilike(search_term)
            )
        )

    # 获取总记录数
    total = query.count()

    # 应用排序和分页
    query = query.order_by(Permission.code)
    query = query.offset(skip).limit(limit)

    return query.all(), total


def get_permission(db: Session, permission_id: int) -> Optional[Permission]:
    """
    根据ID获取权限。

    Args:
        db: 数据库会话
        permission_id: 权限ID

    Returns:
        权限对象，如果不存在则返回None
    """
    return db.query(Permission).filter(Permission.id == permission_id).first()


def get_permission_by_code(db: Session, code: str) -> Optional[Permission]:
    """
    根据代码获取权限。

    Args:
        db: 数据库会话
        code: 权限代码

    Returns:
        权限对象，如果不存在则返回None
    """
    return db.query(Permission).filter(Permission.code == code).first()


def create_permission(db: Session, permission: PermissionCreate) -> Permission:
    """
    创建权限。

    Args:
        db: 数据库会话
        permission: 权限创建模型

    Returns:
        创建的权限对象
    """
    # 检查代码是否已存在
    existing = get_permission_by_code(db, permission.code)
    if existing:
        raise ValueError(f"Permission with code '{permission.code}' already exists")

    # 创建新的权限
    db_permission = Permission(**permission.model_dump())
    db.add(db_permission)
    db.commit()
    db.refresh(db_permission)
    return db_permission


def update_permission(db: Session, permission_id: int, permission: PermissionUpdate) -> Optional[Permission]:
    """
    更新权限。

    Args:
        db: 数据库会话
        permission_id: 权限ID
        permission: 权限更新模型

    Returns:
        更新后的权限对象，如果不存在则返回None
    """
    # 获取要更新的权限
    db_permission = get_permission(db, permission_id)
    if not db_permission:
        return None

    # 如果代码发生变化，检查新代码是否已存在
    if permission.code is not None and permission.code != db_permission.code:
        existing = get_permission_by_code(db, permission.code)
        if existing:
            raise ValueError(f"Permission with code '{permission.code}' already exists")

    # 更新权限
    update_data = permission.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_permission, key, value)

    db.commit()
    db.refresh(db_permission)
    return db_permission


def delete_permission(db: Session, permission_id: int) -> bool:
    """
    删除权限。

    Args:
        db: 数据库会话
        permission_id: 权限ID

    Returns:
        是否成功删除
    """
    # 获取要删除的权限
    db_permission = get_permission(db, permission_id)
    if not db_permission:
        return False

    # 删除权限
    db.delete(db_permission)
    db.commit()
    return True
