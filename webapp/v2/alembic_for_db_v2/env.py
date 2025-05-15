import os
import sys # Ensure sys is imported early
from logging.config import fileConfig

# --- 新增：加载 .env 文件 ---
from dotenv import load_dotenv

# 计算 .env 文件的路径
# env.py 路径: webapp/v2/alembic_for_db_v2/env.py
# 项目根目录是 env.py 往上三层
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
dotenv_path = os.path.join(project_root, '.env')
if os.path.exists(dotenv_path):
    print(f"--- Alembic env.py: Loading .env file from: {dotenv_path} ---")
    load_dotenv(dotenv_path)
else:
    print(f"--- Alembic env.py: .env file not found at: {dotenv_path} ---")

# --- 新增：将项目根目录添加到 sys.path --- 
if project_root not in sys.path:
    print(f"--- Alembic env.py: Adding project root to sys.path: {project_root} ---")
    sys.path.insert(0, project_root)
else:
    print(f"--- Alembic env.py: Project root already in sys.path: {project_root} ---")
# --- 结束新增 ---

from sqlalchemy import engine_from_config
from sqlalchemy import pool
import sqlalchemy as sa # Added for sa.create_engine

from alembic import context

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
# from myapp import mymodel
# target_metadata = mymodel.Base.metadata
# --- 修改：指向您的 db_v2 (db_main) 的 SQLAlchemy 模型元数据 ---
try:
    # from webapp.v2.models import Base  # 旧的导入方式
    from webapp.v2.database import BaseV2  # 新的导入方式
    target_metadata = BaseV2.metadata
    print(f"--- Alembic env.py: Successfully imported BaseV2.metadata from webapp.v2.database. ID: {id(BaseV2.metadata)} ---")
    # Debug: Print known tables to confirm
    if target_metadata is not None:
        known_tables = ", ".join(sorted([f"{table.schema}.{table.name}" if table.schema else table.name for table in target_metadata.tables.values()]))
        print(f"--- Alembic env.py: Tables known to target_metadata: {known_tables if known_tables else 'None'} ---")
    else:
        print("--- Alembic env.py: target_metadata is None after import attempt. ---")

except ImportError as e:
    print(f"--- Alembic env.py Error: Failed to import BaseV2 from webapp.v2.database. Error: {e} ---")
    print(f"Current sys.path: {sys.path}")
    print("Please ensure 'webapp.v2.database.BaseV2' is correct and the parent directory of 'webapp' is in PYTHONPATH if running alembic from a different location.")
    target_metadata = None 
# --- 结束修改 ---


# --- 新增：从环境变量直接获取完整的数据库URL ---
def get_configured_database_url():
    # 直接从 .env 文件读取 DATABASE_URL_V2
    db_url = os.getenv("DATABASE_URL_V2")

    if not db_url:
        print("--- Alembic env.py Error: DATABASE_URL_V2 environment variable not set! ---")
        # Fallback or raise error - for now, let's try the main config as a last resort, though it's not ideal
        # This part might need adjustment based on whether alembic.ini has a usable default
        print("--- Alembic env.py: Attempting to use sqlalchemy.url from alembic.ini as fallback. ---")
        return config.get_main_option("sqlalchemy.url") # Fallback, might be None or wrong DB

    print(f"--- Alembic env.py: Using database URL from environment variable DATABASE_URL_V2: {db_url.split('@')[0]}@******** ---") # Mask password
    return db_url.strip()
# --- 结束新增 ---


# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = get_configured_database_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        include_schemas=True, # Added for schema support
        # compare_type=True, # Consider enabling for stricter type checking during autogenerate
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    db_url_for_online = get_configured_database_url()
    if not db_url_for_online:
        raise ValueError("Database URL could not be determined for online mode.")

    # connectable = engine_from_config( # Original way
    #     config.get_section(config.config_ini_section, {}),
    #     prefix="sqlalchemy.",
    #     poolclass=pool.NullPool,
    # )
    
    # Directly use the URL from env var to create engine
    print(f"--- Alembic env.py: CONFIG.SQLALCHEMY.URL for online mode (from env or fallback): {db_url_for_online.split('@')[0]}@******** ---") # Mask password
    connectable = sa.create_engine(db_url_for_online, poolclass=pool.NullPool)


    with connectable.connect() as connection:
        print(f"--- Alembic env.py: Successfully connected to DB for online mode: {str(connection.engine.url).split('@')[0]}@******** ---") # Mask password
        context.configure(
            connection=connection, 
            target_metadata=target_metadata,
            include_schemas=True, # Added for schema support
            # compare_type=True, # Consider enabling for stricter type checking
            # render_as_batch=True, # For SQLite and some other DBs if needed
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
