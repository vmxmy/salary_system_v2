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

# 创建SQLAlchemy引擎
engine_v2 = create_engine(SQLALCHEMY_DATABASE_URL, pool_pre_ping=True)

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
