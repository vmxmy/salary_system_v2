import logging
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from alembic.config import Config as AlembicConfig
from alembic import command as alembic_command
from pathlib import Path

# 假设你的 settings 和 Base (SQLAlchemy模型基类) 可以这样导入
# (根据你项目实际情况调整导入路径)
from webapp.core.config import settings # 用于获取 DATABASE_URL
from webapp.v2.database import BaseV2   # 你的 v2 版本 SQLAlchemy Base
from webapp.v2.models import security as security_models # 用于种子数据，例如 User, Role
from webapp.auth import get_password_hash # 用于哈希密码

logger = logging.getLogger(__name__)

def get_alembic_config() -> AlembicConfig:
    """加载 Alembic 配置"""
    # init_app.py 路径: webapp/scripts/init_app.py
    # alembic.ini 目标路径: webapp/v2/alembic.ini
    
    alembic_ini_path = Path(__file__).resolve().parent.parent / "v2" / "alembic.ini"
    
    if not alembic_ini_path.exists():
        logger.error(f"Alembic config file (alembic.ini) not found at: {alembic_ini_path}")
        raise FileNotFoundError(f"Alembic config file (alembic.ini) not found at {alembic_ini_path}")

    logger.info(f"Using Alembic config: {alembic_ini_path}")
    config = AlembicConfig(str(alembic_ini_path))
    
    # 确保 Alembic 可以找到数据库 URL
    config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)
    
    # Alembic的env.py中通常会处理sys.path以导入应用模块，
    # 如果你的 alembic.ini 中的 prepend_sys_path = . (或类似) 设置正确，
    # 并且从项目根目录运行alembic命令，那通常是足够的。
    # 对于从应用代码中调用alembic命令，确保运行环境的PYTHONPATH也包含项目根目录。
    # 你在 webapp/v2/alembic_for_db_v2/env.py 中已经有处理sys.path的逻辑，这很好。

    return config

def seed_initial_data(db_session):
    """填充初始种子数据"""
    logger.info("Attempting to seed initial data...")

    # 示例：创建默认角色 (如果不存在)
    default_roles_data = [
        {"code": "SUPER_ADMIN", "name": "超级管理员", "description": "拥有系统所有权限"},
        {"code": "HR_MANAGER", "name": "人事经理", "description": "负责人事管理模块"},
        {"code": "EMPLOYEE", "name": "普通员工", "description": "普通员工访问权限"},
    ]
    
    roles_created_count = 0
    for role_data in default_roles_data:
        role = db_session.query(security_models.Role).filter_by(code=role_data["code"]).first()
        if not role:
            try:
                new_role = security_models.Role(**role_data)
                db_session.add(new_role)
                db_session.flush() # Use flush to ensure role can be referenced by ID if needed soon
                logger.info(f"Creating role: {role_data['code']}")
                roles_created_count += 1
            except Exception as e:
                logger.error(f"Error creating role {role_data['code']}: {e}")
                db_session.rollback() # Rollback this specific role creation
                continue # Continue to next role
    if roles_created_count > 0:
        db_session.commit() # Commit all successfully created roles
        logger.info(f"{roles_created_count} new roles committed.")
    else:
        logger.info("No new roles needed to be created or all role creations failed.")


    # 示例：创建默认管理员用户 (如果不存在)
    admin_username = settings.ADMIN_USERNAME
    admin_email = settings.ADMIN_EMAIL
    admin_password_plain = settings.ADMIN_PASSWORD # 明文密码，来自配置

    if not admin_username or not admin_password_plain:
        logger.warning("Admin username or password not configured in settings. Skipping admin user creation.")
        return

    admin_user = db_session.query(security_models.User).filter_by(username=admin_username).first()
    if not admin_user:
        logger.info(f"Admin user '{admin_username}' not found, creating...")
        try:
            hashed_password = get_password_hash(admin_password_plain)
            
            new_admin = security_models.User(
                username=admin_username,
                email=admin_email,
                password_hash=hashed_password,
                is_active=True,
                # email_verified=True, # 如果有此字段
                # created_at=datetime.utcnow(), # 如果有审计字段
                # updated_at=datetime.utcnow(), # 如果有审计字段
            )
            db_session.add(new_admin)
            db_session.flush() # Ensure new_admin has an ID for relationship assignment

            # 赋予管理员角色
            super_admin_role = db_session.query(security_models.Role).filter_by(code="SUPER_ADMIN").first()
            if super_admin_role:
                # 检查User模型中roles属性的定义，通常是多对多关系
                # 如果User.roles是 InstrumentedList,可以直接append
                if hasattr(new_admin, 'roles'):
                     new_admin.roles.append(super_admin_role)
                     logger.info(f"Assigned SUPER_ADMIN role to {admin_username}.")
                else: # 可能 UserRole 是一个关联对象表
                    user_role_association = security_models.UserRole(user_id=new_admin.id, role_id=super_admin_role.id)
                    db_session.add(user_role_association)
                    logger.info(f"Associated SUPER_ADMIN role to {admin_username} via UserRole table.")
            else:
                logger.warning("SUPER_ADMIN role not found, cannot assign to admin user.")
            
            db_session.commit()
            logger.info(f"Admin user '{admin_username}' created and SUPER_ADMIN role assigned successfully.")
        except Exception as e:
            logger.error(f"Error creating admin user '{admin_username}': {e}", exc_info=True)
            db_session.rollback()
    else:
        logger.info(f"Admin user '{admin_username}' already exists.")

    logger.info("Initial data seeding process completed.")


def initialize_database():
    """
    检查数据库完整性并根据需要进行初始化。
    1. 运行 Alembic 迁移到最新版本。
    2. 填充初始种子数据。
    """
    logger.info("Starting database initialization check...")
    
    db_url = settings.DATABASE_URL
    if not db_url:
        logger.critical("DATABASE_URL not configured in settings. Cannot initialize database.")
        return

    engine = None
    db_session = None
    try:
        engine = create_engine(db_url)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db_session = SessionLocal()

        # 1. 运行 Alembic 迁移
        logger.info("Checking database schema version and applying migrations if necessary...")
        alembic_cfg = get_alembic_config()
        
        alembic_command.upgrade(alembic_cfg, "head")
        logger.info("Database schema migration completed (or already up-to-date).")

        # 2. 填充种子数据
        # 检查管理员用户是否存在作为是否已初始化的一个标志
        admin_user_exists = db_session.query(security_models.User).filter_by(username=settings.ADMIN_USERNAME).first()
        if not admin_user_exists:
            logger.info("Core seed data (admin user) seems to be missing, proceeding with seeding.")
            seed_initial_data(db_session)
        else:
            logger.info("Core seed data (e.g., admin user) already exists. Skipping data seeding unless other checks fail.")
            # 你可以在这里添加更复杂的检查，比如检查角色数量等
            # For example, check if default roles exist even if admin user exists
            super_admin_role_exists = db_session.query(security_models.Role).filter_by(code="SUPER_ADMIN").first()
            if not super_admin_role_exists:
                logger.info("Admin user exists, but SUPER_ADMIN role is missing. Re-running seeding for roles.")
                seed_initial_data(db_session) # This might re-attempt admin creation if not careful

    except Exception as e:
        logger.error(f"An error occurred during database initialization: {e}", exc_info=True)
        if db_session:
            db_session.rollback()
        raise 
    finally:
        if db_session:
            db_session.close()
        # Dispose the engine if it was created, especially for scripts that run and exit.
        # For long-running apps, engine disposal is usually handled differently or not at all.
        if engine:
            engine.dispose()


    logger.info("Database initialization process finished.")

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - [%(name)s] - %(message)s')
    
    # 独立运行时，需要确保项目根目录在 sys.path 中，以便导入 webapp.*
    # init_app.py is in webapp/scripts/
    # project_root is webapp/
    project_root = Path(__file__).resolve().parent.parent.parent # salary_system/
    if str(project_root) not in os.sys.path:
        os.sys.path.insert(0, str(project_root))
        logger.info(f"Added project root ({project_root}) to sys.path for standalone script run.")

    # 加载 .env 文件 (通常位于 webapp/.env)
    dotenv_path_standalone = Path(__file__).resolve().parent.parent / ".env"
    if dotenv_path_standalone.exists():
        from dotenv import load_dotenv
        logger.info(f"Loading .env file from {dotenv_path_standalone} for standalone script run.")
        load_dotenv(dotenv_path=dotenv_path_standalone)
    else:
        logger.warning(f".env file not found at {dotenv_path_standalone}. "
                       "Script relies on environment variables being set externally (e.g., DATABASE_URL, ADMIN_PASSWORD).")
        
    try:
        initialize_database()
        logger.info("Standalone database initialization script completed successfully.")
    except Exception as e:
        logger.error(f"Standalone database initialization script failed: {e}", exc_info=True)
        os.sys.exit(1) 