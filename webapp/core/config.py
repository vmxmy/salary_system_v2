import os
import sys
from dotenv import load_dotenv
from pydantic_settings import BaseSettings
import logging
from typing import List, Optional, Union
from pathlib import Path

# 强制只从 webapp 目录下读取 .env 文件
webapp_dir = Path(__file__).resolve().parent.parent
dotenv_path = webapp_dir / ".env"

if not dotenv_path.exists():
    error_msg = f"❌ 错误: 未找到必需的 .env 文件: {dotenv_path}\n请在 webapp 目录下创建 .env 文件并配置必要的环境变量。"
    print(error_msg, file=sys.stderr)
    raise FileNotFoundError(error_msg)

# 加载 webapp 目录下的 .env 文件
load_dotenv(dotenv_path=dotenv_path)
print(f"✅ 成功加载配置文件: {dotenv_path}")

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

    # Uvicorn设置
    UVICORN_HOST: str = os.getenv("UVICORN_HOST", "0.0.0.0")
    UVICORN_PORT: int = int(os.getenv("UVICORN_PORT", "8080"))
    UVICORN_RELOAD: bool = os.getenv("UVICORN_RELOAD", "true").lower() == "true"

    # 安全设置
    SECRET_KEY: str = os.getenv("SECRET_KEY", "请替换这个为真正的密钥，不要使用默认值")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7天

    # 数据库设置
    DATABASE_URL: str = os.getenv("DATABASE_URL")

    # CORS设置
    CORS_ORIGINS_STRING: Optional[str] = os.getenv("CORS_ORIGINS_STRING", None)
    CORS_ORIGINS: List[str] = []

    def __init__(self, **values):
        super().__init__(**values)
        if self.CORS_ORIGINS_STRING:
            self.CORS_ORIGINS = [origin.strip() for origin in self.CORS_ORIGINS_STRING.split(',')]
        else:
            # 如果没有设置环境变量，使用空列表（需要通过环境变量配置）
            self.CORS_ORIGINS = []
            print("⚠️  警告: 未设置 CORS_ORIGINS_STRING 环境变量，CORS 将不允许任何跨域请求")
            print("   请在 .env 文件中设置 CORS_ORIGINS_STRING 环境变量")

    # 文件上传设置
    UPLOAD_DIR: str = "/tmp/salary_uploads"
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB

    # 允许额外的环境变量通过，不会引发验证错误
    # 注意：env_file 设置为 None，因为我们已经手动加载了 .env 文件
    model_config = {
        "extra": "ignore",
        "env_file": None,  # 禁用自动 .env 文件查找
        "env_file_encoding": "utf-8"
    }

# 创建设置实例
settings = Settings()

# 导出设置对象
def get_settings() -> Settings:
    """返回应用程序设置实例"""
    return settings