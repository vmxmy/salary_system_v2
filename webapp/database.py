import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Load environment variables
# 首先尝试加载项目根目录的.env文件
root_dotenv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
if os.path.exists(root_dotenv_path):
    load_dotenv(dotenv_path=root_dotenv_path)
else:
    # 如果根目录没有.env文件，则尝试加载webapp/.env文件（向后兼容）
    webapp_dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
    load_dotenv(dotenv_path=webapp_dotenv_path)

DATABASE_URL = os.getenv("DATABASE_URL")
logger = logging.getLogger(__name__)

if not DATABASE_URL:
    logger.critical("DATABASE_URL environment variable not set! Cannot establish DB connection.")
    # Raise error during module load if DATABASE_URL is missing or placeholder
    DATABASE_URL = "postgresql://user:password@host:port/dbname" # Placeholder only

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

# --- Old psycopg2 Connection (REMOVE) --- START ---
# def get_db_connection():
#     """Provides a psycopg2 database connection using DATABASE_URL."""
#     if not DATABASE_URL:
#         logger.critical("DATABASE_URL environment variable not set for psycopg2 connection!")
#         raise ConnectionError("Database configuration is missing.")
#     conn = None
#     try:
#         conn = psycopg2.connect(DATABASE_URL)
#         logger.debug("psycopg2 connection established.")
#         yield conn # Yield the connection for use in a 'with' statement or endpoint dependency
#     except psycopg2.OperationalError as e:
#         logger.error(f"Failed to connect to database using psycopg2: {e}")
#         raise ConnectionError(f"Database connection failed: {e}")
#     finally:
#         if conn:
#             conn.close()
#             logger.debug("psycopg2 connection closed.")
# --- Old psycopg2 Connection (REMOVE) --- END ---