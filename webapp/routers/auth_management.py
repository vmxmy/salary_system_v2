from fastapi import APIRouter, Depends, HTTPException, status, Body
from fastapi.security import OAuth2PasswordRequestForm
from typing import List
from sqlalchemy.orm import Session
from datetime import timedelta
import logging
import typing

from .. import auth, models_db, schemas
from ..database import get_db

# Added logger instance
logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/token", response_model=schemas.Token, tags=["Authentication"])
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    Handles the OAuth2 password flow to authenticate a user and issue a JWT token.
    Now includes email in the token payload.
    """
    import logging
    logging.basicConfig(level=logging.DEBUG)
    logger = logging.getLogger("auth_debug")
    user = auth.authenticate_user(db, form_data.username, form_data.password)
    logger.debug(f"[DEBUG] 登录用户名: {form_data.username}, user: {user}")
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Assuming user object returned by authenticate_user has username, email, and role.name
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # --- Include email in the token payload --- START
    token_data = {
        "sub": user.username,
        "role": user.roles[0].name if user.roles else None, # Access the first role's name if roles exist
        "email": user.email  # Add the email field here
    }
    # --- Include email in the token payload --- END
    
    access_token = auth.create_access_token(
        data=token_data, 
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED, tags=["Authentication"])
async def register_user(
    user_in: schemas.UserRegister,
    db: Session = Depends(get_db)
):
    """Registers a new user with the default 'Guest' role."""
    # 1. Check if Guest role exists
    guest_role = models_db.get_role_by_name(db, "Guest")
    if not guest_role:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="Registration configuration error. Please contact administrator."
        )
    guest_role_id = guest_role['id']

    # 2. Prepare UserCreate schema for the database function
    # Note: UserCreate requires role_id, which we now have
    user_create_data = schemas.UserCreate(
        username=user_in.username,
        email=user_in.email,
        password=user_in.password, # Hashing happens below
        role_id=guest_role_id,
        is_active=True # New users start as active by default
    )

    # 3. Hash password
    hashed_password = auth.get_password_hash(user_create_data.password)

    # 4. Call the database function to create the user
    try:
        # Call the renamed ORM function
        created_user = models_db.create_user(db=db, user=user_create_data, hashed_password=hashed_password) 
        if not created_user:
             # This case should ideally not be reached if create_user raises exceptions
             raise HTTPException(status_code=500, detail="Failed to create user after database operation.")
        
        # Fetch the user again with role details for the response
        # (create_user_orm might already return this depending on its implementation)
        # A separate fetch ensures consistency if create_user doesn't eager load.
        # Ensure we pass the integer ID, using cast to satisfy linter
        user_response = models_db.get_user_by_id(db, user_id=typing.cast(int, created_user.id))
        if not user_response:
             # This should ideally not happen if creation was successful
             logger.error(f"Failed to fetch newly created user {created_user.id} for response.")
             raise HTTPException(status_code=500, detail="Failed to retrieve user details after creation.")

        # Convert the ORM model to Pydantic model for the response
        # FastAPI handles this automatically if response_model is set correctly
        return user_response

    except HTTPException as http_exc:
        # Re-raise HTTPExceptions raised by create_user (e.g., 409 Conflict)
        raise http_exc
    except Exception as e:
        # Catch any other unexpected errors
        raise HTTPException(status_code=500, detail="An internal server error occurred during registration.") 