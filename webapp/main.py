from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Query, status, Body # Add Body
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import List, Optional
import os
from dotenv import load_dotenv
from sqlalchemy.orm import Session # Added Session import
from datetime import datetime, timezone, timedelta
from fastapi.responses import FileResponse, HTMLResponse
from fastapi import BackgroundTasks
import shutil
import tempfile
import uuid
import pandas as pd
from sqlalchemy import select, text, func, and_, or_ # Added select, text, func, and_, or_
from sqlalchemy.orm import Session # Keep Session import
from sqlalchemy.exc import SQLAlchemyError # Added SQLAlchemyError
import sqlalchemy.exc as sa_exc # Added alias for SQLAlchemy exceptions
from . import file_converter
import logging
import subprocess
from fastapi.middleware.cors import CORSMiddleware

# Import new modules
from . import auth, models_db, schemas, models # Added models
from .database import get_db # Keep get_db import
from .routers import units # Keep units router import
from .routers import departments # Keep departments router import
from .routers import report_links  # 添加导入报表链接路由

# Load environment variables from .env file in the webapp directory
# Important: Webapp should manage its own .env for configuration separation
load_dotenv() 

DATABASE_URL = os.getenv("DATABASE_URL") # Assumes DATABASE_URL is in webapp/.env
if not DATABASE_URL:
    logger.critical("DATABASE_URL environment variable not set!")
    # Decide how to handle this - raise error, exit, use default? For now, let it fail later.
    DATABASE_URL = "postgresql://user:password@host:port/dbname" # Placeholder

app = FastAPI(title="Salary System API")

# Add CORS middleware
# Adjust origins based on your frontend development server URL
origins = [
    "http://localhost:3000", # Default create-react-app port
    "http://localhost:5173", # Default Vite port
    "http://127.0.0.1:5173",
    # Add other origins if needed (e.g., production frontend URL)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True, # Allow cookies/auth headers
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"], # Allow all standard methods
    allow_headers=["*"], # Allow all headers
)

# Include routers
app.include_router(units.router, prefix="/api/units-crud", tags=["Units CRUD"]) # Added: Include the units router
app.include_router(departments.router, prefix="/api/departments-crud", tags=["Departments CRUD"]) # Added: Include the departments router
app.include_router(
    report_links.router,
    prefix="/api/report-links",
    tags=["Report Links"]
) # 添加注册报表链接路由

# Configure logging for this module
logger = logging.getLogger(__name__)
# Basic config if run directly, but FastAPI might configure root logger
# logging.basicConfig(level=logging.INFO) 

# --- Configuration for INTERMEDIATE Output Columns --- START
# Based on the original script's expected_staging_columns
EXPECTED_INTERMEDIATE_COLUMNS = [
    'id_card_number', 'employee_name', # From KEY_JOIN_COLUMN_STAGING, NAME_COLUMN_STAGING
    'employee_unique_id', 'establishment_type_name', 'pay_period_identifier',
    # Job Attrs
    'job_attr_人员身份', 'job_attr_人员职级', 'job_attr_岗位类别', 'job_attr_参照正编岗位工资级别', 'job_attr_参照正编薪级工资级次', 'job_attr_工资级别', 'job_attr_工资档次', 'job_attr_固定薪酬全年应发数',
    # Salary Components
    'salary_一次性补扣发', 'salary_基础绩效奖补扣发', 'salary_职务技术等级工资', 'salary_级别岗位级别工资', 'salary_93年工改保留补贴', 'salary_独生子女父母奖励金', 'salary_岗位职务补贴', 'salary_公务员规范性津贴补贴', 'salary_公务交通补贴', 'salary_基础绩效奖', 'salary_见习试用期工资', 'salary_信访工作人员岗位津贴', 'salary_奖励绩效补扣发', 'salary_岗位工资', 'salary_薪级工资', 'salary_月基础绩效', 'salary_月奖励绩效', 'salary_基本工资', 'salary_绩效工资', 'salary_其他补助', 'salary_补发工资', 'salary_津贴', 'salary_季度考核绩效奖', 'salary_补助', 'salary_信访岗位津贴', 'salary_补扣发合计', 'salary_生活津贴', 'salary_补发薪级合计',
    'salary_total_backpay_amount',
    # Deductions (from dedicated sheets primarily)
    'deduct_个人缴养老保险费', 'deduct_个人缴医疗保险费', 'deduct_个人缴职业年金', 'deduct_个人缴住房公积金',
    # These might be on salary sheet but are expected in the intermediate output according to original script
    'deduct_个人缴失业保险费', # Added based on original script expected output
    'deduct_个人所得税', # Added based on original script expected output
    'deduct_其他扣款', # Added based on original script expected output
    'deduct_补扣退社保缴费', # Added based on original script expected output
    'deduct_补扣退公积金', # Added based on original script expected output
    'deduct_补扣个税', # Added based on original script expected output
    # Contributions (from dedicated sheets primarily)
    'contrib_单位缴养老保险费', 'contrib_单位缴医疗保险费', 'contrib_单位缴职业年金', 'contrib_单位缴住房公积金',
    # These might be on salary sheet but are expected in the intermediate output according to original script
    'contrib_单位缴失业保险费', # Added based on original script expected output
    'contrib_大病医疗单位缴纳', # Added based on original script expected output
    # Other
    'other_备注',
    # Metadata
    '_airbyte_source_file', '_airbyte_source_sheet',
]
# --- Configuration for INTERMEDIATE Output Columns --- END

# --- Configuration for Final Output Columns --- START
# This list defines the exact columns and their order expected in the final CSV output.
# Based on the structure used by dbt staging models and the original script.
FINAL_EXPECTED_COLUMNS = [
    'id_card_number', # Key
    'employee_name', # Key
    'employee_unique_id', # From 工号
    'establishment_type_name', # From 编制 or sheet name
    'pay_period_identifier', # Added during processing
    # Job Attributes
    'job_attr_personnel_identity',
    'job_attr_personnel_rank',
    'job_attr_post_category',
    'job_attr_ref_official_post_salary_level',
    'job_attr_ref_official_salary_step',
    'job_attr_salary_level',
    'job_attr_salary_grade',
    'job_attr_annual_fixed_salary_amount',
    # Salary Components (Map from Chinese names like '岗位工资')
    'salary_one_time_deduction',
    'salary_basic_performance_bonus_deduction',
    'salary_position_or_technical_salary', # 职务技术等级工资
    'salary_rank_or_post_grade_salary', # 级别岗位级别工资
    'salary_reform_1993_reserved_subsidy',
    'salary_only_child_parents_reward',
    'salary_post_position_allowance', # 岗位职务补贴
    'salary_civil_servant_normative_allowance',
    'salary_transportation_allowance',
    'salary_basic_performance_bonus',
    'salary_probation_salary', # 见习试用期工资
    'salary_petition_worker_post_allowance', # 信访工作人员岗位津贴
    'salary_reward_performance_deduction',
    'salary_post_salary', # 岗位工资
    'salary_salary_step', # 薪级工资
    'salary_monthly_basic_performance',
    'salary_monthly_reward_performance',
    'salary_basic_salary', # 基本工资
    # 'salary_performance_salary', # 绩效工资 - Often a total, check if needed
    'salary_other_allowance', # 其他补助 - Verify mapping
    'salary_salary_backpay', # 补发工资
    'salary_allowance', # 津贴 - Verify mapping
    'salary_quarterly_performance_bonus',
    'salary_subsidy', # 补助 - Verify mapping
    'salary_petition_post_allowance', # 信访岗位津贴
    # 'salary_total_deduction_adjustment', # 补扣发合计 - Check if mapped
    'salary_living_allowance',
    'salary_salary_step_backpay_total', # 补发薪级合计
    'salary_total_backpay_amount', # 补发合计
    # Deductions (From separate sheets, mapped to deduct_...)
    'deduct_self_pension_contribution',
    'deduct_self_medical_contribution',
    'deduct_self_annuity_contribution',
    'deduct_self_housing_fund_contribution',
    # 'deduct_self_unemployment_contribution', # Add if needed
    # 'deduct_individual_income_tax', # Add if mapped
    # 'deduct_other_deductions', # Add if mapped
    # 'deduct_social_insurance_adjustment', # Add if mapped
    # 'deduct_housing_fund_adjustment', # Add if mapped
    # 'deduct_tax_adjustment', # Add if mapped
    # Contributions (From separate sheets, mapped to contrib_...)
    'contrib_employer_pension_contribution',
    'contrib_employer_medical_contribution',
    'contrib_employer_annuity_contribution',
    'contrib_employer_housing_fund_contribution',
    # 'contrib_employer_unemployment_contribution', # Add if needed
    # 'contrib_employer_critical_illness_contribution', # Add if needed
    # Other
    'other_remarks', # From 备注
    # Metadata added by process
    '_airbyte_source_file',
    '_airbyte_source_sheet',
    '_airbyte_raw_id',
    '_airbyte_extracted_at',
    '_airbyte_meta'
]
# --- Configuration for Final Output Columns --- END

# --- Pydantic Model for Field Mapping --- START
class FieldMappingBase(BaseModel):
    target_name: str
    is_intermediate: Optional[bool] = None
    is_final: Optional[bool] = None
    description: Optional[str] = None
    data_type: Optional[str] = None

class FieldMappingCreate(FieldMappingBase):
    source_name: str # Included for creation

class FieldMappingUpdate(FieldMappingBase):
    pass # All fields are optional for update

class FieldMappingInDB(FieldMappingCreate):
    # Inherits source_name from Create, others from Base
    # No extra fields needed typically unless DB has more than model
    pass

# Response model for list
class FieldMappingListResponse(BaseModel):
    data: List[FieldMappingInDB]
# --- Pydantic Model for Field Mapping --- END

# --- Pydantic Model for Employee --- START
class EmployeeBase(BaseModel):
    name: str
    id_card_number: str # Consider adding validation regex
    department_id: Optional[int] = None
    employee_unique_id: Optional[str] = None # Optional: 工号
    bank_account_number: Optional[str] = None # Added
    bank_name: Optional[str] = None # Added
    establishment_type_id: Optional[int] = None # Added HERE
    # Add other relevant fields from your employees table
    # email: Optional[str] = None
    # phone_number: Optional[str] = None

class EmployeeCreate(EmployeeBase):
    pass # Inherits all fields from Base

class EmployeeUpdate(BaseModel):
    # All fields optional for update
    name: Optional[str] = None
    id_card_number: Optional[str] = None # Allow updating, but uniqueness check needed
    department_id: Optional[int] = None
    employee_unique_id: Optional[str] = None
    bank_account_number: Optional[str] = None # Added
    bank_name: Optional[str] = None # Added
    establishment_type_id: Optional[int] = None # Added for editing establishment

class EmployeeInDBBase(EmployeeBase):
    id: int # Primary key from DB
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    # establishment_type_id is now in EmployeeBase for consistency, but could be here too

    class Config:
        # orm_mode = True
        from_attributes = True # Use from_attributes for Pydantic v2 compatibility

# Used for response when getting a single employee or creating one
class EmployeeResponse(EmployeeInDBBase):
    # Optionally include related data like department name
    department_name: Optional[str] = None
    unit_name: Optional[str] = None
    # establishment_type_id is inherited from EmployeeInDBBase -> EmployeeBase
    establishment_type_name: Optional[str] = None # Added: Name corresponding to establishment_type_id

# Used for response when listing employees
class EmployeeListResponse(BaseModel):
    data: List[EmployeeResponse]
    total: int
# --- Pydantic Model for Employee --- END

# --- Pydantic Model for Department List --- START
class DepartmentInfo(BaseModel):
    id: int
    name: str
# --- Pydantic Model for Department List --- END

# --- Pydantic Model for Establishment Type List --- START
class EstablishmentTypeInfo(BaseModel):
    id: int
    name: str
# --- Pydantic Model for Establishment Type List --- END

# --- Pydantic Model for Pay Periods Response --- START
class PayPeriodsResponse(BaseModel):
    data: List[str]
# --- Pydantic Model for Pay Periods Response --- END

# --- Pydantic Model for Unit --- START
class UnitBase(BaseModel):
    name: str
    description: Optional[str] = None

class UnitCreate(UnitBase):
    pass

class UnitUpdate(BaseModel): # Explicitly define optional fields for update
    name: Optional[str] = None
    description: Optional[str] = None

class UnitInDBBase(UnitBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        # orm_mode = True # Keep for potential FastAPI use cases
        from_attributes = True # Use from_attributes for Pydantic v2 compatibility

# Response model for single Unit
class Unit(UnitInDBBase):
    pass

# Response model for list of Units
class UnitListResponse(BaseModel):
    data: List[Unit]
    total: int
# --- Pydantic Model for Unit --- END

# --- Pydantic Model for Department --- START
class DepartmentBase(BaseModel):
    name: str
    unit_id: int # Foreign key to Unit
    description: Optional[str] = None

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentUpdate(BaseModel): # Explicitly define optional fields for update
    name: Optional[str] = None
    description: Optional[str] = None
    # unit_id is typically not updated directly, handle via deletion/creation if needed

class DepartmentInDBBase(DepartmentBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        # orm_mode = True # Keep for potential FastAPI use cases
        from_attributes = True # Use from_attributes for Pydantic v2 compatibility

# Response model for single Department (includes unit name)
class Department(DepartmentInDBBase):
    unit_name: Optional[str] = None # Will be populated by CRUD function

# Response model for list of Departments
class DepartmentListResponse(BaseModel):
    data: List[Department]
    total: int
# --- Pydantic Model for Department --- END

# --- Pydantic Model for Salary Record (Used in get_salary_data) --- START
# TODO: Define this more precisely based on view_level1_calculations columns
class SalaryRecord(BaseModel):
    # Identifiers
    employee_id: int
    pay_period_identifier: str
    establishment_type_id: Optional[int] = None
    
    # Employee Info
    employee_name: Optional[str] = None
    id_card_number: Optional[str] = None
    
    # Dimension Attributes
    department_name: Optional[str] = None
    unit_name: Optional[str] = None
    establishment_type_name: Optional[str] = None
    
    # Job Attributes (Example subset - ADD ALL NEEDED FROM VIEW)
    job_attr_personnel_identity: Optional[str] = None
    job_attr_personnel_rank: Optional[str] = None
    job_attr_post_category: Optional[str] = None
    # ... add other job attributes
    
    # Salary Components (Example subset - ADD ALL NEEDED FROM VIEW)
    salary_post_salary: Optional[float] = None
    salary_salary_step: Optional[float] = None
    salary_basic_salary: Optional[float] = None
    salary_performance_salary: Optional[float] = None # Example
    # ... add many other salary components
    
    # Deductions (Example subset - ADD ALL NEEDED FROM VIEW)
    deduct_self_pension_contribution: Optional[float] = None
    deduct_self_medical_contribution: Optional[float] = None
    deduct_individual_income_tax: Optional[float] = None # Example
    # ... add other deductions
    
    # Contributions (Example subset - ADD ALL NEEDED FROM VIEW)
    contrib_employer_pension_contribution: Optional[float] = None
    contrib_employer_medical_contribution: Optional[float] = None
    # ... add other contributions
    
    # Calculated Totals (Example subset - ADD ALL NEEDED FROM VIEW)
    calc_total_payable: Optional[float] = None
    calc_net_pay: Optional[float] = None

    # Other fields
    other_remarks: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        # If reading directly from RealDictCursor, orm_mode/from_attributes might not be strictly needed
        # but doesn't hurt.
        # orm_mode = True # Use orm_mode=True for Pydantic v1 or from_attributes=True for v2
        from_attributes = True 

# Paginated response for salary data
class PaginatedSalaryResponse(BaseModel):
    data: List[SalaryRecord]
    total: int
# --- Pydantic Model for Salary Record --- END

# --- Pydantic Models Definitions (Moved Here) --- END ---


# --- Constants / Configurations (Moved below Models) ---

# --- Configuration for INTERMEDIATE Output Columns --- START
# Based on the original script's expected_staging_columns
EXPECTED_INTERMEDIATE_COLUMNS = [
    # // ... (list of columns) ...
]
# --- Configuration for INTERMEDIATE Output Columns --- END

# --- Configuration for Final Output Columns --- START
# This list defines the exact columns and their order expected in the final CSV output.
# Based on the structure used by dbt staging models and the original script.
FINAL_EXPECTED_COLUMNS = [
    # // ... (list of columns) ...
]
# --- Configuration for Final Output Columns --- END


# --- dbt Background Task Runner --- START
async def run_dbt_build(dbt_project_dir: str):
    """Runs 'dbt build' in the specified dbt project directory as a background task."""
    logger.info(f"[DBT Background Task] Starting dbt build for project: {dbt_project_dir}")
    try:
        command = ['dbt', 'build'] 
        logger.info(f"[DBT Background Task] Executing command: {' '.join(command)} in {dbt_project_dir}")
        
        result = subprocess.run(
            command,
            cwd=dbt_project_dir, 
            capture_output=True, 
            text=True,           
            check=False,         
            env=os.environ.copy() 
        )
        
        log_output = f"dbt stdout:\n{result.stdout}\ndbt stderr:\n{result.stderr}"
        if result.returncode == 0:
            logger.info(f"[DBT Background Task] dbt build completed successfully in {dbt_project_dir}.\n{log_output}")
        else:
            logger.error(f"[DBT Background Task] dbt build failed with return code {result.returncode} in {dbt_project_dir}.\n{log_output}")
            
    except FileNotFoundError:
        logger.error(f"[DBT Background Task] dbt command not found. Ensure dbt is installed and in PATH for the FastAPI process.")
    except Exception as e:
        logger.error(f"[DBT Background Task] An error occurred while running dbt build: {e}", exc_info=True)
# --- dbt Background Task Runner --- END


# --- Database Connection Helper Function (Commented out, using database.py now) ---
# def get_db_connection():
# // ... function body ...


# --- API Endpoints --- START ---

# --- Authentication Endpoint ---
@app.post("/token", response_model=schemas.Token, tags=["Authentication"])
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    Handles the OAuth2 password flow to authenticate a user and issue a JWT token.
    Now includes email in the token payload.
    """
    user = auth.authenticate_user(db, form_data.username, form_data.password)
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
        "role": user.role.name,
        "email": user.email  # Add the email field here
    }
    # --- Include email in the token payload --- END
    
    access_token = auth.create_access_token(
        data=token_data, 
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# --- NEW Registration Endpoint --- START
@app.post("/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED, tags=["Authentication"])
async def register_user(
    user_in: schemas.UserRegister,
    db: Session = Depends(get_db) # Changed conn to db: Session
):
    """Registers a new user with the default 'Guest' role."""
    # 1. Check if Guest role exists
    guest_role = models_db.get_role_by_name(db, "Guest")
    if not guest_role:
        logger.error("Default 'Guest' role not found in the database. Registration cannot proceed.")
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
        # models_db.create_user now handles integrity errors and raises HTTPException
        created_user = models_db.create_user(db, user=user_create_data, hashed_password=hashed_password)
        if not created_user:
             # This case should ideally not be reached if create_user raises exceptions
             raise HTTPException(status_code=500, detail="Failed to create user after database operation.")
        
        # Return the newly created user details (including the role)
        # The response model UserResponse will format it correctly
        return created_user 

    except HTTPException as http_exc:
        # Re-raise HTTPExceptions raised by create_user (e.g., 409 Conflict)
        raise http_exc
    except Exception as e:
        # Catch any other unexpected errors
        logger.error(f"Unexpected error during user registration for {user_in.username}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An internal server error occurred during registration.")
# --- NEW Registration Endpoint --- END

# --- User Management Endpoints --- START

# Endpoint accessible by Super Admin to create any user
@app.post("/api/users", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED, tags=["Users"])
async def create_user_endpoint(
    user: schemas.UserCreate,
    db: Session = Depends(get_db), # Changed conn to db: Session
    current_user: schemas.UserResponse = Depends(auth.require_role(["Super Admin"]))
):
    """
    Creates a new user by a Super Admin. Requires role_id to be specified.
    Uses the updated models_db.create_user function.
    """
    role = models_db.get_role_by_id(db, user.role_id)
    if not role:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Role with ID {user.role_id} not found.")

    hashed_password = auth.get_password_hash(user.password)
    
    try:
        created_user = models_db.create_user(db, user=user, hashed_password=hashed_password)
        if not created_user:
             raise HTTPException(status_code=500, detail="Failed to create user after database operation.")
        return created_user
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        logger.error(f"Unexpected error in create_user_endpoint: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An internal server error occurred.")

# Endpoint accessible by Super Admin to get a list of users
@app.get("/api/users", response_model=schemas.UserListResponse, tags=["Users"])
async def read_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db), # Changed conn to db: Session
    current_user: schemas.UserResponse = Depends(auth.require_role(["Super Admin"]))
):
    """
    Retrieves a list of users (including email) with pagination. Only accessible by Super Admins.
    Uses the updated models_db.get_users function.
    """
    try:
        users, total_count = models_db.get_users(conn, skip=skip, limit=limit)
        return {"data": users, "total": total_count}
    except Exception as e:
        logger.error(f"Failed to retrieve users: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to retrieve users")

# --- /me routes (MUST come BEFORE /{user_id} routes) --- START ---

@app.get("/api/users/me", response_model=schemas.UserResponse, tags=["Users"])
async def read_users_me(current_user: schemas.UserResponse = Depends(auth.get_current_user)):
    """
    Retrieves the details of the currently authenticated user.
    """
    return current_user

@app.put("/api/users/me", response_model=schemas.UserResponse, tags=["Users"])
async def update_current_user(
    user_update: schemas.UserUpdate = Body(...),
    current_user: schemas.UserResponse = Depends(auth.get_current_user),
    conn = Depends(get_db)
):
    """Updates the current logged-in user's information (e.g., email)."""
    if user_update.password is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password updates should be done via the /api/users/me/password endpoint."
        )
    
    updated_user_dict = models_db.update_user(
        conn=conn, 
        user_id=current_user.id, 
        user_update=user_update,
        hashed_password=None 
    )
    
    if updated_user_dict is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update user information.")

    return schemas.UserResponse(**updated_user_dict)

@app.put("/api/users/me/password", status_code=status.HTTP_204_NO_CONTENT, tags=["Users"])
async def update_current_user_password(
    payload: schemas.PasswordUpdate = Body(...),
    current_user: schemas.UserResponse = Depends(auth.get_current_user),
    conn = Depends(get_db)
):
    """Updates the current logged-in user's password."""
    current_hashed_password = models_db.get_user_hashed_password(conn, current_user.id)
    if not current_hashed_password or not auth.verify_password(payload.current_password, current_hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password"
        )
    
    new_hashed_password = auth.get_password_hash(payload.new_password)
    
    success = models_db.update_user_password(conn, current_user.id, new_hashed_password)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update password in the database."
        )
    return

# --- /me routes --- END ---

# --- Routes with /api/users/{user_id} (MUST come AFTER /api/users/me) --- START ---

@app.get("/api/users/{user_id}", response_model=schemas.UserResponse, tags=["Users"])
async def read_user(
    user_id: int,
    conn = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.require_role(["Super Admin"]))
):
    """
    Retrieves details for a specific user by ID (including email). Only accessible by Super Admins.
    Uses the updated models_db.get_user_by_id function.
    """
    db_user = models_db.get_user_by_id(conn, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return db_user

@app.put("/api/users/{user_id}", response_model=schemas.UserResponse, tags=["Users"])
async def update_user_endpoint(
    user_id: int,
    user_update: schemas.UserUpdate,
    conn = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.require_role(["Super Admin"]))
):
    """
    Updates a user's details (including optional email). Only accessible by Super Admins.
    Uses the updated models_db.update_user function.
    """
    existing_user = models_db.get_user_by_id(conn, user_id)
    if not existing_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if user_update.role_id is not None:
        role = models_db.get_role_by_id(conn, user_update.role_id)
        if not role:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Role with ID {user_update.role_id} not found.")

    hashed_password = None
    if user_update.password:
        hashed_password = auth.get_password_hash(user_update.password)

    try:
        updated_user = models_db.update_user(
            conn,
            user_id=user_id,
            user_update=user_update,
            hashed_password=hashed_password
        )
        return updated_user
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        logger.error(f"Unexpected error in update_user_endpoint for user {user_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An internal server error occurred during user update.")

@app.delete("/api/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Users"])
async def delete_user_endpoint(
    user_id: int,
    conn = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.require_role(["Super Admin"]))
):
    """
    Deletes a user. Only accessible by Super Admins.
    Prevents a user from deleting themselves.
    """
    if current_user.id == user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot delete yourself.")

    deleted_count = models_db.delete_user(conn, user_id=user_id)
    if deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return 

# --- Routes with /api/users/{user_id} --- END ---

# Endpoint accessible by Super Admin to get list of roles
@app.get("/api/roles", response_model=List[schemas.RoleResponse], tags=["Users"])
async def get_roles_list(
    conn = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.require_role(["Super Admin"]))
):
    """
    Retrieves a list of all available roles. Only accessible by Super Admins.
    """
    try:
        roles = models_db.get_roles(conn)
        return roles
    except Exception as e:
        logger.error(f"Failed to retrieve roles: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to retrieve roles")

# --- User Management Endpoints --- END

# --- Existing Helper CRUD Functions (Not Endpoints) ---
# IMPORTANT: Keep these definitions if they are used internally by endpoints
# TODO: Review if these should be moved to models_db.py for better separation

def create_unit(conn, unit: UnitCreate) -> dict:
    # // ... function body ...
    pass

def get_unit_by_id(conn, unit_id: int) -> Optional[dict]:
    # // ... function body ...
    pass

def get_units(conn, search: Optional[str], limit: int, offset: int) -> tuple[List[dict], int]:
    """Fetches a paginated list of units with optional search."""
    units_list = []
    total_count = 0
    base_query = "FROM public.units "
    where_clauses = []
    params = {}

    if search:
        where_clauses.append("name ILIKE %(search)s")
        params['search'] = f"%{search}%"

    where_sql = ""
    if where_clauses:
        where_sql = " WHERE " + " AND ".join(where_clauses)

    count_query = f"SELECT COUNT(*) {base_query} {where_sql};"
    data_query = f"SELECT id, name, description, created_at, updated_at {base_query} {where_sql} ORDER BY name LIMIT %(limit)s OFFSET %(offset)s;"
    params['limit'] = limit
    params['offset'] = offset

    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Get total count
            cur.execute(count_query, params)
            total_count = cur.fetchone()['count']
            
            # Get data
            cur.execute(data_query, params)
            units_list = cur.fetchall()
            
            # Convert datetime objects to ISO format strings or handle as needed by Pydantic
            for unit in units_list:
                if unit.get('created_at'):
                    unit['created_at'] = unit['created_at'].isoformat()
                if unit.get('updated_at'):
                    unit['updated_at'] = unit['updated_at'].isoformat()
                    
    except psycopg2.Error as e:
        logger.error(f"Database error fetching units: {e}", exc_info=True)
        # Don't return None, raise an exception that FastAPI can handle
        raise HTTPException(status_code=500, detail="数据库错误：无法获取单位列表。")
    except Exception as e:
        logger.error(f"Unexpected error fetching units: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="内部服务器错误：获取单位列表时发生意外。")

    return units_list, total_count

def update_unit(conn, unit_id: int, unit_update: UnitUpdate) -> Optional[dict]:
    # // ... function body ...
    pass

def delete_unit(conn, unit_id: int) -> bool:
    # // ... function body ...
    pass

def create_department(conn, department: DepartmentCreate) -> dict:
    # // ... function body ...
    pass

def get_department_by_id(conn, department_id: int) -> Optional[dict]:
    # // ... function body ...
    pass

def get_departments(conn, unit_id: Optional[int], search: Optional[str], limit: int, offset: int) -> tuple[List[dict], int]:
    """Fetches a paginated list of departments with optional filtering by unit and search."""
    departments_list = []
    total_count = 0
    # Select columns from departments and the unit name
    select_clause = "SELECT d.id, d.name, d.unit_id, d.description, d.created_at, d.updated_at, u.name as unit_name "
    base_query = "FROM public.departments d LEFT JOIN public.units u ON d.unit_id = u.id "
    where_clauses = []
    params = {}

    if unit_id is not None:
        where_clauses.append("d.unit_id = %(unit_id)s")
        params['unit_id'] = unit_id

    if search:
        where_clauses.append("d.name ILIKE %(search)s")
        params['search'] = f"%{search}%"

    where_sql = ""
    if where_clauses:
        where_sql = " WHERE " + " AND ".join(where_clauses)

    count_query = f"SELECT COUNT(d.*) {base_query} {where_sql};"
    # Use all params except limit/offset for count
    count_params = params.copy()

    data_query = f"{select_clause} {base_query} {where_sql} ORDER BY d.name LIMIT %(limit)s OFFSET %(offset)s;"
    # Add limit/offset for data query
    params['limit'] = limit
    params['offset'] = offset

    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Get total count
            cur.execute(count_query, count_params)
            total_count = cur.fetchone()['count']

            # Get data
            cur.execute(data_query, params)
            departments_list = cur.fetchall()

            # Convert datetime objects
            for dept in departments_list:
                if dept.get('created_at'):
                    dept['created_at'] = dept['created_at'].isoformat()
                if dept.get('updated_at'):
                    dept['updated_at'] = dept['updated_at'].isoformat()

    except psycopg2.Error as e:
        logger.error(f"Database error fetching departments: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="数据库错误：无法获取部门列表。")
    except Exception as e:
        logger.error(f"Unexpected error fetching departments: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="内部服务器错误：获取部门列表时发生意外。")

    return departments_list, total_count

def update_department(conn, department_id: int, department_update: DepartmentUpdate) -> Optional[dict]:
    # // ... function body ...
    pass

def delete_department(conn, department_id: int) -> bool:
    # // ... function body ...
    pass

# --- Endpoints start here --- 

@app.get("/")
async def read_root():
    """Root endpoint providing a welcome message."""
    return {"message": "Welcome to the Salary System API"}

# --- NEW ROUTE for Pay Periods --- START
@app.get("/api/salary_data/pay_periods", response_model=PayPeriodsResponse, tags=["Salary Data"])
async def get_available_pay_periods(
    # Change conn to db: Session
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.get_current_user) # Require login
):
    """Fetches a list of unique pay periods (YYYY-MM) available in the raw staging data using SQLAlchemy."""
    # Removed cursor initialization
    try:
        # Removed cursor creation
        # Use text() for the raw SQL query with SQLAlchemy execute
        query = text("""
            SELECT DISTINCT pay_period_identifier 
            FROM raw_salary_data_staging 
            WHERE pay_period_identifier IS NOT NULL
            ORDER BY pay_period_identifier DESC;
        """)
        result = db.execute(query)
        # Use mappings().all() to get list of RowMapping objects
        results_rows = result.mappings().all()
        
        # Extract the identifiers into a list
        periods_list = [row['pay_period_identifier'] for row in results_rows]
        
        return PayPeriodsResponse(data=periods_list)
        
    except sa_exc.SQLAlchemyError as error: # Catch SQLAlchemy errors
        logger.error(f"Database error fetching pay periods: {error}", exc_info=True)
        # No rollback needed for SELECT
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch pay periods from the database."
        )
    except Exception as e: # Catch any other unexpected errors
        logger.error(f"Unexpected error fetching pay periods: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected server error occurred while fetching pay periods."
        )
    # Removed finally block with cursor.close()

@app.get("/api/salary_data", response_model=PaginatedSalaryResponse, tags=["Salary Data"])
async def get_salary_data(
    limit: int = 100, 
    offset: int = 0, 
    pay_period: Optional[str] = None,
    employee_name: Optional[str] = None,
    department_name: Optional[str] = None,
    unit_name: Optional[str] = None,
    establishment_type_name: Optional[str] = None,
    db: Session = Depends(get_db), # Use db: Session
    # Replace Basic Auth with JWT Auth (any logged-in user)
    current_user: schemas.UserResponse = Depends(auth.get_current_user)
):
    """Fetches paginated salary data based on filters."""
    # logger.info(f"Fetching salary data with limit={limit}, offset={offset}, pay_period={pay_period}")
    # logger.info(f"Filters - Employee: {employee_name}, Dept: {department_name}, Unit: {unit_name}, Est Type: {establishment_type_name}")

    # Start building the query using SQLAlchemy Core or ORM if possible.
    # For complex dynamic queries, text() is often easier initially.
    base_query = "SELECT * FROM public.view_level1_calculations WHERE 1=1" # Corrected view name
    count_query = "SELECT COUNT(*) FROM public.view_level1_calculations WHERE 1=1" # Corrected view name
    params = {}
    count_params = {}
    # param_index = 1 # Not needed for named parameters

    filters = []
    if pay_period:
        filters.append("pay_period_identifier = :pay_period")
        params['pay_period'] = pay_period
        count_params['pay_period'] = pay_period

    if employee_name:
        filters.append("employee_name ILIKE :employee_name") # Use ILIKE for case-insensitive search
        params['employee_name'] = f"%{employee_name}%"
        count_params['employee_name'] = f"%{employee_name}%"

    if department_name:
        filters.append("department_name = :department_name")
        params['department_name'] = department_name
        count_params['department_name'] = department_name
        
    if unit_name:
        filters.append("unit_name = :unit_name")
        params['unit_name'] = unit_name
        count_params['unit_name'] = unit_name

    if establishment_type_name:
        filters.append("establishment_type_name = :establishment_type_name")
        params['establishment_type_name'] = establishment_type_name
        count_params['establishment_type_name'] = establishment_type_name

    if filters:
        filter_clause = " AND ".join(filters)
        base_query += f" AND {filter_clause}"
        count_query += f" AND {filter_clause}"

    # Add ordering and pagination
    # Default ordering, adjust as needed
    base_query += " ORDER BY employee_name, pay_period_identifier LIMIT :limit OFFSET :offset"
    params['limit'] = limit
    params['offset'] = offset

    # logger.debug(f"Executing SQL: {base_query} with params: {params}")
    # logger.debug(f"Executing Count SQL: {count_query} with params: {count_params}")

    try:
        # Execute count query
        total_result = db.execute(text(count_query), count_params)
        total = total_result.scalar_one()
        # logger.debug(f"Total records found: {total}")

        # Execute main data query
        result = db.execute(text(base_query), params)
        # Use mappings().all() to get list of dict-like Row objects
        items_raw = result.mappings().all()
        # logger.debug(f"Fetched {len(items_raw)} raw items.")
        
        # Convert Row objects to dictionaries if needed by Pydantic model,
        # Pydantic v2 with from_attributes=True should handle Row objects directly.
        # If issues arise, uncomment the list comprehension:
        # items = [dict(row) for row in items_raw]
        items = items_raw # Try direct assignment first
        # logger.debug(f"Processed items: {items[:2]}..." if items else "Processed items: []")

        return PaginatedSalaryResponse(data=items, total=total)

    except sa_exc.SQLAlchemyError as e: # Catch SQLAlchemy specific errors
        logger.error(f"Database error fetching salary data: {e}", exc_info=True)
        # It's often better to return a generic error message to the client
        raise HTTPException(status_code=500, detail="Database error occurred while fetching salary data.")
    except Exception as e:
        # Catch any other unexpected errors
        logger.error(f"Unexpected error fetching salary data: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An unexpected server error occurred.")

# --- Endpoint to get distinct establishment types ---
@app.get("/api/establishment-types", response_model=List[str], tags=["Helper Lists"])
async def get_establishment_types(
    # conn = Depends(get_db), # Original commented out
    db: Session = Depends(get_db), # Use db: Session
    # Replace Basic Auth with JWT Auth (any logged-in user)
    current_user: schemas.UserResponse = Depends(auth.get_current_user)
):
    """Fetches distinct establishment type names."""
    try:
        # Use SQLAlchemy ORM query - Assumes 'EstablishmentType' model and 'name' attribute
        results = db.query(models.EstablishmentType.name).distinct().order_by(models.EstablishmentType.name).all()
        # results will be a list of tuples, e.g., [('Type A',), ('Type B',)]
        types = [row[0] for row in results if row[0]] # Extract the first element and filter None/empty
        return types
    except sa_exc.SQLAlchemyError as e: # Catch SQLAlchemy specific errors
        logger.error(f"Database error fetching establishment types: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Database error occurred while fetching establishment types.")
    except Exception as e:
        logger.error(f"Unexpected error fetching establishment types: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An unexpected server error occurred.")

# --- Endpoint to get distinct department names ---
@app.get("/api/departments", response_model=List[str], tags=["Helper Lists"])
async def api_get_distinct_department_names(
    # conn = Depends(get_db), # Original commented out
    db: Session = Depends(get_db), # Use db: Session
    # Replace Basic Auth with JWT Auth (any logged-in user)
    current_user: schemas.UserResponse = Depends(auth.get_current_user)
):
    """Fetches distinct department names."""
    try:
         # Use SQLAlchemy ORM query - Assumes 'Department' model and 'name' attribute
        results = db.query(models.Department.name).distinct().order_by(models.Department.name).all()
        departments = [row[0] for row in results if row[0]] # Extract names, filter None/empty
        return departments
    except sa_exc.SQLAlchemyError as e: # Catch SQLAlchemy specific errors
        logger.error(f"Database error fetching department names: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Database error occurred while fetching department names.")
    except Exception as e:
        logger.error(f"Unexpected error fetching department names: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An unexpected server error occurred.")

# --- Endpoint to get distinct unit names ---
@app.get("/api/units", response_model=List[str], tags=["Helper Lists"])
async def api_get_distinct_unit_names(
    # conn = Depends(get_db), # Original commented out
    db: Session = Depends(get_db), # Use db: Session
    # Replace Basic Auth with JWT Auth (any logged-in user)
    current_user: schemas.UserResponse = Depends(auth.get_current_user)
):
    """Fetches distinct unit names."""
    try:
        # Use SQLAlchemy ORM query - Assumes 'Unit' model and 'name' attribute
        results = db.query(models.Unit.name).distinct().order_by(models.Unit.name).all()
        units = [row[0] for row in results if row[0]] # Extract names, filter None/empty
        return units
    except sa_exc.SQLAlchemyError as e: # Catch SQLAlchemy specific errors
        logger.error(f"Database error fetching unit names: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Database error occurred while fetching unit names.")
    except Exception as e:
        logger.error(f"Unexpected error fetching unit names: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An unexpected server error occurred.")

# --- Endpoint to get departments list (ID and Name) --- START
@app.get("/api/departments-list", response_model=List[DepartmentInfo], tags=["Helper Lists"])
async def get_departments_list(
    # conn = Depends(get_db), # Original commented out
    db: Session = Depends(get_db), # Use db: Session
    # Replace Basic Auth with JWT Auth (any logged-in user)
    current_user: schemas.UserResponse = Depends(auth.get_current_user)
):
    """Fetches a list of all departments with their IDs and names using ORM."""
    try:
        # Use SQLAlchemy ORM query
        results = db.query(
            models.Department.id,
            models.Department.name
        ).order_by(models.Department.name).all()
        # Pydantic model DepartmentInfo expects id and name, 
        # ORM result provides tuples or Row objects compatible with from_attributes=True
        logger.info(f"Fetched {len(results)} departments for list.")
        return results
    except sa_exc.SQLAlchemyError as e:
        logger.error(f"Database error fetching departments list: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Database error occurred while fetching departments list.")
    except Exception as e:
        logger.error(f"Unexpected error fetching departments list: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An unexpected server error occurred.")
    # No finally block needed for db session management with Depends
# --- Endpoint to get departments list (ID and Name) --- END

# --- New endpoint for Establishment Types List --- START
@app.get("/api/establishment-types-list", response_model=List[EstablishmentTypeInfo], tags=["Helper Lists"])
async def get_establishment_types_list(
    # conn = Depends(get_db), # Original commented out
    db: Session = Depends(get_db), # Use db: Session
    # Replace Basic Auth with JWT Auth (any logged-in user)
    current_user: schemas.UserResponse = Depends(auth.get_current_user)
):
    """Fetches a list of all establishment types with their IDs and names using ORM."""
    try:
        # Use SQLAlchemy ORM query
        results = db.query(
            models.EstablishmentType.id,
            models.EstablishmentType.name
        ).order_by(models.EstablishmentType.name).all()
        # Pydantic model EstablishmentTypeInfo expects id and name
        logger.info(f"Fetched {len(results)} establishment types for list.")
        return results
    except sa_exc.SQLAlchemyError as e:
        logger.error(f"Database error fetching establishment types list: {e}", exc_info=True)
        # conn.rollback() # No rollback needed for SELECT usually, handled by session context
        raise HTTPException(status_code=500, detail="Database error occurred while fetching establishment types list.")
    except Exception as e:
        logger.error(f"Unexpected error fetching establishment types list: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An unexpected server error occurred.")
    # No finally block needed for db session or cursor
# --- New endpoint for Establishment Types List --- END

# --- Serve HTML Frontend --- # New Section

@app.get("/converter", response_class=HTMLResponse)
async def get_converter_page():
    """Serves the Excel to CSV converter HTML page."""
    html_file_path = os.path.join(os.path.dirname(__file__), "converter.html")
    if not os.path.exists(html_file_path):
        # Log this error
        print(f"Frontend HTML file not found at: {html_file_path}")
        raise HTTPException(status_code=404, detail="Converter page not found.")
    try:
        with open(html_file_path, "r", encoding="utf-8") as f:
            html_content = f.read()
        return HTMLResponse(content=html_content)
    except Exception as e:
        print(f"Error reading HTML file {html_file_path}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Could not load converter page.")

# --- File Conversion Endpoint --- # New Section

@app.post("/api/convert/excel-to-csv", response_class=FileResponse, tags=["File Conversion"])
async def convert_excel_to_csv(
    background_tasks: BackgroundTasks, 
    file: UploadFile = File(...),
    pay_period: str = Query(..., regex=r"^\d{4}-\d{2}$", description="Pay period in YYYY-MM format"),
    import_to_db: bool = Query(False, description="Set to true to import the generated CSV into the staging table."),
    # Change conn to db: Session
    db: Session = Depends(get_db),
    # Replace Basic Auth with JWT Auth (Super Admin or Data Admin)
    current_user: schemas.UserResponse = Depends(auth.require_role(["Super Admin", "Data Admin"])) 
):
    """
    Receives an Excel file, converts it, optionally imports the result to the staging table,
    and returns the generated CSV file.
    Uses SQLAlchemy Session for DB interactions where possible, retaining psycopg2 COPY for performance.
    """
    temp_dir = None
    temp_excel_path = None
    temp_csv_path = None
    df_final_renamed = None

    try:
        # 1. Save uploaded Excel to a temporary file
        temp_dir = tempfile.mkdtemp(prefix="salary_upload_")
        temp_excel_filename = f"{uuid.uuid4()}_{file.filename}"
        temp_excel_path = os.path.join(temp_dir, temp_excel_filename)
        logger.info(f"Saving uploaded file to temporary path: {temp_excel_path}")
        with open(temp_excel_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        logger.info("File saved successfully.")

        # 2. Process Excel to Intermediate DataFrame using file_converter
        logger.info(f"Processing Excel to intermediate DataFrame for period: {pay_period}")
        df_intermediate = file_converter.process_excel_to_dataframe(temp_excel_path, pay_period)
        
        if df_intermediate is None:
            logger.error("file_converter.process_excel_to_dataframe returned None. Processing failed.")
            raise HTTPException(status_code=400, detail="Failed to process Excel file. Check logs for details.")
        
        logger.info(f"Intermediate DataFrame processed. Rows: {len(df_intermediate)}, Columns: {df_intermediate.columns.tolist()}")

        # 3. Ensure Intermediate DataFrame Structure (Match original script's output before rename)
        logger.info("Ensuring intermediate DataFrame structure...")
        present_columns = df_intermediate.columns.tolist()
        final_intermediate_columns = []
        added_cols = []
        missing_cols = []
        
        for col in EXPECTED_INTERMEDIATE_COLUMNS:
            if col in present_columns:
                final_intermediate_columns.append(col)
            else:
                df_intermediate[col] = None # Add missing column with None/NaN
                final_intermediate_columns.append(col)
                missing_cols.append(col)
                added_cols.append(col)
                logger.warning(f"Expected intermediate column '{col}' was missing. Added with None.")
        
        try:
            df_intermediate_structured = df_intermediate[final_intermediate_columns].copy()
            logger.info(f"Intermediate DataFrame structured. Missing columns added: {missing_cols}. Final intermediate columns: {df_intermediate_structured.columns.tolist()}")
        except KeyError as e:
            logger.error(f"KeyError during intermediate column reindexing: {e}. This shouldn't happen if missing columns were added.", exc_info=True)
            raise HTTPException(status_code=500, detail="Internal error structuring intermediate data.")

        # 4. Rename Headers to Final English Names using DB mapping (Pass db Session)
        logger.info(f"Renaming intermediate headers using DB mapping...")
        df_final_renamed = file_converter.rename_dataframe_headers(df_intermediate_structured, db)
        logger.info(f"Final header renaming complete. Initial columns: {df_final_renamed.columns.tolist()}")

        # --- Add Step 4.5: Reindex DataFrame to match FINAL_EXPECTED_COLUMNS --- START
        logger.info(f"Reindexing final DataFrame to match FINAL_EXPECTED_COLUMNS...")
        df_final_output = pd.DataFrame()
        missing_final_cols = []
        try:
            # Ensure all expected final columns exist, add if missing 
            for col in FINAL_EXPECTED_COLUMNS:
                 if col not in df_final_renamed.columns:
                      logger.warning(f"Final expected column '{col}' missing after rename. Adding as None.")
                      df_final_renamed[col] = None
                      missing_final_cols.append(col)
            # Select and reorder columns exactly as defined
            df_final_output = df_final_renamed[FINAL_EXPECTED_COLUMNS].copy()
            logger.info(f"Final DataFrame reindexed successfully. Missing columns added: {missing_final_cols}. Final output columns: {df_final_output.columns.tolist()}")
        except KeyError as e:
             logger.error(f"KeyError during final column selection: {e}. Columns available after rename: {df_final_renamed.columns.tolist()}", exc_info=True)
             # This indicates a mismatch between FINAL_EXPECTED_COLUMNS and what rename produced/DB mapping has
             raise HTTPException(status_code=500, detail=f"Internal error preparing final CSV structure: missing key {e}. Check FINAL_EXPECTED_COLUMNS definition.")
        # --- Add Step 4.5 --- END

        # --- Add Step 4.6: Generate _airbyte_raw_id --- START
        try:
            df_final_output['_airbyte_raw_id'] = [str(uuid.uuid4()) for _ in range(len(df_final_output))]
            logger.info(f"Added '_airbyte_raw_id' column with generated UUIDs. Final columns: {df_final_output.columns.tolist()}")
        except Exception as uuid_err:
            logger.error(f"Error generating UUIDs for '_airbyte_raw_id': {uuid_err}", exc_info=True)
            # Decide if this is critical. If _airbyte_raw_id is required for import, raise.
            raise HTTPException(status_code=500, detail="Failed to generate required internal IDs.")
        # --- Add Step 4.6 --- END
        
        # --- Add Step 4.7: Generate _airbyte_extracted_at --- START
        try:
            now_utc = datetime.now(timezone.utc)
            df_final_output['_airbyte_extracted_at'] = now_utc 
            logger.info(f"Added '_airbyte_extracted_at' column with value: {now_utc.isoformat()}. Final columns: {df_final_output.columns.tolist()}")
        except Exception as ts_err:
            logger.error(f"Error generating timestamp for '_airbyte_extracted_at': {ts_err}", exc_info=True)
            # If this timestamp is required for import, raise.
            raise HTTPException(status_code=500, detail="Failed to generate required timestamp.")
        # --- Add Step 4.7 --- END

        # --- Add Step 4.8: Generate _airbyte_meta --- START
        try:
            df_final_output['_airbyte_meta'] = '{}' # Assign empty JSON object as string
            logger.info(f"Added '_airbyte_meta' column with default value: '{{}}'. Final columns: {df_final_output.columns.tolist()}")
        except Exception as meta_err:
            logger.error(f"Error assigning default value for '_airbyte_meta': {meta_err}", exc_info=True)
            # Decide if this is critical. If required, raise.
            raise HTTPException(status_code=500, detail="Failed to prepare required metadata column.")
        # --- Add Step 4.8 --- END

        # --- Add Step 4.9: Deduplicate DataFrame --- START
        logger.info(f"DataFrame shape before deduplication: {df_final_output.shape}")
        # Define columns to check for duplicates within the same pay period
        duplicate_check_cols = ['id_card_number', 'pay_period_identifier']
        try:
            # Drop duplicates based on the defined columns, keeping the first occurrence
            df_final_output.drop_duplicates(subset=duplicate_check_cols, keep='first', inplace=True)
            logger.info(f"DataFrame shape after deduplication on {duplicate_check_cols}: {df_final_output.shape}")
        except KeyError as e:
            logger.error(f"Error during deduplication: One of the key columns {duplicate_check_cols} not found. Columns: {df_final_output.columns.tolist()}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Internal error preparing data: Missing key column for deduplication.")
        except Exception as dedup_err:
            logger.error(f"Unexpected error during DataFrame deduplication: {dedup_err}", exc_info=True)
            raise HTTPException(status_code=500, detail="Internal error during data deduplication.")
        # --- Add Step 4.9: Deduplicate DataFrame --- END

        # 5. Save Final DataFrame to a temporary CSV file
        temp_csv_filename = f"converted_{pay_period}_{uuid.uuid4()}.csv"
        temp_csv_path = os.path.join(temp_dir, temp_csv_filename)
        logger.info(f"Saving reindexed final data to temporary CSV: {temp_csv_path}")
        # Save the reindexed dataframe
        df_final_output.to_csv(temp_csv_path, index=False, encoding='utf-8-sig') 
        logger.info("Final CSV saved successfully.")

        # --- Database Import Logic --- START
        import_status = "skipped" # Default status if import is not requested
        import_message = ""

        if import_to_db:
            logger.info(f"Import to DB requested. Attempting to import {temp_csv_path} to public.raw_salary_data_staging")
            
            copy_columns = ", ".join(FINAL_EXPECTED_COLUMNS) 
            copy_sql = f"COPY public.raw_salary_data_staging ({copy_columns}) FROM STDIN WITH (FORMAT CSV, HEADER TRUE, DELIMITER ',', NULL '')"
            # Use named parameter for delete
            delete_sql = text("DELETE FROM public.raw_salary_data_staging WHERE pay_period_identifier = :pay_period;")
            delete_params = {'pay_period': pay_period}
            
            raw_conn = None # Initialize raw_conn
            try:
                # --- Delete existing data for the period using Session --- START
                logger.info(f"Attempting to delete existing records for pay period {pay_period} from staging table using Session...")
                delete_result = db.execute(delete_sql, delete_params)
                logger.info(f"Deleted {delete_result.rowcount} existing records for pay period {pay_period}.")
                # --- Delete existing data for the period --- END
                
                # --- Copy new data using raw connection --- START
                logger.info(f"Getting raw DBAPI connection for COPY operation...")
                # Get the underlying DBAPI connection from the Session
                raw_conn = db.connection().connection 
                logger.info(f"Executing COPY command: {copy_sql[:200]}... using raw cursor") 
                with open(temp_csv_path, 'r', encoding='utf-8-sig') as csv_file:
                    # Use the raw connection's cursor for copy_expert
                    with raw_conn.cursor() as cur: 
                        cur.copy_expert(sql=copy_sql, file=csv_file)
                        row_count = cur.rowcount 
                # --- Copy new data --- END
                
                db.commit() # Commit the transaction via the Session
                import_status = "success"
                import_message = f"Successfully imported {row_count if row_count >= 0 else 'unknown number of'} rows into raw_salary_data_staging."
                logger.info(import_message)

                # --- Trigger dbt Run using Helper Function --- START ---
                current_dir = os.path.dirname(os.path.abspath(__file__))
                dbt_project_path = os.path.abspath(os.path.join(current_dir, '../salary_dbt_transforms'))
                _trigger_dbt_build_if_project_valid(background_tasks, dbt_project_path)
                # --- Trigger dbt Run using Helper Function --- END ---

            except psycopg2.Error as import_err:
                conn.rollback() 
                logger.error(f"Database error during CSV import: {import_err}", exc_info=True)
                import_status = "failed"
                # Extract a cleaner error message if possible
                error_first_line = str(import_err).split('\n')[0] # Get first line of error
                import_message = f"Database import failed: {error_first_line}" # Use the extracted line
            except Exception as e:
                conn.rollback() 
                logger.error(f"Unexpected error during CSV import process: {e}", exc_info=True)
                import_status = "failed"
                import_message = f"Unexpected error during import: {str(e)}"
        # --- Database Import Logic --- END

        # Schedule temporary directory cleanup *only* after successful CSV save (and import attempt)
        background_tasks.add_task(shutil.rmtree, temp_dir)
        logger.info(f"Scheduled cleanup for temporary directory: {temp_dir}")

        # Prepare custom headers for the response
        response_headers = {
            # Add import status headers ONLY if import was attempted
            **( { 
                "X-Import-Status": import_status,
                "X-Import-Message": import_message.encode('utf-8').decode('latin-1') # Basic encoding for header
              } if import_to_db else {} ),
            # Ensure Content-Disposition is set correctly by FileResponse itself usually,
            # but you could override if needed.
        }

        # Return the temporary CSV file as a response, regardless of import success/failure
        return FileResponse(
            path=temp_csv_path, 
            media_type='text/csv', 
            filename=f"salary_record_{pay_period.replace('-','')}.csv",
            headers=response_headers # Add custom headers
        )

    except HTTPException as http_exc: 
        if temp_dir and os.path.exists(temp_dir):
            try:
                shutil.rmtree(temp_dir)
                logger.warning(f"Cleaned up temp directory {temp_dir} due to HTTPException.")
            except Exception as cleanup_err:
                logger.error(f"Error cleaning up temp directory {temp_dir} after HTTPException: {cleanup_err}")
        raise http_exc
    except Exception as e:
        logger.error(f"An unexpected error occurred in convert_excel_to_csv: {e}", exc_info=True)
        if temp_dir and os.path.exists(temp_dir):
            try:
                shutil.rmtree(temp_dir)
                logger.warning(f"Cleaned up temp directory {temp_dir} due to unexpected error.")
            except Exception as cleanup_err:
                logger.error(f"Error cleaning up temp directory {temp_dir} after unexpected error: {cleanup_err}")
        raise HTTPException(status_code=500, detail=f"An internal server error occurred: {e}")
    finally:
        # Ensure the database connection provided by Depends is closed by FastAPI
        # We don't close conn manually here if obtained via Depends
        # Ensure the uploaded file handle is closed 
        if hasattr(file, 'file') and not file.file.closed:
            file.file.close()

# --- Config Management Endpoints --- START
@app.get("/api/config/mappings", response_model=FieldMappingListResponse, tags=["Configuration"])
async def get_all_field_mappings(
    # Change conn to db: Session
    db: Session = Depends(get_db),
    # Replace Basic Auth with JWT Auth (Super Admin only)
    current_user: schemas.UserResponse = Depends(auth.require_role(["Super Admin"])) 
):
    """Fetches all field mapping records from the database using SQLAlchemy Session."""
    query = text("SELECT source_name, target_name, is_intermediate, is_final, description, data_type FROM public.salary_field_mappings ORDER BY source_name;")
    try:
        # Execute using db.execute and get mappings
        result = db.execute(query)
        mappings = result.mappings().all()
        logger.info(f"Found {len(mappings)} field mappings.")
        return {"data": mappings}
    except sa_exc.SQLAlchemyError as e: # Use SQLAlchemy exceptions
        logger.error(f"Database query error for field mappings: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve field mappings.")
    except Exception as e:
        logger.error(f"An unexpected error occurred fetching field mappings: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An internal server error occurred.")
    # No finally block needed, session managed by Depends

@app.post("/api/config/mappings", response_model=FieldMappingInDB, status_code=201, tags=["Configuration"])
async def create_field_mapping(
    mapping: FieldMappingCreate,
    # Change conn to db: Session
    db: Session = Depends(get_db),
    # Replace Basic Auth with JWT Auth (Super Admin only)
    current_user: schemas.UserResponse = Depends(auth.require_role(["Super Admin"])) 
):
    """Creates a new field mapping record using SQLAlchemy Session."""
    query = text("""
        INSERT INTO public.salary_field_mappings 
        (source_name, target_name, is_intermediate, is_final, description, data_type)
        VALUES (:source_name, :target_name, :is_intermediate, :is_final, :description, :data_type)
        RETURNING source_name, target_name, is_intermediate, is_final, description, data_type;
    """)
    try:
        # Execute using db.execute, get one mapping result
        result = db.execute(query, mapping.model_dump()) # Use model_dump for Pydantic v2
        new_mapping_row = result.mappings().fetchone()
        db.commit() # Commit the transaction
        logger.info(f"Created field mapping: {new_mapping_row}")
        if not new_mapping_row:
             # This case should ideally not happen if INSERT...RETURNING works
             logger.error("INSERT...RETURNING did not return the new mapping row.")
             raise HTTPException(status_code=500, detail="Failed to confirm mapping creation.")
        return new_mapping_row # Return the RowMapping directly, Pydantic handles conversion
    except sa_exc.IntegrityError as e: # Catch unique constraint violation
        db.rollback() # Rollback on error
        logger.error(f"Database integrity error creating field mapping: {e}", exc_info=True)
        # Check if it's a unique violation, provide a more specific message
        detail = "Database integrity error occurred." # Default message
        # The specific constraint name might be in e.orig or e.pgcode depending on driver/version
        # A simple check for common unique keys:
        if 'uq_salary_field_mappings_source_name' in str(e):
            detail = f"Mapping with source_name '{mapping.source_name}' already exists."
        elif 'uq_salary_field_mappings_target_name' in str(e):
            detail = f"Mapping with target_name '{mapping.target_name}' already exists."
        else: # Generic if specific constraint not identified
            detail = f"Mapping conflict. Source '{mapping.source_name}' or target '{mapping.target_name}' may already exist."
        raise HTTPException(status_code=409, detail=detail) # 409 Conflict
    except sa_exc.SQLAlchemyError as e: # Catch other SQLAlchemy errors
        db.rollback()
        logger.error(f"Database query error creating field mapping: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to create field mapping.")
    except Exception as e:
        db.rollback() # Rollback on any unexpected error too
        logger.error(f"An unexpected error occurred creating field mapping: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An internal server error occurred.")
    # No finally block needed

@app.put("/api/config/mappings/{source_name}", response_model=FieldMappingInDB, tags=["Configuration"])
async def update_field_mapping(
    source_name: str,
    mapping_update: FieldMappingUpdate,
    # Change conn to db: Session
    db: Session = Depends(get_db),
    # Replace Basic Auth with JWT Auth (Super Admin only)
    current_user: schemas.UserResponse = Depends(auth.require_role(["Super Admin"])) 
):
    """Updates an existing field mapping record by source_name using SQLAlchemy Session."""
    # Build the SET clause dynamically based on provided fields using model_dump
    update_fields = mapping_update.model_dump(exclude_unset=True)
    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields provided for update.")

    # Use :key style for named parameters with SQLAlchemy text()
    set_clause = ", ".join([f"{key} = :{key}" for key in update_fields])
    query = text(f"""
        UPDATE public.salary_field_mappings
        SET {set_clause}
        WHERE source_name = :source_name
        RETURNING source_name, target_name, is_intermediate, is_final, description, data_type;
    """)
    # Combine update fields with the source_name for query parameters
    params = {**update_fields, "source_name": source_name}
    
    try:
        # Execute using db.execute
        result = db.execute(query, params)
        updated_mapping = result.mappings().fetchone()
        
        if not updated_mapping:
            # No need to rollback here, the record just wasn't found
            raise HTTPException(status_code=404, detail=f"Mapping with source_name '{source_name}' not found.")
            
        db.commit() # Commit the successful update
        logger.info(f"Updated field mapping: {updated_mapping}")
        return updated_mapping
        
    except sa_exc.IntegrityError as e: # Catch potential unique constraint violation on target_name
        db.rollback()
        logger.error(f"Database integrity error updating field mapping: {e}", exc_info=True)
        detail = f"Update failed. Target name '{mapping_update.target_name}' must be unique."
        # Check if target_name was actually part of the update causing the error
        if 'target_name' not in update_fields:
            detail = "Database integrity error during update." # More generic if target wasn't updated
        # Add checks for other specific unique constraints if needed
        raise HTTPException(status_code=409, detail=detail) # 409 Conflict
        
    except sa_exc.SQLAlchemyError as e: # Catch other SQLAlchemy errors
        db.rollback()
        logger.error(f"Database query error updating field mapping: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to update field mapping.")
        
    except Exception as e:
        db.rollback()
        logger.error(f"An unexpected error occurred updating field mapping: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An internal server error occurred.")
    # No finally block needed

@app.delete("/api/config/mappings/{source_name}", status_code=204, tags=["Configuration"]) # 204 No Content on successful delete
async def delete_field_mapping(
    source_name: str,
    # Change conn to db: Session
    db: Session = Depends(get_db),
    # Replace Basic Auth with JWT Auth (Super Admin only)
    current_user: schemas.UserResponse = Depends(auth.require_role(["Super Admin"])) 
):
    """Deletes a field mapping record by source_name using SQLAlchemy Session."""
    # Use :source_name for named parameter
    query = text("DELETE FROM public.salary_field_mappings WHERE source_name = :source_name RETURNING source_name;")
    params = {"source_name": source_name}
    try:
        # Execute using db.execute
        result = db.execute(query, params)
        deleted_row = result.fetchone() # Check if a row was returned (meaning deleted)
        
        if not deleted_row:
            # No need to rollback, just means the record wasn't found
            raise HTTPException(status_code=404, detail=f"Mapping with source_name '{source_name}' not found.")
            
        db.commit() # Commit the deletion
        logger.info(f"Deleted field mapping with source_name: {source_name}")
        return # Return None for 204 response
        
    except sa_exc.SQLAlchemyError as e: # Catch SQLAlchemy errors
        db.rollback()
        logger.error(f"Database query error deleting field mapping: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to delete field mapping.")
        
    except Exception as e:
        db.rollback()
        logger.error(f"An unexpected error occurred deleting field mapping: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An internal server error occurred.")
    # No finally block needed

# --- Config Management Endpoints --- END

# --- Employee Management Endpoints --- START
@app.get("/api/employees", response_model=EmployeeListResponse, tags=["Employees"])
async def get_employees(
    # Change limit/offset to page/size to match frontend
    page: int = Query(1, ge=1, description="Page number starting from 1"),
    size: int = Query(10, ge=1, le=100, description="Number of items per page"),
    # Filters
    name: Optional[str] = Query(None, description="Filter by employee name (case-insensitive partial match)"),
    department_id: Optional[int] = Query(None, description="Filter by department ID"),
    employee_unique_id: Optional[str] = Query(None, description="Filter by employee unique ID (工号, exact match)"), # Added Filter
    establishment_type_id: Optional[int] = Query(None, description="Filter by establishment type ID"), # Added Filter
    db: Session = Depends(get_db), # Ensure db: Session is used
    # Replace Basic Auth with JWT Auth (Super Admin or Data Admin)
    current_user: schemas.UserResponse = Depends(auth.get_current_user) # Changed role check logic, now any logged-in user can view?
):
    """Fetches a paginated list of employees with optional filtering using SQLAlchemy text()."""
    offset = (page - 1) * size
    # Use text() for existing complex SQL query
    base_select = """
        SELECT
            e.id, e.name, e.id_card_number, e.employee_unique_id,
            e.department_id, d.name as department_name,
            u.name as unit_name, e.bank_account_number, e.bank_name,
            e.establishment_type_id, et.name as establishment_type_name,
            e.created_at, e.updated_at
        FROM employees e
        LEFT JOIN departments d ON e.department_id = d.id
        LEFT JOIN units u ON d.unit_id = u.id
        LEFT JOIN establishment_types et ON e.establishment_type_id = et.id
    """
    count_select = "SELECT COUNT(e.id) "
    from_join = """
        FROM employees e
        LEFT JOIN departments d ON e.department_id = d.id
        LEFT JOIN units u ON d.unit_id = u.id
        LEFT JOIN establishment_types et ON e.establishment_type_id = et.id
    """
    
    where_clauses = []
    params = {}

    if name:
        where_clauses.append("e.name ILIKE :name")
        params['name'] = f"%{name}%"
    if department_id:
        where_clauses.append("e.department_id = :department_id")
        params['department_id'] = department_id
    if employee_unique_id:
        where_clauses.append("e.employee_unique_id = :employee_unique_id")
        params['employee_unique_id'] = employee_unique_id
    if establishment_type_id:
        where_clauses.append("e.establishment_type_id = :establishment_type_id")
        params['establishment_type_id'] = establishment_type_id

    where_sql = ""
    if where_clauses:
        where_sql = " WHERE " + " AND ".join(where_clauses)

    # Construct final queries
    final_count_query = count_select + from_join + where_sql
    final_data_query = base_select + where_sql + " ORDER BY e.id LIMIT :limit OFFSET :offset"

    # Add pagination params to the main data query params
    params['limit'] = size
    params['offset'] = offset
    
    # Count params should only contain filter parameters
    count_params = {k: v for k, v in params.items() if k not in ('limit', 'offset')}

    try:
        # Fetch total count
        total_result = db.execute(text(final_count_query), count_params)
        total = total_result.scalar_one()

        # Fetch paginated data
        data_result = db.execute(text(final_data_query), params)
        employees_data = data_result.mappings().all()

        # Pydantic EmployeeResponse should handle the Row mapping via from_attributes=True
        return EmployeeListResponse(data=employees_data, total=total)

    except sa_exc.SQLAlchemyError as e:
        logger.error(f"Database error fetching employees: {e}", exc_info=True)
        # conn.rollback() # Handled by session context manager
        raise HTTPException(status_code=500, detail="Database error occurred while fetching employees.")
    except Exception as e:
        logger.error(f"Unexpected error fetching employees: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An unexpected server error occurred.")
    # No finally cursor.close() needed

@app.get("/api/employees/{employee_id}", response_model=EmployeeResponse, tags=["Employees"])
async def get_employee(
    employee_id: int,
    # Change conn to db: Session
    db: Session = Depends(get_db),
    # Replace Basic Auth with JWT Auth (Super Admin or Data Admin)
    current_user: schemas.UserResponse = Depends(auth.require_role(["Super Admin", "Data Admin"])) 
):
    """Fetches a single employee by their ID, including related names, using SQLAlchemy Session."""
    # Adjusted query to use named parameters :employee_id and join establishment_types
    query = text("""
        SELECT 
            e.id, e.name, e.id_card_number, e.department_id, e.employee_unique_id, 
            e.bank_account_number, e.bank_name, e.establishment_type_id, 
            e.created_at, e.updated_at,
            d.name as department_name, 
            u.name as unit_name,
            et.name as establishment_type_name 
        FROM public.employees e
        LEFT JOIN public.departments d ON e.department_id = d.id
        LEFT JOIN public.units u ON d.unit_id = u.id
        LEFT JOIN public.establishment_types et ON e.establishment_type_id = et.id
        WHERE e.id = :employee_id;
    """)
    params = {"employee_id": employee_id}
    try:
        # Execute using db.execute
        result = db.execute(query, params)
        # Fetch one mapping
        employee = result.mappings().fetchone()
        
        if not employee:
            raise HTTPException(status_code=404, detail=f"Employee with id {employee_id} not found.")
            
        # Pydantic model EmployeeResponse should handle the mapping
        return employee
        
    except sa_exc.SQLAlchemyError as e: # Catch SQLAlchemy errors
        logger.error(f"Database query error fetching employee {employee_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve employee details.")
    except Exception as e:
        logger.error(f"An unexpected error occurred fetching employee {employee_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An internal server error occurred.")
    # No finally block needed

@app.post("/api/employees", response_model=EmployeeResponse, status_code=201, tags=["Employees"])
async def create_employee(
    employee: EmployeeCreate,
    # Change conn to db: Session
    db: Session = Depends(get_db),
    # Replace Basic Auth with JWT Auth (Super Admin or Data Admin)
    current_user: schemas.UserResponse = Depends(auth.require_role(["Super Admin", "Data Admin"])) 
):
    """Creates a new employee record using SQLAlchemy Session, checking for uniqueness."""
    
    # Use named parameters :id_card_number
    check_query = text("SELECT id FROM public.employees WHERE id_card_number = :id_card_number LIMIT 1;")
    # Use named parameters, include bank/establishment fields
    insert_query = text("""
        INSERT INTO public.employees (name, id_card_number, department_id, employee_unique_id, 
                                    bank_account_number, bank_name, establishment_type_id)
        VALUES (:name, :id_card_number, :department_id, :employee_unique_id, 
                :bank_account_number, :bank_name, :establishment_type_id)
        RETURNING id;
    """)
    # Fetch related names including establishment_type_name
    get_new_query = text("""        
        SELECT 
            e.id, e.name, e.id_card_number, e.department_id, e.employee_unique_id, 
            e.bank_account_number, e.bank_name, e.establishment_type_id,
            e.created_at, e.updated_at,
            d.name as department_name, 
            u.name as unit_name,
            et.name as establishment_type_name
        FROM public.employees e
        LEFT JOIN public.departments d ON e.department_id = d.id
        LEFT JOIN public.units u ON d.unit_id = u.id
        LEFT JOIN public.establishment_types et ON e.establishment_type_id = et.id
        WHERE e.id = :new_employee_id;
    """) 

    try:
        # 1. Check for existing ID card number using db.execute
        logger.debug(f"Checking uniqueness for ID card: {employee.id_card_number}")
        existing_result = db.execute(check_query, {"id_card_number": employee.id_card_number})
        existing_employee = existing_result.fetchone() # No mapping needed for just checking existence
        if existing_employee:
            logger.warning(f"Attempted to create employee with duplicate ID card number: {employee.id_card_number}")
            raise HTTPException(
                status_code=409, # Conflict
                detail=f"Employee with ID card number {employee.id_card_number} already exists."
            )

        # 2. Insert new employee using db.execute and model_dump
        logger.debug(f"Inserting new employee: {employee.name}")
        insert_result = db.execute(insert_query, employee.model_dump()) # Pydantic v2
        new_employee_record = insert_result.fetchone() # Get the ID returned
        if not new_employee_record or not new_employee_record[0]: # Check if ID was returned
             db.rollback()
             logger.error("Failed to get ID of newly inserted employee.")
             raise HTTPException(status_code=500, detail="Failed to create employee record.")
        new_employee_id = new_employee_record[0]
        
        # 3. Fetch full details of the newly created employee
        logger.debug(f"Fetching details for new employee ID: {new_employee_id}")
        get_result = db.execute(get_new_query, {"new_employee_id": new_employee_id})
        created_employee_details = get_result.mappings().fetchone()
        
        db.commit() # Commit only after all steps succeed
        logger.info(f"Successfully created employee {employee.name} with ID {new_employee_id}")
        return created_employee_details
            
    except sa_exc.IntegrityError as e: # Catch specific integrity errors (like FK violation)
        db.rollback()
        logger.error(f"Database integrity error creating employee: {e}", exc_info=True)
        detail = "Database error: Could not create employee due to data conflict (e.g., invalid department ID or duplicate unique ID)."
        # Add more specific checks if needed (e.g., check e.orig.pgcode or constraint name)
        if 'employees_department_id_fkey' in str(e):
            detail = f"Invalid Department ID: {employee.department_id}. Department does not exist."
        elif 'uq_employees_employee_unique_id' in str(e):
             detail = f"Duplicate Employee Unique ID (工号): {employee.employee_unique_id}. This ID is already in use."
        # ID card uniqueness checked earlier, but catch here just in case of race condition?
        elif 'uq_employees_id_card_number' in str(e):
            detail = f"Duplicate ID Card Number: {employee.id_card_number}. This number already exists."
        raise HTTPException(status_code=400, detail=detail) # Bad request due to bad data

    except sa_exc.SQLAlchemyError as e: # Catch other SQLAlchemy errors
        db.rollback()
        logger.error(f"Database query error creating employee: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Database error occurred while creating employee.")
    except Exception as e:
        db.rollback()
        logger.error(f"An unexpected error occurred creating employee: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An internal server error occurred.")
    # No finally block needed

@app.put("/api/employees/{employee_id}", response_model=EmployeeResponse, tags=["Employees"])
async def update_employee(
    employee_id: int,
    employee_update: EmployeeUpdate,
    # Change conn to db: Session
    db: Session = Depends(get_db),
    # Replace Basic Auth with JWT Auth (Super Admin or Data Admin)
    current_user: schemas.UserResponse = Depends(auth.require_role(["Super Admin", "Data Admin"])) 
):
    """Updates an existing employee's details using SQLAlchemy Session."""
    # Get fields to update from the Pydantic model, excluding unset fields
    update_data = employee_update.model_dump(exclude_unset=True)

    if not update_data:
        raise HTTPException(status_code=400, detail="没有提供要更新的字段。")

    # Check for existence first using Session (optional but good practice)
    existing_employee = db.get(models.Employee, employee_id)
    if not existing_employee:
         raise HTTPException(status_code=404, detail="未找到该员工。")

    # Construct SET clause dynamically using named parameters (:key)
    set_parts = []
    params = {}
    for key, value in update_data.items():
        # Validate field names against EmployeeUpdate model fields
        if key in EmployeeUpdate.model_fields: # Check if key is a valid field for update
            set_parts.append(f"{key} = :{key}") 
            params[key] = value
        else:
            logger.warning(f"Attempted to update invalid or non-updatable field: {key}")
            # Ignore invalid fields

    if not set_parts:
         raise HTTPException(status_code=400, detail="没有有效的字段可更新。")

    # Add updated_at timestamp automatically
    set_clause = ", ".join(set_parts) + ", updated_at = CURRENT_TIMESTAMP"
    # Use named parameter :employee_id for WHERE clause
    update_query = text(f"UPDATE employees SET {set_clause} WHERE id = :employee_id RETURNING id")
    params['employee_id'] = employee_id

    # Query to fetch the full updated record including related names
    final_query = text("""
        SELECT
            e.id, e.name, e.id_card_number, e.department_id, e.employee_unique_id, 
            e.bank_account_number, e.bank_name, e.establishment_type_id, 
            e.created_at, e.updated_at,
            d.name as department_name,
            u.name as unit_name,
            et.name as establishment_type_name
        FROM employees e
        LEFT JOIN departments d ON e.department_id = d.id
        LEFT JOIN units u ON d.unit_id = u.id
        LEFT JOIN establishment_types et ON e.establishment_type_id = et.id
        WHERE e.id = :employee_id
    """)
    final_params = {"employee_id": employee_id}

    try:
        logger.debug(f"Executing update query with params: {params}")
        update_result = db.execute(update_query, params)
        updated_id_row = update_result.fetchone() # Check if RETURNING worked

        if not updated_id_row:
            db.rollback() # Should not happen if existence check passed
            raise HTTPException(status_code=500, detail="更新员工信息失败 (无法确认更新)。")

        # Fetch the full updated record with related names
        final_result = db.execute(final_query, final_params)
        full_updated_employee = final_result.mappings().fetchone()

        db.commit()
        logger.info(f"Successfully updated employee ID: {employee_id}")
        return full_updated_employee

    except sa_exc.IntegrityError as e:
        db.rollback()
        logger.error(f"Unique constraint violation during employee update: {e}", exc_info=True)
        detail = "更新失败：违反了唯一性约束（例如，身份证号或工号已存在）。"
        if 'uq_employees_id_card_number' in str(e):
             detail = "更新失败：该身份证号已被其他员工使用。"
        elif 'uq_employees_employee_unique_id' in str(e):
            detail = "更新失败：该工号已被其他员工使用。"
        # Add check for FK violations if needed
        elif 'employees_department_id_fkey' in str(e):
            detail = f"更新失败：指定的部门 ID 不存在。"
        elif 'employees_establishment_type_id_fkey' in str(e):
            detail = f"更新失败：指定的编制类型 ID 不存在。"
        raise HTTPException(status_code=409, detail=detail) # 409 Conflict
        
    except sa_exc.SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Error updating employee {employee_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="更新员工信息时发生数据库错误。")
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error updating employee {employee_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="更新员工信息时发生内部错误。")
    # No finally block needed

@app.delete("/api/employees/{employee_id}", status_code=204, tags=["Employees"])
async def delete_employee(
    employee_id: int,
    # Change conn to db: Session
    db: Session = Depends(get_db),
    # Replace Basic Auth with JWT Auth (Super Admin or Data Admin)
    current_user: schemas.UserResponse = Depends(auth.require_role(["Super Admin", "Data Admin"])) 
):
    """Deletes an employee record by ID using SQLAlchemy Session."""
    # Use named parameter :employee_id
    query = text("DELETE FROM public.employees WHERE id = :employee_id RETURNING id;")
    params = {"employee_id": employee_id}
    try:
        logger.debug(f"Attempting to delete employee ID: {employee_id}")
        result = db.execute(query, params)
        deleted_id = result.scalar_one_or_none() # Check if RETURNING returned the ID
        
        if deleted_id is None:
            # No need to rollback, record just wasn't found
            logger.warning(f"Delete failed: Employee with id {employee_id} not found.")
            raise HTTPException(status_code=404, detail=f"Employee with id {employee_id} not found.")
            
        db.commit() # Commit the deletion
        logger.info(f"Successfully deleted employee ID: {employee_id}")
        return # Return None with 204 status code
            
    except sa_exc.IntegrityError as e: # Catch FK violations if employee is referenced elsewhere
        db.rollback()
        logger.error(f"Database integrity error deleting employee {employee_id}: {e}", exc_info=True)
        # Provide a more user-friendly message if it's a foreign key constraint
        detail = "无法删除该员工，因为其数据与其他记录关联。"
        # Check for specific FK constraint names if needed
        # if 'fk_constraint_name' in str(e): detail = "..."
        raise HTTPException(status_code=409, detail=detail) # 409 Conflict

    except sa_exc.SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error deleting employee {employee_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Database error occurred while deleting employee.")
    except Exception as e:
        db.rollback()
        logger.error(f"An unexpected error occurred deleting employee {employee_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An internal server error occurred.")
    # No finally block needed

# --- Employee Management Endpoints --- END

# --- Main Application Run Logic (for direct execution, e.g., debugging) ---
if __name__ == "__main__":
    import uvicorn
    logger.info("Starting Uvicorn server for Salary System API...")
    # Use environment variables for host/port if available, otherwise default
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", "8080")) 
    reload = os.getenv("RELOAD", "true").lower() == "true"
    
    uvicorn.run("main:app", host=host, port=port, reload=reload) 

# --- Helper Function to Trigger dbt Build --- START ---
def _trigger_dbt_build_if_project_valid(background_tasks: BackgroundTasks, dbt_project_dir: str) -> bool:
    """
    Checks if the dbt project directory is valid and adds the dbt build task
    to background tasks if it is.

    Args:
        background_tasks: The BackgroundTasks instance.
        dbt_project_dir: The path to the dbt project directory.

    Returns:
        True if the task was added, False otherwise.
    """
    logger.info(f"Checking for dbt project at calculated path: {dbt_project_dir}")
    if not os.path.isdir(dbt_project_dir) or not os.path.exists(os.path.join(dbt_project_dir, 'dbt_project.yml')):
         logger.error(f"dbt project directory not found or invalid at: {dbt_project_dir}. Skipping dbt run trigger.")
         return False
    else:
         logger.info(f"Adding dbt build task to background for project: {dbt_project_dir}")
         # Ensure run_dbt_build is accessible in this scope
         # If run_dbt_build is defined later in the file, this might need adjustment
         # or run_dbt_build should be defined before this helper.
         background_tasks.add_task(run_dbt_build, dbt_project_dir)
         return True
# --- Helper Function to Trigger dbt Build --- END ---

# --- New API Endpoint to Trigger dbt Build --- START ---
@app.post("/api/dbt/trigger-run", status_code=status.HTTP_202_ACCEPTED, tags=["DBT Tasks"])
async def trigger_dbt_run_endpoint(
    background_tasks: BackgroundTasks,
    current_user: schemas.UserResponse = Depends(auth.require_role(["Super Admin", "Data Admin"]))
):
    """
    Manually triggers a dbt build process in the background.
    Requires Super Admin or Data Admin role.
    """
    # Calculate dbt project path (ensure this logic is consistent)
    current_dir = os.path.dirname(os.path.abspath(__file__))
    dbt_project_path = os.path.abspath(os.path.join(current_dir, '../salary_dbt_transforms'))

    task_added = _trigger_dbt_build_if_project_valid(background_tasks, dbt_project_path)

    if task_added:
        return {"message": "dbt build task added to background."}
    else:
        # If the project path was invalid, raise an error
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"dbt project directory not found or invalid at: {dbt_project_path}. Task not triggered."
        )
# --- New API Endpoint to Trigger dbt Build --- END

# Ensure this is placed appropriately, e.g., before the final uvicorn run if applicable,
# or logically grouped with other endpoints.

# Optional: Add a block to run uvicorn directly using .env variables
if __name__ == "__main__":
    import uvicorn
    import os
    from dotenv import load_dotenv

    # Load .env from the webapp directory relative to main.py
    dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
    load_dotenv(dotenv_path=dotenv_path)

    host = os.getenv("UVICORN_HOST", "0.0.0.0")
    port = int(os.getenv("UVICORN_PORT", 8080))
    reload = os.getenv("UVICORN_RELOAD", "true").lower() == "true"

    print(f"Starting Uvicorn server directly on http://{host}:{port} with reload={reload}...")
    uvicorn.run("webapp.main:app", host=host, port=port, reload=reload)