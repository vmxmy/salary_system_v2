#!/usr/bin/env python
"""
数据库连接测试脚本 - 用于测试v2版本的数据库连接

使用方法:
    python test_db_connection.py [--db-url DATABASE_URL]

如果不提供--db-url参数，脚本将尝试从环境变量DATABASE_URL中读取数据库连接字符串。
"""

import argparse
import os
import sys
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv
from pathlib import Path

# 加载环境变量
env_path = Path(__file__).resolve().parents[2] / '.env'
if env_path.exists():
    load_dotenv(dotenv_path=env_path)

def test_connection(db_url=None):
    """测试数据库连接"""
    # 如果没有提供数据库连接字符串，尝试从环境变量中读取
    if not db_url:
        db_url = os.environ.get("DATABASE_URL")
        if not db_url:
            print("错误: 未提供数据库连接字符串，且环境变量DATABASE_URL未设置")
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

        # 测试查询数据库版本
        print("测试查询数据库版本...")
        cursor.execute("SELECT version();")
        version = cursor.fetchone()
        print(f"数据库版本: {version['version']}")

        # 测试查询security.users表
        print("\n测试查询security.users表...")
        try:
            cursor.execute("SELECT * FROM information_schema.tables WHERE table_schema = 'security' AND table_name = 'users';")
            table_exists = cursor.fetchone()
            if table_exists:
                print("security.users表存在")

                # 查询表结构
                print("\n查询security.users表结构...")
                cursor.execute("""
                    SELECT column_name, data_type, is_nullable
                    FROM information_schema.columns
                    WHERE table_schema = 'security' AND table_name = 'users'
                    ORDER BY ordinal_position;
                """)
                columns = cursor.fetchall()
                print("表结构:")
                for column in columns:
                    print(f"  {column['column_name']} ({column['data_type']}, {'可空' if column['is_nullable'] == 'YES' else '非空'})")

                # 查询表数据
                print("\n查询security.users表数据...")
                cursor.execute("SELECT * FROM security.users LIMIT 5;")
                users = cursor.fetchall()
                if users:
                    print(f"找到{len(users)}条记录:")
                    for user in users:
                        print(f"  ID: {user['id']}, 用户名: {user['username']}, 是否激活: {user['is_active']}")
                else:
                    print("表中没有数据")
            else:
                print("security.users表不存在")
        except Exception as e:
            print(f"查询security.users表时出错: {e}")

        # 测试查询security.roles表
        print("\n测试查询security.roles表...")
        try:
            cursor.execute("SELECT * FROM information_schema.tables WHERE table_schema = 'security' AND table_name = 'roles';")
            table_exists = cursor.fetchone()
            if table_exists:
                print("security.roles表存在")

                # 查询表数据
                print("\n查询security.roles表数据...")
                cursor.execute("SELECT * FROM security.roles LIMIT 5;")
                roles = cursor.fetchall()
                if roles:
                    print(f"找到{len(roles)}条记录:")
                    for role in roles:
                        print(f"  ID: {role['id']}, 代码: {role['code']}, 名称: {role['name']}")
                else:
                    print("表中没有数据")
            else:
                print("security.roles表不存在")
        except Exception as e:
            print(f"查询security.roles表时出错: {e}")

        # 测试查询security.user_roles表
        print("\n测试查询security.user_roles表...")
        try:
            cursor.execute("SELECT * FROM information_schema.tables WHERE table_schema = 'security' AND table_name = 'user_roles';")
            table_exists = cursor.fetchone()
            if table_exists:
                print("security.user_roles表存在")

                # 查询表数据
                print("\n查询security.user_roles表数据...")
                cursor.execute("SELECT * FROM security.user_roles LIMIT 5;")
                user_roles = cursor.fetchall()
                if user_roles:
                    print(f"找到{len(user_roles)}条记录:")
                    for user_role in user_roles:
                        print(f"  用户ID: {user_role['user_id']}, 角色ID: {user_role['role_id']}")
                else:
                    print("表中没有数据")
            else:
                print("security.user_roles表不存在")
        except Exception as e:
            print(f"查询security.user_roles表时出错: {e}")

        # 关闭游标和连接
        cursor.close()
        conn.close()
        print("\n数据库连接测试完成")
        return True
    except Exception as e:
        print(f"数据库连接失败: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description="数据库连接测试脚本")
    parser.add_argument("--db-url", help="数据库连接字符串")

    args = parser.parse_args()

    test_connection(args.db_url)

if __name__ == "__main__":
    main()
