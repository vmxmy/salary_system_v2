import sys
import os
sys.path.append('webapp/v2')
sys.path.append('webapp')

from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql+psycopg2://postgres:810705@pg.debian.ziikoo.com:25432/salary_system_v2')

# 创建数据库连接
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

with SessionLocal() as db:
    print('🔍 测试动态获取视图字段...')
    
    # 直接查询视图字段
    sql = text("""
        SELECT 
            column_name as field_name,
            data_type,
            ordinal_position
        FROM information_schema.columns 
        WHERE table_name = 'v_comprehensive_employee_payroll'
        AND table_schema = 'reports'
        ORDER BY ordinal_position
        LIMIT 10
    """)
    
    result = db.execute(sql)
    fields = result.fetchall()
    
    print(f'✅ 获取到 {len(fields)} 个字段（前10个）:')
    for i, field in enumerate(fields):
        is_chinese = any('\u4e00' <= char <= '\u9fff' for char in field.field_name)
        print(f'  {i+1}. {field.field_name} ({field.data_type}) - {"中文" if is_chinese else "英文"}') 