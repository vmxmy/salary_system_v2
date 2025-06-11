"""
数据库连接模块，提供v2 API使用的数据库连接和会话管理。
"""
import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
from ..core.config import settings

# 加载环境变量
# load_dotenv() # 通常由主应用或 pydantic-settings 在配置层面处理，这里可以考虑移除或保留看是否对独立脚本运行此文件有影响

logger = logging.getLogger(__name__)

# 使用主应用的 DATABASE_URL 配置
SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL

if not SQLALCHEMY_DATABASE_URL:
    error_msg = "DATABASE_URL is not set in settings (via .env or environment variables). Cannot establish DB V2 connection."
    logger.critical(error_msg)
    # 根据实际需求决定是否在此处引发异常，或者允许有默认值（settings.DATABASE_URL本身可能已有默认值）
    # 如果 settings.DATABASE_URL 保证总有值（例如通过 pydantic 的默认值），则此检查可能不需要如此严格
    raise RuntimeError(error_msg) # 或者使用一个更安全的备用，但目标是统一

logger.info(f"V2 API is configured to use DATABASE_URL: {SQLALCHEMY_DATABASE_URL.split('@')[0] if SQLALCHEMY_DATABASE_URL and '@' in SQLALCHEMY_DATABASE_URL else 'DATABASE_URL (details masked or not available)'}@********")

# 创建SQLAlchemy引擎 - 🚀 针对远程数据库优化
engine_v2 = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    pool_pre_ping=True,           # 保持连接活跃，避免重新连接
    pool_size=20,                 # 增加连接池大小（远程连接）
    max_overflow=30,              # 增加最大溢出连接数
    pool_timeout=60,              # 增加获取连接超时时间
    pool_recycle=7200,            # 连接回收时间（2小时，远程连接保持更久）
    echo=False,                   # 禁用SQL echo以提升性能
    # 🚀 针对远程连接的特殊优化
    connect_args={
        "connect_timeout": 10,    # TCP连接超时
        "application_name": "salary_system_v2_api"  # 应用标识
    }
)

# 创建会话工厂
SessionLocalV2 = sessionmaker(autocommit=False, autoflush=False, bind=engine_v2)

# 创建声明性模型的Base类
BaseV2 = declarative_base()

def get_db_v2():
    """FastAPI dependency that provides a SQLAlchemy database session for v2 API."""
    db = SessionLocalV2()
    try:
        yield db
    finally:
        db.close()

def get_database_url_for_bg_task() -> str:
    """Returns the database URL for background task usage."""
    if not SQLALCHEMY_DATABASE_URL:
        # This case should ideally be prevented by the initial check at module load.
        logger.critical("get_database_url_for_bg_task: SQLALCHEMY_DATABASE_URL is not available!")
        raise RuntimeError("Database URL is not configured for background tasks.")
    return str(SQLALCHEMY_DATABASE_URL) # Ensure it's a string

# For async background tasks
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from contextlib import asynccontextmanager

# Example: postgresql+asyncpg://user:password@host:port/dbname
# ASYNC_SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://") if SQLALCHEMY_DATABASE_URL else None

if SQLALCHEMY_DATABASE_URL:
    if SQLALCHEMY_DATABASE_URL.startswith("postgresql+psycopg2://"):
        ASYNC_SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgresql+psycopg2://", "postgresql+asyncpg://")
    elif SQLALCHEMY_DATABASE_URL.startswith("postgresql://"):
        ASYNC_SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")
    else:
        logger.warning(f"Database URL {SQLALCHEMY_DATABASE_URL} is not in a recognized format for async conversion. Async DB operations may fail.")
        ASYNC_SQLALCHEMY_DATABASE_URL = None
else:
    ASYNC_SQLALCHEMY_DATABASE_URL = None

if ASYNC_SQLALCHEMY_DATABASE_URL:
    async_engine_v2 = create_async_engine(ASYNC_SQLALCHEMY_DATABASE_URL, echo=False) # Set echo=True for debugging
    AsyncSessionLocalV2 = sessionmaker(
        bind=async_engine_v2, class_=AsyncSession, expire_on_commit=False
    )
else:
    logger.warning("ASYNC_SQLALCHEMY_DATABASE_URL is not configured. Async DB operations may fail.")
    async_engine_v2 = None
    AsyncSessionLocalV2 = None


@asynccontextmanager
async def get_async_db_session() -> AsyncSession:
    """Provides an asynchronous SQLAlchemy database session."""
    if not AsyncSessionLocalV2:
        logger.error("AsyncSessionLocalV2 is not initialized. Cannot create async DB session.")
        raise RuntimeError("Async database session factory is not configured.")
    
    async_session = AsyncSessionLocalV2()
    try:
        yield async_session
        await async_session.commit()
    except Exception:
        await async_session.rollback()
        raise
    finally:
        await async_session.close()
