from typing import Optional, List, Dict, Any, Tuple, Union
import logging
from fastapi import HTTPException, status
from datetime import datetime, timezone
import uuid # Add this import

# 注意：此文件已完成从psycopg2到SQLAlchemy ORM的迁移
# 所有数据库操作现在都使用SQLAlchemy ORM实现

# Import SQLAlchemy components
from sqlalchemy.orm import Session, joinedload, selectinload, relationship
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from sqlalchemy import func, or_, and_, text, Column, String, Integer, BigInteger, UniqueConstraint, ForeignKey, TIMESTAMP, Identity, Text, Numeric, Boolean
# We need JSONB specific type for PostgreSQL
from sqlalchemy.dialects.postgresql import JSONB

# Assuming schemas.py defines the Pydantic models like UserCreate, UserUpdate, RoleCreate etc.
from . import schemas
from . import models
from .database import Base
# 导入SalaryRecordUpdate类型
from .pydantic_models import SalaryRecordUpdate

logger = logging.getLogger(__name__)

# --- Role DB Operations (SQLAlchemy ORM Version) ---

def get_role_by_id(db: Session, role_id: int) -> Optional[models.Role]:
    """Fetches a role by its ID using SQLAlchemy ORM."""
    try:
        return db.query(models.Role).filter(models.Role.id == role_id).first()
    except SQLAlchemyError as e:
        logger.error(f"SQLAlchemy error fetching role by ID {role_id}: {e}")
        # No rollback needed for SELECT typically, but Session might be in bad state
        return None

def get_role_by_name(db: Session, role_name: str) -> Optional[models.Role]:
    """Fetches a role by its name using SQLAlchemy ORM."""
    try:
        return db.query(models.Role).filter(models.Role.name == role_name).first()
    except SQLAlchemyError as e:
        logger.error(f"SQLAlchemy error fetching role by name {role_name}: {e}")
        return None

def get_roles(db: Session) -> List[models.Role]:
    """Fetches all roles from the database using SQLAlchemy ORM."""
    try:
        return db.query(models.Role).order_by(models.Role.id).all()
    except SQLAlchemyError as e:
        logger.error(f"SQLAlchemy error fetching all roles: {e}")
        return []

# --- User DB Operations (Final ORM Versions) ---

def get_user_by_username(db: Session, username: str) -> Optional[models.User]:
    """Fetches a user by username using SQLAlchemy ORM, joining the role.
       Returns the User ORM object or None.
    """
    try:
        # Use joinedload to eagerly load the related role object in the same query
        return db.query(models.User).options(joinedload(models.User.role)).filter(models.User.username == username).first()
    except SQLAlchemyError as e:
        logger.error(f"SQLAlchemy error fetching user by username {username}: {e}")
        return None

def get_users(db: Session, skip: int = 0, limit: int = 100) -> Tuple[List[models.User], int]:
    """Fetches a paginated list of users with their role information using SQLAlchemy ORM.
       Returns a tuple: (list of User ORM objects, total user count).
    """
    try:
        # Query for the paginated list of users, joining the role
        query = db.query(models.User).options(joinedload(models.User.role)).order_by(models.User.id)

        # Get the paginated results
        users_list = query.offset(skip).limit(limit).all()

        # Get the total count of users (without pagination constraints)
        # Note: If filtering is added later, the filter needs to be applied here too.
        total_count = db.query(func.count(models.User.id)).scalar() or 0

        return users_list, total_count
    except SQLAlchemyError as e:
        logger.error(f"SQLAlchemy error fetching users list: {e}")
        return [], 0

def get_user_by_id(db: Session, user_id: int) -> Optional[models.User]:
    """Fetches a single user by ID using SQLAlchemy ORM, joining the role.
       Returns the User ORM object or None if not found.
    """
    try:
        # Use joinedload to eagerly load the related role object
        return db.query(models.User).options(joinedload(models.User.role)).filter(models.User.id == user_id).first()
    except SQLAlchemyError as e:
        logger.error(f"SQLAlchemy error fetching user by ID {user_id}: {e}")
        return None

def create_user(db: Session, user: schemas.UserCreate, hashed_password: str) -> models.User:
    """Creates a new user in the database using SQLAlchemy ORM.
    Handles potential IntegrityErrors (username/email unique constraints).
    Returns the newly created User ORM object.
    Raises HTTPException on errors.
    """
    # Create the SQLAlchemy model instance
    db_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        role_id=user.role_id,
        is_active=user.is_active
    )

    try:
        db.add(db_user)
        db.commit()
        db.refresh(db_user) # Refresh to get ID and potentially loaded relationships
        return db_user
    except IntegrityError as e:
        db.rollback() # Rollback the session
        logger.error(f"Database integrity error creating user {user.username} or email {user.email}: {e}")
        detail = "An integrity constraint was violated during user creation."
        # Check common constraint names (these might vary based on your DB schema)
        if "users_username_key" in str(e) or "uq_users_username" in str(e):
            detail = f"Username '{user.username}' already exists."
        elif "users_email_key" in str(e) or "uq_users_email" in str(e):
            detail = f"Email '{user.email}' is already registered."
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=detail) from e
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"SQLAlchemy error creating user {user.username}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database error during user creation.") from e
    except Exception as e: # Catch any other unexpected errors
        db.rollback()
        logger.error(f"Unexpected error creating user {user.username}: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An unexpected error occurred during user creation.") from e

def update_user(db: Session, user_id: int, user_update: schemas.UserUpdate, hashed_password: Optional[str] = None) -> models.User:
    """Updates a user's information in the database using SQLAlchemy ORM.
    Handles potential IntegrityErrors and checks if the user exists.
    Returns the updated User ORM object.
    Raises HTTPException on errors.
    """
    # Fetch the existing user, including the role to ensure it's loaded for the return object
    db_user = db.query(models.User).options(joinedload(models.User.role)).filter(models.User.id == user_id).first()

    if not db_user:
        # If user not found, raise 404 immediately
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Get fields to update, excluding any fields that were not explicitly set in the request
    update_data = user_update.model_dump(exclude_unset=True)

    # Handle password update separately
    if hashed_password:
        update_data['hashed_password'] = hashed_password
    # Remove 'password' key if it exists (even if None) to avoid setting it directly
    if 'password' in update_data:
        del update_data['password']

    if not update_data:
        # If no fields other than potentially password=None were provided, return the existing user
        return db_user

    # Update the user object's attributes
    for key, value in update_data.items():
        setattr(db_user, key, value)

    # Manually set updated_at if your model doesn't have server_default=func.now()
    # db_user.updated_at = datetime.now(timezone.utc)

    try:
        db.commit()
        db.refresh(db_user)
        return db_user
    except IntegrityError as e:
        db.rollback()
        logger.error(f"Database integrity error updating user {user_id}: {e}")
        detail = "Update failed due to integrity constraint."
        if "users_username_key" in str(e) or "uq_users_username" in str(e):
            detail = f"Username '{user_update.username}' is already registered by another user."
        elif "users_email_key" in str(e) or "uq_users_email" in str(e):
            detail = f"Email '{user_update.email}' is already registered by another user."
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=detail) from e
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"SQLAlchemy error updating user {user_id}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database error during user update.") from e
    except Exception as e: # Catch any other unexpected errors
        db.rollback()
        logger.error(f"Unexpected error updating user {user_id}: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An unexpected error occurred during user update.") from e

def delete_user(db: Session, user_id: int) -> bool:
    """Deletes a user from the database using SQLAlchemy ORM.
    Returns True if deletion was successful, False if user not found.
    Raises HTTPException on database errors.
    """
    try:
        # Find the user first
        db_user = db.query(models.User).filter(models.User.id == user_id).first()

        if not db_user:
            # User not found, deletion cannot proceed
            return False

        # Delete the user
        db.delete(db_user)
        db.commit()
        return True # Deletion successful

    except SQLAlchemyError as e:
        db.rollback() # Rollback in case of error
        logger.error(f"SQLAlchemy error deleting user {user_id}: {e}")
        # Raise 500 for unexpected DB errors during delete
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database error during user deletion.") from e
    except Exception as e: # Catch any other unexpected errors
        db.rollback()
        logger.error(f"Unexpected error deleting user {user_id}: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An unexpected error occurred during user deletion.") from e

def get_user_hashed_password(db: Session, user_id: int) -> Optional[str]:
    """Fetches only the hashed password for a given user ID."""
    try:
        # Select only the hashed_password column for efficiency
        hashed_password = db.query(models.User.hashed_password).filter(models.User.id == user_id).scalar()
        return hashed_password
    except SQLAlchemyError as e:
        logger.error(f"SQLAlchemy error fetching hashed password for user {user_id}: {e}")
        # Depending on policy, you might want to raise 500 or return None
        # Returning None is consistent with the old function if the query fails
        return None

def update_user_password(db: Session, user_id: int, new_hashed_password: str) -> bool:
    """Updates a user's password in the database using SQLAlchemy ORM.
    Returns True if successful, False if user not found.
    Raises HTTPException on database errors.
    """
    try:
        # Find the user
        db_user = db.query(models.User).filter(models.User.id == user_id).first()

        if not db_user:
            # User not found
            return False

        # Update the password - 修复类型问题
        setattr(db_user, 'hashed_password', new_hashed_password)  # 使用setattr而不是直接赋值
        # Manually set updated_at if needed
        # db_user.updated_at = datetime.now(timezone.utc)

        db.commit()
        return True # Update successful

    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"SQLAlchemy error updating password for user {user_id}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database error during password update.") from e
    except Exception as e: # Catch any other unexpected errors
        db.rollback()
        logger.error(f"Unexpected error updating password for user {user_id}: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An unexpected error occurred during password update.") from e

# --- NEW Employee Management ORM Functions --- START ---

def get_employee_by_id(db: Session, employee_id: int) -> Optional[models.Employee]:
    """Fetches a single employee by ID using ORM, eager loading related data."""
    return db.query(models.Employee).options(
        joinedload(models.Employee.department).joinedload(models.Department.unit), # Load department -> unit
        joinedload(models.Employee.establishment_type) # Load establishment type
    ).filter(models.Employee.id == employee_id).first()

def create_employee(db: Session, employee: schemas.EmployeeCreate) -> models.Employee:
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
        db.refresh(db_employee) # Get ID, created_at etc.

        # Eager load relationships for the response AFTER the commit
        # This is one way; alternatively, query again with options if needed
        # However, for a consistent response, querying again might be better:
        # return get_employee_by_id(db, db_employee.id) # Query again to get loaded object
        return db_employee # Return the created object (relationships might be lazy loaded)

    except IntegrityError as e:
        db.rollback()
        # Could be foreign key constraint (dept_id, est_type_id) or another race condition on unique keys
        logger.error(f"Integrity error creating employee: {e}", exc_info=True)
        # Basic check for foreign key violation (this check is basic and might need refinement)
        if "foreign key constraint" in str(e).lower():
             if "fk_employees_department_id" in str(e).lower():
                 raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid Department ID: {employee.department_id}")
             elif "fk_employees_establishment_type_id" in str(e).lower():
                 raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid Establishment Type ID: {employee.establishment_type_id}")
        # Re-check unique constraints in case of race condition
        elif "unique constraint" in str(e).lower():
             if "uq_employees_id_card_number" in str(e).lower():
                 raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Employee with ID card number {employee.id_card_number} already exists (race condition)." )
             elif "uq_employees_employee_unique_id" in str(e).lower() and employee.employee_unique_id:
                 raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Employee with unique ID {employee.employee_unique_id} already exists (race condition)." )
             elif "uq_employees_email" in str(e).lower() and employee.email: # Check for email unique constraint
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
) -> Tuple[List[models.Employee], int]:
    """Fetches a paginated list of employees using ORM, with filtering and eager loading."""
    query = db.query(models.Employee).options(
        joinedload(models.Employee.department).joinedload(models.Department.unit),
        joinedload(models.Employee.establishment_type)
    )

    # Apply filters dynamically
    if name:
        query = query.filter(models.Employee.name.ilike(f"%{name}%"))
    if department_id:
        query = query.filter(models.Employee.department_id == department_id)
    if employee_unique_id:
        # Assuming exact match for unique ID
        query = query.filter(models.Employee.employee_unique_id == employee_unique_id)
    if establishment_type_id:
        query = query.filter(models.Employee.establishment_type_id == establishment_type_id)

    # Get total count before applying limit/offset
    total_count = query.count()

    # Apply pagination and ordering
    employees = query.order_by(models.Employee.id).offset(skip).limit(limit).all()

    return employees, total_count

def update_employee(
    db: Session,
    employee_id: int,
    employee_update: schemas.EmployeeUpdate
) -> Optional[models.Employee]:
    """Updates an existing employee using ORM, checking uniqueness constraints on update."""
    db_employee = get_employee_by_id(db, employee_id) # Updated internal call
    if not db_employee:
        return None # Indicate not found

    update_data = employee_update.model_dump(exclude_unset=True) # Get fields to update

    # Check uniqueness constraints if relevant fields are being updated
    if 'id_card_number' in update_data and update_data['id_card_number'] != db_employee.id_card_number:
        existing = db.query(models.Employee).filter(
            models.Employee.id_card_number == update_data['id_card_number'],
            models.Employee.id != employee_id # Exclude self
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"ID card number {update_data['id_card_number']} is already used by another employee."
            )

    if 'employee_unique_id' in update_data and update_data['employee_unique_id'] and update_data['employee_unique_id'] != db_employee.employee_unique_id:
        existing = db.query(models.Employee).filter(
            models.Employee.employee_unique_id == update_data['employee_unique_id'],
            models.Employee.id != employee_id # Exclude self
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Employee unique ID {update_data['employee_unique_id']} is already used by another employee."
            )

    if 'email' in update_data and update_data['email'] and update_data['email'] != db_employee.email:
        existing = db.query(models.Employee).filter(
            models.Employee.email == update_data['email'],
            models.Employee.id != employee_id # Exclude self
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Email {update_data['email']} is already used by another employee."
            )

    # Update fields
    for key, value in update_data.items():
        setattr(db_employee, key, value)

    try:
        db.commit()
        db.refresh(db_employee)
        # Query again to ensure relationships are loaded correctly after update
        return get_employee_by_id(db, employee_id) # Updated internal call
    except IntegrityError as e:
        db.rollback()
        logger.error(f"Integrity error updating employee {employee_id}: {e}", exc_info=True)
        # Handle potential foreign key or unique constraint violations during commit
        if "foreign key constraint" in str(e).lower():
             if "fk_employees_department_id" in str(e).lower():
                 raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid Department ID provided for update.")
             elif "fk_employees_establishment_type_id" in str(e).lower():
                 raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid Establishment Type ID provided for update.")
        elif "unique constraint" in str(e).lower():
            # This might indicate a race condition if pre-commit checks passed
            if "uq_employees_id_card_number" in str(e).lower():
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="ID card number conflict during update (race condition).")
            elif "uq_employees_employee_unique_id" in str(e).lower() and update_data.get('employee_unique_id'):
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Employee unique ID conflict during update (race condition).")
            elif "uq_employees_email" in str(e).lower() and update_data.get('email'): # Check for email unique constraint
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
    db_employee = db.get(models.Employee, employee_id) # Use db.get for simple PK lookup
    if not db_employee:
        return False # Indicate not found

    try:
        db.delete(db_employee)
        db.commit()
        return True
    except IntegrityError as e:
        # This might happen if the employee is referenced by other tables
        # with foreign key constraints (e.g., salary records not yet deleted)
        db.rollback()
        logger.error(f"Integrity error deleting employee {employee_id}: {e}", exc_info=True)
        # Raise a specific error indicating dependency issue
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot delete employee {employee_id}. They might be referenced in other records (e.g., salary data)."
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error deleting employee {employee_id}: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error deleting employee.")

# --- NEW Employee Management ORM Functions --- END ---

# --- ORM Functions for Unit Management --- START ---

def create_unit(db: Session, unit: schemas.UnitCreate) -> models.Unit:
    """
    Creates a new unit with the given data using SQLAlchemy ORM.
    Checks for duplicate name.
    Returns the created Unit ORM object or raises HTTPException.
    """
    # Check for duplicate unit name
    existing_unit = db.query(models.Unit).filter(models.Unit.name == unit.name).first()
    if existing_unit:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Unit with name '{unit.name}' already exists."
        )

    # Create Unit instance
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
        # Convert to HTTPException
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

def get_unit_by_id(db: Session, unit_id: int) -> Optional[models.Unit]:
    """Fetches a unit by its ID using SQLAlchemy ORM."""
    try:
        # Use db.get for efficient primary key lookup
        return db.get(models.Unit, unit_id)
    except SQLAlchemyError as e:
        logger.error(f"SQLAlchemy error fetching unit by ID {unit_id}: {e}")
        # Depending on the desired behavior, you might want to raise an exception
        # or return None if the session is in a bad state.
        return None

def get_units(
    db: Session,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
) -> Tuple[List[models.Unit], int]:
    """
    Fetches a paginated list of units using ORM, with optional search.
    Returns a tuple: (list of Unit ORM objects, total count).
    """
    try:
        # Base query
        query = db.query(models.Unit)

        # Apply search filter if provided
        if search:
            query = query.filter(models.Unit.name.ilike(f"%{search}%"))

        # Get total count matching the filter before applying pagination
        total_count = query.count()

        # Apply ordering and pagination
        units_list = query.order_by(models.Unit.name).offset(skip).limit(limit).all()

        return units_list, total_count

    except SQLAlchemyError as e:
        logger.error(f"SQLAlchemy error fetching units list: {e}")
        return [], 0 # Return empty list and zero count on error

def update_unit(db: Session, unit_id: int, unit_update: schemas.UnitUpdate) -> Optional[models.Unit]:
    """
    Updates an existing unit by ID.
    Returns the updated Unit ORM object, or None if not found.
    Raises HTTPException on conflict.
    """
    # Get the existing unit
    db_unit = get_unit_by_id(db, unit_id)
    if not db_unit:
        return None # Unit not found

    # Update fields that are present in the request
    update_data = unit_update.dict(exclude_unset=True) # Only take fields that were provided
    for key, value in update_data.items():
        # Check for name uniqueness if name is being changed
        if key == 'name' and value != db_unit.name:
            existing = db.query(models.Unit).filter(models.Unit.name == value).first()
            if existing:
                # Raise an exception for duplicate name
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Unit with name '{value}' already exists."
                )

        # Set the attribute
        setattr(db_unit, key, value)

    # Update timestamp would happen automatically if using onupdate in model

    try:
        db.add(db_unit)
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
    Returns True if the unit was deleted, False if not found.
    Raises HTTPException on constraint violation.
    """
    # Check if the unit exists
    db_unit = get_unit_by_id(db, unit_id)
    if not db_unit:
        # Unit not found
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
        # Check if the error is because the unit has dependent departments
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

def get_departments_by_unit_id(db: Session, unit_id: int) -> List[models.Department]:
    """
    获取指定单位的所有部门列表
    Returns a list of Department ORM objects for the given unit_id.
    """
    try:
        # Query departments for the specified unit_id
        departments = db.query(models.Department).filter(
            models.Department.unit_id == unit_id
        ).order_by(models.Department.name).all()

        return departments
    except SQLAlchemyError as e:
        logger.error(f"SQLAlchemy error fetching departments for unit {unit_id}: {e}")
        return [] # Return empty list on error

def get_all_unit_names(db: Session) -> List[str]:
    """
    获取所有单位名称列表，用于下拉框等场景
    Returns a list of unit names.
    """
    try:
        # Query only the name field from Unit model
        unit_names = db.query(models.Unit.name).order_by(models.Unit.name).all()
        # Extract names from result tuples
        return [name[0] for name in unit_names if name[0]]
    except SQLAlchemyError as e:
        logger.error(f"SQLAlchemy error fetching all unit names: {e}")
        return [] # Return empty list on error

# --- ORM Functions for Unit Management --- END

# --- ORM Functions for Department Management --- START
def create_department(db: Session, department: schemas.DepartmentCreate) -> models.Department:
    """
    Creates a new department using SQLAlchemy ORM.
    Checks for unit existence and duplicate name within the unit.
    Returns the created Department ORM object (with unit loaded).
    Raises HTTPException on errors.
    """
    # 1. Check if the parent unit exists
    parent_unit = get_unit_by_id(db, department.unit_id) # Reuse existing ORM function
    if not parent_unit:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unit with ID {department.unit_id} does not exist."
        )

    # 2. Check for duplicate department name within the SAME unit
    existing_dept = db.query(models.Department).filter(
        models.Department.name == department.name,
        models.Department.unit_id == department.unit_id
    ).first()
    if existing_dept:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Department with name '{department.name}' already exists in unit '{parent_unit.name}'."
        )

    # 3. Create Department instance
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
        # Query again with joinedload (safer for consistent response)
        created_dept_with_unit = db.query(models.Department).options(
            joinedload(models.Department.unit)
        ).filter(models.Department.id == db_department.id).first()

        if not created_dept_with_unit:
             # Should not happen if refresh worked, but handle defensively
             logger.error(f"Failed to re-fetch created department {db_department.id} with unit.")
             # Return the basic object instead of failing the whole operation
             return db_department

        return created_dept_with_unit

    except IntegrityError as e: # Catch potential FK issues or race conditions on unique constraints
        db.rollback()
        logger.error(f"Integrity error creating department '{department.name}' in unit {department.unit_id}: {e}", exc_info=True)
        # Check if it was the unique constraint (name, unit_id) again due to race condition
        if "uq_departments_unit_id_name" in str(e).lower() or "departments_unit_id_name_key" in str(e).lower():
             raise HTTPException(
                 status_code=status.HTTP_409_CONFLICT,
                 detail=f"Department with name '{department.name}' already exists in unit '{parent_unit.name}' (race condition)."
             )
        # Could also be other constraints, raise a generic 500
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database integrity error during department creation."
        )
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"SQLAlchemy error creating department '{department.name}': {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error during department creation."
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error creating department '{department.name}': {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during department creation."
        )

def get_department_by_id(db: Session, department_id: int) -> Optional[models.Department]:
    """
    Fetches a single department by ID using ORM, eager loading the related unit.
    Returns the Department ORM object or None if not found.
    """
    try:
        # Use joinedload to eagerly load the related unit object
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
) -> Tuple[List[models.Department], int]:
    """
    Fetches a paginated list of departments using ORM,
    with optional filtering by unit_id and search term (on department name).
    Eager loads the related unit for each department.
    Returns a tuple: (list of Department ORM objects, total count).
    """
    try:
        # Base query with eager loading of the unit
        query = db.query(models.Department).options(joinedload(models.Department.unit))

        # Apply filters dynamically
        if unit_id is not None:
            query = query.filter(models.Department.unit_id == unit_id)
        if search:
            query = query.filter(models.Department.name.ilike(f"%{search}%"))

        # Get total count matching the filters before pagination
        total_count = query.count()

        # Apply ordering and pagination
        departments_list = query.order_by(models.Department.name).offset(skip).limit(limit).all()

        return departments_list, total_count

    except SQLAlchemyError as e:
        logger.error(f"SQLAlchemy error fetching departments list: {e}")
        return [], 0 # Return empty list and zero count on error

def count_employees_by_department_id(db: Session, department_id: int) -> int:
    """
    计算指定部门下的员工数量
    Returns the count of employees associated with the given department ID.
    """
    try:
        # 使用SQLAlchemy的func.count计算员工数量
        count = db.query(func.count(models.Employee.id)).filter(
            models.Employee.department_id == department_id
        ).scalar()

        return count or 0  # 确保返回整数，即使结果为None
    except SQLAlchemyError as e:
        logger.error(f"SQLAlchemy error counting employees for department {department_id}: {e}")
        return 0  # 出错时返回0

def update_department(
    db: Session,
    department_id: int,
    department_update: schemas.DepartmentUpdate
) -> Optional[models.Department]:
    """
    Updates an existing department using SQLAlchemy ORM.
    Handles potential IntegrityErrors (e.g., duplicate name within the same unit).
    Returns the updated Department ORM object (with unit loaded) or None if not found.
    Raises HTTPException on errors.
    """
    # Fetch the department, ensuring the unit is loaded for checks and response
    db_department = get_department_by_id(db, department_id) # Reuse existing function
    if not db_department:
        return None # Not found

    update_data = department_update.model_dump(exclude_unset=True)

    # Check for duplicate name within the SAME unit if name is being updated
    if 'name' in update_data and update_data['name'] != db_department.name:
        existing_dept = db.query(models.Department).filter(
            models.Department.name == update_data['name'],
            models.Department.unit_id == db_department.unit_id, # Check within the same unit
            models.Department.id != department_id # Exclude self
        ).first()
        if existing_dept:
            # Accessing unit name might require db_department.unit to be loaded
            unit_name = db_department.unit.name if db_department.unit else f"ID {db_department.unit_id}"
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Department name '{update_data['name']}' already exists in unit '{unit_name}'."
            )

    # Update the object's attributes
    for key, value in update_data.items():
        setattr(db_department, key, value)

    # Manually update timestamp if needed
    # db_department.updated_at = datetime.now(timezone.utc)

    try:
        db.commit()
        db.refresh(db_department)
        # Re-fetch with unit loaded to ensure consistent response format
        return get_department_by_id(db, department_id)

    except IntegrityError as e: # Catch potential race condition on unique constraint
        db.rollback()
        logger.error(f"Integrity error updating department {department_id}: {e}", exc_info=True)
        unit_name = db_department.unit.name if db_department.unit else f"ID {db_department.unit_id}"
        # Check for the specific unique constraint violation
        if "uq_departments_unit_id_name" in str(e).lower() or "departments_unit_id_name_key" in str(e).lower():
             raise HTTPException(
                 status_code=status.HTTP_409_CONFLICT,
                 detail=f"Department name update conflict. Name '{update_data.get('name', db_department.name)}' might already exist in unit '{unit_name}' (race condition)."
             )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database integrity error during department update."
        )
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"SQLAlchemy error updating department {department_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error during department update."
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error updating department {department_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during department update."
        )

def delete_department(db: Session, department_id: int) -> bool:
    """
    Deletes a department by ID using ORM, ensuring it has no associated employees.
    Returns True if deleted successfully.
    Raises HTTPException 404 if not found, 409 if employees exist, 500 on other errors.
    """
    db_department = db.get(models.Department, department_id)
    if not db_department:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Department with ID {department_id} not found.")

    # Check for associated employees before deleting
    employee_count = db.query(func.count(models.Employee.id)).filter(models.Employee.department_id == department_id).scalar()

    if employee_count > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot delete department '{db_department.name}' (ID: {department_id}) because it has {employee_count} associated employee(s). Delete or reassign employees first."
        )

    try:
        db.delete(db_department)
        db.commit()
        return True
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"SQLAlchemy error deleting department {department_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error during department deletion."
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error deleting department {department_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during department deletion."
        )

# --- ORM Functions for Department Management --- END

# --- ORM Functions for Establishment Type Management --- START
def get_establishment_types(db: Session) -> List[models.EstablishmentType]:
    """
    Fetches all establishment types from the database using SQLAlchemy ORM,
    ordered by name.
    """
    try:
        return db.query(models.EstablishmentType).order_by(models.EstablishmentType.name).all()
    except SQLAlchemyError as e:
        logger.error(f"SQLAlchemy error fetching all establishment types: {e}", exc_info=True)
        # In a real scenario, you might want to raise an HTTPException here
        # or ensure the calling endpoint handles the empty list appropriately.
        return [] # Return empty list on error

# --- ORM Functions for Establishment Type Management --- END

# --- ORM Functions for Salary Data --- START
def get_distinct_pay_periods(db: Session) -> List[str]:
    """
    Fetches a list of unique, non-null pay periods (YYYY-MM) from the
    consolidated_data table using a raw SQL query via SQLAlchemy session.
    Returns a list of strings, ordered descending.
    """
    try:
        # Use text() for raw SQL execution through the session
        query = text("""
            SELECT DISTINCT pay_period_identifier
            FROM staging.consolidated_data
            WHERE pay_period_identifier IS NOT NULL
            ORDER BY pay_period_identifier DESC;
        """)

        result = db.execute(query)

        # Fetch all results and extract the first element (pay_period_identifier)
        periods_list = [row[0] for row in result.fetchall()]

        return periods_list

    except SQLAlchemyError as e:
        logger.error(f"SQLAlchemy error fetching distinct pay periods: {e}", exc_info=True)
        return [] # Return empty list on error
    except Exception as e:
        # Catch other potential errors like issues with text() import or execution
        logger.error(f"Unexpected error fetching distinct pay periods: {e}", exc_info=True)
        return []

def get_salary_data(
    db: Session,
    limit: int = 100,
    skip: int = 0, # Renamed from offset to match common ORM/API patterns
    pay_period: Optional[str] = None,
    employee_name: Optional[str] = None,
    department_name: Optional[str] = None,
    unit_name: Optional[str] = None,
    establishment_type_name: Optional[str] = None,
) -> Tuple[List[Dict[str, Any]], int]: # Return List of Dicts for easier Pydantic conversion
    """
    Fetches salary data from the consolidated_data table using raw SQL
    via SQLAlchemy session, with filtering and pagination.
    Returns a tuple: (list of salary records as dictionaries, total count).
    """
    params = {}
    filters = []
    # Updated base_query to point to the staging schema and consolidated_data table
    base_query = "FROM staging.consolidated_data"

    # Build WHERE clause dynamically
    if pay_period:
        filters.append("pay_period_identifier = :pay_period")
        params['pay_period'] = pay_period
    if employee_name:
        filters.append("employee_name ILIKE :employee_name")
        params['employee_name'] = f"%{employee_name}%"
    if department_name:
        filters.append("sal_department_name = :department_name")
        params['department_name'] = department_name
    if unit_name:
        filters.append("sal_organization_name = :unit_name")
        params['unit_name'] = unit_name
    if establishment_type_name:
        filters.append("sal_establishment_type_name = :establishment_type_name")
        params['establishment_type_name'] = establishment_type_name

    where_clause = ""
    if filters:
        where_clause = " WHERE " + " AND ".join(filters)

    # Count query
    # Pass params without limit/skip for count
    count_params = params.copy()
    # Updated count_sql to point to the staging schema
    count_sql = text(f"SELECT COUNT(*) AS total {base_query} {where_clause}")

    # Data query
    # Add limit/skip params only for data query
    data_params = params.copy()
    data_params['limit'] = limit
    data_params['skip'] = skip
    # Updated data_sql to point to the staging schema
    data_sql = text(f"""
        SELECT
            _consolidated_data_id,
            employee_name,
            pay_period_identifier,
            id_card_number,
            ann_annuity_contribution_base_salary,
            ann_annuity_contribution_base,
            ann_annuity_employer_rate,
            ann_annuity_employer_contribution,
            ann_annuity_employee_rate,
            ann_annuity_employee_contribution,
            hf_housingfund_contribution_base_salary,
            hf_housingfund_contribution_base,
            hf_housingfund_employer_rate,
            hf_housingfund_employer_contribution,
            hf_housingfund_employee_rate,
            hf_housingfund_employee_contribution,
            med_contribution_base_salary,
            med_contribution_base,
            med_employer_medical_rate,
            med_employer_medical_contribution,
            med_employee_medical_rate,
            med_employee_medical_contribution,
            med_employer_critical_illness_rate,
            med_employer_critical_illness_contribution,
            med_medical_total_employer_contribution,
            med_medical_total_employee_contribution,
            pen_pension_contribution_base,
            pen_pension_total_amount,
            pen_pension_employer_rate,
            pen_pension_employer_contribution,
            pen_pension_employee_rate,
            pen_pension_employee_contribution,
            pen_unemployment_contribution_base,
            pen_unemployment_total_amount,
            pen_unemployment_employer_rate,
            pen_unemployment_employer_contribution,
            pen_unemployment_employee_rate,
            pen_unemployment_employee_contribution,
            pen_injury_contribution_base,
            pen_injury_total_amount,
            pen_injury_employer_rate,
            pen_injury_employer_contribution,
            pen_ss_total_employer_contribution,
            pen_ss_total_employee_contribution,
            sal_remarks,
            sal_subsidy,
            sal_allowance,
            sal_post_salary,
            sal_salary_step,
            sal_basic_salary,
            sal_tax_adjustment,
            sal_salary_grade,
            sal_salary_level,
            sal_salary_backpay,
            sal_post_category,
            sal_other_allowance,
            sal_other_deductions,
            sal_employee_type_key,
            sal_personnel_rank,
            sal_living_allowance,
            sal_probation_salary,
            sal_one_time_deduction,
            sal_performance_salary,
            sal_personnel_identity,
            sal_total_backpay_amount,
            sal_individual_income_tax,
            sal_housing_fund_adjustment,
            sal_basic_performance_bonus,
            sal_petition_post_allowance,
            sal_post_position_allowance,
            sal_salary_transportation_allowance,
            sal_self_annuity_contribution,
            sal_self_medical_contribution,
            sal_self_pension_contribution,
            sal_monthly_basic_performance,
            sal_only_child_parents_reward,
            sal_rank_or_post_grade_salary,
            sal_salary_step_backpay_total,
            sal_ref_official_salary_step,
            sal_monthly_reward_performance,
            sal_total_deduction_adjustment,
            sal_social_insurance_adjustment,
            sal_quarterly_performance_bonus,
            sal_annual_fixed_salary_amount,
            sal_position_or_technical_salary,
            sal_reform_1993_reserved_subsidy,
            sal_reward_performance_deduction,
            sal_employer_annuity_contribution,
            sal_employer_medical_contribution,
            sal_employer_pension_contribution,
            sal_self_housing_fund_contribution,
            sal_self_unemployment_contribution,
            sal_petition_worker_post_allowance,
            sal_ref_official_post_salary_level,
            sal_basic_performance_bonus_deduction,
            sal_salary_civil_servant_normative_allowance,
            sal_employer_housing_fund_contribution,
            sal_employer_unemployment_contribution,
            sal_employer_critical_illness_contribution,
            sal_bank_account_number,
            sal_bank_branch_name,
            sal_employment_start_date,
            sal_employment_status,
            sal_organization_name,
            sal_department_name,
            sal_basic_performance_salary,
            sal_incentive_performance_salary,
            sal_self_injury_contribution,
            sal_employer_injury_contribution,
            sal_position_or_post_wage,
            sal_rank_or_step_wage,
            sal_is_leader,
            sal_pay_period,
            tax_period_identifier,
            tax_income_period_start,
            tax_income_period_end,
            tax_current_period_income,
            tax_current_period_tax_exempt_income,
            tax_deduction_basic_pension,
            tax_deduction_basic_medical,
            tax_deduction_unemployment,
            tax_deduction_housing_fund,
            tax_deduction_child_edu_cumulative,
            tax_deduction_cont_edu_cumulative,
            tax_deduction_housing_loan_interest_cumulative,
            tax_deduction_housing_rent_cumulative,
            tax_deduction_support_elderly_cumulative,
            tax_deduction_infant_care_cumulative,
            tax_deduction_private_pension_cumulative,
            tax_deduction_annuity,
            tax_deduction_commercial_health_insurance,
            tax_deduction_deferred_pension_insurance,
            tax_deduction_other,
            tax_deduction_donations,
            tax_total_deductions_pre_tax,
            tax_reduction_amount,
            tax_standard_deduction,
            tax_calculated_income_tax,
            tax_remarks,
            _import_batch_id,
            _consolidation_timestamp,
            ann_employee_type_key,
            hf_employee_type_key,
            med_employee_type_key,
            pen_employee_type_key,
            sal_employee_unique_id,
            sal_establishment_type_name,
            tax_employee_type_key,
            sal_position_rank,
            sal_gender,
            sal_ethnicity,
            sal_date_of_birth,
            sal_education_level,
            sal_service_interruption_years,
            sal_continuous_service_years,
            sal_actual_position,
            sal_actual_position_start_date,
            sal_position_level_start_date
        {base_query} {where_clause}
        ORDER BY _consolidated_data_id, pay_period_identifier
        LIMIT :limit OFFSET :skip
    """)

    try:
        # Execute count query
        total_result = db.execute(count_sql, count_params).scalar_one_or_none() # Use scalar_one_or_none for safety
        total_count = total_result if total_result is not None else 0

        # Execute data query
        data_result = db.execute(data_sql, data_params)

        # Convert Row objects to dictionaries
        # ._mapping gives access to the column-keyed dictionary
        # 修复类型问题：将RowMapping转换为Dict[str, Any]
        salary_data_list = [dict(row._mapping) for row in data_result.fetchall()]

        return salary_data_list, total_count

    except SQLAlchemyError as e:
        logger.error(f"SQLAlchemy error fetching salary data: {e}", exc_info=True)
        # Raise an HTTPException so the endpoint can handle it
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error while fetching salary data."
        ) from e
    except Exception as e:
        logger.error(f"Unexpected error fetching salary data: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while fetching salary data."
        ) from e

def update_salary_record(
    db: Session,
    record_id: int,
    record_update: SalaryRecordUpdate
) -> Optional[Dict[str, Any]]:
    """
    更新薪资记录

    Args:
        db: 数据库会话
        record_id: 薪资记录ID (_consolidated_data_id)
        record_update: 更新的薪资数据

    Returns:
        更新后的薪资记录字典，如果记录不存在则返回None
    """
    try:
        # 获取要更新的字段
        update_data = record_update.model_dump(exclude_unset=True)
        if not update_data:
            logger.warning(f"No data provided for salary record update (ID: {record_id})")
            return None

        # 构建SET子句
        set_clauses = []
        params = {"record_id": record_id}

        for key, value in update_data.items():
            set_clauses.append(f"{key} = :{key}")
            params[key] = value

        set_clause = ", ".join(set_clauses)

        # 构建更新SQL
        update_sql = text(f"""
            UPDATE staging.consolidated_data
            SET {set_clause}
            WHERE _consolidated_data_id = :record_id
            RETURNING *
        """)

        # 执行更新
        result = db.execute(update_sql, params)
        db.commit()

        # 获取更新后的记录
        updated_record = result.mappings().first()

        if not updated_record:
            logger.warning(f"Salary record with ID {record_id} not found")
            return None

        # 转换为字典并返回
        return dict(updated_record)

    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"SQLAlchemy error updating salary record {record_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error updating salary record: {str(e)}"
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error updating salary record {record_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected error updating salary record: {str(e)}"
        )

# --- ORM Functions for Salary Data --- END

# --- ORM Functions for Report Link Management --- START

def create_report_link(db: Session, report_link: schemas.ReportLinkCreate) -> models.ReportLink:
    """创建新报表链接"""
    db_report_link = models.ReportLink(**report_link.dict())
    db.add(db_report_link)
    db.commit()
    db.refresh(db_report_link)
    return db_report_link

def get_report_links(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    active_only: bool = False,
    category: Optional[str] = None
) -> Tuple[List[models.ReportLink], int]:
    """获取报表链接列表，支持分页和过滤"""
    query = db.query(models.ReportLink)

    if active_only:
        query = query.filter(models.ReportLink.is_active == True)

    if category:
        query = query.filter(models.ReportLink.category == category)

    # 获取总数
    total_count = query.count()

    # 添加排序和分页
    query = query.order_by(models.ReportLink.display_order, models.ReportLink.name)
    query = query.offset(skip).limit(limit)

    return query.all(), total_count

def get_report_link_by_id(db: Session, report_link_id: int) -> Optional[models.ReportLink]:
    """通过ID获取单个报表链接"""
    return db.query(models.ReportLink).filter(models.ReportLink.id == report_link_id).first()

def update_report_link(
    db: Session,
    report_link_id: int,
    report_link_update: schemas.ReportLinkUpdate
) -> Optional[models.ReportLink]:
    """更新报表链接"""
    db_report_link = get_report_link_by_id(db, report_link_id)
    if not db_report_link:
        return None

    update_data = report_link_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_report_link, key, value)

    db.commit()
    db.refresh(db_report_link)
    return db_report_link

def delete_report_link(db: Session, report_link_id: int) -> bool:
    """删除报表链接"""
    db_report_link = get_report_link_by_id(db, report_link_id)
    if not db_report_link:
        return False

    db.delete(db_report_link)
    db.commit()
    return True

# --- ORM Functions for Report Link Management --- END

# --- ORM Functions for Sheet Name Mapping --- START ---

def get_sheet_mappings(db: Session, skip: int = 0, limit: int = 100) -> List[models.SheetNameMapping]:
    """Fetches a list of sheet name mappings using ORM."""
    try:
        return db.query(models.SheetNameMapping).order_by(models.SheetNameMapping.sheet_name).offset(skip).limit(limit).all()
    except SQLAlchemyError as e:
        logger.error(f"SQLAlchemy error fetching sheet mappings: {e}", exc_info=True)
        return []

def get_sheet_mapping_by_name(db: Session, sheet_name: str) -> Optional[models.SheetNameMapping]:
    """Fetches a single sheet name mapping by its name (PK)."""
    try:
        # Use db.get for primary key lookup
        return db.get(models.SheetNameMapping, sheet_name)
    except SQLAlchemyError as e:
        logger.error(f"SQLAlchemy error fetching sheet mapping by name '{sheet_name}': {e}", exc_info=True)
        return None

def create_sheet_mapping(db: Session, mapping: schemas.SheetNameMappingCreate) -> models.SheetNameMapping:
    """Creates a new sheet name mapping."""
    db_mapping = models.SheetNameMapping(**mapping.model_dump())
    try:
        db.add(db_mapping)
        db.commit()
        db.refresh(db_mapping)
        return db_mapping
    except IntegrityError as e:
        db.rollback()
        logger.error(f"Integrity error creating sheet mapping for '{mapping.sheet_name}': {e}", exc_info=True)
        if "sheet_name_mappings_pkey" in str(e):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Sheet name '{mapping.sheet_name}' already exists.")
        elif "fk_mapping_employee_type_key" in str(e):
             raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid employee_type_key '{mapping.employee_type_key}'.")
        else:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Database integrity error.")
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"SQLAlchemy error creating sheet mapping: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database error creating sheet mapping.")

def update_sheet_mapping(db: Session, sheet_name: str, mapping_update: schemas.SheetNameMappingUpdate) -> Optional[models.SheetNameMapping]:
    """Updates an existing sheet name mapping."""
    db_mapping = get_sheet_mapping_by_name(db, sheet_name)
    if not db_mapping:
        return None

    update_data = mapping_update.model_dump(exclude_unset=True)
    if not update_data:
         return db_mapping # Nothing to update

    for key, value in update_data.items():
        setattr(db_mapping, key, value)

    try:
        db.commit()
        db.refresh(db_mapping)
        return db_mapping
    except IntegrityError as e: # Handle potential FK violation on employee_type_key update
        db.rollback()
        logger.error(f"Integrity error updating sheet mapping '{sheet_name}': {e}", exc_info=True)
        if "fk_mapping_employee_type_key" in str(e):
             raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid employee_type_key provided for update.")
        else:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Database integrity error during update.")
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"SQLAlchemy error updating sheet mapping '{sheet_name}': {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database error updating sheet mapping.")

def delete_sheet_mapping(db: Session, sheet_name: str) -> bool:
    """Deletes a sheet name mapping."""
    db_mapping = get_sheet_mapping_by_name(db, sheet_name)
    if not db_mapping:
        return False
    try:
        db.delete(db_mapping)
        db.commit()
        return True
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"SQLAlchemy error deleting sheet mapping '{sheet_name}': {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database error deleting sheet mapping.")

# --- ORM Functions for Sheet Name Mapping --- END ---

# --- Calculation Rule Engine Models Removed (Moved to models.py) ---

# --- Calculated Salary Record Model Removed (Moved to models.py) ---

# # +++ Raw Salary Data Staging Model (Minimal) +++ START  <- Commenting out this section
# class RawSalaryDataStaging(Base):
#     __tablename__ = "raw_salary_data_staging"
#     __table_args__ = {'schema': 'staging'} # Added schema
#     # Assuming an 'id' column exists, add it if needed for other operations
#     id = Column(Integer, primary_key=True, index=True) # Added primary key
#     pay_period_identifier = Column(String, index=True) # Add index for performance
#     # Add other columns from FINAL_EXPECTED_COLUMNS if needed for ORM interaction
#     # e.g., id_card_number = Column(String, index=True)
#     # ... etc
# # +++ Raw Salary Data Staging Model (Minimal) +++ END

# --- ORM CRUD Functions for Units --- START

# --- ORM CRUD Functions for User Table Configs --- START

def create_table_config(db: Session, user_id: int, table_id: str, config_type: str,
                       name: str, config_data: dict, is_default: bool = False,
                       is_shared: bool = False) -> models.UserTableConfig:
    """创建表格配置"""
    # 如果设置为默认，先将同类型的其他配置设为非默认
    if is_default:
        db.query(models.UserTableConfig).filter(
            models.UserTableConfig.user_id == user_id,
            models.UserTableConfig.table_id == table_id,
            models.UserTableConfig.config_type == config_type,
            models.UserTableConfig.is_default == True
        ).update({"is_default": False})

    # 创建新配置
    db_config = models.UserTableConfig(
        user_id=user_id,
        table_id=table_id,
        config_type=config_type,
        name=name,
        config_data=config_data,
        is_default=is_default,
        is_shared=is_shared
    )

    try:
        db.add(db_config)
        db.commit()
        db.refresh(db_config)

        # 手动将日期时间字段转换为字符串
        if hasattr(db_config, 'created_at') and db_config.created_at:
            db_config.created_at = db_config.created_at.isoformat()
        if hasattr(db_config, 'updated_at') and db_config.updated_at:
            db_config.updated_at = db_config.updated_at.isoformat()

        return db_config
    except IntegrityError as e:
        db.rollback()
        logger.error(f"Integrity error creating table config: {e}", exc_info=True)
        if "uq_user_table_config" in str(e):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"配置名称 '{name}' 已存在于同一表格和类型下"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="数据库完整性错误"
            )
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"SQLAlchemy error creating table config: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="创建配置时发生数据库错误"
        )

def get_table_config(db: Session, config_id: int) -> Optional[models.UserTableConfig]:
    """获取单个表格配置"""
    try:
        return db.query(models.UserTableConfig).filter(
            models.UserTableConfig.id == config_id
        ).first()
    except SQLAlchemyError as e:
        logger.error(f"SQLAlchemy error fetching table config {config_id}: {e}", exc_info=True)
        return None

def get_table_configs(db: Session, user_id: int, table_id: str, config_type: str) -> List[models.UserTableConfig]:
    """获取用户的表格配置列表"""
    try:
        # 获取用户自己的配置和其他用户共享的配置
        configs = db.query(models.UserTableConfig).filter(
            ((models.UserTableConfig.user_id == user_id) |
             (models.UserTableConfig.is_shared == True)),
            models.UserTableConfig.table_id == table_id,
            models.UserTableConfig.config_type == config_type
        ).order_by(
            models.UserTableConfig.is_default.desc(),
            models.UserTableConfig.updated_at.desc()
        ).all()

        # 手动将日期时间字段转换为字符串
        for config in configs:
            if hasattr(config, 'created_at') and config.created_at:
                config.created_at = config.created_at.isoformat()
            if hasattr(config, 'updated_at') and config.updated_at:
                config.updated_at = config.updated_at.isoformat()

        return configs
    except SQLAlchemyError as e:
        logger.error(f"SQLAlchemy error fetching table configs: {e}", exc_info=True)
        return []

def update_table_config(db: Session, config_id: int, user_id: int, config_data: dict = None,
                       name: str = None, is_default: bool = None, is_shared: bool = None) -> Optional[models.UserTableConfig]:
    """更新表格配置"""
    # 获取配置
    db_config = db.query(models.UserTableConfig).filter(
        models.UserTableConfig.id == config_id,
        models.UserTableConfig.user_id == user_id  # 确保只能更新自己的配置
    ).first()

    if not db_config:
        return None

    # 更新字段
    if config_data is not None:
        db_config.config_data = config_data
    if name is not None:
        db_config.name = name
    if is_shared is not None:
        db_config.is_shared = is_shared

    # 处理默认配置
    if is_default is not None and is_default != db_config.is_default:
        if is_default:
            # 将同类型的其他配置设为非默认
            db.query(models.UserTableConfig).filter(
                models.UserTableConfig.user_id == user_id,
                models.UserTableConfig.table_id == db_config.table_id,
                models.UserTableConfig.config_type == db_config.config_type,
                models.UserTableConfig.id != config_id,
                models.UserTableConfig.is_default == True
            ).update({"is_default": False})
        db_config.is_default = is_default

    try:
        db.commit()
        db.refresh(db_config)

        # 手动将日期时间字段转换为字符串
        if hasattr(db_config, 'created_at') and db_config.created_at:
            db_config.created_at = db_config.created_at.isoformat()
        if hasattr(db_config, 'updated_at') and db_config.updated_at:
            db_config.updated_at = db_config.updated_at.isoformat()

        return db_config
    except IntegrityError as e:
        db.rollback()
        logger.error(f"Integrity error updating table config {config_id}: {e}", exc_info=True)
        if "uq_user_table_config" in str(e):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"配置名称已存在于同一表格和类型下"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="数据库完整性错误"
            )
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"SQLAlchemy error updating table config {config_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="更新配置时发生数据库错误"
        )

def delete_table_config(db: Session, config_id: int, user_id: int) -> bool:
    """删除表格配置"""
    try:
        result = db.query(models.UserTableConfig).filter(
            models.UserTableConfig.id == config_id,
            models.UserTableConfig.user_id == user_id  # 确保只能删除自己的配置
        ).delete()
        db.commit()
        return result > 0
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"SQLAlchemy error deleting table config {config_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="删除配置时发生数据库错误"
        )

# --- ORM CRUD Functions for User Table Configs --- END
# ... existing code ...
# --- ORM CRUD Functions for Email Server Configs --- START ---

def create_email_server_config(db: Session, config_in: schemas.EmailServerConfigCreate) -> models.EmailServerConfig:
    """Creates a new email server configuration, symmetrically encrypting the password."""
    from .auth import encrypt_data # Use symmetric encryption

    encrypted_pass = encrypt_data(config_in.password)
    if not encrypted_pass:
        # Handle encryption failure, perhaps by raising an HTTPException
        logger.error(f"Failed to encrypt password for email server config: {config_in.server_name}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Password encryption failed.")

    # 如果要设置为默认配置，先将所有其他配置的is_default设为False
    if config_in.is_default:
        try:
            db.query(models.EmailServerConfig).filter(models.EmailServerConfig.is_default == True).update({"is_default": False})
            db.flush()  # 确保更新已应用但不提交事务
        except Exception as e:
            logger.error(f"Error resetting default email server configs: {e}")
            # 继续执行，因为唯一索引会确保只有一个默认配置

    db_config = models.EmailServerConfig(
        server_name=config_in.server_name,
        host=config_in.host,
        port=config_in.port,
        use_tls=config_in.use_tls,
        use_ssl=config_in.use_ssl,
        username=config_in.username,
        encrypted_password=encrypted_pass, # Store symmetrically encrypted password
        encryption_method="fernet", # Explicitly Fernet
        sender_email=config_in.sender_email,
        is_default=config_in.is_default
    )
    try:
        db.add(db_config)
        db.commit()
        db.refresh(db_config)
        return db_config
    except IntegrityError as e:
        db.rollback()
        logger.error(f"Integrity error creating email server config '{config_in.server_name}': {e}", exc_info=True)
        if "uq_email_server_configs_server_name" in str(e).lower() or "email_server_configs_server_name_key" in str(e).lower():
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Email server configuration with name '{config_in.server_name}' already exists.")
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Database integrity error during email server config creation.")
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating email server config: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not create email server configuration.")

def get_email_server_config(db: Session, config_id: int) -> Optional[models.EmailServerConfig]:
    """Fetches an email server configuration by ID."""
    return db.query(models.EmailServerConfig).filter(models.EmailServerConfig.id == config_id).first()

def get_email_server_config_by_name(db: Session, server_name: str) -> Optional[models.EmailServerConfig]:
    """Fetches an email server configuration by server_name."""
    return db.query(models.EmailServerConfig).filter(models.EmailServerConfig.server_name == server_name).first()

def get_email_server_configs(db: Session, skip: int = 0, limit: int = 100) -> Tuple[List[models.EmailServerConfig], int]:
    """Fetches a paginated list of email server configurations."""
    query = db.query(models.EmailServerConfig)
    total_count = query.count()
    configs = query.order_by(models.EmailServerConfig.server_name).offset(skip).limit(limit).all()
    return configs, total_count

def update_email_server_config(db: Session, config_id: int, config_in: schemas.EmailServerConfigUpdate) -> Optional[models.EmailServerConfig]:
    """Updates an email server configuration. Symmetrically encrypts password if provided."""
    from .auth import encrypt_data # Use symmetric encryption

    db_config = get_email_server_config(db, config_id)
    if not db_config:
        return None

    update_data = config_in.model_dump(exclude_unset=True)

    if "password" in update_data and update_data["password"]:
        encrypted_pass = encrypt_data(update_data["password"])
        if not encrypted_pass:
            logger.error(f"Failed to encrypt password during update for email server config ID: {config_id}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Password encryption failed during update.")
        db_config.encrypted_password = encrypted_pass
        db_config.encryption_method = "fernet" # Ensure method is updated
        del update_data["password"] # Remove plain password from update_data

    if "server_name" in update_data and update_data["server_name"] != db_config.server_name:
        existing_config = get_email_server_config_by_name(db, update_data["server_name"])
        if existing_config and existing_config.id != config_id:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Email server configuration with name '{update_data['server_name']}' already exists.")

    # 如果要设置为默认配置，先将所有其他配置的is_default设为False
    if update_data.get('is_default'):
        try:
            db.query(models.EmailServerConfig).filter(
                models.EmailServerConfig.id != config_id,
                models.EmailServerConfig.is_default == True
            ).update({"is_default": False})
            db.flush()  # 确保更新已应用但不提交事务
        except Exception as e:
            logger.error(f"Error resetting default email server configs during update: {e}")
            # 继续执行，因为唯一索引会确保只有一个默认配置

    for key, value in update_data.items():
        setattr(db_config, key, value)

    try:
        db.commit()
        db.refresh(db_config)
        return db_config
    except IntegrityError as e:
        db.rollback()
        logger.error(f"Integrity error updating email server config ID {config_id}: {e}", exc_info=True)
        if "uq_email_server_configs_server_name" in str(e).lower() or "email_server_configs_server_name_key" in str(e).lower():
             raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Email server configuration name conflict during update.")
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Database integrity error during email server config update.")
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating email server config ID {config_id}: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not update email server configuration.")

def delete_email_server_config(db: Session, config_id: int) -> bool:
    """Deletes an email server configuration."""
    db_config = get_email_server_config(db, config_id)
    if not db_config:
        return False
    try:
        db.delete(db_config)
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting email server config ID {config_id}: {e}", exc_info=True)
        # Consider if there are dependencies before allowing deletion or raise specific error
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not delete email server configuration.")

# --- ORM CRUD Functions for Email Server Configs --- END ---
# --- ORM CRUD Functions for Email Logs --- START ---

def create_email_log_entry(
    db: Session,
    sender_email: str,
    recipient_emails: List[str],
    subject: str,
    status: str, # "sent", "failed", "pending", "skipped_no_email", "skipped_no_salary_data"
    task_uuid: uuid.UUID, # New parameter
    body: Optional[str] = None,
    error_message: Optional[str] = None,
    sender_employee_id: Optional[int] = None
) -> models.EmailLog:
    """Creates an email log entry in the database."""
    db_log = models.EmailLog(
        sender_email=sender_email,
        recipient_emails=recipient_emails, # Pydantic model will handle conversion to JSON for DB if needed
        subject=subject,
        body=body,
        status=status,
        error_message=error_message,
        sender_employee_id=sender_employee_id,
        task_uuid=task_uuid # Save the new field
    )
    try:
        db.add(db_log)
        db.commit()
        db.refresh(db_log)
        return db_log
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Error creating email log entry: {e}")
        # Depending on how critical this is, you might re-raise or handle differently
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not save email log.")

# --- ORM CRUD Functions for Email Logs --- END ---
# --- ORM Functions for Payslip Data --- START ---

def get_employee_payslip_data(db: Session, employee_id_card: str, pay_period: str) -> Optional[Dict[str, Any]]:
    """
    Fetches salary data for a specific employee and pay period from the
    staging.consolidated_data table.
    Returns a dictionary of the salary record or None if not found.
    """
    # Assuming 'id_card_number' is the link to employees and is present in consolidated_data
    # And 'pay_period_identifier' matches the pay_period format 'YYYY-MM'

    # This function reuses parts of the existing get_salary_data logic but is more targeted.
    # We select all columns for simplicity, but you could specify them.

    query_sql = text(f"""
        SELECT *
        FROM staging.consolidated_data
        WHERE id_card_number = :id_card_number AND pay_period_identifier = :pay_period
        LIMIT 1;
    """)

    params = {"id_card_number": employee_id_card, "pay_period": pay_period}

    try:
        result = db.execute(query_sql, params)
        row = result.mappings().first() # Use .first() as we expect at most one record

        if row:
            return dict(row)
        return None

    except SQLAlchemyError as e:
        logger.error(f"SQLAlchemy error fetching payslip data for employee ID card {employee_id_card}, period {pay_period}: {e}", exc_info=True)
        # Depending on how critical this is, you might raise an HTTPException or return None
        # For now, returning None to indicate data not found or error.
        return None
    except Exception as e:
        logger.error(f"Unexpected error fetching payslip data for employee ID card {employee_id_card}, period {pay_period}: {e}", exc_info=True)
        return None

# --- ORM Functions for Payslip Data --- END ---

# --- Email Sending Task DB Operations --- START ---

def create_email_sending_task(
    db: Session,
    task_uuid: uuid.UUID,
    pay_period: str,
    email_config_id: int,
    filters_applied: Optional[Dict[str, Any]],
    subject_template: Optional[str],
    requested_by_user_id: Optional[int],
    total_employees_matched: Optional[int] = 0
) -> models.EmailSendingTask:
    """Creates a new email sending task record."""
    db_task = models.EmailSendingTask(
        task_uuid=task_uuid,
        pay_period=pay_period,
        email_config_id=email_config_id,
        filters_applied=filters_applied,
        subject_template=subject_template,
        requested_by_user_id=requested_by_user_id,
        total_employees_matched=total_employees_matched,
        status='queued' # Initial status
    )
    try:
        db.add(db_task)
        db.commit()
        db.refresh(db_task)
        return db_task
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Error creating email sending task: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not create email sending task.")

def get_email_sending_task_by_uuid(db: Session, task_uuid: uuid.UUID) -> Optional[models.EmailSendingTask]:
    """Fetches an email sending task by its UUID."""
    try:
        return db.query(models.EmailSendingTask).filter(models.EmailSendingTask.task_uuid == task_uuid).first()
    except SQLAlchemyError as e:
        logger.error(f"Error fetching email sending task {task_uuid}: {e}")
        return None

def update_email_sending_task_status(
    db: Session,
    task_uuid: uuid.UUID,
    status: str,
    completed_at: Optional[datetime] = None,
    error_message: Optional[str] = None
) -> Optional[models.EmailSendingTask]:
    """Updates the status and optionally completed_at and error_message of an email sending task."""
    try:
        db_task = db.query(models.EmailSendingTask).filter(models.EmailSendingTask.task_uuid == task_uuid).first()
        if db_task:
            db_task.status = status
            if completed_at:
                db_task.completed_at = completed_at
            if error_message is not None: # Allow clearing error message with empty string
                db_task.last_error_message = error_message
            db.commit()
            db.refresh(db_task)
            return db_task
        return None
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Error updating status for email sending task {task_uuid}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not update task status.")

def update_email_sending_task_stats(
    db: Session,
    task_uuid: uuid.UUID,
    sent_increment: int = 0,
    failed_increment: int = 0,
    skipped_increment: int = 0,
    matched_employees: Optional[int] = None
) -> Optional[models.EmailSendingTask]:
    """Atomically updates the statistics for an email sending task.
       Can also set the total_employees_matched if provided.
    """
    try:
        db_task = db.query(models.EmailSendingTask).filter(models.EmailSendingTask.task_uuid == task_uuid).with_for_update().first()
        if db_task:
            if matched_employees is not None:
                db_task.total_employees_matched = matched_employees
            db_task.total_sent_successfully = (db_task.total_sent_successfully or 0) + sent_increment
            db_task.total_failed = (db_task.total_failed or 0) + failed_increment
            db_task.total_skipped = (db_task.total_skipped or 0) + skipped_increment
            db.commit()
            db.refresh(db_task)
            return db_task
        return None
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Error updating stats for email sending task {task_uuid}: {e}")
        # Not raising HTTPException here as this might be called in a background task loop
        return None # Allow caller to handle this

def get_email_sending_tasks_history(
    db: Session,
    skip: int = 0,
    limit: int = 10,
    requested_by_user_id: Optional[int] = None
) -> Tuple[List[models.EmailSendingTask], int]:
    """Fetches a paginated history of email sending tasks, optionally filtered by user."""
    try:
        query = db.query(models.EmailSendingTask)
        # 暂时移除用户ID筛选，以便测试功能
        # if requested_by_user_id:
        #     query = query.filter(models.EmailSendingTask.requested_by_user_id == requested_by_user_id)

        total_count = query.count() # Get total count before pagination
        tasks = query.order_by(models.EmailSendingTask.started_at.desc()).offset(skip).limit(limit).all()
        return tasks, total_count
    except SQLAlchemyError as e:
        logger.error(f"Error fetching email sending tasks history: {e}")
        return [], 0

def get_detailed_email_logs_for_task(
    db: Session,
    task_uuid: uuid.UUID,
    skip: int = 0,
    limit: int = 100
) -> Tuple[List[models.EmailLog], int]:
    """Fetches paginated detailed email logs for a specific task UUID."""
    try:
        # 打印task_uuid的值和类型，用于调试
        logger.info(f"Fetching email logs for task_uuid: {task_uuid} (type: {type(task_uuid)})")

        # 查询数据库中的所有EmailLog记录，用于调试
        all_logs = db.query(models.EmailLog).all()
        logger.info(f"Total email logs in database: {len(all_logs)}")
        for log in all_logs[:5]:  # 只打印前5条记录，避免日志过长
            logger.info(f"Log ID: {log.id}, task_uuid: {log.task_uuid} (type: {type(log.task_uuid) if log.task_uuid else None})")

        # 使用字符串比较，避免UUID类型不匹配的问题
        query = db.query(models.EmailLog).filter(models.EmailLog.task_uuid == task_uuid)
        total_count = query.count()
        logger.info(f"Found {total_count} logs matching task_uuid: {task_uuid}")

        logs = query.order_by(models.EmailLog.sent_at.desc()).offset(skip).limit(limit).all()
        return logs, total_count
    except SQLAlchemyError as e:
        logger.error(f"Error fetching detailed email logs for task {task_uuid}: {e}")
        return [], 0

def create_test_email_log_for_task(
    db: Session,
    task_uuid: uuid.UUID,
    employee_id: int = 1,
    employee_name: str = "测试员工",
    employee_email: str = "test@example.com",
    status: str = "sent"
) -> models.EmailLog:
    """创建测试邮件日志，用于调试前端显示问题"""
    try:
        # 获取任务详情
        task = get_email_sending_task_by_uuid(db, task_uuid)
        if not task:
            logger.error(f"Task {task_uuid} not found when creating test email log")
            return None

        # 创建测试邮件日志
        email_log = models.EmailLog(
            task_uuid=task_uuid,
            sender_email="system@example.com",
            recipient_emails=[employee_email],
            subject=f"{task.pay_period}工资单 - {employee_name}", # 修改主题格式，使其与实际邮件格式一致
            body=f"<p>这是一封测试邮件，发送给 {employee_name}，工资周期为 {task.pay_period}。</p>",
            status=status,
            sent_at=datetime.utcnow(),
            error_message=None if status == "sent" else "测试错误信息",
            sender_employee_id=task.requested_by_user_id
        )

        db.add(email_log)
        db.commit()
        db.refresh(email_log)
        logger.info(f"Created test email log: {email_log.id} for task {task_uuid}")
        return email_log
    except Exception as e:
        logger.error(f"Error creating test email log for task {task_uuid}: {e}")
        db.rollback()
        return None

# --- Email Sending Task DB Operations --- END ---