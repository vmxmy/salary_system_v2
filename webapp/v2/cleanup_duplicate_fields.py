#!/usr/bin/env python3
"""
清理数据源字段表中的重复英文字段，只保留中文字段
"""

import sys
import os
sys.path.append('.')

from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

def main():
    # 加载环境变量
    load_dotenv()
    DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql+psycopg2://postgres:810705@pg.debian.ziikoo.com:25432/salary_system_v2')

    # 创建数据库连接
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    with SessionLocal() as db:
        print("🔍 检查当前字段状况...")
        
        # 检查当前字段数量
        result = db.execute(text('''
            SELECT COUNT(*) as total_fields,
                   COUNT(CASE WHEN field_name ~ '^[a-zA-Z_]+$' THEN 1 END) as english_fields,
                   COUNT(CASE WHEN field_name ~ '[^\x00-\x7F]' THEN 1 END) as chinese_fields
            FROM config.report_data_source_fields 
            WHERE data_source_id = 1
        '''))
        
        stats = result.fetchone()
        print(f"总字段数: {stats[0]}")
        print(f"英文字段: {stats[1]}")
        print(f"中文字段: {stats[2]}")
        
        # 删除英文字段（保留中文字段）
        print("\n🗑️ 删除重复的英文字段...")
        result = db.execute(text('''
            DELETE FROM config.report_data_source_fields 
            WHERE data_source_id = 1 
              AND field_name ~ '^[a-zA-Z_]+$'
              AND (description IS NULL OR description = '')
        '''))
        
        deleted_count = result.rowcount
        print(f"删除了 {deleted_count} 个英文字段")
        
        # 检查剩余字段数量
        result = db.execute(text('''
            SELECT COUNT(*) as remaining_fields
            FROM config.report_data_source_fields 
            WHERE data_source_id = 1
        '''))
        
        remaining = result.fetchone()[0]
        print(f"剩余字段数量: {remaining}")
        
        db.commit()
        print("✅ 清理完成！")

if __name__ == "__main__":
    main() 