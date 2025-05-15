"""
安全相关的CRUD操作。
"""
from sqlalchemy.orm import Session, selectinload
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
    query = db.query(User).options(selectinload(User.roles).selectinload(Role.permissions))

    if is_active is not None:
        query = query.filter(User.is_active == is_active)

    if role_id:
        query = query.join(User.roles).filter(Role.id == role_id)

    if search:
        search_term = f"%{search}%"
        query = query.filter(User.username.ilike(search_term))

    total_query_for_count = db.query(User.id)
    if is_active is not None:
        total_query_for_count = total_query_for_count.filter(User.is_active == is_active)
    if role_id:
        total_query_for_count = total_query_for_count.join(User.roles).filter(Role.id == role_id)
    if search:
        total_query_for_count = total_query_for_count.filter(User.username.ilike(f"%{search}%"))
    
    total = total_query_for_count.distinct().count()

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
    return db.query(User).options(selectinload(User.roles).selectinload(Role.permissions)).filter(User.id == user_id).first()


def get_user_by_username(db: Session, username: str) -> Optional[User]:
    """
    根据用户名获取用户。

    Args:
        db: 数据库会话
        username: 用户名

    Returns:
        用户对象，如果不存在则返回None
    """
    return db.query(User).options(selectinload(User.roles).selectinload(Role.permissions)).filter(User.username == username).first()


def get_user_by_employee_id(db: Session, employee_id: int) -> Optional[User]:
    """
    根据员工ID获取用户。

    Args:
        db: 数据库会话
        employee_id: 员工ID

    Returns:
        用户对象，如果不存在则返回None
    """
    return db.query(User).options(selectinload(User.roles).selectinload(Role.permissions)).filter(User.employee_id == employee_id).first()


def create_user(db: Session, user: UserCreate) -> User:
    """
    创建用户。

    Args:
        db: 数据库会话
        user: 用户创建模型

    Returns:
        创建的用户对象
    """
    existing_username = get_user_by_username(db, user.username)
    if existing_username:
        raise ValueError(f"User with username '{user.username}' already exists")

    if user.employee_id:
        existing_employee = get_user_by_employee_id(db, user.employee_id)
        if existing_employee:
            raise ValueError(f"User with employee ID '{user.employee_id}' already exists")

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
    db_user = get_user(db, user_id)
    if not db_user:
        return None

    if user.username is not None and user.username != db_user.username:
        existing = get_user_by_username(db, user.username)
        if existing:
            raise ValueError(f"User with username '{user.username}' already exists")

    if user.employee_id is not None and user.employee_id != db_user.employee_id:
        if db_user.employee_id is not None and str(db_user.employee_id) == user.employee_id:
            pass
        elif user.employee_id:
            existing_employee_user = db.query(User).filter(User.employee_id == user.employee_id, User.id != user_id).first()
            if existing_employee_user:
                raise ValueError(f"User with employee ID '{user.employee_id}' already exists for another user.")

    update_data = user.model_dump(exclude_unset=True, exclude={"password", "role_ids"})
    for key, value in update_data.items():
        setattr(db_user, key, value)

    if user.password:
        db_user.password_hash = pwd_context.hash(user.password)

    if user.role_ids is not None:
        if not user.role_ids:
            db_user.roles = []
        else:
            roles = db.query(Role).filter(Role.id.in_(user.role_ids)).all()
            if len(roles) != len(set(user.role_ids)):
                found_db_ids = {r.id for r in roles}
                missing_ids = set(user.role_ids) - found_db_ids
                print(f"Warning: Invalid role ID(s) provided during user update for user {user_id}: {missing_ids}. Only valid roles will be assigned.")
            db_user.roles = roles

    db.commit()
    db.refresh(db_user)
    updated_db_user_with_relations = get_user(db, user_id)
    return updated_db_user_with_relations


def delete_user(db: Session, user_id: int) -> bool:
    """
    删除用户。

    Args:
        db: 数据库会话
        user_id: 用户ID

    Returns:
        是否成功删除
    """
    db_user = get_user(db, user_id)
    if not db_user:
        return False

    db.delete(db_user)
    db.commit()
    return True


def assign_roles_to_user(db: Session, user_id: int, role_ids: List[int]) -> Optional[User]:
    """
    Assigns a list of roles to a user, replacing existing roles.

    Args:
        db: Database session.
        user_id: The ID of the user to assign roles to.
        role_ids: A list of role IDs to assign. If empty, all roles will be unassigned.

    Returns:
        The updated User object if found, otherwise None.
        Raises ValueError if any provided role_id is invalid.
    """
    db_user = get_user(db, user_id)
    if not db_user:
        return None

    if not role_ids:
        db_user.roles = []
    else:
        roles = db.query(Role).filter(Role.id.in_(role_ids)).all()
        if len(roles) != len(set(role_ids)):
            found_db_ids = {r.id for r in roles}
            missing_ids = set(role_ids) - found_db_ids
            raise ValueError(f"Invalid role ID(s) provided: {missing_ids}")
        db_user.roles = roles
    
    db.commit()
    db.refresh(db_user)
    return db_user


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

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Role.code.ilike(search_term),
                Role.name.ilike(search_term)
            )
        )

    total = query.count()

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
    return db.query(Role).options(selectinload(Role.permissions)).filter(Role.id == role_id).first()


def get_role_by_code(db: Session, code: str) -> Optional[Role]:
    """
    根据角色代码获取角色。

    Args:
        db: 数据库会话
        code: 角色代码

    Returns:
        角色对象，如果不存在则返回None
    """
    return db.query(Role).options(selectinload(Role.permissions)).filter(Role.code == code).first()


def create_role(db: Session, role: RoleCreate) -> Role:
    """
    创建角色。

    Args:
        db: 数据库会话
        role: 角色创建模型

    Returns:
        创建的角色对象
    """
    existing_code = get_role_by_code(db, role.code)
    if existing_code:
        raise ValueError(f"Role with code '{role.code}' already exists")

    existing_name = db.query(Role).filter(func.lower(Role.name) == func.lower(role.name)).first()
    if existing_name:
        raise ValueError(f"Role with name '{role.name}' already exists")
    
    role_data = role.model_dump(exclude={'permission_ids'})
    # Explicitly pick fields for SQLAlchemy model to avoid passing unexpected arguments
    db_role_init_data = {
        "name": role_data["name"],  # name and code are required in RoleBase
        "code": role_data["code"]
    }
    db_role = Role(**db_role_init_data)

    if role.permission_ids is not None:
        if role.permission_ids:
            permissions = db.query(Permission).filter(Permission.id.in_(role.permission_ids)).all()
            if len(permissions) != len(set(role.permission_ids)):
                found_ids = {p.id for p in permissions}
                missing_ids = set(role.permission_ids) - found_ids
                raise ValueError(f"Invalid permission ID(s) provided: {missing_ids}")
            db_role.permissions = permissions
        else:
            db_role.permissions = []

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
    db_role = get_role(db, role_id)
    if not db_role:
        return None

    if role.code is not None and role.code != db_role.code:
        existing_code = get_role_by_code(db, role.code)
        if existing_code:
            raise ValueError(f"Role with code '{role.code}' already exists")
    
    if role.name is not None and role.name.lower() != db_role.name.lower():
        existing_name = db.query(Role).filter(func.lower(Role.name) == func.lower(role.name), Role.id != role_id).first()
        if existing_name:
            raise ValueError(f"Role with name '{role.name}' already exists")

    update_data = role.model_dump(exclude_unset=True, exclude={'permission_ids'})
    for key, value in update_data.items():
        setattr(db_role, key, value)

    if role.permission_ids is not None:
        if role.permission_ids:
            permissions = db.query(Permission).filter(Permission.id.in_(role.permission_ids)).all()
            if len(permissions) != len(set(role.permission_ids)):
                found_ids = {p.id for p in permissions}
                missing_ids = set(role.permission_ids) - found_ids
                raise ValueError(f"Invalid permission ID(s) provided: {missing_ids}")
            db_role.permissions = permissions
        else:
            db_role.permissions = []
    
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
    db_role = get_role(db, role_id)
    if not db_role:
        return False

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

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Permission.code.ilike(search_term),
                Permission.description.ilike(search_term)
            )
        )

    total = query.count()

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
    existing = get_permission_by_code(db, permission.code)
    if existing:
        raise ValueError(f"Permission with code '{permission.code}' already exists")

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
    db_permission = get_permission(db, permission_id)
    if not db_permission:
        return None

    if permission.code is not None and permission.code != db_permission.code:
        existing = get_permission_by_code(db, permission.code)
        if existing:
            raise ValueError(f"Permission with code '{permission.code}' already exists")

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
    db_permission = get_permission(db, permission_id)
    if not db_permission:
        return False

    db.delete(db_permission)
    db.commit()
    return True
