#!/usr/bin/env python
"""
密码验证脚本 - 用于验证密码哈希

使用方法:
    python verify_password.py --username admin --password admin
    python verify_password.py --username admin --password admin --db-url "postgresql://postgres:810705@localhost:5432/salary_system_v2"
"""

import argparse
import os
import sys
import psycopg2
from psycopg2.extras import RealDictCursor
from passlib.context import CryptContext
from dotenv import load_dotenv
from pathlib import Path

# 加载环境变量
env_path = Path(__file__).resolve().parents[2] / '.env'
if env_path.exists():
    load_dotenv(dotenv_path=env_path)

# 创建密码哈希上下文
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    """验证密码"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    """生成密码哈希"""
    return pwd_context.hash(password)

def verify_user_password(username, password, db_url=None):
    """验证用户密码"""
    # 如果没有提供数据库连接字符串，尝试从环境变量中读取
    if not db_url:
        db_url = os.environ.get("DATABASE_URL")
        if not db_url:
            print("错误: 未提供数据库连接字符串，且环境变量DATABASE_URL均未设置")
            return False
        else:
            print(f"使用环境变量DATABASE_URL: {db_url}")
    else:
        print(f"使用提供的数据库连接字符串: {db_url}")
    
    try:
        # 连接数据库
        print("尝试连接数据库...")
        conn = psycopg2.connect(db_url)
        print("数据库连接成功!")
        
        # 创建游标
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # 查询用户
        print(f"查询用户 '{username}'...")
        cursor.execute("SELECT * FROM security.users WHERE username = %s", (username,))
        user = cursor.fetchone()
        
        if not user:
            print(f"用户 '{username}' 不存在")
            cursor.close()
            conn.close()
            return False
        
        # 显示用户信息
        print(f"找到用户:")
        print(f"  ID: {user['id']}")
        print(f"  用户名: {user['username']}")
        print(f"  密码哈希: {user['password_hash']}")
        print(f"  是否激活: {user['is_active']}")
        
        # 验证密码
        print(f"\n验证密码...")
        is_valid = verify_password(password, user['password_hash'])
        
        if is_valid:
            print(f"密码验证成功!")
        else:
            print(f"密码验证失败!")
            
            # 生成新的密码哈希
            print(f"\n生成新的密码哈希...")
            new_hash = get_password_hash(password)
            print(f"新密码哈希: {new_hash}")
            
            # 提供更新密码的SQL语句
            print(f"\n如果需要更新密码，可以执行以下SQL语句:")
            print(f"UPDATE security.users SET password_hash = '{new_hash}' WHERE username = '{username}';")
        
        # 关闭游标和连接
        cursor.close()
        conn.close()
        
        return is_valid
    except Exception as e:
        print(f"验证密码时出错: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description="密码验证脚本")
    parser.add_argument("--username", required=True, help="用户名")
    parser.add_argument("--password", required=True, help="密码")
    parser.add_argument("--db-url", help="数据库连接字符串")
    
    args = parser.parse_args()
    
    verify_user_password(args.username, args.password, args.db_url)

if __name__ == "__main__":
    main()
