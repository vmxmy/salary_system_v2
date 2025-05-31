from typing import Optional, List, Tuple
import logging

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from sqlalchemy.exc import SQLAlchemyError, IntegrityError

# Assuming schemas.py defines Pydantic models like DepartmentCreate, DepartmentUpdate
# and models.py defines the ORM model Department, Unit, Employee
from .. import schemas
from .. import models # Adjusted import
from .unit import get_unit_by_id # Import from sibling module

logger = logging.getLogger(__name__)

# --- ORM Functions for Department Management --- START ---

def create_department(db: Session, department: schemas.DepartmentCreate) -> 'models.Department':
    """
    Creates a new department using SQLAlchemy ORM.
    Checks for unit existence and duplicate name within the unit.
    Returns the created Department ORM object (with unit loaded).
    Raises HTTPException on errors.
    """
    parent_unit = get_unit_by_id(db, department.unit_id)
    if not parent_unit:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unit with ID {department.unit_id} does not exist."
        )

    existing_dept = db.query(models.Department).filter(
        models.Department.name == department.name,
        models.Department.unit_id == department.unit_id
    ).first()
    if existing_dept:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Department with name '{department.name}' already exists in unit '{parent_unit.name if parent_unit else department.unit_id}'."
        )

    db_department = models.Department(
        name=department.name,
        unit_id=department.unit_id,
        description=department.description
    )

    try:
        db.add(db_department)
        db.commit()
        db.refresh(db_department)
        # Eager load the unit relationship for the response
        created_dept_with_unit = db.query(models.Department).options(
            joinedload(models.Department.unit)
        ).filter(models.Department.id == db_department.id).first()

        if not created_dept_with_unit:
             logger.error(f"Failed to re-fetch created department {db_department.id} with unit.")
             return db_department
        return created_dept_with_unit
    except IntegrityError as e:
        db.rollback()
        logger.error(f"Integrity error creating department '{department.name}' in unit {department.unit_id}: {e}", exc_info=True)
        parent_unit_name_for_error = parent_unit.name if parent_unit else str(department.unit_id)
        if "uq_departments_unit_id_name" in str(e).lower() or "departments_unit_id_name_key" in str(e).lower():
             raise HTTPException(
                 status_code=status.HTTP_409_CONFLICT,
                 detail=f"Department with name '{department.name}' already exists in unit '{parent_unit_name_for_error}' (race condition)."
             )
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database error creating department.") from e
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"SQLAlchemy error creating department: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database error creating department.") from e


def get_department_by_id(db: Session, department_id: int) -> Optional['models.Department']:
    """
    Fetches a department by its ID using SQLAlchemy ORM, with its unit.
    """
    try:
        return db.query(models.Department).options(
            joinedload(models.Department.unit)
        ).filter(models.Department.id == department_id).first()
    except SQLAlchemyError as e:
        logger.error(f"SQLAlchemy error fetching department by ID {department_id}: {e}")
        return None

def get_departments(
    db: Session,
    unit_id: Optional[int] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
) -> Tuple[List['models.Department'], int]:
    """
    Fetches a paginated list of departments, optionally filtered by unit_id and search term.
    Returns a tuple: (list of Department ORM objects, total count).
    """
    try:
        query = db.query(models.Department).options(joinedload(models.Department.unit))

        if unit_id is not None:
            query = query.filter(models.Department.unit_id == unit_id)
        if search:
            query = query.filter(models.Department.name.ilike(f"%{search}%"))

        total_count = query.count() # Get total count before pagination
        departments_list = query.order_by(models.Department.name).offset(skip).limit(limit).all()
        return departments_list, total_count
    except SQLAlchemyError as e:
        logger.error(f"SQLAlchemy error fetching departments: {e}")
        return [], 0

def count_employees_by_department_id(db: Session, department_id: int) -> int:
    """
    Counts the number of employees associated with a given department ID.
    """
    try:
        count = db.query(func.count(models.Employee.id)).filter(models.Employee.department_id == department_id).scalar()
        return count or 0
    except SQLAlchemyError as e:
        logger.error(f"SQLAlchemy error counting employees for department {department_id}: {e}")
        return 0


def update_department(
    db: Session,
    department_id: int,
    department_update: schemas.DepartmentUpdate
) -> Optional['models.Department']:
    """
    Updates an existing department by ID.
    Returns the updated Department ORM object (with unit), or None if not found.
    Raises HTTPException on conflict or other errors.
    """
    db_department = get_department_by_id(db, department_id) 
    if not db_department:
        return None 

    update_data = department_update.model_dump(exclude_unset=True)

    if 'name' in update_data and update_data['name'] != db_department.name:
        target_unit_id = db_department.unit_id 
        parent_unit_for_error_msg: Optional['models.Unit'] = None
        if 'unit_id' in update_data and update_data['unit_id'] != db_department.unit_id:
            target_unit_id = update_data['unit_id']
            new_parent_unit = get_unit_by_id(db, target_unit_id)
            if not new_parent_unit:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Target unit with ID {target_unit_id} for department update does not exist."
                )
            parent_unit_for_error_msg = new_parent_unit
        else:
            parent_unit_for_error_msg = get_unit_by_id(db, target_unit_id)

        existing_dept_with_same_name = db.query(models.Department).filter(
            models.Department.name == update_data['name'],
            models.Department.unit_id == target_unit_id, 
            models.Department.id != department_id 
        ).first()

        if existing_dept_with_same_name:
            parent_unit_name = parent_unit_for_error_msg.name if parent_unit_for_error_msg else str(target_unit_id)
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Department name '{update_data['name']}' already exists in unit '{parent_unit_name}'."
            )

    if 'unit_id' in update_data and update_data['unit_id'] != db_department.unit_id:
        if not ('name' in update_data and update_data['name'] != db_department.name) : 
            new_parent_unit = get_unit_by_id(db, update_data['unit_id'])
            if not new_parent_unit:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Target unit with ID {update_data['unit_id']} for department update does not exist."
                )
    
    for key, value in update_data.items():
        setattr(db_department, key, value)

    try:
        db.commit()
        db.refresh(db_department)
        return get_department_by_id(db, department_id)
    except IntegrityError as e:
        db.rollback()
        logger.error(f"Integrity error updating department {department_id}: {e}", exc_info=True)
        parent_unit_name_for_error = "the unit"
        if db_department.unit:
             parent_unit_name_for_error = db_department.unit.name
        elif 'unit_id' in update_data:
            updated_unit = get_unit_by_id(db, update_data['unit_id'])
            if updated_unit: parent_unit_name_for_error = updated_unit.name
            else: parent_unit_name_for_error = str(update_data['unit_id'])
        elif db_department.unit_id:
            current_unit = get_unit_by_id(db, db_department.unit_id)
            if current_unit: parent_unit_name_for_error = current_unit.name
            else: parent_unit_name_for_error = str(db_department.unit_id)

        conflicting_name = update_data.get('name', db_department.name)
        if "uq_departments_unit_id_name" in str(e).lower() or "departments_unit_id_name_key" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Department name '{conflicting_name}' already exists in {parent_unit_name_for_error} (race condition during update)."
            )
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database error updating department.") from e
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"SQLAlchemy error updating department {department_id}: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database error during department update.") from e


def delete_department(db: Session, department_id: int) -> bool:
    """
    Deletes a department by ID.
    Returns True if deleted.
    Raises HTTPException on constraint violation (e.g., if employees are in department) or if not found.
    """
    db_department = get_department_by_id(db, department_id)
    if not db_department:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Department with ID {department_id} not found."
        )

    employee_count = count_employees_by_department_id(db, department_id)
    if employee_count > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot delete department '{db_department.name}' (ID: {department_id}) as it has {employee_count} associated employee(s). Please reassign or remove them first."
        )

    try:
        db.delete(db_department)
        db.commit()
        return True
    except IntegrityError as e: 
        db.rollback()
        logger.error(f"Integrity error deleting department {department_id}, likely due to associated records: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot delete department '{db_department.name}' (ID: {department_id}) due to existing associations (e.g., employees or other records)."
        )
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"SQLAlchemy error deleting department {department_id}: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database error during department deletion.") from e

# --- ORM Functions for Department Management --- END --- 