"""
数据源字段CRUD操作模块
负责数据源字段的基本操作
"""

from typing import List, Optional
from sqlalchemy.orm import Session
from ...models.reports import ReportDataSourceField
from ...pydantic_models.reports import ReportDataSourceFieldCreate, ReportDataSourceFieldUpdate


class ReportDataSourceFieldCRUD:
    """数据源字段CRUD操作类"""
    
    @staticmethod
    def get_by_data_source(db: Session, data_source_id: int) -> List[ReportDataSourceField]:
        """根据数据源ID获取字段列表"""
        return db.query(ReportDataSourceField).filter(
            ReportDataSourceField.data_source_id == data_source_id
        ).order_by(ReportDataSourceField.sort_order).all()

    @staticmethod
    def create(db: Session, field: ReportDataSourceFieldCreate) -> ReportDataSourceField:
        """创建数据源字段"""
        db_field = ReportDataSourceField(**field.dict())
        db.add(db_field)
        db.commit()
        db.refresh(db_field)
        return db_field

    @staticmethod
    def update(db: Session, field_id: int, field: ReportDataSourceFieldUpdate) -> Optional[ReportDataSourceField]:
        """更新数据源字段"""
        db_field = db.query(ReportDataSourceField).filter(ReportDataSourceField.id == field_id).first()
        if db_field:
            update_data = field.dict(exclude_unset=True)
            for key, value in update_data.items():
                setattr(db_field, key, value)
            db.commit()
            db.refresh(db_field)
        return db_field

    @staticmethod
    def delete(db: Session, field_id: int) -> bool:
        """删除数据源字段"""
        db_field = db.query(ReportDataSourceField).filter(ReportDataSourceField.id == field_id).first()
        if db_field:
            db.delete(db_field)
            db.commit()
            return True
        return False
