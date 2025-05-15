import os
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm, HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
from cryptography.fernet import Fernet # For symmetric encryption
# import psycopg2 # No longer needed directly here if refactored

# Import SQLAlchemy Session and ORM Models if needed for type hints
from sqlalchemy.orm import Session

# Import schemas, models_db, and the new get_db dependency
# from . import models_db # This was causing the issue by importing the wrong get_user_by_username
from . import schemas, models # models is likely webapp.models (ORM definitions)
from .database import get_db # <--- Use get_db
from .v2.crud import security as v2_crud_security # <--- ADDED: Specific import for v2 CRUD operations

# Import logging for added logging functionality
import logging

# Added logger instance
logger = logging.getLogger(__name__)

# Configuration (consider moving to a config module or reading from env more robustly)
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "default_secret_key_change_this") # Use a strong default ONLY for dev
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", 30))

if SECRET_KEY == "default_secret_key_change_this":
    print("WARNING: Using default JWT_SECRET_KEY. Please set a strong secret key in your .env file.")

# Fernet Key for Email Server Password Encryption
# IMPORTANT: This key MUST be kept secret and consistent across application instances.
# It's best to set this as an environment variable.
EMAIL_CFG_FERNET_KEY_ENV_VAR = "EMAIL_CFG_FERNET_KEY"
_fernet_key = os.getenv(EMAIL_CFG_FERNET_KEY_ENV_VAR)
if not _fernet_key:
    print(f"WARNING: Environment variable {EMAIL_CFG_FERNET_KEY_ENV_VAR} for email config encryption is not set.")
    print("Using a fixed development key. For production, generate a key once and set it as an environment variable.")
    # 使用固定的开发密钥 - 注意：这只适用于开发环境，生产环境应该使用环境变量
    _fernet_key = "2aJmWSBM9jAqez6XRJ4Xhkv5DohIfl4b5UNchy0YR44="
    # In a real app, you might want to halt or have a more robust way to handle this.
    # For now, we'll proceed with the fixed key for development.

try:
    fernet_cipher = Fernet(_fernet_key.encode()) # Encode string key back to bytes for Fernet
except Exception as e:
    logger.error(f"Failed to initialize Fernet cipher with key from {EMAIL_CFG_FERNET_KEY_ENV_VAR}. Ensure it's a valid Fernet key. Error: {e}")
    # Fallback or error handling if key is invalid
    print(f"CRITICAL: Could not initialize Fernet cipher. Email password encryption/decryption will fail. Ensure {EMAIL_CFG_FERNET_KEY_ENV_VAR} is a valid Fernet key.")
    # fernet_cipher = None # Or raise an exception to halt startup


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

# --- Symmetric Encryption/Decryption Utilities (for Email Server Passwords) ---

def encrypt_data(plain_text: str) -> Optional[str]:
    """Encrypts data using Fernet."""
    if not fernet_cipher:
        logger.error("Fernet cipher is not initialized. Cannot encrypt data.")
        # Potentially raise an error or return a specific indicator
        raise ValueError("Fernet cipher not initialized. Cannot encrypt.")
    try:
        return fernet_cipher.encrypt(plain_text.encode()).decode()
    except Exception as e:
        logger.error(f"Error encrypting data: {e}", exc_info=True)
        return None # Or raise

def decrypt_data(encrypted_text: str) -> Optional[str]:
    """Decrypts data using Fernet."""
    if not fernet_cipher:
        logger.error("Fernet cipher is not initialized. Cannot decrypt data.")
        raise ValueError("Fernet cipher not initialized. Cannot decrypt.")
    try:
        return fernet_cipher.decrypt(encrypted_text.encode()).decode()
    except Exception as e: # Includes InvalidToken
        logger.error(f"Error decrypting data (possibly invalid token or key): {e}", exc_info=True)
        return None # Or raise

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
    # Use the renamed ORM function from v2_crud_security
    user = v2_crud_security.get_user_by_username(db, username=username) # <--- MODIFIED: Use v2_crud_security
    if not user:
        logger.warning(f"Authentication failed: User '{username}' not found.")
        return None
    # 获取hashed_password的值而不是Column对象
    if not verify_password(password, str(user.password_hash)): # password_hash is the attribute in ORM model
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
    user_orm = v2_crud_security.get_user_by_username(db, username=username) # <--- MODIFIED: Use v2_crud_security

    if user_orm is None:
        raise credentials_exception

    # Construct UserResponse from the ORM object
    # Pydantic should handle the nested Role conversion if schemas are set up correctly
    current_user = schemas.UserResponse.model_validate(user_orm) # Use model_validate for Pydantic v2
    # For Pydantic v1, use: current_user = schemas.UserResponse.from_orm(user_orm)

    if not current_user.is_active:
         raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")

    # MODIFIED: Adjust role comparison for a list of roles
    if token_role is not None and current_user.roles:
        user_role_names = [r.name for r in current_user.roles if r and r.name] # Get names of all assigned roles
        if not user_role_names: # Handles case where roles list might be empty or roles have no name
             if token_role: # If token has a role but user has no roles in DB
                print(f"Warning: Token role '{token_role}' present, but user '{current_user.username}' has no roles assigned in DB.")
        elif token_role not in user_role_names:
            print(f"Warning: Token role '{token_role}' not found in user's DB roles: {user_role_names} for user '{current_user.username}'")
            # Depending on security policy, you might raise credentials_exception here
    elif token_role is not None and not current_user.roles:
        print(f"Warning: Token role '{token_role}' present, but user '{current_user.username}' has no roles assigned in DB (roles list is empty).")

    return current_user

# Dependency factory for requiring specific roles
def require_role(allowed_roles: List[str]):
    """Dependency factory that checks if the current user has one of the allowed roles."""
    async def role_checker(current_user: schemas.UserResponse = Depends(get_current_user)) -> schemas.UserResponse:
        if not current_user.roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"User has no roles assigned. Requires one of: {allowed_roles}"
            )

        # Check if the user has any of the allowed role codes
        user_has_allowed_role = any(role.code in allowed_roles for role in current_user.roles if role and hasattr(role, 'code') and role.code)

        if not user_has_allowed_role:
            current_role_codes = [r.code for r in current_user.roles if r and hasattr(r, 'code') and r.code]
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"User role codes {current_role_codes} are not authorized for this operation. Requires one of: {allowed_roles}"
            )
        return current_user
    return role_checker