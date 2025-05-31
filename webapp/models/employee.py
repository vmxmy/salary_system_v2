from typing import Optional, List, Tuple
import logging

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload
import sqlalchemy

# Assuming schemas.py defines Pydantic models like EmployeeCreate, EmployeeUpdate
# and models.py defines the ORM model Employee, Department, Unit, EstablishmentType
from .. import schemas
from .. import models # Adjusted import

logger = logging.getLogger(__name__)

# --- NEW Employee Management ORM Functions --- START ---

def get_employee_by_id(db: Session, employee_id: int) -> Optional['models.Employee']:
    """Fetches a single employee by ID using ORM, eager loading related data."""
    return db.query(models.Employee).options(
        joinedload(models.Employee.department).joinedload(models.Department.unit), # Load department -> unit
        joinedload(models.Employee.establishment_type) # Load establishment type
    ).filter(models.Employee.id == employee_id).first()

def create_employee(db: Session, employee: schemas.EmployeeCreate) -> 'models.Employee':
    """Creates a new employee record using ORM, checking uniqueness constraints."""
    # 1. Check for uniqueness
    existing_by_id_card = db.query(models.Employee).filter(models.Employee.id_card_number == employee.id_card_number).first()
    if existing_by_id_card:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Employee with ID card number {employee.id_card_number} already exists."
        )

    if employee.employee_unique_id:
        existing_by_unique_id = db.query(models.Employee).filter(models.Employee.employee_unique_id == employee.employee_unique_id).first()
        if existing_by_unique_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Employee with unique ID {employee.employee_unique_id} already exists."
            )

    if employee.email:
        existing_by_email = db.query(models.Employee).filter(models.Employee.email == employee.email).first()
        if existing_by_email:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Employee with email {employee.email} already exists."
            )

    # 2. Create Employee instance
    db_employee = models.Employee(
        name=employee.name,
        id_card_number=employee.id_card_number,
        department_id=employee.department_id,
        employee_unique_id=employee.employee_unique_id,
        bank_account_number=employee.bank_account_number,
        bank_name=employee.bank_name,
        establishment_type_id=employee.establishment_type_id,
        email=employee.email
    )

    # 3. Add, commit, refresh
    try:
        db.add(db_employee)
        db.commit()
        db.refresh(db_employee)
        return db_employee
    except sqlalchemy.exc.IntegrityError as e:
        db.rollback()
        logger.error(f"Integrity error creating employee: {e}", exc_info=True)
        if "foreign key constraint" in str(e).lower():
             if "fk_employees_department_id" in str(e).lower():
                 raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid Department ID: {employee.department_id}")
             elif "fk_employees_establishment_type_id" in str(e).lower():
                 raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid Establishment Type ID: {employee.establishment_type_id}")
        elif "unique constraint" in str(e).lower():
             if "uq_employees_id_card_number" in str(e).lower():
                 raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Employee with ID card number {employee.id_card_number} already exists (race condition)." )
             elif "uq_employees_employee_unique_id" in str(e).lower() and employee.employee_unique_id:
                 raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Employee unique ID conflict during creation (race condition)." )
             elif "uq_employees_email" in str(e).lower() and employee.email:
                 raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Employee with email {employee.email} already exists (race condition).")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database error creating employee.")
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error creating employee: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error creating employee.")

def get_employees(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    name: Optional[str] = None,
    department_id: Optional[int] = None,
    employee_unique_id: Optional[str] = None,
    establishment_type_id: Optional[int] = None
) -> Tuple[List['models.Employee'], int]:
    """Fetches a paginated list of employees using ORM, with filtering and eager loading."""
    query = db.query(models.Employee).options(
        joinedload(models.Employee.department).joinedload(models.Department.unit),
        joinedload(models.Employee.establishment_type)
    )

    if name:
        query = query.filter(models.Employee.name.ilike(f"%{name}%"))
    if department_id:
        query = query.filter(models.Employee.department_id == department_id)
    if employee_unique_id:
        query = query.filter(models.Employee.employee_unique_id == employee_unique_id)
    if establishment_type_id:
        query = query.filter(models.Employee.establishment_type_id == establishment_type_id)

    total_count = query.count()
    employees = query.order_by(models.Employee.id).offset(skip).limit(limit).all()
    return employees, total_count

def update_employee(
    db: Session,
    employee_id: int,
    employee_update: schemas.EmployeeUpdate
) -> Optional['models.Employee']:
    """Updates an existing employee using ORM, checking uniqueness constraints on update."""
    db_employee = get_employee_by_id(db, employee_id)
    if not db_employee:
        return None

    update_data = employee_update.model_dump(exclude_unset=True)

    if 'id_card_number' in update_data and update_data['id_card_number'] != db_employee.id_card_number:
        existing = db.query(models.Employee).filter(
            models.Employee.id_card_number == update_data['id_card_number'],
            models.Employee.id != employee_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"ID card number {update_data['id_card_number']} is already used by another employee."
            )

    if 'employee_unique_id' in update_data and update_data['employee_unique_id'] and update_data['employee_unique_id'] != db_employee.employee_unique_id:
        existing = db.query(models.Employee).filter(
            models.Employee.employee_unique_id == update_data['employee_unique_id'],
            models.Employee.id != employee_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Employee unique ID {update_data['employee_unique_id']} is already used by another employee."
            )

    if 'email' in update_data and update_data['email'] and update_data['email'] != db_employee.email:
        existing = db.query(models.Employee).filter(
            models.Employee.email == update_data['email'],
            models.Employee.id != employee_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Email {update_data['email']} is already used by another employee."
            )

    for key, value in update_data.items():
        setattr(db_employee, key, value)

    try:
        db.commit()
        db.refresh(db_employee)
        return get_employee_by_id(db, employee_id)
    except sqlalchemy.exc.IntegrityError as e:
        db.rollback()
        logger.error(f"Integrity error updating employee {employee_id}: {e}", exc_info=True)
        if "foreign key constraint" in str(e).lower():
             if "fk_employees_department_id" in str(e).lower():
                 raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Department ID provided for update.")
             elif "fk_employees_establishment_type_id" in str(e).lower():
                 raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Establishment Type ID provided for update.")
        elif "unique constraint" in str(e).lower():
            if "uq_employees_id_card_number" in str(e).lower():
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="ID card number conflict during update (race condition).")
            elif "uq_employees_employee_unique_id" in str(e).lower() and update_data.get('employee_unique_id'):
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Employee unique ID conflict during update (race condition).")
            elif "uq_employees_email" in str(e).lower() and update_data.get('email'):
                 raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email conflict during update (race condition).")
            else:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Unique constraint violation during update." )
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database error updating employee.")
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error updating employee {employee_id}: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error updating employee.")

def delete_employee(db: Session, employee_id: int) -> bool:
    """Deletes an employee by ID using ORM."""
    db_employee = db.get(models.Employee, employee_id)
    if not db_employee:
        return False

    try:
        db.delete(db_employee)
        db.commit()
        return True
    except sqlalchemy.exc.IntegrityError as e:
        db.rollback()
        logger.error(f"Integrity error deleting employee {employee_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot delete employee {employee_id}. They might be referenced in other records (e.g., salary data)."
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error deleting employee {employee_id}: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error deleting employee.")

# --- NEW Employee Management ORM Functions --- END --- 