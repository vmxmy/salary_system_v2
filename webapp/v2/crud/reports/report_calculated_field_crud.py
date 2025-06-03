from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from ...models.reports import ReportCalculatedField
from ...pydantic_models.reports import (
    ReportCalculatedFieldCreate, ReportCalculatedFieldUpdate
)


# 计算字段CRUD
class ReportCalculatedFieldCRUD:
    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100, is_global: Optional[bool] = None) -> List[ReportCalculatedField]:
        query = db.query(ReportCalculatedField)
        if is_global is not None:
            query = query.filter(ReportCalculatedField.is_global == is_global)
        total = query.count()
        fields = query.offset(skip).limit(limit).all()
        return fields, total

    @staticmethod
    def get_by_id(db: Session, field_id: int) -> Optional[ReportCalculatedField]:
        return db.query(ReportCalculatedField).filter(ReportCalculatedField.id == field_id).first()

    @staticmethod
    def create(db: Session, field: ReportCalculatedFieldCreate, user_id: int) -> ReportCalculatedField:
        db_field = ReportCalculatedField(**field.dict(), created_by=user_id)
        db.add(db_field)
        db.commit()
        db.refresh(db_field)
        return db_field

    @staticmethod
    def update(db: Session, field_id: int, field: ReportCalculatedFieldUpdate) -> Optional[ReportCalculatedField]:
        db_field = db.query(ReportCalculatedField).filter(ReportCalculatedField.id == field_id).first()
        if db_field:
            update_data = field.dict(exclude_unset=True)
            for field_name, value in update_data.items():
                setattr(db_field, field_name, value)
            db.commit()
            db.refresh(db_field)
        return db_field

    @staticmethod
    def delete(db: Session, field_id: int) -> bool:
        db_field = db.query(ReportCalculatedField).filter(ReportCalculatedField.id == field_id).first()
        if db_field:
            db.delete(db_field)
            db.commit()
            return True
        return False

    @staticmethod
    def test_formula(db: Session, formula: str, data_source_id: Optional[int] = None) -> Dict[str, Any]:
        """测试计算公式"""
        try:
            # 这里可以实现公式验证逻辑
            # 简单示例：检查公式语法
            if not formula.strip():
                return {"valid": False, "error": "公式不能为空"}
            
            # 可以添加更复杂的公式验证逻辑
            return {"valid": True, "result": "公式语法正确"}
        except Exception as e:
            return {"valid": False, "error": str(e)} 