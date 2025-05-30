# Shared utility functions for HR CRUD operations 
from sqlalchemy.orm import Session
from sqlalchemy import func, select
from typing import Optional
import logging

# 修正导入路径 - 使用 v2.models 而不是 webapp.models
from ...models.hr import Position as PositionModel, Department as DepartmentModel, PersonnelCategory as PersonnelCategoryModel
from ...models.config import LookupType, LookupValue

logger = logging.getLogger(__name__)

# Helper function to get position by name
def _get_position_by_name(db: Session, name: str) -> Optional[PositionModel]:
    return db.query(PositionModel).filter(func.lower(PositionModel.name) == func.lower(name)).first()

# Helper function to get department by name
def _get_department_by_name(db: Session, name: str) -> Optional[DepartmentModel]:
    return db.query(DepartmentModel).filter(func.lower(DepartmentModel.name) == func.lower(name)).first()

# Helper function to get personnel category by name
def _get_personnel_category_by_name(db: Session, name: str) -> Optional[PersonnelCategoryModel]:
    return db.query(PersonnelCategoryModel).filter(func.lower(PersonnelCategoryModel.name) == func.lower(name)).first()

# region Helper functions for resolving IDs
def _resolve_lookup_id(db: Session, text_value: Optional[str], type_code: str) -> Optional[int]:
    '''
    Resolves a text value for a lookup to its corresponding ID using the LookupType code.
    Example: text_value="男", type_code="GENDER" -> returns the ID of "男" in lookup_values.
    '''
    if not text_value:
        return None
    
    # SQLAlchemy 2.0 style query
    stmt = (
        select(LookupValue.id)
        .join(LookupType, LookupValue.lookup_type_id == LookupType.id)
        .where(LookupType.code == type_code)
        .where(LookupValue.name == text_value)
    )
    
    result = db.execute(stmt)
    lookup_value_id = result.scalar_one_or_none()

    if lookup_value_id is None:
        logger.warning(f"Lookup value not found for text: '{text_value}' with type_code: '{type_code}'. A new one might be created if applicable or this will be skipped.")
    return lookup_value_id
# endregion 