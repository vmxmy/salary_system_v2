"""
数据源统一操作接口
整合所有数据源相关操作，提供统一的对外接口
"""

from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from .data_source_basic_crud import ReportDataSourceBasicCRUD
# from .data_source_field_operations import ReportDataSourceFieldOperations  # 已移除字段表
from .data_source_connection import ReportDataSourceConnection
# from .data_source_field_crud import ReportDataSourceFieldCRUD  # 已移除字段表
from ...models.reports import ReportDataSource
# from ...models.reports import ReportDataSourceField  # 已移除字段表
from ...pydantic_models.reports import (
    ReportDataSourceCreate, ReportDataSourceUpdate,
    DataSourceFieldDetection, DetectedField,
    DataSourceConnectionTest, DataSourceConnectionTestResponse
)


class ReportDataSourceCRUD:
    """数据源统一操作类 - 兼容原有接口"""
    
    # 基础CRUD操作
    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100) -> List[ReportDataSource]:
        """获取所有数据源"""
        return ReportDataSourceBasicCRUD.get_all(db, skip, limit)

    @staticmethod
    def get_by_id(db: Session, data_source_id: int) -> Optional[ReportDataSource]:
        """根据ID获取数据源"""
        return ReportDataSourceBasicCRUD.get_by_id(db, data_source_id)

    @staticmethod
    def create(db: Session, data_source: ReportDataSourceCreate, user_id: int) -> ReportDataSource:
        """创建数据源"""
        return ReportDataSourceBasicCRUD.create(db, data_source, user_id)

    @staticmethod
    def update(db: Session, data_source_id: int, data_source: ReportDataSourceUpdate) -> Optional[ReportDataSource]:
        """更新数据源"""
        return ReportDataSourceBasicCRUD.update(db, data_source_id, data_source)

    @staticmethod
    def delete(db: Session, data_source_id: int) -> bool:
        """删除数据源"""
        return ReportDataSourceBasicCRUD.delete(db, data_source_id)

    # 字段操作 - 现在使用动态字段检测
    @staticmethod
    def detect_fields(db: Session, detection: DataSourceFieldDetection) -> List[DetectedField]:
        """检测数据源表的字段信息 - 动态检测"""
        # 现在使用动态字段服务
        from ...services.dynamic_field_service import DynamicFieldService
        dynamic_service = DynamicFieldService()
        return dynamic_service.detect_fields(db, detection)

    # 连接测试
    @staticmethod
    def test_connection(db: Session, connection_test: DataSourceConnectionTest) -> DataSourceConnectionTestResponse:
        """测试数据源连接"""
        return ReportDataSourceConnection.test_connection(db, connection_test)

    # 字段管理 - 现在使用动态字段获取
    @staticmethod
    def get_fields(db: Session, data_source_id: int) -> List[Dict[str, Any]]:
        """获取数据源字段列表 - 动态获取"""
        # 现在使用动态字段服务
        from ...services.dynamic_field_service import DynamicFieldService
        dynamic_service = DynamicFieldService()
        return dynamic_service.get_fields_for_data_source(db, data_source_id)

    # 高级功能 - 字段同步已不再需要（动态获取）
    @staticmethod
    def sync_fields(db: Session, data_source_id: int, user_id: int) -> bool:
        """同步数据源字段 - 动态获取模式下不再需要同步"""
        # 动态字段获取模式下，字段信息实时获取，无需同步
        return True

    @staticmethod
    def get_statistics(db: Session, data_source_id: int) -> Dict[str, Any]:
        """获取数据源统计信息"""
        from .data_source_statistics import ReportDataSourceStatistics
        return ReportDataSourceStatistics.get_statistics(db, data_source_id)

    @staticmethod
    def preview_data(db: Session, data_source_id: int, limit: int = 10, filters: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """预览数据源数据"""
        from .data_source_preview import ReportDataSourcePreview
        return ReportDataSourcePreview.preview_data(db, data_source_id, limit, filters)
    
    @staticmethod
    def preview_multi_datasource_data(
        db: Session, 
        data_source_ids: List[int], 
        joins: List[Dict[str, Any]],
        fields: List[str],
        filters: Dict[str, Any] = None,
        limit: int = 20,
        offset: int = 0
    ) -> Dict[str, Any]:
        """预览多数据源关联数据"""
        from .data_source_preview import ReportDataSourcePreview
        return ReportDataSourcePreview.preview_multi_datasource_data(
            db, data_source_ids, joins, fields, filters, limit, offset
        )
