# /Users/xumingyang/app/高新区工资信息管理/salary_system/webapp/scripts/init_app.py
import os
import sys
import time
import logging
from subprocess import run, CalledProcessError

from sqlalchemy import create_engine, text, inspect
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import sessionmaker

# 添加项目根目录到Python路径，以便能够导入webapp模块
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

# 导入必要的模块
from webapp.database import Base
from webapp.models import User, Role
from webapp.schemas import UserCreate
from webapp.auth import get_password_hash
from webapp.models_db import get_user_by_username, get_role_by_name, create_user

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- 数据库连接重试 ---
MAX_RETRIES = 10
RETRY_DELAY = 5 # seconds

# 从环境变量获取数据库连接字符串
DATABASE_URL = os.getenv("DATABASE_URL")

# 如果环境变量中没有设置，则尝试从各个组件构建连接字符串
if not DATABASE_URL:
    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_PORT = os.getenv("DB_PORT", "5432")
    DB_NAME = os.getenv("DB_NAME", "salary_system")
    DB_USER = os.getenv("DB_USER", "postgres")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "password")

    DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    logger.info(f"DATABASE_URL not set, constructed from components: {DB_HOST}:{DB_PORT}/{DB_NAME}")

# 创建数据库引擎
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def wait_for_db():
    """等待数据库服务准备好接受连接"""
    logger.info("Waiting for database...")
    db_up = False
    for i in range(MAX_RETRIES):
        try:
            # 使用已创建的engine进行连接测试
            with engine.connect() as connection:
                # 执行一个简单的查询来确认连接
                connection.execute(text("SELECT 1"))
            db_up = True
            logger.info("Database is ready!")
            break
        except OperationalError as e:
            logger.warning(f"Database not ready yet (attempt {i+1}/{MAX_RETRIES}): {e}")
            time.sleep(RETRY_DELAY)
        except Exception as e:
            logger.error(f"An unexpected error occurred while connecting to DB: {e}")
            time.sleep(RETRY_DELAY)

    if not db_up:
        logger.error("Database did not become available after maximum retries. Exiting.")
        exit(1)

# --- Alembic 迁移 ---
def run_migrations():
    """运行 Alembic 数据库迁移"""
    logger.info("Running database migrations...")
    try:
        # 确保 alembic.ini 文件在容器的工作目录或 PYTHONPATH 中可访问
        # 根据需要调整 alembic.ini 的路径或在 Dockerfile 中设置工作目录
        # 此处假设 alembic 命令在 PATH 中，并且 alembic.ini 在当前目录或父目录
        # 如果您的 alembic.ini 在特定位置，可能需要使用 -c 参数:
        # result = run(["alembic", "-c", "/path/to/alembic.ini", "upgrade", "head"], check=True, capture_output=True, text=True)
        result = run(["alembic", "upgrade", "head"], check=True, capture_output=True, text=True)
        logger.info("Alembic upgrade head stdout:")
        logger.info(result.stdout)
        logger.info("Database migrations completed successfully.")
    except CalledProcessError as e:
        logger.error("Database migrations failed.")
        logger.error(f"Return code: {e.returncode}")
        logger.error(f"Stdout: {e.stdout}")
        logger.error(f"Stderr: {e.stderr}")
        exit(1)
    except FileNotFoundError:
        logger.error("Alembic command not found. Make sure Alembic is installed and in the PATH.")
        exit(1)
    except Exception as e:
        logger.error(f"An unexpected error occurred during migrations: {e}")
        exit(1)


# --- 检查数据库是否已初始化 ---
def check_db_initialized():
    """检查数据库是否已初始化（表是否存在）"""
    logger.info("Checking if database is initialized...")
    inspector = inspect(engine)

    # 检查core schema是否存在
    schemas = inspector.get_schema_names()
    if 'core' not in schemas:
        logger.info("Core schema not found. Database needs initialization.")
        return False

    # 检查关键表是否存在
    tables_to_check = ['users', 'roles']
    for table in tables_to_check:
        if not inspector.has_table(table, schema='core'):
            logger.info(f"Table 'core.{table}' not found. Database needs initialization.")
            return False

    logger.info("Database appears to be initialized with required tables.")
    return True

# --- 创建角色 ---
def create_roles(db):
    """创建基本角色（如果不存在）"""
    logger.info("Creating default roles if they don't exist...")

    # 定义默认角色
    default_roles = [
        {"name": "Super Admin", "description": "超级管理员，拥有所有权限"},
        {"name": "Data Admin", "description": "数据管理员，可以管理数据但不能管理用户"},
        {"name": "User", "description": "普通用户，只有查看权限"},
        {"name": "Guest", "description": "访客，权限受限"}
    ]

    for role_data in default_roles:
        role = get_role_by_name(db, role_data["name"])
        if not role:
            logger.info(f"Creating role: {role_data['name']}")
            # 创建角色
            new_role = Role(name=role_data["name"], description=role_data["description"])
            db.add(new_role)
            db.commit()
            logger.info(f"Role '{role_data['name']}' created successfully.")
        else:
            logger.info(f"Role '{role_data['name']}' already exists.")

# --- 创建初始管理员用户 ---
def create_initial_admin():
    """创建初始管理员用户（如果不存在）"""
    logger.info("Checking for initial admin user...")
    ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@example.com")
    ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
    ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "changeme") # 强烈建议更改此默认值

    if not ADMIN_PASSWORD or ADMIN_PASSWORD == "changeme":
        logger.warning("Default admin password is used. Please set a strong ADMIN_PASSWORD environment variable.")

    # 创建数据库会话
    db = SessionLocal()

    try:
        # 首先创建角色
        create_roles(db)

        # 检查管理员用户是否存在
        admin_user = get_user_by_username(db, username=ADMIN_USERNAME)
        if not admin_user:
            logger.info(f"Admin user '{ADMIN_USERNAME}' not found. Creating...")

            # 获取Super Admin角色
            admin_role = get_role_by_name(db, "Super Admin")
            if not admin_role:
                logger.error("Default admin role 'Super Admin' not found in database. Cannot create admin user.")
                return

            # 创建用户
            user_in = UserCreate(
                username=ADMIN_USERNAME,
                email=ADMIN_EMAIL,
                password=ADMIN_PASSWORD,
                role_id=admin_role.id,
                is_active=True
            )

            # 哈希密码
            hashed_password = get_password_hash(user_in.password)

            # 创建用户
            new_admin = create_user(db, user=user_in, hashed_password=hashed_password)
            logger.info(f"Admin user '{ADMIN_USERNAME}' created successfully with role 'Super Admin'.")
        else:
            logger.info(f"Admin user '{ADMIN_USERNAME}' already exists.")
    except Exception as e:
        logger.error(f"Failed to create initial admin user: {e}")
        db.rollback() # 回滚以防部分操作成功
        # 不在此处退出，迁移可能已成功，允许应用启动
    finally:
        db.close()

# --- 初始化数据库 ---
def initialize_database(force_confirm=False):
    """初始化数据库，包括运行迁移和创建初始管理员用户

    Args:
        force_confirm: 如果为True，则跳过用户确认直接执行初始化
    """
    # 检查数据库是否已初始化
    if not check_db_initialized():
        logger.info("Database needs initialization.")

        # 如果不是强制确认模式，则请求用户确认
        if not force_confirm and not os.getenv("AUTO_INIT_DB", "false").lower() == "true":
            try:
                confirm = input("数据库需要初始化。是否继续？(y/n): ")
                if not confirm.lower() in ['y', 'yes']:
                    logger.info("用户取消了数据库初始化。")
                    return
            except Exception as e:
                # 如果在非交互式环境中无法获取输入，则记录警告并继续
                logger.warning(f"无法获取用户输入确认，可能在非交互式环境中运行: {e}")
                logger.info("继续执行初始化...")

        logger.info("Running database migrations...")
        run_migrations()
        logger.info("Creating initial admin user...")
        create_initial_admin()
    else:
        logger.info("Database is already initialized. Skipping initialization.")

# --- 主执行流程 ---
if __name__ == "__main__":
    import argparse

    # 创建命令行参数解析器
    parser = argparse.ArgumentParser(description="数据库初始化脚本")
    parser.add_argument("--force", "-f", action="store_true", help="强制初始化，不提示确认")
    parser.add_argument("--yes", "-y", action="store_true", help="自动确认所有提示")
    args = parser.parse_args()

    wait_for_db()

    # 如果指定了--yes或--force参数，则跳过确认
    force_confirm = args.force or args.yes
    initialize_database(force_confirm=force_confirm)

    logger.info("Initialization script finished.")