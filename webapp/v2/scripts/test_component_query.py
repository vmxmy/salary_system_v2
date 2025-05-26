#!/usr/bin/env python3
"""
测试 get_payroll_component_definitions 函数
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from crud.config import get_payroll_component_definitions

# 创建数据库连接
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/salary_system_v2')
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def test_component_query():
    db = SessionLocal()
    try:
        # 测试查询
        result = get_payroll_component_definitions(
            db, 
            component_type='PERSONAL_DEDUCTION', 
            is_active=True, 
            limit=1000
        )
        
        print(f'查询结果数量: {len(result["data"])}')
        print(f'Meta信息: {result["meta"]}')
        print('\n组件代码列表:')
        for i, comp in enumerate(result['data']):
            print(f'  {i+1}. {comp.code} - {comp.name} (display_order: {comp.display_order})')
            
        # 检查是否包含 SOCIAL_INSURANCE_ADJUSTMENT
        codes = [comp.code for comp in result['data']]
        print(f'\n是否包含SOCIAL_INSURANCE_ADJUSTMENT: {"SOCIAL_INSURANCE_ADJUSTMENT" in codes}')
        
        # 测试不同的limit值
        print('\n测试不同的limit值:')
        for limit_val in [5, 7, 10, 100]:
            result_limited = get_payroll_component_definitions(
                db, 
                component_type='PERSONAL_DEDUCTION', 
                is_active=True, 
                limit=limit_val
            )
            codes_limited = [comp.code for comp in result_limited['data']]
            has_social = 'SOCIAL_INSURANCE_ADJUSTMENT' in codes_limited
            print(f'  limit={limit_val}: 返回{len(result_limited["data"])}条, 包含SOCIAL_INSURANCE_ADJUSTMENT: {has_social}')
            
    finally:
        db.close()

if __name__ == '__main__':
    test_component_query() 