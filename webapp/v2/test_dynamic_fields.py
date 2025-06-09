#!/usr/bin/env python3
"""
测试动态字段服务
"""

import sys
import os
sys.path.append('.')
sys.path.append('..')

from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from dotenv import load_dotenv
from services.dynamic_field_service import DynamicDataSourceService, DynamicFieldService

def main():
    # 加载环境变量
    load_dotenv()
    DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql+psycopg2://postgres:810705@pg.debian.ziikoo.com:25432/salary_system_v2')

    # 创建数据库连接
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    with SessionLocal() as db:
        print("🔍 测试动态字段服务...")
        
        try:
            # 测试直接获取视图字段
            print("\n1. 测试直接获取 v_comprehensive_employee_payroll 视图字段:")
            fields = DynamicFieldService.get_view_fields(
                db=db,
                schema_name='reports',
                view_name='v_comprehensive_employee_payroll'
            )
            
            print(f"✅ 获取到 {len(fields)} 个字段")
            
            # 显示前5个字段
            print("\n前5个字段:")
            for i, field in enumerate(fields[:5]):
                print(f"  {i+1}. {field['field_name']} ({field['field_type']}) - {field['field_group']}")
            
            # 测试通过数据源ID获取字段
            print("\n2. 测试通过数据源ID获取字段:")
            ds_fields = DynamicDataSourceService.get_data_source_fields_dynamic(db, 1)
            
            print(f"✅ 通过数据源ID获取到 {len(ds_fields)} 个字段")
            
            # 统计字段分组
            groups = {}
            for field in ds_fields:
                group = field.get('field_group', '未分组')
                groups[group] = groups.get(group, 0) + 1
            
            print("\n字段分组统计:")
            for group, count in groups.items():
                print(f"  {group}: {count} 个字段")
            
            # 检查中文字段
            chinese_fields = [f for f in ds_fields if f.get('display_name_zh')]
            print(f"\n中文字段数量: {len(chinese_fields)}")
            
            print("\n✅ 动态字段服务测试成功！")
            
        except Exception as e:
            print(f"❌ 测试失败: {str(e)}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    main() 