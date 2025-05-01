import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Optional, List, Dict, Any, Tuple
import logging
from fastapi import HTTPException, status
from datetime import datetime, timezone

# Import SQLAlchemy components
from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from sqlalchemy import func, or_, and_, text, Column, String, Integer

# Assuming schemas.py defines the Pydantic models like UserCreate, UserUpdate, RoleCreate etc.
from . import schemas
from . import models
from .database import Base

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

# --- User DB Operations (Partially Refactored) ---

def get_user_by_username_orm(db: Session, username: str) -> Optional[models.User]:
    """(ORM Version) Fetches a user by username using SQLAlchemy ORM, joining the role.
       Returns the User ORM object or None.
    """
    try:
        # Use joinedload to eagerly load the related role object in the same query
        return db.query(models.User).options(joinedload(models.User.role)).filter(models.User.username == username).first()
    except SQLAlchemyError as e:
        logger.error(f"SQLAlchemy error fetching user by username {username}: {e}")
        return None

def get_users_orm(db: Session, skip: int = 0, limit: int = 100) -> Tuple[List[models.User], int]:
    """(ORM Version) Fetches a paginated list of users with their role information using SQLAlchemy ORM.
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

def get_user_by_id_orm(db: Session, user_id: int) -> Optional[models.User]:
    """(ORM Version) Fetches a single user by ID using SQLAlchemy ORM, joining the role.
       Returns the User ORM object or None if not found.
    """
    try:
        # Use joinedload to eagerly load the related role object
        return db.query(models.User).options(joinedload(models.User.role)).filter(models.User.id == user_id).first()
    except SQLAlchemyError as e:
        logger.error(f"SQLAlchemy error fetching user by ID {user_id}: {e}")
        return None

def create_user_orm(db: Session, user: schemas.UserCreate, hashed_password: str) -> models.User:
    """(ORM Version) Creates a new user in the database using SQLAlchemy ORM.
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

def update_user_orm(db: Session, user_id: int, user_update: schemas.UserUpdate, hashed_password: Optional[str] = None) -> models.User:
    """(ORM Version) Updates a user's information in the database using SQLAlchemy ORM.
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

def delete_user_orm(db: Session, user_id: int) -> bool:
    """(ORM Version) Deletes a user from the database using SQLAlchemy ORM.
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

def get_user_hashed_password_orm(db: Session, user_id: int) -> Optional[str]:
    """(ORM Version) Fetches only the hashed password for a given user ID."""
    try:
        # Select only the hashed_password column for efficiency
        hashed_password = db.query(models.User.hashed_password).filter(models.User.id == user_id).scalar()
        return hashed_password
    except SQLAlchemyError as e:
        logger.error(f"SQLAlchemy error fetching hashed password for user {user_id}: {e}")
        # Depending on policy, you might want to raise 500 or return None
        # Returning None is consistent with the old function if the query fails
        return None

def update_user_password_orm(db: Session, user_id: int, new_hashed_password: str) -> bool:
    """(ORM Version) Updates a user's password in the database using SQLAlchemy ORM.
    Returns True if successful, False if user not found.
    Raises HTTPException on database errors.
    """
    try:
        # Find the user
        db_user = db.query(models.User).filter(models.User.id == user_id).first()
        
        if not db_user:
            # User not found
            return False
            
        # Update the password
        db_user.hashed_password = new_hashed_password
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

def get_employee_by_id_orm(db: Session, employee_id: int) -> Optional[models.Employee]:
    """Fetches a single employee by ID using ORM, eager loading related data."""
    return db.query(models.Employee).options(
        joinedload(models.Employee.department).joinedload(models.Department.unit), # Load department -> unit
        joinedload(models.Employee.establishment_type) # Load establishment type
    ).filter(models.Employee.id == employee_id).first()

def create_employee_orm(db: Session, employee: schemas.EmployeeCreate) -> models.Employee:
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

    # 2. Create Employee instance
    db_employee = models.Employee(
        name=employee.name,
        id_card_number=employee.id_card_number,
        department_id=employee.department_id,
        employee_unique_id=employee.employee_unique_id,
        bank_account_number=employee.bank_account_number,
        bank_name=employee.bank_name,
        establishment_type_id=employee.establishment_type_id
    )
    
    # 3. Add, commit, refresh
    try:
        db.add(db_employee)
        db.commit()
        db.refresh(db_employee) # Get ID, created_at etc.
        
        # Eager load relationships for the response AFTER the commit
        # This is one way; alternatively, query again with options if needed
        # However, for a consistent response, querying again might be better:
        # return get_employee_by_id_orm(db, db_employee.id) # Query again to get loaded object
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
        
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database error creating employee.")
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error creating employee: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error creating employee.")

def get_employees_orm(
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

def update_employee_orm(
    db: Session, 
    employee_id: int, 
    employee_update: schemas.EmployeeUpdate
) -> Optional[models.Employee]:
    """Updates an existing employee using ORM, checking uniqueness constraints on update."""
    db_employee = get_employee_by_id_orm(db, employee_id) # Reuse get function to fetch with loaded relations
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

    # Update fields
    for key, value in update_data.items():
        setattr(db_employee, key, value)

    try:
        db.commit()
        db.refresh(db_employee)
        # Query again to ensure relationships are loaded correctly after update
        # Refresh might not reload relationships perfectly in all cases
        return get_employee_by_id_orm(db, employee_id) 
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
             raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Unique constraint violation during update (e.g., ID card or unique ID)." )
        
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database error updating employee.")
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error updating employee {employee_id}: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error updating employee.")

def delete_employee_orm(db: Session, employee_id: int) -> bool:
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

def create_unit_orm(db: Session, unit: schemas.UnitCreate) -> models.Unit:
    """
    Creates a new unit using SQLAlchemy ORM.
    Handles potential IntegrityErrors (e.g., duplicate name).
    """
    try:
        # Create the ORM model instance from the Pydantic schema
        db_unit = models.Unit(**unit.model_dump()) # Use model_dump() for Pydantic v2
        
        db.add(db_unit)
        db.commit()
        db.refresh(db_unit) # Refresh to get DB-generated values like ID, created_at
        return db_unit
    except IntegrityError:
        db.rollback() # Rollback the transaction on error
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Unit with name '{unit.name}' already exists."
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating unit '{unit.name}' with ORM: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal server error occurred while creating the unit."
        )

def get_unit_by_id_orm(db: Session, unit_id: int) -> Optional[models.Unit]:
    """Fetches a unit by its ID using SQLAlchemy ORM."""
    try:
        # Use db.get for efficient primary key lookup
        return db.get(models.Unit, unit_id)
    except SQLAlchemyError as e:
        logger.error(f"SQLAlchemy error fetching unit by ID {unit_id}: {e}")
        # Depending on the desired behavior, you might want to raise an exception
        # or return None if the session is in a bad state.
        return None

def get_units_orm(
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

def update_unit_orm(
    db: Session, 
    unit_id: int, 
    unit_update: schemas.UnitUpdate
) -> Optional[models.Unit]:
    """
    Updates an existing unit using SQLAlchemy ORM.
    Handles potential IntegrityErrors (e.g., duplicate name).
    Returns the updated Unit ORM object or None if not found.
    """
    db_unit = db.get(models.Unit, unit_id) # Use db.get for PK lookup
    if not db_unit:
        return None # Not found

    update_data = unit_update.model_dump(exclude_unset=True)

    # Check for duplicate name if name is being updated
    if 'name' in update_data and update_data['name'] != db_unit.name:
        existing_unit = db.query(models.Unit).filter(
            models.Unit.name == update_data['name'],
            models.Unit.id != unit_id # Exclude the current unit
        ).first()
        if existing_unit:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Unit with name '{update_data['name']}' already exists."
            )
            
    # Update the object's attributes
    for key, value in update_data.items():
        setattr(db_unit, key, value)
        
    # Manually update timestamp if needed
    # db_unit.updated_at = datetime.now(timezone.utc)

    try:
        db.commit()
        db.refresh(db_unit)
        return db_unit
    except IntegrityError: # Catch potential race condition on unique name
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Unit name update conflict. Name '{update_data.get('name', db_unit.name)}' might already exist (race condition)."
        )
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"SQLAlchemy error updating unit {unit_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error during unit update."
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error updating unit {unit_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during unit update."
        )

def delete_unit_orm(db: Session, unit_id: int) -> bool:
    """
    Deletes a unit by ID using ORM, ensuring it has no associated departments.
    Returns True if deleted successfully.
    Raises HTTPException 404 if not found, 409 if departments exist, 500 on other errors.
    """
    db_unit = db.get(models.Unit, unit_id)
    if not db_unit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Unit with ID {unit_id} not found.")
        # Return False # Or raise 404

    # Check for associated departments before deleting
    department_count = db.query(func.count(models.Department.id)).filter(models.Department.unit_id == unit_id).scalar()
    
    if department_count > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot delete unit '{db_unit.name}' (ID: {unit_id}) because it contains {department_count} department(s). Delete or reassign departments first."
        )

    try:
        db.delete(db_unit)
        db.commit()
        return True
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"SQLAlchemy error deleting unit {unit_id}: {e}")
        # This might indicate other FK constraints or DB issues
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error during unit deletion."
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error deleting unit {unit_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during unit deletion."
        )

# --- ORM Functions for Unit Management --- END

# --- ORM Functions for Department Management --- START
def create_department_orm(db: Session, department: schemas.DepartmentCreate) -> models.Department:
    """
    Creates a new department using SQLAlchemy ORM.
    Checks for unit existence and duplicate name within the unit.
    Returns the created Department ORM object (with unit loaded).
    Raises HTTPException on errors.
    """
    # 1. Check if the parent unit exists
    parent_unit = get_unit_by_id_orm(db, department.unit_id) # Reuse existing ORM function
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

def get_department_by_id_orm(db: Session, department_id: int) -> Optional[models.Department]:
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

def get_departments_orm(
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

def update_department_orm(
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
    db_department = get_department_by_id_orm(db, department_id) # Reuse existing function
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
        return get_department_by_id_orm(db, department_id)
        
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

def delete_department_orm(db: Session, department_id: int) -> bool:
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
def get_establishment_types_orm(db: Session) -> List[models.EstablishmentType]:
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
def get_distinct_pay_periods_orm(db: Session) -> List[str]:
    """
    Fetches a list of unique, non-null pay periods (YYYY-MM) from the 
    raw_salary_data_staging table using a raw SQL query via SQLAlchemy session.
    Returns a list of strings, ordered descending.
    """
    try:
        # Use text() for raw SQL execution through the session
        query = text("""
            SELECT DISTINCT pay_period_identifier 
            FROM public.raw_salary_data_staging 
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

def get_salary_data_orm(
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
    Fetches salary data from the view_level1_calculations using raw SQL 
    via SQLAlchemy session, with filtering and pagination.
    Returns a tuple: (list of salary records as dictionaries, total count).
    """
    params = {}
    filters = []
    base_query = "FROM public.view_level1_calculations"
    
    # Build WHERE clause dynamically
    if pay_period:
        filters.append("pay_period_identifier = :pay_period")
        params['pay_period'] = pay_period
    if employee_name:
        filters.append("employee_name ILIKE :employee_name")
        params['employee_name'] = f"%{employee_name}%"
    if department_name:
        filters.append("department_name = :department_name")
        params['department_name'] = department_name
    if unit_name:
        filters.append("unit_name = :unit_name")
        params['unit_name'] = unit_name
    if establishment_type_name:
        filters.append("establishment_type_name = :establishment_type_name")
        params['establishment_type_name'] = establishment_type_name

    where_clause = ""
    if filters:
        where_clause = " WHERE " + " AND ".join(filters)

    # Count query
    # Pass params without limit/skip for count
    count_params = params.copy()
    count_sql = text(f"SELECT COUNT(*) AS total {base_query} {where_clause}")

    # Data query
    # Add limit/skip params only for data query
    data_params = params.copy()
    data_params['limit'] = limit
    data_params['skip'] = skip
    data_sql = text(f"""
        SELECT * {base_query} {where_clause} 
        ORDER BY employee_id, pay_period_identifier 
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
        salary_data_list = [row._mapping for row in data_result.fetchall()]
        
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

# --- Keep old psycopg2 version for now if other parts still depend on it --- 
def get_user_by_username(conn, username: str) -> Optional[Dict[str, Any]]:
    """(Old psycopg2 Version) Fetches a user by username, including hashed password, email, and role info."""
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Join with roles to get role name directly
            query = """
                SELECT u.id, u.username, u.email, u.hashed_password, u.role_id, u.is_active, u.created_at, u.updated_at, r.name as role_name
                FROM users u
                JOIN roles r ON u.role_id = r.id
                WHERE u.username = %s
            """
            cur.execute(query, (username,))
            user = cur.fetchone()
            return user
    except psycopg2.Error as e:
        logger.error(f"Database error fetching user by username {username}: {e}")
        conn.rollback()
        return None

def get_user_by_id(conn, user_id: int) -> Optional[Dict[str, Any]]:
    """Fetches a user by ID, including email and role info."""
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            query = """
                SELECT 
                    u.id, u.username, u.email, u.role_id, u.is_active, u.created_at, u.updated_at, 
                    r.id as role_id_join, r.name as role_name, r.description as role_description
                FROM users u
                JOIN roles r ON u.role_id = r.id
                WHERE u.id = %s
            """
            cur.execute(query, (user_id,))
            user_data = cur.fetchone()
            if user_data:
                 # Structure the role data as nested dictionary for UserResponse schema
                 user_data['role'] = {
                     'id': user_data.pop('role_id_join'), # Use the joined role_id
                     'name': user_data.pop('role_name'),
                     'description': user_data.pop('role_description')
                 }
                 # Ensure the main role_id field expected by UserInDBBase is still there
                 # (though redundant now with nested role, schema expects it)
                 # user_data['role_id'] = user_data['role']['id'] # This is already present from the SELECT u.role_id
            return user_data
    except psycopg2.Error as e:
        logger.error(f"Database error fetching user by ID {user_id}: {e}")
        conn.rollback()
        return None

def create_user(conn, user: schemas.UserCreate, hashed_password: str) -> Optional[Dict[str, Any]]:
    """Creates a new user in the database, including the email."""
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            query = """
                INSERT INTO users (username, email, hashed_password, role_id, is_active)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id;
            """
            # Pass email from the schema
            cur.execute(query, (user.username, user.email, hashed_password, user.role_id, user.is_active))
            new_user_id_row = cur.fetchone()
            conn.commit() # Commit after successful insert

            if new_user_id_row:
                # Fetch the newly created user with role details for response
                return get_user_by_id(conn, new_user_id_row['id'])
            else:
                conn.rollback() # Should not happen if RETURNING id works, but safe
                logger.error(f"Failed to retrieve ID for newly created user {user.username}")
                return None
    except psycopg2.IntegrityError as e:
        logger.error(f"Database integrity error creating user {user.username} or email {user.email}: {e}")
        conn.rollback()
        detail = "An integrity constraint was violated." 
        if "users_username_key" in str(e):
            detail = f"Username '{user.username}' already exists."
        elif "uq_users_email" in str(e): # Check for the email constraint name
            detail = f"Email '{user.email}' is already registered."
        # Raise HTTPException here instead of returning None for clearer API response
        raise HTTPException(status_code=409, detail=detail) from e
    except psycopg2.Error as e:
        logger.error(f"Database error creating user {user.username}: {e}")
        conn.rollback()
        # Raise HTTPException instead of returning None
        raise HTTPException(status_code=500, detail="Database error during user creation.") from e

def get_users(conn, skip: int = 0, limit: int = 100) -> Tuple[List[Dict[str, Any]], int]:
    """Fetches a paginated list of users with their email and role information."""
    users_list = []
    total_count = 0
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Get total count
            cur.execute("SELECT COUNT(*) FROM users")
            total_count = cur.fetchone()['count']

            # Get paginated users with role info
            query = """
                SELECT 
                    u.id, u.username, u.email, u.role_id, u.is_active, u.created_at, u.updated_at, 
                    r.id as role_id_join, r.name as role_name, r.description as role_description
                FROM users u
                JOIN roles r ON u.role_id = r.id
                ORDER BY u.id
                LIMIT %s OFFSET %s
            """
            cur.execute(query, (limit, skip))
            results = cur.fetchall()
            for row in results:
                 # Structure the role data as nested dictionary
                 row['role'] = {
                     'id': row.pop('role_id_join'),
                     'name': row.pop('role_name'),
                     'description': row.pop('role_description')
                 }
                 # Ensure the main role_id field expected by UserInDBBase is still there
                 # row['role_id'] = row['role']['id'] # Already present in select
                 users_list.append(row)

        return users_list, total_count
    except psycopg2.Error as e:
        logger.error(f"Database error fetching users list: {e}")
        conn.rollback()
        return [], 0

def update_user(conn, user_id: int, user_update: schemas.UserUpdate, hashed_password: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """(Old psycopg2 Version) Updates a user's information in the database, including email."""
    # Use model_dump for Pydantic v2
    fields_to_update = user_update.model_dump(exclude_unset=True) 

    if hashed_password:
        fields_to_update['hashed_password'] = hashed_password
    elif 'password' in fields_to_update:
        # If password is None or empty string in the update model, don't update it.
        # Ensure 'password' itself is not added to the fields to update DB.
        del fields_to_update['password']

    if not fields_to_update:
        # No fields to update, return current user data
        # Use existing function which now includes email and role
        return get_user_by_id(conn, user_id) 

    # Prepare SET clause and values for the query
    set_clause = ", ".join([f"{key} = %({key})s" for key in fields_to_update.keys()])
    values = {**fields_to_update, 'user_id': user_id} # Use named placeholders

    query = f"""
        UPDATE users
        SET {set_clause}, updated_at = CURRENT_TIMESTAMP
        WHERE id = %(user_id)s
        RETURNING id;
    """

    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(query, values)
            updated_user_id_row = cur.fetchone()
            if not updated_user_id_row:
                conn.rollback() # User not found
                logger.warning(f"Attempted to update non-existent user with ID: {user_id}")
                # Raise not found error instead of returning None
                raise HTTPException(status_code=404, detail="User not found")
            
            conn.commit()
            # Fetch the updated user details including role and email
            return get_user_by_id(conn, user_id) 
    except psycopg2.IntegrityError as e:
         logger.error(f"Database integrity error updating user {user_id}: {e}")
         conn.rollback()
         detail = "Update failed due to integrity constraint." 
         if "users_username_key" in str(e):
             detail = f"Username '{user_update.username}' is already registered by another user."
         elif "uq_users_email" in str(e): # Check for email constraint
             detail = f"Email '{user_update.email}' is already registered by another user."
         raise HTTPException(status_code=409, detail=detail) from e
    except psycopg2.Error as e:
        logger.error(f"Database error updating user {user_id}: {e}")
        conn.rollback()
        # Raise HTTPException instead of returning None
        raise HTTPException(status_code=500, detail="Database error during user update.") from e

def delete_user(conn, user_id: int) -> bool:
    """(Old psycopg2 Version) Deletes a user from the database."""
    try:
        with conn.cursor() as cur: # No RealDictCursor needed, just rowcount
            cur.execute("DELETE FROM users WHERE id = %s", (user_id,))
            deleted_rows = cur.rowcount
            conn.commit()
            return deleted_rows > 0
    except psycopg2.Error as e:
        logger.error(f"Database error deleting user {user_id}: {e}")
        conn.rollback()
        return False

def get_user_hashed_password(conn, user_id: int) -> Optional[str]:
    """(Old psycopg2 Version) Fetches only the hashed password for a given user ID."""
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT hashed_password FROM users WHERE id = %s", (user_id,))
            result = cur.fetchone()
            return result[0] if result else None
    except psycopg2.Error as e:
        logger.error(f"Database error fetching hashed password for user {user_id}: {e}")
        conn.rollback()
        return None

def update_user_password(conn, user_id: int, new_hashed_password: str) -> bool:
    """(Old psycopg2 Version) Updates a user's password in the database."""
    try:
        with conn.cursor() as cur:
            cur.execute("UPDATE users SET hashed_password = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s", (new_hashed_password, user_id))
            updated_rows = cur.rowcount
            conn.commit()
            return updated_rows > 0
    except psycopg2.Error as e:
        logger.error(f"Database error updating password for user {user_id}: {e}")
        conn.rollback()
        return False

# --- Helper to get DB connection (example, likely exists in main.py already) ---
# You should ideally reuse the connection logic from your main FastAPI app (e.g., Depends(get_db_connection))
# This is just a placeholder representation.

# def get_db_connection():
#     conn = psycopg2.connect(os.getenv("DATABASE_URL"))
#     try:
#         yield conn
#     finally:
#         conn.close() 

# +++ Raw Salary Data Staging Model (Minimal) +++ START
class RawSalaryDataStaging(Base):
    __tablename__ = "raw_salary_data_staging"
    # Assuming an 'id' column exists, add it if needed for other operations
    id = Column(Integer, primary_key=True, index=True) # Added primary key
    pay_period_identifier = Column(String, index=True) # Add index for performance
    # Add other columns from FINAL_EXPECTED_COLUMNS if needed for ORM interaction
    # e.g., id_card_number = Column(String, index=True)
    # ... etc

# +++ Raw Salary Data Staging Model (Minimal) +++ END

# --- ORM CRUD Functions for Units --- START
# ... existing code ... 