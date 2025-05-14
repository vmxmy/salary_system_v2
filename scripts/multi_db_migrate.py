#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
多数据库迁移辅助脚本

此脚本用于简化多数据库迁移的操作，可以在多个数据库上运行相同的迁移命令。
使用方法：
    python scripts/multi_db_migrate.py --command upgrade --target head --db-urls "postgresql://user1:pass1@host1/db1" "postgresql://user2:pass2@host2/db2"

参数说明：
    --command: Alembic命令，如upgrade、downgrade、revision等
    --target: 迁移目标，如head、-1等
    --db-urls: 数据库URL列表，可以指定多个数据库URL
    --message: 迁移消息，用于revision命令
    --autogenerate: 是否自动生成迁移脚本，用于revision命令
"""

import os
import sys
import argparse
import subprocess
from typing import List, Optional


def run_alembic_command(command: str, target: Optional[str] = None, db_url: Optional[str] = None,
                        message: Optional[str] = None, autogenerate: bool = False) -> int:
    """
    运行Alembic命令

    Args:
        command: Alembic命令，如upgrade、downgrade、revision等
        target: 迁移目标，如head、-1等
        db_url: 数据库URL
        message: 迁移消息，用于revision命令
        autogenerate: 是否自动生成迁移脚本，用于revision命令

    Returns:
        命令执行的返回码
    """
    # 构建命令
    cmd = ["alembic", command]
    
    # 添加目标参数
    if target:
        cmd.append(target)
    
    # 添加消息参数
    if message and command == "revision":
        cmd.extend(["-m", message])
    
    # 添加自动生成参数
    if autogenerate and command == "revision":
        cmd.append("--autogenerate")
    
    # 设置环境变量
    env = os.environ.copy()
    if db_url:
        env["ALEMBIC_DATABASE_URL"] = db_url
    
    # 运行命令
    print(f"Running command: {' '.join(cmd)}")
    if db_url:
        print(f"Using database URL: {db_url}")
    
    result = subprocess.run(cmd, env=env)
    return result.returncode


def main():
    """主函数"""
    parser = argparse.ArgumentParser(description="多数据库迁移辅助脚本")
    parser.add_argument("--command", required=True, help="Alembic命令，如upgrade、downgrade、revision等")
    parser.add_argument("--target", help="迁移目标，如head、-1等")
    parser.add_argument("--db-urls", nargs="+", required=True, help="数据库URL列表，可以指定多个数据库URL")
    parser.add_argument("--message", help="迁移消息，用于revision命令")
    parser.add_argument("--autogenerate", action="store_true", help="是否自动生成迁移脚本，用于revision命令")
    
    args = parser.parse_args()
    
    # 检查参数
    if args.command == "revision" and not args.message:
        print("Error: --message is required for revision command")
        return 1
    
    # 运行命令
    for db_url in args.db_urls:
        print(f"\n{'='*80}\nRunning migration on database: {db_url}\n{'='*80}")
        result = run_alembic_command(
            command=args.command,
            target=args.target,
            db_url=db_url,
            message=args.message,
            autogenerate=args.autogenerate
        )
        
        if result != 0:
            print(f"Error: Migration failed for database: {db_url}")
            return result
    
    print("\nAll migrations completed successfully!")
    return 0


if __name__ == "__main__":
    sys.exit(main())
