"""
实际任职 (Position) 相关的CRUD操作。
"""
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import List, Optional, Tuple

from ...models.hr import Position as PositionModel # Renaming to avoid conflict if Position pydantic model is imported
from ...pydantic_models.hr import PositionCreate, PositionUpdate # Assuming these exist or will be created

# Placeholder for logger if needed in the future
# import logging
# logger = logging.getLogger(__name__)

def get_positions(
    db: Session,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    is_active: Optional[bool] = None
) -> Tuple[List[PositionModel], int]:
    """
    获取实际任职列表，支持分页、搜索和按激活状态过滤。
    """
    query = db.query(PositionModel)

    if is_active is not None:
        query = query.filter(PositionModel.is_active == is_active)

    if search:
        search_term = f"%{search.lower()}%"
        query = query.filter(
            or_(
                func.lower(PositionModel.name).like(search_term),
                func.lower(PositionModel.code).like(search_term)
            )
        )
    
    total = query.count()
    positions = query.order_by(PositionModel.name).offset(skip).limit(limit).all()
    return positions, total

def _get_position_by_name(db: Session, name: str) -> Optional[PositionModel]:
    return db.query(PositionModel).filter(func.lower(PositionModel.name) == func.lower(name)).first()

# TODO: Add create_position, update_position, delete_position if needed.
# For now, positions might be managed elsewhere or through simpler means if they are relatively static.
# If full CRUD is needed, define Pydantic models PositionCreate, PositionUpdate first.
# Example structure for create_position:
# def create_position(db: Session, position: PositionCreate) -> PositionModel:
#     # Check for existing code/name if necessary
#     db_position = PositionModel(**position.model_dump())
#     db.add(db_position)
#     db.commit()
#     db.refresh(db_position)
#     return db_position

# Example structure for update_position:
# def update_position(db: Session, position_id: int, position: PositionUpdate) -> Optional[PositionModel]:
#     db_position = db.query(PositionModel).filter(PositionModel.id == position_id).first()
#     if not db_position:
#         return None
#     update_data = position.model_dump(exclude_unset=True)
#     for key, value in update_data.items():
#         setattr(db_position, key, value)
#     db.commit()
#     db.refresh(db_position)
#     return db_position

# Example structure for delete_position:
# def delete_position(db: Session, position_id: int) -> bool:
#     db_position = db.query(PositionModel).filter(PositionModel.id == position_id).first()
#     if not db_position:
#         return False
#     # Add checks for dependencies (e.g., EmployeeJobHistory) before deleting
#     # job_history_count = db.query(EmployeeJobHistory).filter(EmployeeJobHistory.position_id == position_id).count()
#     # if job_history_count > 0:
#     #     raise ValueError(f"Cannot delete position with ID {position_id} as it's referenced by job histories.")
#     db.delete(db_position)
#     db.commit()
#     return True