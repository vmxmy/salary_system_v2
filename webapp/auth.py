import os
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm, HTTPBearer, HTTPAuthorizationCredentials, HTTPBasic
from jose import JWTError, jwt
from passlib.context import CryptContext
from cryptography.fernet import Fernet # For symmetric encryption
# import psycopg2 # No longer needed directly here if refactored

# Import SQLAlchemy Session and ORM Models if needed for type hints
from sqlalchemy.orm import Session

# Import schemas, models_db, and the new get_db dependency
# from . import models_db # This was causing the issue by importing the wrong get_user_by_username
from . import models # models is likely webapp.models (ORM definitions)
from .v2.database import get_db_v2 # <--- ADD THIS LINE (V2 DB)
from .v2.crud import security as v2_crud_security # <--- ADDED: Specific import for v2 CRUD operations
from .v2.pydantic_models import security as v2_security_schemas # IMPORT THE V2 SECURITY SCHEMAS

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

# Configure the HTTP Basic authentication scheme
basic_scheme = HTTPBasic()

# Configure the HTTP Bearer authentication scheme
# bearer_scheme = HTTPBearer(auto_error=True) # Original
bearer_scheme = HTTPBearer(auto_error=False) # Changed for testing - if header missing/malformed, creds will be None

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
    db: Session = Depends(get_db_v2) # <--- USE get_db_v2 HERE
) -> v2_security_schemas.User: # UPDATED return type annotation
    logger.info(f"+++ ENTERING get_current_user at {datetime.now()} for token starting with: {credentials.credentials[:20] if credentials and credentials.credentials else 'NO_TOKEN_CREDENTIALS'}") # EXISTING LINE
    logger.info(f"+++ get_current_user successfully obtained db session from get_db_v2: {type(db)}") # ADDED LOG
    token = credentials.credentials # Extract token from credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    username: Optional[str] = None # ADDED: Initialize username

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub") # Get username, might be None
        logger.info(f"+++ JWT decoded. Payload sub (username): '{username}'") # MODIFIED: Changed to INFO

        if not username:  # 检查空字符串
            logger.warning(f"!!! USERNAME MISSING in JWT payload. Token: {token[:30]}... Raising 401.") # MODIFIED: Enhanced log, was JWT payload 'sub' is empty.
            raise credentials_exception
        
        token_role: Optional[str] = payload.get("role")  # 正确标注类型
        logger.info(f"+++ JWT token_role: '{token_role}' for username '{username}'") # ADDED INFO

    except JWTError as e: # Capture JWTError
        logger.warning(f"!!! JWT DECODE ERROR: {e}. Token: {token[:30]}... Raising 401.") # MODIFIED: Enhanced log, was JWT Error: {e}
        raise credentials_exception
    except Exception as e_jwt_generic: # ADDED: Catch any other error during JWT processing
        logger.error(f"!!! UNEXPECTED ERROR during JWT processing for token {token[:30]}... : {e_jwt_generic}", exc_info=True) # ADDED ERROR
        raise credentials_exception


    logger.info(f"+++ Attempting to fetch user '{username}' from DB.") # MODIFIED: Changed to INFO, was debug log
    user_orm = v2_crud_security.get_user_by_username(db, username=username) # <--- MODIFIED: Use v2_crud_security
    logger.info(f"+++ User '{username}' fetched from DB. Result: {'Found' if user_orm else 'NOT FOUND'}") # MODIFIED: Changed to INFO, was debug log

    if user_orm is None:
        logger.warning(f"!!! USER '{username}' NOT FOUND in DB. Raising 401.") # MODIFIED: Enhanced log, was User '{username}' not found in DB.
        raise credentials_exception

    # Construct User (from v2_security_schemas) from the ORM object
    current_user = v2_security_schemas.User.model_validate(user_orm) # UPDATED to use v2_security_schemas.User
    logger.info(f"+++ User model validated for '{username}'. All permission codes: {current_user.all_permission_codes}") # ADDED INFO

    if not current_user.is_active:
         logger.warning(f"!!! USER '{username}' IS INACTIVE. Raising 400.") # MODIFIED: Enhanced log, was Inactive user '{username}' ...
         raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")

    # MODIFIED: Adjust role comparison for a list of roles
    if token_role is not None and current_user.roles:
        user_role_names = [r.name for r in current_user.roles if r and r.name] # Get names of all assigned roles
        if not user_role_names: # Handles case where roles list might be empty or roles have no name
             if token_role: # If token has a role but user has no roles in DB
                logger.warning(f"Token role '{token_role}' present, but user '{current_user.username}' has no roles assigned in DB.") # Existing log
        elif token_role not in user_role_names:
            logger.warning(f"Token role '{token_role}' not found in user's DB roles: {user_role_names} for user '{current_user.username}'") # Existing log
            # Depending on security policy, you might raise credentials_exception here
    elif token_role is not None and not current_user.roles:
        logger.warning(f"Token role '{token_role}' present, but user '{current_user.username}' has no roles assigned in DB (roles list is empty).") # Existing log

    logger.info(f"+++ EXITING get_current_user successfully for user: '{current_user.username}', active: {current_user.is_active} at {datetime.now()}") # MODIFIED: Enhanced log, was Authentication successful & EXITING log 
    return current_user

# Dependency factory for requiring specific permissions
def require_permissions(required_permissions: List[str]):
    """Dependency factory that checks if the current user has ALL of the required permissions."""
    logger.info(f"@@@ TEST 12: FACTORY require_permissions CALLED with required_permissions: {required_permissions} AT {datetime.now()}")
    
    # Test 12: permission_checker now takes db and credentials, and inlines get_current_user logic
    async def permission_checker(
        db: Session = Depends(get_db_v2),
        credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme) 
    ) -> v2_security_schemas.User:
        logger.info(f"*** TEST 12: ENTERING permission_checker (inlined get_current_user) AT {datetime.now()}")
        
        # --- Start of inlined get_current_user logic ---
        # Add a check for None before accessing credentials.credentials
        if credentials is None:
            logger.warning(f"!!! TEST 12 (inline): NO CREDENTIALS PROVIDED (credentials is None). Raising 401.")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Not authenticated or credentials missing (Test 12 inline check)",
                headers={"WWW-Authenticate": "Bearer"},
            )

        logger.info(f"+++ TEST 12 (inline): Processing token starting with: {credentials.credentials[:20] if credentials.credentials else 'NO_TOKEN_CREDENTIALS'}")
        token = credentials.credentials
        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials (Test 12 inline)",
            headers={"WWW-Authenticate": "Bearer"},
        )
        username: Optional[str] = None

        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            username = payload.get("sub")
            logger.info(f"+++ TEST 12 (inline): JWT decoded. Payload sub (username): '{username}'")
            if not username:
                logger.warning(f"!!! TEST 12 (inline): USERNAME MISSING in JWT payload. Token: {token[:30]}... Raising 401.")
                raise credentials_exception
            token_role: Optional[str] = payload.get("role")
            logger.info(f"+++ TEST 12 (inline): JWT token_role: '{token_role}' for username '{username}'")
        except JWTError as e:
            logger.warning(f"!!! TEST 12 (inline): JWT DECODE ERROR: {e}. Token: {token[:30]}... Raising 401.")
            raise credentials_exception
        except Exception as e_jwt_generic:
            logger.error(f"!!! TEST 12 (inline): UNEXPECTED ERROR during JWT processing for token {token[:30]}... : {e_jwt_generic}", exc_info=True)
            raise credentials_exception

        logger.info(f"+++ TEST 12 (inline): Attempting to fetch user '{username}' from DB.")
        user_orm = v2_crud_security.get_user_by_username(db, username=username)
        logger.info(f"+++ TEST 12 (inline): User '{username}' fetched from DB. Result: {'Found' if user_orm else 'NOT FOUND'}")

        if user_orm is None:
            logger.warning(f"!!! TEST 12 (inline): USER '{username}' NOT FOUND in DB. Raising 401.")
            raise credentials_exception

        current_user = v2_security_schemas.User.model_validate(user_orm)
        logger.info(f"+++ TEST 12 (inline): User model validated for '{username}'. All permission codes: {current_user.all_permission_codes}")

        if not current_user.is_active:
            logger.warning(f"!!! TEST 12 (inline): USER '{username}' IS INACTIVE. Raising 400.")
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user (Test 12 inline)")
        
        # Optional: Role check from original get_current_user (can be adapted or removed for this test)
        if token_role is not None and current_user.roles:
            user_role_names = [r.name for r in current_user.roles if r and r.name]
            if not user_role_names and token_role:
                logger.warning(f"TEST 12 (inline): Token role '{token_role}' present, but user '{current_user.username}' has no roles.")
            elif token_role not in user_role_names:
                logger.warning(f"TEST 12 (inline): Token role '{token_role}' not in user's DB roles: {user_role_names}")
        elif token_role is not None and not current_user.roles:
            logger.warning(f"TEST 12 (inline): Token role '{token_role}' present, but user '{current_user.username}' has no DB roles (list empty).")

        logger.info(f"+++ TEST 12 (inline): Successfully processed user '{current_user.username}'")
        # --- End of inlined get_current_user logic ---
        
        # Original permission checking logic starts here, using the `current_user` obtained above
        logger.info(f"*** TEST 12 (permission check part): User '{current_user.username}'. Required: {required_permissions}")
        
        if not current_user.all_permission_codes:
            logger.warning(f"!!! TEST 12 (permission check part): PERMISSION DENIED for user '{current_user.username}' - no permissions. Required: {required_permissions}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"User has no permissions. Requires: {', '.join(required_permissions)} (Test 12)"
            )

        user_permissions_set = set(current_user.all_permission_codes)
        missing_permissions = [perm for perm in required_permissions if perm not in user_permissions_set]

        if missing_permissions:
            logger.warning(f"!!! TEST 12 (permission check part): PERMISSION DENIED for '{current_user.username}'. Missing: {missing_permissions}. Required: {required_permissions}.")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"User missing permissions: {', '.join(missing_permissions)}. (Test 12)"
            )
        
        logger.info(f"*** TEST 12: EXITING permission_checker successfully for user '{current_user.username}' AT {datetime.now()}")
        return current_user
    return permission_checker

# Test 13: Define a minimal auth factory from auth.py
def minimal_auth_factory():
    logger.info(f"@@@ TEST 13: MINIMAL_AUTH_FACTORY CALLED AT {datetime.now()} @@@")
    async def minimal_auth_checker() -> v2_security_schemas.User:
        logger.info(f"*** TEST 13: MINIMAL_AUTH_CHECKER ENTERED AT {datetime.now()} ***")
        # Return a hardcoded, valid User object
        mock_user_for_test13 = v2_security_schemas.User(
            id=778, # Different ID from other mocks
            username="test13_minimal_user",
            employee_id=None,
            is_active=True,
            created_at=datetime.now(),
            roles=[v2_security_schemas.Role(id=78, name="Test13 Role", code="TEST13_ROLE", description="Role for Test 13", is_active=True, permissions=[])],
            all_permission_codes=["P_EMPLOYEE_VIEW_DETAIL", "P_TEST_PERMISSION"], # Include necessary permission
            description="Mock user for Test 13 minimal_auth_factory"
        )
        logger.info(f"*** TEST 13: MINIMAL_AUTH_CHECKER RETURNING mock user: {mock_user_for_test13.username} ***")
        return mock_user_for_test13
    return minimal_auth_checker

# Test 9: Define a mock_get_current_user function
async def mock_get_current_user() -> v2_security_schemas.User:
    logger.info(">>> MOCK_GET_CURRENT_USER CALLED AT %s <<<", datetime.now())
    # Ensure this object's fields align with v2_security_schemas.User
    mock_user_data = {
        "id": 999, 
        "username": "mockuser_test9",
        # "email": "mockuser@example.com", # email is not in UserBase or User directly, but in UserUpdate
        # "full_name": "Mock User Test9", # full_name is not in UserBase or User directly
        "employee_id": None, # Added employee_id as it's in UserBase
        "is_active": True,
        # "is_superuser": False, # is_superuser is not in UserBase or User
        "created_at": datetime.now(), # ADDED created_at
        "roles": [
            {"id": 99, "name": "Mock Role", "description": "A mock role for testing", "code": "MOCK_ROLE_CODE", "is_active": True, "permissions": []} # ADDED code, is_active, permissions for Role
        ],
        "all_permission_codes": ["P_EMPLOYEE_VIEW_DETAIL", "P_OTHER_MOCK_PERMISSION"],
        "description": "Mock user for Test 9" # Added description as it's in User
    }
    try:
        # This assumes v2_security_schemas.User.model_validate can handle this structure
        user_instance = v2_security_schemas.User.model_validate(mock_user_data)
        logger.info(">>> MOCK_GET_CURRENT_USER: Successfully validated and created mock_user_instance for %s AT %s <<<", user_instance.username, datetime.now())
        return user_instance
    except Exception as e: # Catch Pydantic ValidationError specifically if possible
        logger.error(">>> MOCK_GET_CURRENT_USER: Failed to validate mock_user_data: %s", e, exc_info=True)
        # Fallback to a minimal valid User object or re-raise
        # For now, let's create a super minimal one if validation fails, to see if the rest of the flow works
        # This part might need adjustment based on how strictly we want to enforce the mock
        logger.warning(">>> MOCK_GET_CURRENT_USER: Falling back to minimal user due to validation error AT %s <<<", datetime.now())
        minimal_user = v2_security_schemas.User(
            id=998, 
            username="fallback_mockuser", 
            is_active=True, 
            created_at=datetime.now(), 
            roles=[], # Empty roles list
            all_permission_codes=["P_EMPLOYEE_VIEW_DETAIL"] # Minimal permissions
        )
        return minimal_user

# Old require_role function - can be removed or kept for compatibility if needed elsewhere
# For now, let's comment it out to avoid confusion. If it's still used, we'll need to address that.
# def require_role(allowed_roles: List[str]):

# Test 4b: Define a very simple synchronous dependency
def very_simple_auth_dependency():
    logger.info("@@@ VERY_SIMPLE_AUTH_DEPENDENCY CALLED @@@")
    return "simple_auth_ok"

# Original require_permissions - for reference or potential revert. Keep commented.
# def require_permissions(required_permissions: List[str]):
#     logger.info(f"@@@ TEST 12: FACTORY require_permissions CALLED with required_permissions: {required_permissions} AT {datetime.now()}")
    
#     async def permission_checker( ... ) -> v2_security_schemas.User:
#         ... (Test 12 logic) ...
#     return permission_checker

# --- FINAL SOLUTION ---

# Step 1: Core logic function (no Depends in its signature within this helper)
async def get_actual_user_and_check_permissions(token: Optional[str], db: Session, required_permissions: List[str]) -> v2_security_schemas.User:
    logger.info(f"FINAL_AUTH_CORE: Entered. Token Present: {'Yes' if token else 'No'}. Required Permissions: {required_permissions}")

    credentials_exception_401 = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials (FINAL_AUTH_CORE)",
        headers={"WWW-Authenticate": "Bearer"},
    )
    credentials_exception_403 = HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Permission denied (FINAL_AUTH_CORE)",
    )

    if not token:
        logger.warning("FINAL_AUTH_CORE: No token provided.")
        raise credentials_exception_401

    username: Optional[str] = None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        logger.info(f"FINAL_AUTH_CORE: JWT decoded. User: '{username}'")
        if not username:
            logger.warning("FINAL_AUTH_CORE: Username missing in JWT payload.")
            raise credentials_exception_401
        # token_role = payload.get("role") # Can log or use if needed
    except JWTError as e:
        logger.warning(f"FINAL_AUTH_CORE: JWT Decode Error: {e}")
        raise credentials_exception_401
    
    user_orm = v2_crud_security.get_user_by_username(db, username=username)
    if not user_orm:
        logger.warning(f"FINAL_AUTH_CORE: User '{username}' not found in DB.")
        raise credentials_exception_401

    current_user = v2_security_schemas.User.model_validate(user_orm)
    if not current_user.is_active:
        logger.warning(f"FINAL_AUTH_CORE: User '{username}' is inactive.")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user (FINAL_AUTH_CORE)")

    logger.info(f"FINAL_AUTH_CORE: User '{username}' retrieved. Checking permissions: {required_permissions}")
    
    # Handle case where current_user.all_permission_codes might be None
    user_permissions_set = set(current_user.all_permission_codes or [])
    
    if required_permissions: # Only check if there are specific permissions required
        missing_permissions = [perm for perm in required_permissions if perm not in user_permissions_set]
        if missing_permissions:
            logger.warning(f"FINAL_AUTH_CORE: User '{username}' missing permissions: {missing_permissions}")
            raise credentials_exception_403
    
    logger.info(f"FINAL_AUTH_CORE: Permissions OK for user '{username}'. Returning user.")
    return current_user

# Step 2: The new dependency factory
def require_permissions_final(required_permissions: List[str]):
    logger.info(f"FINAL_AUTH_FACTORY: require_permissions_final CALLED for: {required_permissions}")

    async def actual_checker_with_deps(
        db: Session = Depends(get_db_v2), 
        cred: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme)
    ) -> v2_security_schemas.User:
        logger.info(f"FINAL_AUTH_CHECKER: CALLED. DB: {'OK' if db else 'FAIL'}, Cred: {'OK' if cred and cred.credentials else 'FAIL/MISSING'}")
        
        if not cred or not cred.credentials:
            logger.warning("FINAL_AUTH_CHECKER: No credentials provided by bearer_scheme.")
            # Re-raise with WWW-Authenticate header for browser basic auth prompt or token refresh UIs
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, 
                detail="Not authenticated (FINAL_AUTH_CHECKER)",
                headers={"WWW-Authenticate": "Bearer"} 
            )
        
        token = cred.credentials
        # required_permissions is from the outer factory's scope (closure)
        user = await get_actual_user_and_check_permissions(token, db, required_permissions)
        logger.info(f"FINAL_AUTH_CHECKER: PASSED for user: {user.username}")
        return user

    return actual_checker_with_deps

# --- NEW EXPLICIT AUTH CHECK (Plan Step 1a) ---
async def explicit_auth_check(db: Session, credentials: Optional[HTTPAuthorizationCredentials], required_permissions: List[str]) -> v2_security_schemas.User:
    logger.info(f"EXPLICIT_AUTH_CHECK: Entered. Credentials Present: {'Yes' if credentials and credentials.credentials else 'No'}. Required Permissions: {required_permissions}")

    token: Optional[str] = None
    if credentials and credentials.credentials:
        token = credentials.credentials

    credentials_exception_401 = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials (EXPLICIT_AUTH_CHECK)",
        headers={"WWW-Authenticate": "Bearer"},
    )
    credentials_exception_403 = HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Permission denied (EXPLICIT_AUTH_CHECK)",
    )

    if not token:
        logger.warning("EXPLICIT_AUTH_CHECK: No token provided.")
        raise credentials_exception_401

    username: Optional[str] = None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        logger.info(f"EXPLICIT_AUTH_CHECK: JWT decoded. User: '{username}'")
        if not username:
            logger.warning("EXPLICIT_AUTH_CHECK: Username missing in JWT payload.")
            raise credentials_exception_401
        # token_role = payload.get("role") # Can log or use if needed
    except JWTError as e:
        logger.warning(f"EXPLICIT_AUTH_CHECK: JWT Decode Error: {e}")
        raise credentials_exception_401
    
    user_orm = v2_crud_security.get_user_by_username(db, username=username)
    if not user_orm:
        logger.warning(f"EXPLICIT_AUTH_CHECK: User '{username}' not found in DB.")
        raise credentials_exception_401

    current_user = v2_security_schemas.User.model_validate(user_orm)
    if not current_user.is_active:
        logger.warning(f"EXPLICIT_AUTH_CHECK: User '{username}' is inactive.")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user (EXPLICIT_AUTH_CHECK)")

    logger.info(f"EXPLICIT_AUTH_CHECK: User '{username}' retrieved. Checking permissions: {required_permissions}")
    
    user_permissions_set = set(current_user.all_permission_codes or [])
    
    if required_permissions: 
        missing_permissions = [perm for perm in required_permissions if perm not in user_permissions_set]
        if missing_permissions:
            logger.warning(f"EXPLICIT_AUTH_CHECK: User '{username}' missing permissions: {missing_permissions}")
            raise credentials_exception_403
    
    logger.info(f"EXPLICIT_AUTH_CHECK: Permissions OK for user '{username}'. Returning user.")
    return current_user

# --- NEW MINIMAL PERMISSION GATE FACTORY (Plan Step 1b) ---
def minimal_permission_gate_factory():
    logger.info(f"@@@ MINIMAL_PERMISSION_GATE_FACTORY CALLED AT {datetime.now()} @@@")
    async def minimal_gate_checker() -> bool:
        logger.info(f"*** MINIMAL_GATE_CHECKER ENTERED AT {datetime.now()} ***")
        return True
    return minimal_gate_checker

# Keep old require_permissions (Test 12 version) commented out for now
# def require_permissions(required_permissions: List[str]):
#    logger.info(f"@@@ TEST 12: FACTORY require_permissions CALLED with required_permissions: {required_permissions} AT {datetime.now()}")
#    async def permission_checker( ... ) -> v2_security_schemas.User:
#        ... (Test 12 logic) ...
#    return permission_checker