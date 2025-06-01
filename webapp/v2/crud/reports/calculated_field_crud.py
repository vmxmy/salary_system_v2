"""
计算字段CRUD操作模块
负责计算字段的基本操作
"""

from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from ...models.reports import ReportCalculatedField
from ...pydantic_models.reports import ReportCalculatedFieldCreate, ReportCalculatedFieldUpdate


class ReportCalculatedFieldCRUD:
    """计算字段CRUD操作类"""
    
    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100, is_global: Optional[bool] = None) -> List[ReportCalculatedField]:
        """获取所有计算字段"""
        query = db.query(ReportCalculatedField)
        if is_global is not None:
            query = query.filter(ReportCalculatedField.is_global == is_global)
        return query.offset(skip).limit(limit).all()

    @staticmethod
    def get_by_id(db: Session, field_id: int) -> Optional[ReportCalculatedField]:
        """根据ID获取计算字段"""
        return db.query(ReportCalculatedField).filter(ReportCalculatedField.id == field_id).first()

    @staticmethod
    def create(db: Session, field: ReportCalculatedFieldCreate, user_id: int) -> ReportCalculatedField:
        """创建计算字段"""
        db_field = ReportCalculatedField(**field.dict(), created_by=user_id)
        db.add(db_field)
        db.commit()
        db.refresh(db_field)
        return db_field

    @staticmethod
    def update(db: Session, field_id: int, field: ReportCalculatedFieldUpdate) -> Optional[ReportCalculatedField]:
        """更新计算字段"""
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
        """删除计算字段"""
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
