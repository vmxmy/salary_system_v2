import sys
print("==== sys.path ====", sys.path)
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Query, status, Body, Response
import bcrypt
from webapp.auth import get_password_hash
print("admin hash:", get_password_hash("admin"))
print("==== bcrypt module path:", bcrypt.__file__)
print("==== has __about__:", hasattr(bcrypt, "__about__"))
if hasattr(bcrypt, "__about__"):
    print("==== bcrypt.__about__:", bcrypt.__about__)
else:
    print("==== dir(bcrypt):", dir(bcrypt))
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
from .routers.calculation_rules_admin import router as calculation_admin_router
from .routers.salary_calculation import router as salary_calculation_router
from .routers.table_configs import router as table_configs_router
from .routers.email_config import router as email_config_router
from .routers.email_sender import router as email_sender_router # Added email_sender_router

# Import v2 API routers
from .v2.routers import employees_router as v2_employees_router
from .v2.routers import departments_router as v2_departments_router
from .v2.routers import job_titles_router as v2_job_titles_router
from .v2.routers import lookup_router as v2_lookup_router
from .v2.routers import config_router as v2_config_router
from .v2.routers import payroll_router as v2_payroll_router
from .v2.routers import security_router as v2_security_router
from .v2.routers import auth_router as v2_auth_router

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
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With"],
    expose_headers=["Content-Length"],
    max_age=600,  # 预检请求缓存10分钟
)

# 数据库连接
# 首先尝试加载项目根目录的.env文件
root_dotenv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
if os.path.exists(root_dotenv_path):
    load_dotenv(dotenv_path=root_dotenv_path)
else:
    # 如果根目录没有.env文件，则尝试加载webapp/.env文件（向后兼容）
    webapp_dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
    load_dotenv(dotenv_path=webapp_dotenv_path)

DATABASE_URL = settings.DATABASE_URL  # 从配置获取
if not DATABASE_URL:
    logger.critical("DATABASE_URL environment variable not set!")
    # 尝试从各个组件构建连接字符串
    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_PORT = os.getenv("DB_PORT", "5432")
    DB_NAME = os.getenv("DB_NAME", "salary_system")
    DB_USER = os.getenv("DB_USER", "postgres")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "password")

    DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    logger.info(f"DATABASE_URL not set, constructed from components: {DB_HOST}:{DB_PORT}/{DB_NAME}")

# 在应用启动时初始化数据库（如果AUTO_INIT_DB环境变量设置为true）
AUTO_INIT_DB = os.getenv("AUTO_INIT_DB", "false").lower() == "true"
if AUTO_INIT_DB:
    logger.info("AUTO_INIT_DB设置为true，尝试自动初始化数据库...")
    from .scripts.init_app import initialize_database
    try:
        initialize_database()
    except Exception as e:
        logger.error(f"Error initializing database: {e}")
        # 不中断应用启动，但记录错误
else:
    logger.info("AUTO_INIT_DB未设置为true，跳过自动数据库初始化。如需自动初始化，请设置环境变量AUTO_INIT_DB=true")

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
    """转发到models_db.create_unit函数。"""
    db = conn
    from .schemas import UnitCreate as SchemasUnitCreate
    unit_obj = SchemasUnitCreate(**unit.dict())
    # Call renamed function
    result = models_db.create_unit(db, unit_obj)
    return result.__dict__

def get_unit_by_id(conn, unit_id: int) -> Optional[dict]:
    """转发到models_db.get_unit_by_id函数。"""
    db = conn
    # Call renamed function
    result = models_db.get_unit_by_id(db, unit_id)
    if result is None:
        return None
    return result.__dict__

def delete_unit(conn, unit_id: int) -> bool:
    """转发到models_db.delete_unit函数。"""
    db = conn
    # Call renamed function
    return models_db.delete_unit(db, unit_id)

def create_department(conn, department: DepartmentCreate) -> dict:
    """转发到models_db.create_department函数。"""
    db = conn
    from .schemas import DepartmentCreate as SchemasDepartmentCreate
    dept_obj = SchemasDepartmentCreate(**department.dict())
    # Call renamed function
    result = models_db.create_department(db, dept_obj)
    return result.__dict__

def delete_department(conn, department_id: int) -> bool:
    """转发到models_db.delete_department函数。"""
    db = conn
    # Call renamed function
    return models_db.delete_department(db, department_id)

# --- DELETE get_units, update_unit, update_department ---
# (These functions are likely unused placeholders or old code)

# --- Endpoints start here ---

@app.get("/")
async def read_root():
    """Root endpoint providing a welcome message."""
    return {"message": "Welcome to the Salary Information Management System API"}

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

# --- DELETE Redundant delete_field_mapping endpoint ---
# (The @app.delete("/api/config/mappings/{source_name}"...) block is deleted)

# --- Config Management Endpoints --- END

# --- Employee Management Endpoints (REMOVED - Handled by employees.py router) ---
# (The @app.get("/api/employees", ...) and @app.get("/api/employees/{employee_id}", ...) blocks are deleted)

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

    # 首先尝试加载项目根目录的.env文件
    root_dotenv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
    if os.path.exists(root_dotenv_path):
        load_dotenv(dotenv_path=root_dotenv_path)
        print(f"Loaded environment variables from {root_dotenv_path}")
    else:
        # 如果根目录没有.env文件，则尝试加载webapp/.env文件（向后兼容）
        webapp_dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
        load_dotenv(dotenv_path=webapp_dotenv_path)
        print(f"Loaded environment variables from {webapp_dotenv_path}")

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
    # Corrected query to use field_db_name and core schema
    query = text("""
        SELECT
            etfr.employee_type_key,
            etfr.field_db_name,
            etfr.is_required,
            sfm.source_name,
            sfm.target_name
        FROM core.employee_type_field_rules etfr
        JOIN core.salary_field_mappings sfm ON etfr.field_db_name = sfm.target_name
        WHERE etfr.employee_type_key = :employee_type_key;
    """ )
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
    prefix="", # Keep empty for root paths like /token
    tags=["Authentication"]
)

# 2. 用户管理路由
app.include_router(
    user_router,
    prefix="", # Removed /api prefix, assuming /api/users is defined within user_router
    tags=["Users"]
)

# 3. 员工路由
app.include_router(
    employees_router,
    prefix="", # Removed /api prefix, assuming /api/employees is defined within employees_router
    tags=["Employees"]
)

# 4. 单位路由
app.include_router(
    units.router,
    prefix="", # Removed /api prefix, assuming /api/units is defined within units.router
    tags=["Units"]
)

# 5. 部门路由
app.include_router(
    departments.router,
    prefix="", # Removed /api prefix, assuming /api/departments is defined within departments.router
    tags=["Departments"]
)

# 6. 报表链接路由
app.include_router(
    report_links.router,
    prefix="/api/report-links", # Keep specific prefix
    tags=["Report Links"]
)

# 7. 薪资数据路由
app.include_router(
    salary_data_router,
    prefix="",  # Keep empty as router defines /api/...
    tags=["Salary Data"]
)

# 8. 配置管理路由
app.include_router(
    config_router,
    prefix="/api/config", # Keep specific prefix
    tags=["Configuration"]
)

# 9. 文件转换路由
app.include_router(
    file_conversion_router,
    prefix="/api", # Changed prefix from '' to '/api'
    tags=["File Conversion"]
)

# 10. 计算引擎管理路由
app.include_router(
    calculation_admin_router,
    prefix="/api/v1", # Added /api/v1 prefix
    tags=["Calculation Engine Admin"]
)

# 11. 工资计算路由
app.include_router(
    salary_calculation_router,
    prefix="/api/v1", # Added /api/v1 prefix (assuming it's part of v1)
    tags=["Salary Calculation"]
)

# 12. 表格配置路由
app.include_router(
    table_configs_router,
    prefix="",  # 移除重复的前缀，因为路由文件中已经定义了前缀
    tags=["Table Configurations"]
)

# 13. 邮件服务器配置路由
app.include_router(
    email_config_router,
    # prefix="/api/email-configs" # Prefix is defined in the router itself
    tags=["Email Server Configurations"]
)

# 14. 邮件发送路由
app.include_router(
    email_sender_router,
    # prefix="/api/email-sender" # Prefix is defined in the router itself
    tags=["Email Sender"]
)

# 15. v2 API路由
# 员工路由
app.include_router(
    v2_employees_router,
    tags=["v2 API"]
)

# 部门路由
app.include_router(
    v2_departments_router,
    tags=["v2 API"]
)

# 职位路由
app.include_router(
    v2_job_titles_router,
    tags=["v2 API"]
)

# 查找值路由
app.include_router(
    v2_lookup_router,
    tags=["v2 API"]
)

# 配置路由
app.include_router(
    v2_config_router,
    tags=["v2 API"]
)

# 工资路由
app.include_router(
    v2_payroll_router,
    tags=["v2 API"]
)

# 安全路由
app.include_router(
    v2_security_router,
    tags=["v2 API"]
)

# 认证路由
app.include_router(
    v2_auth_router,
    tags=["v2 API"]
)

# --- Removed API Routers with /api/v1 prefix ---
# (Removed api_v1_router definition and app.include_router(api_v1_router))