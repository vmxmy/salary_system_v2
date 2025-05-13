import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings
import logging
from typing import List, Optional, Union

# 加载环境变量
load_dotenv()

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

class Settings(BaseSettings):
    """应用程序配置，使用pydantic_settings管理环境变量和默认值"""

    # API设置
    API_TITLE: str = "薪资管理系统API"
    API_VERSION: str = "1.0.0"
    API_PREFIX: str = ""

    # 安全设置
    SECRET_KEY: str = os.getenv("SECRET_KEY", "请替换这个为真正的密钥，不要使用默认值")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7天

    # 数据库设置
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/salary_db")

    # CORS设置
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://172.28.97.217:5173",  # 添加您的IP地址和端口
        "http://salary.ziikoo.com",   # 添加域名
        "https://salary.ziikoo.com",  # 添加HTTPS版本
        # 移除通配符"*"，因为它与allow_credentials=True不兼容
    ]

    # 文件上传设置
    UPLOAD_DIR: str = "/tmp/salary_uploads"
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB

    # DBT设置
    DBT_PROJECT_DIR: str = os.getenv("DBT_PROJECT_DIR", "./dbt")

    # 允许额外的环境变量通过，不会引发验证错误
    model_config = {
        "extra": "ignore",
        "env_file": ".env"
    }

# 创建设置实例
settings = Settings()

# 导出设置对象
def get_settings() -> Settings:
    """返回应用程序设置实例"""
    return settings