"""
安全相关的Pydantic模型。
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

# User Models
class UserBase(BaseModel):
    """用户基础模型"""
    username: str = Field(..., description="Unique username")
    employee_id: Optional[int] = Field(None, description="Optional link to an employee")
    is_active: bool = Field(True, description="Whether the user account is active")


class UserCreate(UserBase):
    """创建用户模型"""
    password: str = Field(..., description="User password (will be hashed)")


class UserUpdate(BaseModel):
    """更新用户模型"""
    username: Optional[str] = Field(None, description="Unique username")
    password: Optional[str] = Field(None, description="User password (will be hashed)")
    employee_id: Optional[int] = Field(None, description="Optional link to an employee")
    is_active: Optional[bool] = Field(None, description="Whether the user account is active")


class User(UserBase):
    """用户响应模型"""
    id: int = Field(..., description="Primary key")
    created_at: datetime = Field(..., description="User creation timestamp")

    class Config:
        from_attributes = True


class UserListResponse(BaseModel):
    """用户列表响应模型"""
    data: List[User]
    meta: Dict[str, Any] = Field(
        default_factory=lambda: {"page": 1, "size": 10, "total": 0, "totalPages": 1}
    )


# Role Models
class RoleBase(BaseModel):
    """角色基础模型"""
    code: str = Field(..., description="Unique role code")
    name: str = Field(..., description="Role name")


class RoleCreate(RoleBase):
    """创建角色模型"""
    pass


class RoleUpdate(BaseModel):
    """更新角色模型"""
    code: Optional[str] = Field(None, description="Unique role code")
    name: Optional[str] = Field(None, description="Role name")


class Role(RoleBase):
    """角色响应模型"""
    id: int = Field(..., description="Primary key")

    class Config:
        from_attributes = True


class RoleListResponse(BaseModel):
    """角色列表响应模型"""
    data: List[Role]
    meta: Dict[str, Any] = Field(
        default_factory=lambda: {"page": 1, "size": 10, "total": 0, "totalPages": 1}
    )


# Permission Models
class PermissionBase(BaseModel):
    """权限基础模型"""
    code: str = Field(..., description="Unique permission code (e.g., payroll:view, employee:edit)")
    description: Optional[str] = Field(None, description="Description of the permission")


class PermissionCreate(PermissionBase):
    """创建权限模型"""
    pass


class PermissionUpdate(BaseModel):
    """更新权限模型"""
    code: Optional[str] = Field(None, description="Unique permission code (e.g., payroll:view, employee:edit)")
    description: Optional[str] = Field(None, description="Description of the permission")


class Permission(PermissionBase):
    """权限响应模型"""
    id: int = Field(..., description="Primary key")

    class Config:
        from_attributes = True


class PermissionListResponse(BaseModel):
    """权限列表响应模型"""
    data: List[Permission]
    meta: Dict[str, Any] = Field(
        default_factory=lambda: {"page": 1, "size": 10, "total": 0, "totalPages": 1}
    )


# UserRole Models
class UserRoleBase(BaseModel):
    """用户角色关联基础模型"""
    user_id: int = Field(..., description="Foreign key to users")
    role_id: int = Field(..., description="Foreign key to roles")


class UserRoleCreate(UserRoleBase):
    """创建用户角色关联模型"""
    pass


# RolePermission Models
class RolePermissionBase(BaseModel):
    """角色权限关联基础模型"""
    role_id: int = Field(..., description="Foreign key to roles")
    permission_id: int = Field(..., description="Foreign key to permissions")


class RolePermissionCreate(RolePermissionBase):
    """创建角色权限关联模型"""
    pass
