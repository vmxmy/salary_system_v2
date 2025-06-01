from typing import Optional, List, Tuple
import logging

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload # joinedload might not be used here but good for consistency
from sqlalchemy.exc import SQLAlchemyError, IntegrityError

# Assuming schemas.py defines Pydantic models like UnitCreate, UnitUpdate
# and models.py defines the ORM model Unit, Department
from .. import schemas
from .. import models # Adjusted import

logger = logging.getLogger(__name__)

# --- ORM Functions for Unit Management --- START ---

def create_unit(db: Session, unit: schemas.UnitCreate) -> 'models.Unit':
    """
    Creates a new unit with the given data using SQLAlchemy ORM.
    Checks for duplicate name.
    Returns the created Unit ORM object or raises HTTPException.
    """
    existing_unit = db.query(models.Unit).filter(models.Unit.name == unit.name).first()
    if existing_unit:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Unit with name '{unit.name}' already exists."
        )

    db_unit = models.Unit(
        name=unit.name,
        description=unit.description
    )

    try:
        db.add(db_unit)
        db.commit()
        db.refresh(db_unit)
        return db_unit
    except IntegrityError as e:
        db.rollback()
        logger.error(f"Integrity error creating unit: {e}")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Database integrity error creating unit: {e}"
        )
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"SQLAlchemy error creating unit: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error occurred while creating unit."
        )

def get_unit_by_id(db: Session, unit_id: int) -> Optional['models.Unit']:
    """Fetches a unit by its ID using SQLAlchemy ORM."""
    try:
        return db.get(models.Unit, unit_id)
    except SQLAlchemyError as e:
        logger.error(f"SQLAlchemy error fetching unit by ID {unit_id}: {e}")
        return None

def get_units(
    db: Session,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
) -> Tuple[List['models.Unit'], int]:
    """
    Fetches a paginated list of units using ORM, with optional search.
    Returns a tuple: (list of Unit ORM objects, total count).
    """
    try:
        query = db.query(models.Unit)
        if search:
            query = query.filter(models.Unit.name.ilike(f"%{search}%"))
        total_count = query.count()
        units_list = query.order_by(models.Unit.name).offset(skip).limit(limit).all()
        return units_list, total_count
    except SQLAlchemyError as e:
        logger.error(f"SQLAlchemy error fetching units list: {e}")
        return [], 0

def update_unit(db: Session, unit_id: int, unit_update: schemas.UnitUpdate) -> Optional['models.Unit']:
    """
    Updates an existing unit by ID.
    Returns the updated Unit ORM object, or None if not found.
    Raises HTTPException on conflict.
    """
    db_unit = get_unit_by_id(db, unit_id) # Uses the function defined in this file
    if not db_unit:
        return None

    update_data = unit_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        if key == 'name' and value != db_unit.name:
            existing = db.query(models.Unit).filter(models.Unit.name == value).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Unit with name '{value}' already exists."
                )
        setattr(db_unit, key, value)

    try:
        db.add(db_unit) # or db.merge(db_unit) if attributes are directly modified
        db.commit()
        db.refresh(db_unit)
        return db_unit
    except IntegrityError as e:
        db.rollback()
        logger.error(f"Integrity error updating unit {unit_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Database integrity error updating unit: {e}"
        )
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"SQLAlchemy error updating unit {unit_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error occurred while updating unit {unit_id}."
        )

def delete_unit(db: Session, unit_id: int) -> bool:
    """
    Deletes a unit by ID.
    Returns True if the unit was deleted.
    Raises HTTPException on constraint violation or if not found.
    """
    db_unit = get_unit_by_id(db, unit_id) # Uses the function defined in this file
    if not db_unit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Unit with ID {unit_id} not found."
        )

    try:
        db.delete(db_unit)
        db.commit()
        return True
    except IntegrityError as e:
        db.rollback()
        logger.error(f"Integrity error deleting unit {unit_id}, likely due to foreign key constraint: {e}")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot delete unit with ID {unit_id} because it has associated departments or other records."
        )
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"SQLAlchemy error deleting unit {unit_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error occurred while deleting unit {unit_id}."
        )

def get_departments_by_unit_id(db: Session, unit_id: int) -> List['models.Department']:
    """
    获取指定单位的所有部门列表
    Returns a list of Department ORM objects for the given unit_id.
    """
    try:
        departments = db.query(models.Department).filter(
            models.Department.unit_id == unit_id
        ).order_by(models.Department.name).all()
        return departments
    except SQLAlchemyError as e:
        logger.error(f"SQLAlchemy error fetching departments for unit {unit_id}: {e}")
        return []

def get_all_unit_names(db: Session) -> List[str]:
    """
    获取所有单位名称列表，用于下拉框等场景
    Returns a list of unit names.
    """
    try:
        unit_names_tuples = db.query(models.Unit.name).order_by(models.Unit.name).all()
        return [name_tuple[0] for name_tuple in unit_names_tuples if name_tuple[0]]
    except SQLAlchemyError as e:
        logger.error(f"SQLAlchemy error fetching all unit names: {e}")
        return []

# --- ORM Functions for Unit Management --- END --- 