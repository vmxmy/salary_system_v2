from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class UnitBase(BaseModel):
    """单位基础模型"""
    name: str
    description: Optional[str] = None


class UnitCreate(UnitBase):
    """用于创建新单位的模型"""
    pass


class UnitUpdate(BaseModel):
    """用于更新单位信息的模型，所有字段均为可选"""
    name: Optional[str] = None
    description: Optional[str] = None


class UnitInDBBase(UnitBase):
    """数据库中的单位模型，包含ID和时间戳"""
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Unit(UnitInDBBase):
    """用于API响应的单位模型"""
    pass


class UnitListResponse(BaseModel):
    """单位列表响应模型，包含分页信息"""
    data: List[Unit]
    total: int 