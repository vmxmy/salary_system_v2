from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class DepartmentBase(BaseModel):
    """部门基础模型"""
    name: str
    unit_id: int  # 外键关联到Unit
    description: Optional[str] = None


class DepartmentCreate(DepartmentBase):
    """用于创建新部门的模型"""
    pass


class DepartmentUpdate(BaseModel):
    """用于更新部门信息的模型，所有字段均为可选"""
    name: Optional[str] = None
    description: Optional[str] = None
    # 一般不直接更新unit_id，通常需要删除再创建


class DepartmentInDBBase(DepartmentBase):
    """数据库中的部门模型，包含ID和时间戳"""
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Department(DepartmentInDBBase):
    """用于API响应的部门模型，包含单位名称"""
    unit_name: Optional[str] = None  # 通过CRUD函数填充


class DepartmentListResponse(BaseModel):
    """部门列表响应模型，包含分页信息"""
    data: List[Department]
    total: int


class DepartmentInfo(BaseModel):
    """简化的部门信息模型，用于下拉列表等场景"""
    id: int
    name: str 