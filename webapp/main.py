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
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
# === 日志增强：全局请求耗时与SQL耗时日志 ===
from webapp.v2.utils.request_sql_logging import RequestTimingMiddleware, setup_sql_timing_logging
from webapp.v2.database import engine_v2

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s"
)

# FastAPI应用初始化
app = FastAPI()

# 挂载全局请求耗时日志中间件
# 🚨 临时禁用：RequestTimingMiddleware 导致极慢响应（每请求执行psutil内存检查）
# app.add_middleware(RequestTimingMiddleware)

# 启用SQLAlchemy SQL执行耗时日志
setup_sql_timing_logging(engine_v2)

# === PostgreSQL连接数监控SQL（可用于定时监控） ===
# SELECT count(*) FROM pg_stat_activity WHERE state = 'active';
# SELECT count(*) FROM pg_stat_activity;
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
# from webapp.v2.routers import lookup_router as v2_lookup_router  # Now included in config_router
from webapp.v2.routers import config_router as v2_config_router
from webapp.v2.routers import config_v2_router as v2_config_v2_router
from webapp.v2.routers import payroll_router as v2_payroll_router
from webapp.v2.routers import payroll_v2_router as v2_payroll_v2_router
from webapp.v2.routers import hr_v2_router as v2_hr_v2_router
from webapp.v2.routers import security_router as v2_security_router
from webapp.v2.routers.auth import router as v2_auth_router
from webapp.v2.routers.reports import router as v2_reports_router
from webapp.v2.routers import calculation_config_router as v2_calculation_config_router
# Import new V2 system routers
from webapp.v2.routers.system import router as v2_system_router
from webapp.v2.routers.debug import router as v2_debug_router  
from webapp.v2.routers.utilities import router as v2_utilities_router
# from webapp.v2.routers import payroll_calculation_router as v2_payroll_calculation_router  # 已删除复杂计算引擎
from webapp.v2.routers import attendance_router as v2_attendance_router
from webapp.v2.routers.table_config import router as v2_table_config_router
from webapp.v2.routers.views import router as v2_views_router
from webapp.v2.routers import report_config_management_router as v2_report_config_management_router

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
# 配置已从 webapp/.env 文件加载
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

# --- V1 Endpoints have been migrated to V2 ---
# Original endpoints moved to:
# GET /          -> GET /v2/system/info  
# GET /health    -> GET /v2/system/health
# GET /converter -> GET /v2/utilities/converter
# GET /api/debug/field-config/{key} -> GET /v2/debug/field-config/{key}

# --- 以下端点已移至salary_data.py路由器 ---
# @app.get("/api/salary_data/pay_periods", response_model=PayPeriodsResponse)
# @app.get("/api/salary_data", response_model=PaginatedSalaryResponse)
# @app.get("/api/establishment-types", response_model=List[str])
# @app.get("/api/establishment-types-list", response_model=List[EstablishmentTypeInfo])
# @app.get("/api/departments", response_model=List[str])
# @app.get("/api/units", response_model=List[str])
# @app.get("/api/departments-list", response_model=List[DepartmentInfo])

# --- HTML Frontend Endpoints Migrated to V2 ---
# GET /converter -> GET /v2/utilities/converter

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

# === DEBUG ENDPOINTS MIGRATED TO V2 ===
# GET /api/debug/field-config/{employee_type_key} -> GET /v2/debug/field-config/{employee_type_key}

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
    prefix=f"{settings.API_V2_PREFIX}/employees",
    tags=["Employees"]
)
app.include_router(
    v2_departments_router,
    prefix=f"{settings.API_V2_PREFIX}/departments",
    tags=["Departments"]
)
app.include_router(
    v2_personnel_categories_router,
    prefix=f"{settings.API_V2_PREFIX}/personnel-categories",
    tags=["Personnel Categories"]
)
# app.include_router(
#     v2_lookup_router,
#     prefix=settings.API_V2_PREFIX,
#     tags=["Lookup"]
# ) # Now included in config_router
app.include_router(
    v2_config_router,
    prefix=settings.API_V2_PREFIX,
    tags=["Configuration"]
)
app.include_router(
    v2_config_v2_router,
    prefix=settings.API_V2_PREFIX + "/config",
    tags=["Configuration V2 (Views-Based)"]
)
app.include_router(
    v2_payroll_router,
    prefix=settings.API_V2_PREFIX,
    tags=["Payroll"]
)
app.include_router(
    v2_payroll_v2_router,
    prefix=settings.API_V2_PREFIX,
    tags=["Payroll V2 (Views-Based)"]
)
app.include_router(
    v2_hr_v2_router,
    prefix=settings.API_V2_PREFIX + "/hr",
    tags=["HR V2 (Views-Based)"]
)
app.include_router(
    v2_security_router, # 这个是 security.py 对应的路由器变量名
    prefix=settings.API_V2_PREFIX,
    tags=["Security"]
)

# Include the new positions router
app.include_router(
    v2_positions_router,
    prefix=f"{settings.API_V2_PREFIX}/positions",
    tags=["Positions V2"]
)

# Include the new reports router
app.include_router(
    v2_reports_router,
    prefix=settings.API_V2_PREFIX,
    tags=["Reports"]
)

# Include the calculation config router
app.include_router(
    v2_calculation_config_router,
    prefix=settings.API_V2_PREFIX,
    tags=["Calculation Config"]
)

# Include the payroll calculation router - 已删除复杂计算引擎
# app.include_router(
#     v2_payroll_calculation_router,
#     prefix=settings.API_V2_PREFIX,
#     tags=["Payroll Calculation"]
# )

# Include the attendance router
app.include_router(
    v2_attendance_router,
    prefix=settings.API_V2_PREFIX + "/attendance",
    tags=["Attendance"]
)

# Include the table config router
app.include_router(
    v2_table_config_router,
    prefix=settings.API_V2_PREFIX,
    tags=["Table Configuration"]
)

# Include the views router
app.include_router(
    v2_views_router,
    prefix=settings.API_V2_PREFIX,
    tags=["Views"]
)

# Include the optimized views router
from webapp.v2.routers.views_optimized import router as v2_views_optimized_router
app.include_router(
    v2_views_optimized_router,
    prefix=settings.API_V2_PREFIX,
    tags=["高性能视图API"]
)

# Include the simple payroll router
from webapp.v2.routers.simple_payroll import router as v2_simple_payroll_router
app.include_router(
    v2_simple_payroll_router,
    prefix=settings.API_V2_PREFIX,
    tags=["Simple Payroll System"]
)

# Simple payroll audit functionality is now integrated into simple_payroll.py

# Include the simple payroll test router
from webapp.v2.routers.simple_payroll_test import router as v2_simple_payroll_test_router
app.include_router(
    v2_simple_payroll_test_router,
    prefix=settings.API_V2_PREFIX,
    tags=["Simple Payroll Test"]
)

# Include the batch reports router
from webapp.v2.routers.batch_reports import router as v2_batch_reports_router
app.include_router(
    v2_batch_reports_router,
    prefix=settings.API_V2_PREFIX,
    tags=["Batch Reports"]
)

# Include the report config management router
app.include_router(
    v2_report_config_management_router,
    prefix=settings.API_V2_PREFIX,
    tags=["Report Configuration Management"]
)

# Include the debug fast router for performance testing
from webapp.v2.routers.debug_fast import router as v2_debug_fast_router
app.include_router(
    v2_debug_fast_router,
    prefix=settings.API_V2_PREFIX,
    tags=["调试性能接口"]
)

# Include the new V2 system management routers
app.include_router(
    v2_system_router,
    prefix=settings.API_V2_PREFIX,
    tags=["System Management"]
)

app.include_router(
    v2_debug_router,
    prefix=settings.API_V2_PREFIX,
    tags=["Debug Tools"]
)

app.include_router(
    v2_utilities_router,
    prefix=settings.API_V2_PREFIX,
    tags=["Utilities"]
)

# --- Removed API Routers with /api/v1 prefix ---
# (Removed api_v1_router definition and app.include_router(api_v1_router))