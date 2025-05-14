"""
工具函数模块，提供v2 API使用的通用工具函数。
"""
from typing import Dict, Any, Type, TypeVar, List, Optional
from pydantic import BaseModel
from sqlalchemy.orm import Session

T = TypeVar('T')

def orm_to_pydantic(orm_obj: Any, pydantic_model: Type[T]) -> T:
    """
    将SQLAlchemy ORM对象转换为Pydantic模型对象。
    
    Args:
        orm_obj: SQLAlchemy ORM对象
        pydantic_model: Pydantic模型类
        
    Returns:
        Pydantic模型实例
    """
    # 如果ORM对象为None，则返回None
    if orm_obj is None:
        return None
    
    # 将ORM对象转换为字典
    orm_data = {}
    for column in orm_obj.__table__.columns:
        orm_data[column.name] = getattr(orm_obj, column.name)
    
    # 创建Pydantic模型实例
    return pydantic_model.model_validate(orm_data)

def paginate_query_results(
    query_results: List[Any], 
    page: int, 
    size: int, 
    total: int, 
    pydantic_model: Type[T]
) -> Dict[str, Any]:
    """
    将查询结果分页并转换为标准响应格式。
    
    Args:
        query_results: 查询结果列表
        page: 当前页码
        size: 每页大小
        total: 总记录数
        pydantic_model: Pydantic模型类
        
    Returns:
        标准响应格式的字典
    """
    # 计算总页数
    total_pages = (total + size - 1) // size if total > 0 else 1
    
    # 将ORM对象转换为Pydantic模型
    data = [orm_to_pydantic(item, pydantic_model) for item in query_results]
    
    # 返回标准响应格式
    return {
        "data": data,
        "meta": {
            "page": page,
            "size": size,
            "total": total,
            "totalPages": total_pages
        }
    }

def create_error_response(
    status_code: int, 
    message: str, 
    details: Optional[str] = None, 
    field_errors: Optional[List[Dict[str, str]]] = None
) -> Dict[str, Any]:
    """
    创建标准错误响应格式。
    
    Args:
        status_code: HTTP状态码
        message: 错误消息
        details: 详细错误信息
        field_errors: 字段级别的错误列表
        
    Returns:
        标准错误响应格式的字典
    """
    error = {
        "code": status_code,
        "message": message
    }
    
    if details:
        error["details"] = details
        
    if field_errors:
        error["errors"] = field_errors
        
    return {"error": error}
