from typing import List, Optional
from sqlalchemy.orm import Session
from ...models.reports import ReportTemplateField
from ...pydantic_models.reports import (
    ReportTemplateFieldCreate, ReportTemplateFieldUpdate
)


# 报表模板字段CRUD
class ReportTemplateFieldCRUD:
    @staticmethod
    def get_by_template(db: Session, template_id: int) -> List[ReportTemplateField]:
        return db.query(ReportTemplateField).filter(
            ReportTemplateField.template_id == template_id
        ).order_by(ReportTemplateField.display_order).all()

    @staticmethod
    def create(db: Session, field: ReportTemplateFieldCreate) -> ReportTemplateField:
        db_field = ReportTemplateField(**field.dict())
        db.add(db_field)
        db.commit()
        db.refresh(db_field)
        return db_field

    @staticmethod
    def update(db: Session, field_id: int, field: ReportTemplateFieldUpdate) -> Optional[ReportTemplateField]:
        db_field = db.query(ReportTemplateField).filter(ReportTemplateField.id == field_id).first()
        if db_field:
            update_data = field.dict(exclude_unset=True)
            for field_name, value in update_data.items():
                setattr(db_field, field_name, value)
            db.commit()
            db.refresh(db_field)
        return db_field

    @staticmethod
    def delete(db: Session, field_id: int) -> bool:
        db_field = db.query(ReportTemplateField).filter(ReportTemplateField.id == field_id).first()
        if db_field:
            db.delete(db_field)
            db.commit()
            return True
        return False 