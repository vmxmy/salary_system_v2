"""
通用的API响应模型定义
"""
from pydantic import BaseModel, Field
from typing import TypeVar, Generic, Optional, Dict, Any, List
from datetime import datetime

# 定义泛型类型变量
T = TypeVar('T')

class DataResponse(BaseModel, Generic[T]):
    """单个资源的标准响应模型"""
    data: T = Field(..., description="响应数据")
    
    class Config:
        from_attributes = True

class ListMeta(BaseModel):
    """列表响应的元数据模型"""
    page: int = Field(..., description="当前页码")
    size: int = Field(..., description="每页记录数")
    total: int = Field(..., description="总记录数")
    totalPages: int = Field(..., description="总页数")
    
    class Config:
        from_attributes = True

class ListResponse(BaseModel, Generic[T]):
    """列表资源的标准响应模型"""
    data: List[T] = Field(..., description="数据列表")
    meta: ListMeta = Field(..., description="分页元数据")
    
    class Config:
        from_attributes = True

class ErrorDetail(BaseModel):
    """错误详情模型"""
    status_code: int = Field(..., description="HTTP状态码")
    message: str = Field(..., description="错误消息")
    details: Optional[str] = Field(None, description="详细错误信息")
    timestamp: Optional[datetime] = Field(default_factory=datetime.now, description="错误发生时间")
    
    class Config:
        from_attributes = True

class SuccessResponse(BaseModel):
    """通用成功响应模型（无数据返回）"""
    message: str = Field(..., description="成功消息")
    timestamp: Optional[datetime] = Field(default_factory=datetime.now, description="响应时间")
    
    class Config:
        from_attributes = True 