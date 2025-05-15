"""
安全相关的Pydantic模型。
"""
from pydantic import BaseModel, Field, EmailStr
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
    password: str = Field(..., min_length=6, description="用户密码")


class UserUpdate(BaseModel):
    """更新用户模型"""
    username: Optional[str] = Field(None, min_length=3, max_length=50, description="用户名")
    email: Optional[EmailStr] = Field(None, description="用户邮箱")
    full_name: Optional[str] = Field(None, max_length=50, description="用户全名")
    employee_id: Optional[str] = Field(None, max_length=20, description="工号")
    department: Optional[str] = Field(None, max_length=100, description="所属部门")
    position: Optional[str] = Field(None, max_length=100, description="职位")
    description: Optional[str] = Field(None, max_length=255, description="用户描述")
    is_active: Optional[bool] = None
    password: Optional[str] = Field(None, min_length=6, description="新密码，仅在需要更改密码时提供")
    role_ids: Optional[List[int]] = Field(None, description="角色ID列表，用于（重新）分配用户角色")


class User(UserBase):
    """用户响应模型"""
    id: int = Field(..., description="Primary key")
    created_at: datetime = Field(..., description="User creation timestamp")
    roles: List['Role'] = []
    description: Optional[str] = Field(None, max_length=255, description="用户描述")
    is_active: bool = True

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
    name: str = Field(..., min_length=1, max_length=50, description="角色名称")
    code: str = Field(..., min_length=1, max_length=50, description="角色代码,唯一")
    is_active: bool = True


class RoleCreate(RoleBase):
    """创建角色模型"""
    permission_ids: Optional[List[int]] = None


class RoleUpdate(BaseModel):
    """更新角色模型"""
    name: Optional[str] = Field(None, min_length=1, max_length=50, description="角色名称")
    code: Optional[str] = Field(None, min_length=1, max_length=50, description="角色代码,唯一")
    is_active: Optional[bool] = None
    permission_ids: Optional[List[int]] = None


class Role(RoleBase):
    """角色响应模型"""
    id: int = Field(..., description="Primary key")
    permissions: List['Permission'] = []
    is_active: bool = True

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


# Token Response Model for /token endpoint
class TokenData(BaseModel):
    username: Optional[str] = None

class TokenResponseWithFullUser(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User # User model from this file, now includes roles and permissions


# 新增：用于用户分配角色的请求体
class UserRoleAssignRequest(BaseModel):
    role_ids: List[int] = Field(..., description="要分配给用户的角色ID列表")


# Ensure Role is defined before User, or use forward references correctly
# Pydantic v2 automatically handles forward references for type hints in strings

# If Role and User are in the same file and User refers to Role in a list,
# and Role refers to Permission in a list, ensure all are defined or forward-referenced.

Permission.model_rebuild()
Role.model_rebuild()
User.model_rebuild()
