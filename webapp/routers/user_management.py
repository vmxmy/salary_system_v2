from fastapi import APIRouter, Depends, HTTPException, status, Body
from typing import List
from sqlalchemy.orm import Session
import logging

from .. import auth, models_db, schemas
from ..database import get_db

# 配置logger
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/users",
    tags=["Users"]
)

# ==== User Management Endpoints ====

# Endpoint accessible by Super Admin to create any user
@router.post("/", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user_endpoint(
    user: schemas.UserCreate,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.require_role(["Super Admin"]))
):
    """
    Creates a new user by a Super Admin using the ORM. Requires role_id.
    Uses the updated models_db.create_user function.
    """
    role = models_db.get_role_by_id(db, user.role_id)
    if not role:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Role with ID {user.role_id} not found.")

    hashed_password = auth.get_password_hash(user.password)
    
    try:
        created_user = models_db.create_user(db=db, user=user, hashed_password=hashed_password)
        if not created_user:
             raise HTTPException(status_code=500, detail="Failed to create user after database operation.")
        return created_user
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        logger.error(f"Unexpected error in create_user_endpoint: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An internal server error occurred.")

# Endpoint accessible by Super Admin to get a list of users
@router.get("/", response_model=schemas.UserListResponse)
async def read_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.require_role(["Super Admin"]))
):
    """
    Retrieves a list of users (including email) with pagination. Only accessible by Super Admins.
    Uses the updated models_db.get_users function.
    """
    try:
        users, total_count = models_db.get_users(db, skip=skip, limit=limit)
        return {"data": users, "total": total_count}
    except Exception as e:
        logger.error(f"Failed to retrieve users using ORM: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to retrieve users")

# ==== /me routes (MUST come BEFORE /{user_id} routes for correct routing) ====

@router.get("/me", response_model=schemas.UserResponse)
async def read_users_me(current_user: schemas.UserResponse = Depends(auth.get_current_user)):
    """
    Retrieves the details of the currently authenticated user.
    """
    return current_user

@router.put("/me", response_model=schemas.UserResponse)
async def update_current_user(
    user_update: schemas.UserUpdate = Body(...),
    current_user: schemas.UserResponse = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Updates the current logged-in user's information (e.g., email) using ORM."""
    if user_update.password is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password updates should be done via the /api/users/me/password endpoint."
        )
    
    # Use the ORM update function
    # Note: update_user takes user_update directly. No need for hashed_password=None here.
    updated_user = models_db.update_user( 
        db=db, 
        user_id=current_user.id, 
        user_update=user_update
    )
    
    if updated_user is None: # update_user returns None if user not found (or raises on error)
        # This case might not be reachable if get_current_user works, but defensive check
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Current user not found for update.")

    # Return the updated ORM model; FastAPI handles Pydantic conversion
    return updated_user 

@router.put("/me/password", status_code=status.HTTP_204_NO_CONTENT)
async def update_current_user_password(
    payload: schemas.PasswordUpdate = Body(...),
    current_user: schemas.UserResponse = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Updates the current logged-in user's password using ORM."""
    # Use the ORM function to get the current password hash
    current_hashed_password = models_db.get_user_hashed_password(db, current_user.id)
    if not current_hashed_password or not auth.verify_password(payload.current_password, current_hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password"
        )
    
    new_hashed_password = auth.get_password_hash(payload.new_password)
    
    # Use the ORM function to update the password
    success = models_db.update_user_password(db, current_user.id, new_hashed_password)
    
    if not success:
        # update_user_password returns False if user not found, raises on DB error
        # Re-check user existence for clarity, though should be caught by Depends
        user_exists = models_db.get_user_by_id(db, current_user.id)
        if not user_exists:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found during password update.")
        else:
            # If user exists but update failed, it was likely a DB error handled inside update_user_password
            # For safety, raise a generic 500 here if it somehow returned False without raising.
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update password in the database."
            )
    return # Return None for 204 status code

# ==== Individual user routes (MUST come AFTER /me routes) ====

@router.get("/{user_id}", response_model=schemas.UserResponse)
async def read_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.require_role(["Super Admin"]))
):
    """
    Retrieves details for a specific user by ID using ORM. Only accessible by Super Admins.
    """
    # Use the ORM function
    db_user = models_db.get_user_by_id(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    # Return the ORM model; FastAPI handles Pydantic conversion
    return db_user 

@router.put("/{user_id}", response_model=schemas.UserResponse)
async def update_user_endpoint(
    user_id: int,
    user_update: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.require_role(["Super Admin"]))
):
    """
    Updates a user's details (including optional email). Only accessible by Super Admins.
    Uses the updated models_db.update_user function.
    """
    # Use the ORM version to get the user
    existing_user = models_db.get_user_by_id(db, user_id)
    if not existing_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Role check remains the same
    if user_update.role_id is not None:
        role = models_db.get_role_by_id(db, user_update.role_id) # get_role_by_id is already ORM
        if not role:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Role with ID {user_update.role_id} not found.")

    # Password hashing remains the same
    hashed_password = None
    if user_update.password:
        hashed_password = auth.get_password_hash(user_update.password)

    try:
        # Use the ORM version to update the user
        updated_user = models_db.update_user(
            db=db, # Pass the session
            user_id=user_id,
            user_update=user_update,
            hashed_password=hashed_password
        )
        # update_user already raises HTTPException on errors, but returns the user model on success
        if not updated_user: # Should not happen if exceptions are raised correctly, but check anyway
             raise HTTPException(status_code=500, detail="Failed to update user after database operation.")
        return updated_user
    except HTTPException as http_exc:
        # Re-raise HTTPExceptions raised by update_user
        raise http_exc
    except Exception as e:
        # Log any other unexpected errors
        logger.error(f"Unexpected error in update_user_endpoint for user {user_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An internal server error occurred during user update.")

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user_endpoint(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.require_role(["Super Admin"]))
):
    """
    Deletes a user using the ORM. Only accessible by Super Admins.
    Prevents a user from deleting themselves.
    """
    if current_user.id == user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot delete yourself.")

    try:
        # Use the ORM version
        deleted = models_db.delete_user(db, user_id=user_id)
        if not deleted:
            # delete_user returns False if user not found
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        # No explicit return needed on success with 204 status
        return 
    except HTTPException as http_exc:
         # Re-raise known HTTP exceptions (like 404)
         raise http_exc
    except Exception as e: 
        # Catch potential DB errors from delete_user (though it raises 500 itself)
        logger.error(f"Error deleting user {user_id}: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to delete user.")

# ==== Roles endpoint ====

@router.get("/roles/list", response_model=List[schemas.RoleResponse])
async def get_roles_list(
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.require_role(["Super Admin"]))
):
    """
    Retrieves a list of all available roles. Only accessible by Super Admins.
    """
    try:
        roles = models_db.get_roles(db)
        return roles
    except Exception as e:
        logger.error(f"Failed to retrieve roles: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to retrieve roles") 