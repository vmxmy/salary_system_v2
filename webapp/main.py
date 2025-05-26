import sys
import os

# 添加项目根目录到Python路径，确保可以导入webapp模块
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
if project_root not in sys.path:
    sys.path.insert(0, project_root)

print(f"--- main.py DEBUG ---")
print(f"CWD: {os.getcwd()}")
print(f"sys.path: {sys.path}")
print(f"PYTHONPATH env: {os.environ.get('PYTHONPATH')}")
print(f"current_dir: {current_dir}")
print(f"project_root: {project_root}")
print(f"---------------------")

# Import os module
# print(f"==== Loading main.py from: {os.path.abspath(__file__)} ====") # Added print statement
# print("==== sys.path ====", sys.path)
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Query, status, Body, Response
import bcrypt

# 现在可以安全地使用绝对导入
from webapp.auth import get_password_hash
# print("admin hash:", get_password_hash("admin"))
# print("==== bcrypt module path:", bcrypt.__file__)
# print("==== has __about__:", hasattr(bcrypt, "__about__"))
# if hasattr(bcrypt, "__about__"):
#     print("==== bcrypt.__about__:", bcrypt.__about__)
# else:
#     print("==== dir(bcrypt):", dir(bcrypt))
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

# Configure logging to output DEBUG level messages
handler = logging.StreamHandler(sys.stdout)
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)
logger.setLevel(logging.INFO) # Set logger level to INFO

# Also set the root logger level to DEBUG to ensure all loggers inherit it
# logging.basicConfig(level=logging.DEBUG) # Configured in webapp/core/config.py


# Import modules - 使用绝对导入
from webapp import auth, models_db, schemas, models
from webapp.database import get_db
from webapp.core.config import settings

# Import v2 API routers
from webapp.v2.routers import employees_router as v2_employees_router
from webapp.v2.routers import departments_router as v2_departments_router
from webapp.v2.routers import personnel_categories_router as v2_personnel_categories_router
from webapp.v2.routers import positions_router as v2_positions_router
from webapp.v2.routers import lookup_router as v2_lookup_router
from webapp.v2.routers import config_router as v2_config_router
from webapp.v2.routers import payroll_router as v2_payroll_router
from webapp.v2.routers import security_router as v2_security_router
from webapp.v2.routers import auth_router as v2_auth_router

# 导入所有Pydantic模型
from webapp.pydantic_models import (
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
DATABASE_URL = settings.DATABASE_URL  # 从配置获取
if not DATABASE_URL:
    logger.warning("DATABASE_URL environment variable not set! Attempting to construct from components.") # Changed to warning
    # 尝试从各个组件构建连接字符串
    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_PORT = os.getenv("DB_PORT", "5432")
    DB_NAME = os.getenv("DB_NAME", "salary_system")
    DB_USER = os.getenv("DB_USER", "postgres")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "password")

    DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    logger.info(f"DATABASE_URL was not set, constructed from components: {DB_HOST}:{DB_PORT}/{DB_NAME}") # Minor wording change

# 在应用启动时初始化数据库（如果AUTO_INIT_DB环境变量设置为true）
AUTO_INIT_DB = os.getenv("AUTO_INIT_DB", "false").lower() == "true"
if AUTO_INIT_DB:
    logger.info("AUTO_INIT_DB is true, attempting to auto-initialize database...") # Minor wording change
    from webapp.scripts.init_app import initialize_database
    try:
        initialize_database()
    except Exception as e:
        logger.error(f"Error initializing database: {e}")
        # 不中断应用启动，但记录错误
else:
    logger.info("AUTO_INIT_DB is not true, skipping auto database initialization. Set AUTO_INIT_DB=true to enable.") # Minor wording change

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
        logger.error(f"Frontend HTML file not found at: {html_file_path}") # Changed to logger.error
        raise HTTPException(status_code=404, detail="Converter page not found.")
    try:
        with open(html_file_path, "r", encoding="utf-8") as f:
            html_content = f.read()
        return HTMLResponse(content=html_content)
    except Exception as e:
        # 修复print参数错误
        logger.error(f"Error reading HTML file {html_file_path}: {e}") # Changed to logger.error
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
    host = settings.UVICORN_HOST
    port = settings.UVICORN_PORT
    reload_uvicorn = settings.UVICORN_RELOAD

    logger.info(f"Starting Uvicorn server on http://{host}:{port} with reload={reload_uvicorn}...")
    uvicorn.run("webapp.main:app", host=host, port=port, reload=reload_uvicorn)

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

# 注册路由 - 清理旧的注册，并使用新的方式

# 删除所有旧的 app.include_router(...) 调用，从这里开始到文件几乎末尾
# (下面的内容将被新的注册块替换)
# app.include_router(
# v2_employees_router,
# prefix="/api/v2",
# tags=["Employees V2"]
# )
# ... (所有其他 /api/v2 和空 prefix 的路由注册都将被删除) ...
# app.include_router(
# v2_auth_router,
# tags=["v2 API"]
# )

# 新的 V2 路由注册
app.include_router(
    v2_auth_router,
    prefix=settings.API_V2_PREFIX,
    tags=["Authentication"]
)
app.include_router(
    v2_employees_router,
    prefix=settings.API_V2_PREFIX,
    tags=["Employees"]
)
app.include_router(
    v2_departments_router,
    prefix=settings.API_V2_PREFIX,
    tags=["Departments"]
)
app.include_router(
    v2_personnel_categories_router,
    prefix=settings.API_V2_PREFIX,
    tags=["Personnel Categories"]
)
app.include_router(
    v2_lookup_router,
    prefix=settings.API_V2_PREFIX,
    tags=["Lookup"]
)
app.include_router(
    v2_config_router,
    prefix=settings.API_V2_PREFIX,
    tags=["Configuration"]
)
app.include_router(
    v2_payroll_router,
    prefix=settings.API_V2_PREFIX,
    tags=["Payroll"]
)
app.include_router(
    v2_security_router, # 这个是 security.py 对应的路由器变量名
    prefix=settings.API_V2_PREFIX,
    tags=["Security"]
)

# Include the new positions router
app.include_router(
    v2_positions_router,
    prefix=settings.API_V2_PREFIX,
    tags=["Positions V2"]
)

# --- Removed API Routers with /api/v1 prefix ---
# (Removed api_v1_router definition and app.include_router(api_v1_router))