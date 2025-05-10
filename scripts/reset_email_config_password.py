#!/usr/bin/env python
"""
重置邮件服务器配置密码脚本

此脚本用于在Fernet密钥更改后重置邮件服务器配置的密码。
它会提示用户输入新密码，然后使用当前的Fernet密钥加密并更新数据库中的记录。
"""

import os
import sys
import getpass
from sqlalchemy.orm import Session

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# 导入项目模块
from webapp.database import SessionLocal
from webapp.models import EmailServerConfig
from webapp.auth import encrypt_data

def reset_email_config_password(config_id: int, new_password: str, db: Session) -> bool:
    """
    重置指定ID的邮件服务器配置密码
    
    Args:
        config_id: 邮件配置ID
        new_password: 新密码
        db: 数据库会话
        
    Returns:
        bool: 操作是否成功
    """
    # 查找配置
    config = db.query(EmailServerConfig).filter(EmailServerConfig.id == config_id).first()
    if not config:
        print(f"错误: 未找到ID为 {config_id} 的邮件配置")
        return False
    
    # 加密新密码
    encrypted_password = encrypt_data(new_password)
    if not encrypted_password:
        print("错误: 密码加密失败")
        return False
    
    # 更新配置
    config.encrypted_password = encrypted_password
    config.encryption_method = "fernet"  # 确保加密方法正确
    
    try:
        db.commit()
        print(f"成功更新ID为 {config_id} 的邮件配置密码")
        return True
    except Exception as e:
        db.rollback()
        print(f"错误: 更新密码时发生异常: {e}")
        return False

def main():
    """主函数"""
    print("邮件服务器配置密码重置工具")
    print("==========================")
    
    # 获取数据库会话
    db = SessionLocal()
    
    try:
        # 列出所有配置
        configs = db.query(EmailServerConfig).all()
        if not configs:
            print("数据库中没有邮件服务器配置")
            return
        
        print(f"找到 {len(configs)} 个邮件配置:")
        for config in configs:
            print(f"ID: {config.id}, 名称: {config.server_name}, 主机: {config.host}")
        
        # 选择要更新的配置
        config_id = int(input("\n请输入要重置密码的配置ID: "))
        
        # 输入新密码
        new_password = getpass.getpass("请输入新密码: ")
        confirm_password = getpass.getpass("请再次输入新密码: ")
        
        if new_password != confirm_password:
            print("错误: 两次输入的密码不一致")
            return
        
        # 重置密码
        success = reset_email_config_password(config_id, new_password, db)
        
        if success:
            print("密码重置成功！")
        else:
            print("密码重置失败！")
    
    finally:
        db.close()

if __name__ == "__main__":
    main()
