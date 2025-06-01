from typing import Optional, List, Tuple
import logging

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
import sqlalchemy

# Assuming schemas.py defines Pydantic models like UserCreate, UserUpdate
# and models.py defines the ORM model User
from .. import schemas
from .. import models # Adjusted import

logger = logging.getLogger(__name__)

# --- User DB Operations (Final ORM Versions) ---

def get_user_by_username(db: Session, username: str) -> Optional['models.User']:
    """Fetches a user by username using SQLAlchemy ORM, joining the role.
       Returns the User ORM object or None.
    """
    try:
        return db.query(models.User).options(joinedload(models.User.role)).filter(models.User.username == username).first()
    except sqlalchemy.exc.SQLAlchemyError as e:
        logger.error(f"SQLAlchemy error fetching user by username {username}: {e}")
        return None

def get_users(db: Session, skip: int = 0, limit: int = 100) -> Tuple[List['models.User'], int]:
    """Fetches a paginated list of users with their role information using SQLAlchemy ORM.
       Returns a tuple: (list of User ORM objects, total user count).
    """
    try:
        query = db.query(models.User).options(joinedload(models.User.role)).order_by(models.User.id)
        total_count = db.query(func.count(models.User.id)).scalar() or 0
        users_list = query.offset(skip).limit(limit).all()
        return users_list, total_count
    except sqlalchemy.exc.SQLAlchemyError as e:
        logger.error(f"SQLAlchemy error fetching users list: {e}")
        return [], 0

def get_user_by_id(db: Session, user_id: int) -> Optional['models.User']:
    """Fetches a single user by ID using SQLAlchemy ORM, joining the role.
       Returns the User ORM object or None if not found.
    """
    try:
        return db.query(models.User).options(joinedload(models.User.role)).filter(models.User.id == user_id).first()
    except sqlalchemy.exc.SQLAlchemyError as e:
        logger.error(f"SQLAlchemy error fetching user by ID {user_id}: {e}")
        return None

def create_user(db: Session, user: schemas.UserCreate, hashed_password: str) -> 'models.User':
    """Creates a new user in the database using SQLAlchemy ORM.
    Handles potential IntegrityErrors (username/email unique constraints).
    Returns the newly created User ORM object.
    Raises HTTPException on errors.
    """
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
        db.refresh(db_user)
        return db_user
    except sqlalchemy.exc.IntegrityError as e:
        db.rollback()
        logger.error(f"Database integrity error creating user {user.username} or email {user.email}: {e}")
        detail = "An integrity constraint was violated during user creation."
        if "users_username_key" in str(e) or "uq_users_username" in str(e):
            detail = f"Username '{user.username}' already exists."
        elif "users_email_key" in str(e) or "uq_users_email" in str(e):
            detail = f"Email '{user.email}' is already registered."
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=detail) from e
    except sqlalchemy.exc.SQLAlchemyError as e:
        db.rollback()
        logger.error(f"SQLAlchemy error creating user {user.username}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database error during user creation.") from e
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error creating user {user.username}: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An unexpected error occurred during user creation.") from e

def update_user(db: Session, user_id: int, user_update: schemas.UserUpdate, hashed_password: Optional[str] = None) -> 'models.User':
    """Updates a user's information in the database using SQLAlchemy ORM.
    Handles potential IntegrityErrors and checks if the user exists.
    Returns the updated User ORM object.
    Raises HTTPException on errors.
    """
    db_user = db.query(models.User).options(joinedload(models.User.role)).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    update_data = user_update.model_dump(exclude_unset=True)
    if hashed_password:
        update_data['hashed_password'] = hashed_password
    if 'password' in update_data:
        del update_data['password']

    if not update_data:
        return db_user

    for key, value in update_data.items():
        setattr(db_user, key, value)

    try:
        db.commit()
        db.refresh(db_user)
        return db_user
    except sqlalchemy.exc.IntegrityError as e:
        db.rollback()
        logger.error(f"Database integrity error updating user {user_id}: {e}")
        detail = "Update failed due to integrity constraint."
        if "users_username_key" in str(e) or "uq_users_username" in str(e):
            detail = f"Username '{user_update.username}' is already registered by another user."
        elif "users_email_key" in str(e) or "uq_users_email" in str(e):
            detail = f"Email '{user_update.email}' is already registered by another user."
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=detail) from e
    except sqlalchemy.exc.SQLAlchemyError as e:
        db.rollback()
        logger.error(f"SQLAlchemy error updating user {user_id}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database error during user update.") from e
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error updating user {user_id}: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An unexpected error occurred during user update.") from e

def delete_user(db: Session, user_id: int) -> bool:
    """Deletes a user from the database using SQLAlchemy ORM.
    Returns True if deletion was successful, False if user not found.
    Raises HTTPException on database errors.
    """
    try:
        db_user = db.query(models.User).filter(models.User.id == user_id).first()
        if not db_user:
            return False
        db.delete(db_user)
        db.commit()
        return True
    except sqlalchemy.exc.SQLAlchemyError as e:
        db.rollback()
        logger.error(f"SQLAlchemy error deleting user {user_id}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database error during user deletion.") from e
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error deleting user {user_id}: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An unexpected error occurred during user deletion.") from e

def get_user_hashed_password(db: Session, user_id: int) -> Optional[str]:
    """Fetches only the hashed password for a given user ID."""
    try:
        hashed_password = db.query(models.User.hashed_password).filter(models.User.id == user_id).scalar()
        return hashed_password
    except sqlalchemy.exc.SQLAlchemyError as e:
        logger.error(f"SQLAlchemy error fetching hashed password for user {user_id}: {e}")
        return None

def update_user_password(db: Session, user_id: int, new_hashed_password: str) -> bool:
    """Updates a user's password in the database using SQLAlchemy ORM.
    Returns True if successful, False if user not found.
    Raises HTTPException on database errors.
    """
    try:
        db_user = db.query(models.User).filter(models.User.id == user_id).first()
        if not db_user:
            return False
        setattr(db_user, 'hashed_password', new_hashed_password)
        db.commit()
        return True
    except sqlalchemy.exc.SQLAlchemyError as e:
        db.rollback()
        logger.error(f"SQLAlchemy error updating password for user {user_id}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database error during password update.") from e
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error updating password for user {user_id}: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An unexpected error occurred during password update.") from e 