"""
权限检查工具函数
"""
from functools import wraps
from fastapi import HTTPException, Depends
from sqlalchemy.orm import Session
from webapp.v2.models.security import User
from webapp.auth import get_current_user

def check_permission(permission_code: str):
    """
    权限检查装饰器
    
    Args:
        permission_code: 权限代码，如 'report:create_datasource'
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # 从kwargs中获取current_user
            current_user = kwargs.get('current_user')
            if not current_user:
                raise HTTPException(status_code=401, detail="未认证用户")
            
            # 检查权限
            if not has_permission(current_user, permission_code):
                raise HTTPException(
                    status_code=403, 
                    detail=f"权限不足，需要权限: {permission_code}"
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator

def has_permission(user: User, permission_code: str) -> bool:
    """
    检查用户是否有指定权限
    
    Args:
        user: 用户对象
        permission_code: 权限代码
        
    Returns:
        bool: 是否有权限
    """
    if not user or not user.is_active:
        return False
    
    # 检查用户是否有该权限
    user_permissions = user.all_permission_codes
    return permission_code in user_permissions

def require_permission(permission_code: str):
    """
    依赖注入方式的权限检查
    
    Args:
        permission_code: 权限代码
        
    Returns:
        Callable: 可用于FastAPI Depends的函数
    """
    def check_user_permission(current_user: User = Depends(get_current_user)):
        if not has_permission(current_user, permission_code):
            raise HTTPException(
                status_code=403,
                detail=f"权限不足，需要权限: {permission_code}"
            )
        return current_user
    
    return check_user_permission

# 常用权限检查函数
def require_report_admin():
    """要求报表管理员权限"""
    return require_permission("report:admin")

def require_report_user():
    """要求报表用户权限（基础权限）"""
    return require_permission("report:view_templates")

def can_create_datasource(user: User) -> bool:
    """检查是否可以创建数据源"""
    return has_permission(user, "report:create_datasource")

def can_edit_datasource(user: User, datasource_creator_id: int = None) -> bool:
    """检查是否可以编辑数据源"""
    # 管理员权限
    if has_permission(user, "report:admin"):
        return True
    
    # 编辑权限 + 自己创建的
    if has_permission(user, "report:edit_datasource"):
        if datasource_creator_id is None or datasource_creator_id == user.id:
            return True
    
    return False

def can_delete_datasource(user: User, datasource_creator_id: int = None) -> bool:
    """检查是否可以删除数据源"""
    # 管理员权限
    if has_permission(user, "report:admin"):
        return True
    
    # 删除权限 + 自己创建的
    if has_permission(user, "report:delete_datasource"):
        if datasource_creator_id is None or datasource_creator_id == user.id:
            return True
    
    return False

def can_sync_fields(user: User, datasource_creator_id: int = None) -> bool:
    """检查是否可以同步数据源字段"""
    # 管理员权限
    if has_permission(user, "report:admin"):
        return True
    
    # 同步字段权限 + 自己创建的
    if has_permission(user, "report:sync_fields"):
        if datasource_creator_id is None or datasource_creator_id == user.id:
            return True
    
    # 编辑权限也可以同步字段
    if has_permission(user, "report:edit_datasource"):
        if datasource_creator_id is None or datasource_creator_id == user.id:
            return True
    
    return False

def can_manage_global_fields(user: User) -> bool:
    """检查是否可以管理全局计算字段"""
    return has_permission(user, "report:manage_global_fields")

def can_view_all_templates(user: User) -> bool:
    """检查是否可以查看所有用户的模板"""
    return has_permission(user, "report:view_all_templates")

def filter_accessible_items(user: User, items: list, creator_id_field: str = 'created_by') -> list:
    """
    根据用户权限过滤可访问的项目
    
    Args:
        user: 用户对象
        items: 项目列表
        creator_id_field: 创建者ID字段名
        
    Returns:
        list: 过滤后的项目列表
    """
    if has_permission(user, "report:admin") or has_permission(user, "report:view_all_templates"):
        return items
    
    # 只返回自己创建的项目
    return [item for item in items if getattr(item, creator_id_field, None) == user.id] 