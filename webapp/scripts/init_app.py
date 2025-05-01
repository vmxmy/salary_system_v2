# /Users/xumingyang/app/高新区工资信息管理/salary_system/webapp/scripts/init_app.py
import os
import time
import logging
from subprocess import run, CalledProcessError

from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import sessionmaker

# 假设您的数据库设置、模型和用户创建逻辑位于以下模块
# 请根据您的实际项目结构调整这些导入
# from database import SQLALCHEMY_DATABASE_URL, engine as app_engine # 假设这里定义了engine
# from models import Base, User, Role # 导入您的模型
# from schemas import UserCreate # 导入Pydantic模型
# from auth import get_password_hash, create_user # 导入用户创建和密码哈希函数
# from models_db import get_user_by_email, get_role_by_name, add_role_to_user # 导入数据库操作函数

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- 数据库连接重试 ---
MAX_RETRIES = 10
RETRY_DELAY = 5 # seconds

# !! 需要从您的项目中导入真实的 SQLALCHEMY_DATABASE_URL !!
# !! 这是一个占位符，请确保替换为正确的导入或直接从环境变量读取 !!
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@db:5432/salary_system")
# !! 同样，需要导入或创建真实的 engine !!
# app_engine = create_engine(SQLALCHEMY_DATABASE_URL)

def wait_for_db():
    """等待数据库服务准备好接受连接"""
    logger.info("Waiting for database...")
    db_up = False
    for i in range(MAX_RETRIES):
        try:
            # 使用一个临时的 engine 进行连接测试
            engine = create_engine(SQLALCHEMY_DATABASE_URL)
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


# --- 创建初始管理员用户 ---
# !!! 注意: 以下代码是示例，您需要根据项目中的实际模型和函数进行调整 !!!
# !!! 您需要取消注释并替换为实际的导入和逻辑 !!!
# def create_initial_admin():
#     """创建初始管理员用户（如果不存在）"""
#     logger.info("Checking for initial admin user...")
#     ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@example.com")
#     ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
#     ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "changeme") # 强烈建议更改此默认值
#
#     if not ADMIN_PASSWORD or ADMIN_PASSWORD == "changeme":
#         logger.warning("Default admin password is used. Please set a strong ADMIN_PASSWORD environment variable.")
#
#     # 创建数据库会话 (需要真实的 engine)
#     # SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=app_engine)
#     # db = SessionLocal()
#
#     try:
#         # admin_user = get_user_by_email(db, email=ADMIN_EMAIL)
#         admin_user = None # 占位符
#         if not admin_user:
#             logger.info(f"Admin user '{ADMIN_EMAIL}' not found. Creating...")
#             # user_in = UserCreate(
#             #     username=ADMIN_USERNAME,
#             #     email=ADMIN_EMAIL,
#             #     password=ADMIN_PASSWORD,
#             #     is_active=True
#             # )
#             # # 假设 create_user 函数处理密码哈希和用户创建
#             # new_admin = create_user(db=db, user=user_in)
#             new_admin = None # 占位符
#
#             # # 假设存在名为 "Super Admin" 或 "admin" 的角色
#             # admin_role = get_role_by_name(db, role_name="Super Admin") # 或者 "admin"
#             admin_role = None # 占位符
#             if not admin_role:
#                 logger.error("Default admin role 'Super Admin' not found in database. Cannot assign role.")
#                 # 您可能需要在此处创建角色，或确保它已存在
#             else:
#                 # add_role_to_user(db=db, user=new_admin, role=admin_role)
#                 logger.info(f"Admin user '{ADMIN_EMAIL}' created successfully and assigned role.")
#             # db.commit()
#             logger.info("Admin user creation placeholder executed.") # 占位符消息
#
#         else:
#             logger.info(f"Admin user '{ADMIN_EMAIL}' already exists.")
#     except Exception as e:
#         logger.error(f"Failed to create initial admin user: {e}")
#         # db.rollback() # 回滚以防部分操作成功
#         # 不在此处退出，迁移可能已成功，允许应用启动
#     finally:
#         # db.close()
#         pass # 占位符

# --- 主执行流程 ---
if __name__ == "__main__":
    wait_for_db()
    run_migrations()
    # create_initial_admin() # 取消注释以启用管理员创建
    logger.info("Initialization script finished.") 