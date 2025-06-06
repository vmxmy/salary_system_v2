import typing # Added for Any
from fastapi import Depends, HTTPException, status
# Adjust the import path based on the actual location of get_current_user and its return type hint
from webapp.auth import get_current_user 
# Assuming the User schema returned by get_current_user is v2_security_schemas.User as seen in webapp.auth
from webapp.v2.pydantic_models.security import User as V2UserSchema # Restored this import

# Use typing.Any as a placeholder for V2UserSchema during diagnosis
async def get_current_user_id(current_user: V2UserSchema = Depends(get_current_user)) -> int: # Restored type hint
    """FastAPI dependency to get the ID of the current authenticated user."""
    if not current_user or not hasattr(current_user, 'id') or current_user.id is None:
        # This case should ideally be handled by get_current_user itself if no valid user is found.
        # However, adding a check here for robustness.
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not identify current user or user ID is missing.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return current_user.id 