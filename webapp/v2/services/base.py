"""
基础服务类

提供通用的服务抽象，包括：
- 基础服务类
- 视图服务基类
- CRUD服务基类
- 通用的分页、过滤、排序逻辑
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional, Tuple, Type, TypeVar, Generic
from sqlalchemy.orm import Session
from sqlalchemy import text, func
from pydantic import BaseModel

from ..pydantic_models.common import PaginationMeta, PaginationResponse

T = TypeVar('T', bound=BaseModel)


class BaseService(ABC):
    """基础服务类 - 提供通用的服务功能"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def format_pagination_response(
        self, 
        data: List[T], 
        total: int, 
        page: int, 
        size: int
    ) -> PaginationResponse[T]:
        """格式化分页响应"""
        total_pages = (total + size - 1) // size if total > 0 else 1
        
        return PaginationResponse[T](
            data=data,
            meta=PaginationMeta(
                page=page,
                size=size,
                total=total,
                totalPages=total_pages
            )
        )
    
    def build_where_conditions(
        self, 
        filters: Dict[str, Any], 
        field_mappings: Optional[Dict[str, str]] = None
    ) -> Tuple[List[str], Dict[str, Any]]:
        """构建WHERE条件和参数"""
        conditions = []
        params = {}
        field_mappings = field_mappings or {}
        
        for field, value in filters.items():
            if value is not None:
                # 使用字段映射或原字段名
                db_field = field_mappings.get(field, field)
                param_name = f"param_{field}"
                
                conditions.append(f"{db_field} = :{param_name}")
                params[param_name] = value
        
        return conditions, params


class BaseViewService(BaseService):
    """视图服务基类 - 提供基于数据库视图的查询功能"""
    
    @property
    @abstractmethod
    def view_name(self) -> str:
        """视图名称"""
        pass
    
    @property
    @abstractmethod
    def default_fields(self) -> List[str]:
        """默认查询字段"""
        pass
    
    @property
    def field_mappings(self) -> Dict[str, str]:
        """API参数到数据库字段的映射"""
        return {}
    
    def query_view(
        self,
        fields: Optional[List[str]] = None,
        filters: Optional[Dict[str, Any]] = None,
        order_by: Optional[str] = None,
        limit: Optional[int] = None,
        offset: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """通用视图查询方法"""
        # 构建字段列表
        select_fields = fields or self.default_fields
        fields_str = ", ".join(select_fields)
        
        # 构建基础查询
        query = f"SELECT {fields_str} FROM {self.view_name}"
        
        # 构建WHERE条件
        params = {}
        if filters:
            conditions, params = self.build_where_conditions(filters, self.field_mappings)
            if conditions:
                query += f" WHERE {' AND '.join(conditions)}"
        
        # 添加排序
        if order_by:
            query += f" ORDER BY {order_by}"
        
        # 添加分页
        if limit:
            query += f" LIMIT {limit}"
        if offset:
            query += f" OFFSET {offset}"
        
        # 执行查询
        result = self.db.execute(text(query), params)
        
        # 转换结果
        return [dict(row._mapping) for row in result]
    
    def count_view(
        self, 
        filters: Optional[Dict[str, Any]] = None
    ) -> int:
        """获取视图记录总数"""
        query = f"SELECT COUNT(*) FROM {self.view_name}"
        
        params = {}
        if filters:
            conditions, params = self.build_where_conditions(filters, self.field_mappings)
            if conditions:
                query += f" WHERE {' AND '.join(conditions)}"
        
        result = self.db.execute(text(query), params)
        return result.scalar()
    
    def get_paginated_data(
        self,
        page: int = 1,
        size: int = 50,
        filters: Optional[Dict[str, Any]] = None,
        fields: Optional[List[str]] = None,
        order_by: Optional[str] = None
    ) -> Tuple[List[Dict[str, Any]], int]:
        """获取分页数据"""
        # 计算偏移量
        offset = (page - 1) * size
        
        # 获取数据
        data = self.query_view(
            fields=fields,
            filters=filters,
            order_by=order_by,
            limit=size,
            offset=offset
        )
        
        # 获取总数
        total = self.count_view(filters)
        
        return data, total


class BaseCRUDService(BaseService):
    """CRUD服务基类 - 提供基于ORM模型的CRUD操作"""
    
    @property
    @abstractmethod
    def model_class(self) -> Type:
        """ORM模型类"""
        pass
    
    def get_by_id(self, id: int) -> Optional[Any]:
        """根据ID获取记录"""
        return self.db.query(self.model_class).filter(
            self.model_class.id == id
        ).first()
    
    def get_all(
        self, 
        skip: int = 0, 
        limit: int = 100,
        filters: Optional[Dict[str, Any]] = None
    ) -> Tuple[List[Any], int]:
        """获取所有记录"""
        query = self.db.query(self.model_class)
        
        # 应用过滤条件
        if filters:
            for field, value in filters.items():
                if value is not None and hasattr(self.model_class, field):
                    query = query.filter(getattr(self.model_class, field) == value)
        
        # 获取总数
        total = query.count()
        
        # 应用分页
        records = query.offset(skip).limit(limit).all()
        
        return records, total
    
    def create(self, obj_data: Dict[str, Any]) -> Any:
        """创建记录"""
        db_obj = self.model_class(**obj_data)
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj
    
    def update(self, id: int, obj_data: Dict[str, Any]) -> Optional[Any]:
        """更新记录"""
        db_obj = self.get_by_id(id)
        if not db_obj:
            return None
        
        for field, value in obj_data.items():
            if hasattr(db_obj, field):
                setattr(db_obj, field, value)
        
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj
    
    def delete(self, id: int) -> bool:
        """删除记录"""
        db_obj = self.get_by_id(id)
        if not db_obj:
            return False
        
        self.db.delete(db_obj)
        self.db.commit()
        return True


class BusinessService(BaseService):
    """业务服务基类 - 提供业务逻辑编排"""
    
    def __init__(self, db: Session):
        super().__init__(db)
        self._view_service = None
        self._crud_service = None
    
    @property
    @abstractmethod
    def view_service_class(self) -> Type[BaseViewService]:
        """视图服务类"""
        pass
    
    @property
    @abstractmethod
    def crud_service_class(self) -> Type[BaseCRUDService]:
        """CRUD服务类"""
        pass
    
    @property
    def view_service(self) -> BaseViewService:
        """获取视图服务实例"""
        if self._view_service is None:
            self._view_service = self.view_service_class(self.db)
        return self._view_service
    
    @property
    def crud_service(self) -> BaseCRUDService:
        """获取CRUD服务实例"""
        if self._crud_service is None:
            self._crud_service = self.crud_service_class(self.db)
        return self._crud_service
    
    def get_list_data(
        self,
        page: int = 1,
        size: int = 50,
        use_view: bool = True,
        **filters
    ) -> PaginationResponse:
        """获取列表数据 - 可选择使用视图或CRUD"""
        if use_view:
            data, total = self.view_service.get_paginated_data(
                page=page, size=size, filters=filters
            )
        else:
            skip = (page - 1) * size
            data, total = self.crud_service.get_all(
                skip=skip, limit=size, filters=filters
            )
        
        return self.format_pagination_response(data, total, page, size)
    
    def get_detail_data(self, id: int, use_view: bool = True) -> Optional[Any]:
        """获取详情数据"""
        if use_view:
            # 使用视图查询详情
            data = self.view_service.query_view(
                filters={"id": id},
                limit=1
            )
            return data[0] if data else None
        else:
            # 使用CRUD查询详情
            return self.crud_service.get_by_id(id) 