#!/usr/bin/env python
"""
初始化脚本 - 创建Super Admin角色和管理员用户

使用方法:
    python init_admin.py

这个脚本会创建一个Super Admin角色和一个管理员用户，用户名为admin，密码为admin，邮箱为admin@example.com。
"""

import os
import sys
import logging
from pathlib import Path

# 添加项目根目录到Python路径
current_dir = Path(__file__).resolve().parent
project_root = current_dir.parent.parent.parent
sys.path.append(str(project_root))

# 导入必要的模块
from webapp.v2.database import SessionLocalV2, BaseV2, engine_v2
from webapp.v2.models.security import Role, User, user_roles
from webapp.v2.crud.security import pwd_context

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def create_super_admin_role(db):
    """创建Super Admin角色"""
    logger.info("检查Super Admin角色是否存在...")
    
    # 检查角色是否已存在
    role = db.query(Role).filter(Role.code == "SUPER_ADMIN").first()
    if role:
        logger.info("Super Admin角色已存在，ID: %s", role.id)
        return role
    
    # 创建角色
    role = Role(code="SUPER_ADMIN", name="Super Admin")
    db.add(role)
    db.commit()
    db.refresh(role)
    logger.info("创建Super Admin角色成功，ID: %s", role.id)
    return role

def create_admin_user(db, role):
    """创建管理员用户"""
    logger.info("检查管理员用户是否存在...")
    
    # 检查用户是否已存在
    user = db.query(User).filter(User.username == "admin").first()
    if user:
        logger.info("管理员用户已存在，ID: %s", user.id)
        return user
    
    # 创建用户
    hashed_password = pwd_context.hash("admin")
    user = User(
        username="admin",
        password_hash=hashed_password,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    logger.info("创建管理员用户成功，ID: %s", user.id)
    return user

def assign_role_to_user(db, user, role):
    """将角色分配给用户"""
    logger.info("检查用户角色关联是否存在...")
    
    # 检查用户是否已经有这个角色
    user_role = db.query(user_roles).filter(
        user_roles.c.user_id == user.id,
        user_roles.c.role_id == role.id
    ).first()
    
    if user_role:
        logger.info("用户已经有Super Admin角色")
        return
    
    # 添加用户角色关联
    db.execute(user_roles.insert().values(user_id=user.id, role_id=role.id))
    db.commit()
    logger.info("将Super Admin角色分配给管理员用户成功")

def init_admin():
    """初始化管理员用户和角色"""
    logger.info("开始初始化管理员用户和角色...")
    
    # 创建数据库会话
    db = SessionLocalV2()
    try:
        # 创建Super Admin角色
        role = create_super_admin_role(db)
        
        # 创建管理员用户
        user = create_admin_user(db, role)
        
        # 将角色分配给用户
        assign_role_to_user(db, user, role)
        
        logger.info("初始化完成")
    except Exception as e:
        logger.error("初始化失败: %s", str(e))
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    try:
        init_admin()
    except Exception as e:
        logger.error("初始化失败: %s", str(e))
        sys.exit(1)
