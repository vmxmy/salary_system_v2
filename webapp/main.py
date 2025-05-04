from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Query, status, Body, Response
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Sequence
import os
import json
import logging
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
from fastapi.responses import FileResponse, HTMLResponse
from fastapi import BackgroundTasks
import shutil
import tempfile
import uuid
import pandas as pd
import psycopg2
from psycopg2.extras import RealDictCursor
from sqlalchemy import select, text, func, and_, or_
from sqlalchemy.exc import SQLAlchemyError
import sqlalchemy.exc as sa_exc
import subprocess
from fastapi.middleware.cors import CORSMiddleware
import traceback
from fastapi import APIRouter

# 配置logger
logger = logging.getLogger(__name__)

# Import modules - 使用相对导入
from . import auth, models_db, schemas, models, file_converter
from .database import get_db
from .core.config import settings
from .routers import units
from .routers import departments
from .routers import report_links
from .routers.employees import router as employees_router
from .routers.salary_data import router as salary_data_router
from .routers.auth_management import router as auth_router
from .routers.user_management import router as user_router
from .routers.config_management import router as config_router
from .routers.file_conversion import router as file_conversion_router

# 导入所有Pydantic模型
from .pydantic_models import (
    # 员工模型
    EmployeeBase, EmployeeCreate, EmployeeUpdate, EmployeeInDBBase, 
    EmployeeResponse, EmployeeListResponse,
    # 部门模型
    DepartmentBase, DepartmentCreate, DepartmentUpdate, Department, 
    DepartmentListResponse, DepartmentInfo,
    # 单位模型
    UnitBase, UnitCreate, UnitUpdate, Unit, UnitListResponse,
    # 薪资相关模型
    SalaryRecord, PaginatedSalaryResponse, PayPeriodsResponse,
    EstablishmentTypeInfo, FieldMappingBase, FieldMappingCreate,
    FieldMappingUpdate, FieldMappingInDB, FieldMappingListResponse
)

# 注意：薪资数据相关端点已经移动到专用的salary_data.py路由器中：
# - GET /api/salary_data/pay_periods
# - GET /api/salary_data
# - GET /api/establishment-types
# - GET /api/establishment-types-list 
# - GET /api/departments
# - GET /api/units
# - GET /api/departments-list

app = FastAPI(title=settings.API_TITLE, version=settings.API_VERSION)

# 跨域配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 数据库连接
load_dotenv()  # 从.env文件加载环境变量

DATABASE_URL = settings.DATABASE_URL  # 从配置获取
if not DATABASE_URL:
    logger.critical("DATABASE_URL environment variable not set!")
    # Decide how to handle this - raise error, exit, use default? For now, let it fail later.
    DATABASE_URL = "postgresql://user:password@host:port/dbname" # Placeholder

# --- Column Definitions --- START
# 注意: 列定义已迁移到数据库配置表 (salary_field_mappings)
# 通过API端点管理: /api/config/mappings
# --- Column Definitions --- END

# --- Pydantic Model for Field Mapping --- START
# Removed duplicate class definitions. These are already imported from pydantic_models.salary
# --- Pydantic Model for Field Mapping --- END

# --- Pydantic Models Definitions (Moved Here) --- END ---

# --- Constants / Configurations (Moved below Models) ---

# --- Column Definitions --- START
# 注意: 列定义已迁移到数据库配置表 (salary_field_mappings)
# 通过API端点管理: /api/config/mappings
# --- Column Definitions --- END

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

# --- API Endpoints ---
# 注意：大部分API端点已迁移到专用路由器，在下方注册。
# 此处仅保留一些特殊端点，如根路径、调试端点和DBT任务等。

# --- User Management Endpoints --- END

# --- Existing Helper CRUD Functions (Not Endpoints) ---
# IMPORTANT: Keep these definitions if they are used internally by endpoints
# TODO: Review if these should be moved to models_db.py for better separation

def create_unit(conn, unit: UnitCreate) -> dict:
    """转发到models_db.create_unit_orm函数。"""
    # 将Session作为参数传递
    db = conn
    # 确保使用正确的schemas.UnitCreate类型
    from .schemas import UnitCreate as SchemasUnitCreate
    # 创建正确类型的对象
    unit_obj = SchemasUnitCreate(**unit.dict())
    result = models_db.create_unit_orm(db, unit_obj)
    # 转换ORM模型为字典
    return result.__dict__

def get_unit_by_id(conn, unit_id: int) -> Optional[dict]:
    """转发到models_db.get_unit_by_id_orm函数。"""
    db = conn
    result = models_db.get_unit_by_id_orm(db, unit_id)
    if result is None:
        return None
    return result.__dict__

def delete_unit(conn, unit_id: int) -> bool:
    """转发到models_db.delete_unit_orm函数。"""
    db = conn
    return models_db.delete_unit_orm(db, unit_id)

def create_department(conn, department: DepartmentCreate) -> dict:
    """转发到models_db.create_department_orm函数。"""
    db = conn
    # 确保使用正确的schemas.DepartmentCreate类型
    from .schemas import DepartmentCreate as SchemasDepartmentCreate
    # 创建正确类型的对象
    dept_obj = SchemasDepartmentCreate(**department.dict())
    result = models_db.create_department_orm(db, dept_obj)
    return result.__dict__

def delete_department(conn, department_id: int) -> bool:
    """转发到models_db.delete_department_orm函数。"""
    db = conn
    return models_db.delete_department_orm(db, department_id)

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

def update_department(conn, department_id: int, department_update: DepartmentUpdate) -> Optional[dict]:
    # // ... function body ...
    pass

# --- Endpoints start here --- 

@app.get("/")
async def read_root():
    """Root endpoint providing a welcome message."""
    return {"message": "Welcome to the Salary System API"}

# --- 以下端点已移至salary_data.py路由器 ---
# @app.get("/api/salary_data/pay_periods", response_model=PayPeriodsResponse)
# @app.get("/api/salary_data", response_model=PaginatedSalaryResponse)
# @app.get("/api/establishment-types", response_model=List[str])
# @app.get("/api/establishment-types-list", response_model=List[EstablishmentTypeInfo])
# @app.get("/api/departments", response_model=List[str])
# @app.get("/api/units", response_model=List[str])
# @app.get("/api/departments-list", response_model=List[DepartmentInfo])

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
        # 修复print参数错误
        print(f"Error reading HTML file {html_file_path}: {e}")
        raise HTTPException(status_code=500, detail="Could not load converter page.")

# --- File Conversion Endpoint --- # New Section

# 该端点已迁移到file_conversion路由器中

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
    """Fetches a paginated list of employees based on filters."""
    logger.info(f"Fetching employees with page={page}, size={size}, name filter={name}, department_id={department_id}")

    # Convert page/size to limit/offset
    limit = size
    skip = (page - 1) * size
    
    try:
        # ORM: Use db.query to fetch employees with pagination and filtering
        employees, total = models_db.get_employees_orm(
            db=db,
            skip=skip,
            limit=limit,
            name=name,
            department_id=department_id,
            employee_unique_id=employee_unique_id, # Pass new filter
            establishment_type_id=establishment_type_id # Pass new filter
        )
        
        # 正确处理关联数据
        employees_data = []
        for employee in employees:
            # 创建基础数据字典
            employee_dict = {
                "id": employee.id,
                "name": employee.name,
                "id_card_number": employee.id_card_number,
                "department_id": employee.department_id,
                "employee_unique_id": employee.employee_unique_id,
                "bank_account_number": employee.bank_account_number,
                "bank_name": employee.bank_name,
                "establishment_type_id": employee.establishment_type_id,
                "created_at": employee.created_at,
                "updated_at": employee.updated_at,
                # 默认值
                "department_name": None,
                "unit_name": None,
                "establishment_type_name": None
            }
            
            # 添加关联数据
            if employee.department:
                employee_dict["department_name"] = employee.department.name
                if employee.department.unit:
                    employee_dict["unit_name"] = employee.department.unit.name
            
            if employee.establishment_type:
                employee_dict["establishment_type_name"] = employee.establishment_type.name
                
            # 转换为Pydantic模型
            employees_data.append(EmployeeResponse.model_validate(employee_dict))
        
        # Return the formatted response with pagination
        return EmployeeListResponse(data=employees_data, total=total)

    except sa_exc.SQLAlchemyError as e:
        logger.error(f"Database error fetching employees: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    except Exception as e:
        logger.error(f"Error fetching employees: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.get("/api/employees/{employee_id}", response_model=EmployeeResponse, tags=["Employees"])
async def get_employee(
    employee_id: int,
    # Change conn to db: Session
    db: Session = Depends(get_db),
    # Replace Basic Auth with JWT Auth (Super Admin or Data Admin)
    current_user: schemas.UserResponse = Depends(auth.require_role(["Super Admin", "Data Admin"])) 
):
    """Fetches a single employee by their ID, including related names, using SQLAlchemy ORM."""
    try:
        # 使用ORM函数获取员工数据
        employee = models_db.get_employee_by_id_orm(db, employee_id)
        
        if not employee:
            raise HTTPException(status_code=404, detail=f"Employee with id {employee_id} not found.")
            
        # 创建基础数据字典
        employee_dict = {
            "id": employee.id,
            "name": employee.name,
            "id_card_number": employee.id_card_number,
            "department_id": employee.department_id,
            "employee_unique_id": employee.employee_unique_id,
            "bank_account_number": employee.bank_account_number,
            "bank_name": employee.bank_name,
            "establishment_type_id": employee.establishment_type_id,
            "created_at": employee.created_at,
            "updated_at": employee.updated_at,
            # 默认值
            "department_name": None,
            "unit_name": None,
            "establishment_type_name": None
        }
        
        # 添加关联数据
        if employee.department:
            employee_dict["department_name"] = employee.department.name
            if employee.department.unit:
                employee_dict["unit_name"] = employee.department.unit.name
        
        if employee.establishment_type:
            employee_dict["establishment_type_name"] = employee.establishment_type.name
            
        # 转换为Pydantic模型
        return EmployeeResponse.model_validate(employee_dict)
        
    except sa_exc.SQLAlchemyError as e: # Catch SQLAlchemy errors
        logger.error(f"Database query error fetching employee {employee_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve employee details.")
    except Exception as e:
        logger.error(f"An unexpected error occurred fetching employee {employee_id}: {e}", exc_info=True)
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

    print(f"Starting Uvicorn server on http://{host}:{port} with reload={reload}...")
    uvicorn.run("main:app", host=host, port=port, reload=reload)

# === NEW DEBUGGING ENDPOINT ===
@app.get("/api/debug/field-config/{employee_type_key}", 
         response_model=List[Dict[str, Any]], # Return a list of row dictionaries
         tags=["Debugging"], 
         summary="Fetch raw field config from DB for a type key")
async def debug_get_field_config(
    employee_type_key: str, 
    db: Session = Depends(get_db)
):
    """Debug endpoint to directly query the field configuration for a given employee type key."""
    # Corrected query to use field_db_name
    query = text("""
        SELECT
            etfr.employee_type_key,
            etfr.field_db_name,      -- Corrected column name
            etfr.is_required,
            sfm.source_name,
            sfm.target_name          -- Also select target_name from sfm
        FROM public.employee_type_field_rules etfr
        JOIN public.salary_field_mappings sfm ON etfr.field_db_name = sfm.target_name -- Corrected join condition
        WHERE etfr.employee_type_key = :employee_type_key;
    """)
    params = {"employee_type_key": employee_type_key}
    logger.info(f"[DEBUG] Executing query for field config of type: {employee_type_key}")
    try:
        result = db.execute(query, params)
        rows = result.mappings().all()
        logger.info(f"[DEBUG] Found {len(rows)} config rows for type '{employee_type_key}'.")
        if not rows:
            # Return empty list if no rows found
            return [] 
        # Convert RowMapping objects to plain dicts for the response
        # Pydantic should handle this with response_model, but being explicit is safe
        return [dict(row) for row in rows] 
    except SQLAlchemyError as e:
        logger.error(f"[DEBUG] Database error fetching field config for '{employee_type_key}': {e}", exc_info=True)
        raise HTTPException(
            status_code=500, 
            detail=f"Database error querying field config for {employee_type_key}: {e}"
        )
    except Exception as e:
        logger.error(f"[DEBUG] Unexpected error fetching field config for '{employee_type_key}': {e}", exc_info=True)
        raise HTTPException(
            status_code=500, 
            detail=f"Unexpected error querying field config for {employee_type_key}: {e}"
        )

# 注册路由
# 1. 认证路由
app.include_router(
    auth_router, 
    prefix="",
    tags=["Authentication"]
)

# 2. 用户管理路由
app.include_router(
    user_router, 
    prefix="/api",
    tags=["Users"]
)

# 3. 员工路由
app.include_router(
    employees_router, 
    prefix="/api",
    tags=["Employees"]
)

# 4. 单位路由
app.include_router(
    units.router, 
    prefix="/api",
    tags=["Units"]
)

# 5. 部门路由
app.include_router(
    departments.router, 
    prefix="/api",
    tags=["Departments"]
)

# 6. 报表链接路由
app.include_router(
    report_links.router,
    prefix="/api/report-links",
    tags=["Report Links"]
)

# 7. 薪资数据路由
app.include_router(
    salary_data_router,
    prefix="",  # 已在路由器中定义了完整路径
    tags=["Salary Data"]
)

# 8. 配置管理路由
app.include_router(
    config_router,
    prefix="/api/config",
    tags=["Configuration"]
)

# 9. 文件转换路由
app.include_router(
    file_conversion_router,
    prefix="/api",
    tags=["File Conversion"]
        )