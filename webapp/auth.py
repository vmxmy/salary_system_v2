import os
from datetime import datetime, timedelta, timezone
from typing import Optional, List

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm, HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
# import psycopg2 # No longer needed directly here if refactored

# Import SQLAlchemy Session and ORM Models if needed for type hints
from sqlalchemy.orm import Session

# Import schemas, models_db, and the new get_db dependency
from . import models_db, schemas, models
from .database import get_db # <--- Use get_db
# from .database import get_db, get_db_connection # Remove get_db_connection if no longer needed after this change

# Configuration (consider moving to a config module or reading from env more robustly)
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "default_secret_key_change_this") # Use a strong default ONLY for dev
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", 30))

if SECRET_KEY == "default_secret_key_change_this":
    print("WARNING: Using default JWT_SECRET_KEY. Please set a strong secret key in your .env file.")

# Password Hashing Context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Use HTTPBearer instead
bearer_scheme = HTTPBearer()

# --- Password Utilities ---

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against a hashed password."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hashes a plain password."""
    return pwd_context.hash(password)

# --- JWT Utilities ---

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Creates a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# --- Authentication Logic (Refactored for ORM) ---

def authenticate_user(db: Session, username: str, password: str) -> Optional[models.User]: # Return ORM User object
    """(ORM Version) Authenticates a user based on username and password."""
    # Use the ORM version of the function
    user = models_db.get_user_by_username_orm(db, username=username)
    if not user:
        return None
    # 获取hashed_password的值而不是Column对象
    if not verify_password(password, str(user.hashed_password)):
        return None
    # Return the ORM User object itself. The caller (/token endpoint)
    # will extract necessary fields (username, role.name, email) for the token.
    return user

# --- FastAPI Dependencies (Refactored get_current_user) ---

async def get_current_user( 
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme), 
    # conn = Depends(get_db_connection) # <-- Remove old dependency
    db: Session = Depends(get_db) # <--- Use new ORM Session dependency
) -> schemas.UserResponse: # Keep returning UserResponse as expected by Depends
    """(Refactored for ORM) Dependency to get the current authenticated user from the token using HTTPBearer."""
    token = credentials.credentials # Extract token from credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub", "")  # 提供默认值避免None
        if not username:  # 检查空字符串
            raise credentials_exception
        # Role from token is mainly for initial check/logging, primary source is DB
        token_role: Optional[str] = payload.get("role")  # 正确标注类型
    except JWTError:
        raise credentials_exception

    # Fetch user details from DB using ORM
    user_orm = models_db.get_user_by_username_orm(db, username=username)
    
    if user_orm is None:
        raise credentials_exception

    # Construct UserResponse from the ORM object
    # Pydantic should handle the nested Role conversion if schemas are set up correctly
    current_user = schemas.UserResponse.model_validate(user_orm) # Use model_validate for Pydantic v2
    # For Pydantic v1, use: current_user = schemas.UserResponse.from_orm(user_orm)

    if not current_user.is_active:
         raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")

    # 添加对role和role.name的空值检查
    if current_user.role is not None and token_role is not None:
        if current_user.role.name != token_role:
            print(f"Warning: Token role '{token_role}' differs from DB role '{current_user.role.name}' for user '{current_user.username}'")
            # Depending on security policy, you might raise credentials_exception here

    return current_user

# Dependency factory for requiring specific roles
def require_role(allowed_roles: List[str]):
    """Dependency factory that checks if the current user has one of the allowed roles."""
    async def role_checker(current_user: schemas.UserResponse = Depends(get_current_user)) -> schemas.UserResponse:
        # 添加role为None的检查
        if current_user.role is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"User has no role assigned. Requires one of: {allowed_roles}"
            )
        
        if current_user.role.name not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"User role '{current_user.role.name}' is not authorized for this operation. Requires one of: {allowed_roles}"
            )
        return current_user
    return role_checker 