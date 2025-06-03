from typing import List, Optional
from sqlalchemy.orm import Session
from ...models.reports import ReportDataSourceField
from ...pydantic_models.reports import (
    ReportDataSourceFieldCreate, ReportDataSourceFieldUpdate
)


# 数据源字段CRUD
class ReportDataSourceFieldCRUD:
    @staticmethod
    def get_by_data_source(db: Session, data_source_id: int, skip: int = 0, limit: int = 100) -> List[ReportDataSourceField]:
        query = db.query(ReportDataSourceField).filter(
            ReportDataSourceField.data_source_id == data_source_id
        )
        total = query.count()
        fields = query.order_by(ReportDataSourceField.sort_order).offset(skip).limit(limit).all()
        return fields, total

    @staticmethod
    def create(db: Session, field: ReportDataSourceFieldCreate) -> ReportDataSourceField:
        db_field = ReportDataSourceField(**field.dict())
        db.add(db_field)
        db.commit()
        db.refresh(db_field)
        return db_field

    @staticmethod
    def update(db: Session, field_id: int, field: ReportDataSourceFieldUpdate) -> Optional[ReportDataSourceField]:
        db_field = db.query(ReportDataSourceField).filter(ReportDataSourceField.id == field_id).first()
        if db_field:
            update_data = field.dict(exclude_unset=True)
            for field_name, value in update_data.items():
                setattr(db_field, field_name, value)
            db.commit()
            db.refresh(db_field)
        return db_field

    @staticmethod
    def delete(db: Session, field_id: int) -> bool:
        db_field = db.query(ReportDataSourceField).filter(ReportDataSourceField.id == field_id).first()
        if db_field:
            db.delete(db_field)
            db.commit()
            return True
        return False 