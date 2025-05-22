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
    API_V2_PREFIX: str = os.getenv("VITE_API_PATH_PREFIX", "/v2")

    # 安全设置
    SECRET_KEY: str = os.getenv("SECRET_KEY", "请替换这个为真正的密钥，不要使用默认值")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7天

    # 数据库设置
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql+psycopg2://postgres:810705@localhost:5432/salary_system_v2")

    # CORS设置
    CORS_ORIGINS_STRING: Optional[str] = os.getenv("CORS_ORIGINS_STRING", None)
    CORS_ORIGINS: List[str] = []

    def __init__(self, **values):
        super().__init__(**values)
        if self.CORS_ORIGINS_STRING:
            self.CORS_ORIGINS = [origin.strip() for origin in self.CORS_ORIGINS_STRING.split(',')]
        else:
            self.CORS_ORIGINS = [
                "http://localhost:3000",
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "http://localhost:8080",
                "http://127.0.0.1:8080",
                "http://172.28.97.217:5173",
                "http://salary.ziikoo.com",
                "https://salary.ziikoo.com",
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