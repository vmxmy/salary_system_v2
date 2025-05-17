"""
安全相关的CRUD操作。
"""
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import func, or_, and_
from typing import List, Optional, Tuple, Dict, Any
from passlib.context import CryptContext

from ..models.security import User, Role, Permission, user_roles, role_permissions
from ..models.hr import Employee
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
    import logging
    logger = logging.getLogger("auth_debug")
    logger.debug(f"创建用户，接收到的数据: {user.model_dump()}")
    
    existing_username = get_user_by_username(db, user.username)
    if existing_username:
        logger.error(f"用户名 '{user.username}' 已存在")
        raise ValueError(f"User with username '{user.username}' already exists")

    # 处理员工关联
    target_employee_id = user.employee_id
    
    # 如果提供了员工身份证号，尝试查找对应的员工
    if user.employee_id_card:
        from ..models.hr import Employee
        logger.debug(f"尝试通过身份证号 '{user.employee_id_card}' 查找员工")
        
        found_employee = db.query(Employee).filter(Employee.id_number == user.employee_id_card).first()
        if not found_employee:
            logger.error(f"未找到身份证号为 '{user.employee_id_card}' 的员工")
            raise ValueError(f"No employee found with ID card '{user.employee_id_card}'")
            
        # 验证姓名匹配（如果提供）
        if user.employee_first_name and user.employee_last_name:
            if not (found_employee.first_name == user.employee_first_name and
                    found_employee.last_name == user.employee_last_name):
                logger.error(f"提供的姓名与身份证号对应的员工不匹配")
                raise ValueError(f"The provided name ('{user.employee_first_name} {user.employee_last_name}') does not match the employee with ID card '{user.employee_id_card}'")
        
        # 检查该员工是否已关联到其他用户
        existing_link = db.query(User).filter(User.employee_id == found_employee.id).first()
        if existing_link:
            logger.error(f"员工已关联到其他用户 '{existing_link.username}'")
            raise ValueError(f"Employee with ID card '{user.employee_id_card}' is already linked to user '{existing_link.username}'")
            
        target_employee_id = found_employee.id
        logger.debug(f"找到员工ID: {target_employee_id}")

    try:
        # 排除不属于User模型的字段
        user_data = user.model_dump(exclude={
            "password",
            "employee_first_name",
            "employee_last_name",
            "employee_id_card",
            "role_ids"
        })
        
        # 使用找到的员工ID替换原始employee_id
        if target_employee_id:
            user_data["employee_id"] = target_employee_id
            
        logger.debug(f"处理后的用户数据: {user_data}")
        hashed_password = pwd_context.hash(user.password)
        db_user = User(**user_data, password_hash=hashed_password)
        
        # 添加角色（如果提供）
        if user.role_ids:
            roles = db.query(Role).filter(Role.id.in_(user.role_ids)).all()
            if len(roles) != len(set(user.role_ids)):
                found_ids = {r.id for r in roles}
                missing_ids = set(user.role_ids) - found_ids
                logger.warning(f"部分角色ID无效: {missing_ids}")
            db_user.roles = roles
            logger.debug(f"为用户分配角色: {[r.name for r in roles]}")
        
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        logger.debug(f"用户创建成功: {db_user.username}, ID: {db_user.id}")
        return db_user
    except Exception as e:
        db.rollback()
        logger.error(f"创建用户时发生错误: {str(e)}", exc_info=True)
        # 添加更详细的错误信息
        error_type = type(e).__name__
        error_msg = str(e)
        logger.error(f"错误类型: {error_type}, 错误信息: {error_msg}")
        
        # 检查是否是SQLAlchemy错误
        if hasattr(e, '__module__') and 'sqlalchemy' in e.__module__:
            logger.error(f"SQLAlchemy错误: {e.__module__}.{error_type}")
            if hasattr(e, 'orig') and e.orig:
                logger.error(f"原始数据库错误: {e.orig}")
        
        raise ValueError(f"Error creating user: {error_type} - {error_msg}")


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

    update_data = user.model_dump(exclude_unset=True, exclude={"password", "role_ids", "employee_first_name", "employee_last_name", "employee_id_card"})

    if user.username is not None and user.username != db_user.username:
        existing = get_user_by_username(db, user.username)
        if existing:
            raise ValueError(f"User with username '{user.username}' already exists")

    # Handle employee association based on Strategy 1 (Strict ID card)
    target_employee_id: Optional[int] = db_user.employee_id # Preserve current if no change or invalid input

    # Check if any employee association fields were explicitly provided in the request
    employee_fields_provided = user.model_fields_set.intersection({'employee_first_name', 'employee_last_name', 'employee_id_card'})

    if employee_fields_provided:
        employee_first_name = user.employee_first_name
        employee_last_name = user.employee_last_name
        employee_id_card = user.employee_id_card

        is_attempting_unbind = (employee_first_name is None and
                                employee_last_name is None and
                                employee_id_card is None)

        if is_attempting_unbind:
            target_employee_id = None
        else:
            # If not unbinding, ID card is strictly required
            if not employee_id_card:
                raise ValueError("必须提供员工身份证号才能关联员工。如果提供了姓名，也请同时提供身份证号。")

            found_employee = db.query(Employee).filter(Employee.id_number == employee_id_card).first()
            if not found_employee:
                raise ValueError(f"未找到身份证号为 '{employee_id_card}' 的员工。")

            # Optional: Validate name if both ID card and name are provided
            if employee_first_name is not None and employee_last_name is not None:
                if not (found_employee.first_name == employee_first_name and found_employee.last_name == employee_last_name):
                    raise ValueError(f"提供的姓名 ('{employee_first_name} {employee_last_name}') 与身份证号 '{employee_id_card}' 对应的员工 ('{found_employee.first_name} {found_employee.last_name}') 不匹配。")
            
            # Check if this employee is already linked to another user (excluding the current user being updated)
            existing_link = db.query(User).filter(User.employee_id == found_employee.id, User.id != user_id).first()
            if existing_link:
                raise ValueError(f"员工 (身份证号: {employee_id_card}) 已关联到其他用户 '{existing_link.username}'。")
            
            target_employee_id = found_employee.id
    
    # Apply other updates from update_data (username, email, full_name, etc.)
    for key, value in update_data.items():
        setattr(db_user, key, value)
    
    db_user.employee_id = target_employee_id # Apply the determined employee_id

    if user.password:
        db_user.password_hash = pwd_context.hash(user.password)

    if user.role_ids is not None:
        if not user.role_ids: # Empty list means unassign all roles
            db_user.roles = []
        else:
            roles = db.query(Role).filter(Role.id.in_(user.role_ids)).all()
            if len(roles) != len(set(user.role_ids)):
                found_db_ids = {r.id for r in roles}
                missing_ids = set(user.role_ids) - found_db_ids
                # Consider logging this as a warning
                # logging.warning(f"Invalid role ID(s) provided during user update for user {user_id}: {missing_ids}. Only valid roles will be assigned.")
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
