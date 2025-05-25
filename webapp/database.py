import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
from sqlalchemy.exc import OperationalError

# Import settings - .env is loaded by core.config
from .core.config import settings

# Load environment variables # -
# 首先尝试加载项目根目录的.env文件 # -
# root_dotenv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env') # -
# if os.path.exists(root_dotenv_path): # -
#     load_dotenv(dotenv_path=root_dotenv_path) # -
# else: # -
#     # 如果根目录没有.env文件，则尝试加载webapp/.env文件（向后兼容） # -
#     webapp_dotenv_path = os.path.join(os.path.dirname(__file__), '.env') # -
#     load_dotenv(dotenv_path=webapp_dotenv_path) # -

logger = logging.getLogger(__name__)

# 使用settings中的DATABASE_URL
DATABASE_URL = settings.DATABASE_URL

if not DATABASE_URL:
    # This case should ideally not be reached if settings has a default or .env is loaded correctly by pydantic-settings
    logger.critical("DATABASE_URL is not configured in settings (via .env or defaults)! Cannot establish DB connection.")
    # Optionally, raise an exception here to prevent the app from starting with a misconfiguration
    # raise ValueError("DATABASE_URL is not configured.") 
    # For now, to maintain original behavior of having a string (though now it's from settings):
    # If settings.DATABASE_URL could somehow be None and we don't raise, SQLAlchemy would error.
    # The original code had a placeholder, but now we rely on settings to provide a valid or default URL.
    # If settings.DATABASE_URL itself can be None and we must have a string,
    # we might need a different fallback, but pydantic settings usually handle this.


# 检查 DATABASE_URL 是否是占位符，这不应该再发生，因为我们直接从 settings 读取
# if DATABASE_URL == "postgresql://user:password@host:port/dbname":
# logger.warning("DATABASE_URL is still using the placeholder value. Ensure .env is correctly loaded and configured.")

# Create SQLAlchemy engine
# connect_args can be used for options like SSL: e.g., {"sslmode": "require"}
engine = create_engine(DATABASE_URL, pool_pre_ping=True)

# Create a session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create a Base class for declarative models
Base = declarative_base()

def get_db():
    """FastAPI dependency that provides a SQLAlchemy database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
