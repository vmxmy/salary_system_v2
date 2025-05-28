#!/usr/bin/env python3
"""
调试薪资字段定义获取问题
"""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'webapp'))

from webapp.v2.database import get_db_v2
from webapp.v2.crud.config import get_payroll_component_definitions
from sqlalchemy import select
from webapp.v2.models.config import PayrollComponentDefinition

def debug_payroll_components():
    """调试薪资字段定义获取"""
    db = next(get_db_v2())
    
    try:
        print("=== 调试薪资字段定义获取 ===")
        
        # 1. 直接查询数据库
        print("\n1. 直接查询数据库中的SOCIAL_INSURANCE_ADJUSTMENT:")
        direct_query = select(PayrollComponentDefinition).where(
            PayrollComponentDefinition.code == 'SOCIAL_INSURANCE_ADJUSTMENT'
        )
        direct_result = db.execute(direct_query).scalars().first()
        if direct_result:
            print(f"   找到: {direct_result.code} - {direct_result.name} - {direct_result.type} - 激活: {direct_result.is_active}")
        else:
            print("   未找到")
        
        # 2. 使用CRUD函数查询个人扣除项
        print("\n2. 使用CRUD函数查询个人扣除项:")
        personal_deduction_result = get_payroll_component_definitions(
            db, 
            component_type='PERSONAL_DEDUCTION', 
            is_active=True, 
            limit=1000
        )
        personal_components = personal_deduction_result["data"]
        print(f"   个人扣除项数量: {len(personal_components)}")
        
        social_insurance_found = False
        for comp in personal_components:
            if comp.code == 'SOCIAL_INSURANCE_ADJUSTMENT':
                print(f"   找到SOCIAL_INSURANCE_ADJUSTMENT: {comp.code} - {comp.name} - 激活: {comp.is_active}")
                social_insurance_found = True
                break
        
        if not social_insurance_found:
            print("   在个人扣除项中未找到SOCIAL_INSURANCE_ADJUSTMENT")
            print("   所有个人扣除项代码:")
            for comp in personal_components:
                print(f"     {comp.code} - {comp.name}")
        
        # 3. 使用CRUD函数查询雇主扣除项
        print("\n3. 使用CRUD函数查询雇主扣除项:")
        employer_deduction_result = get_payroll_component_definitions(
            db,
            component_type='EMPLOYER_DEDUCTION',
            is_active=True,
            limit=1000
        )
        employer_components = employer_deduction_result["data"]
        print(f"   雇主扣除项数量: {len(employer_components)}")
        
        social_insurance_found_employer = False
        for comp in employer_components:
            if comp.code == 'SOCIAL_INSURANCE_ADJUSTMENT':
                print(f"   找到SOCIAL_INSURANCE_ADJUSTMENT: {comp.code} - {comp.name} - 激活: {comp.is_active}")
                social_insurance_found_employer = True
                break
        
        if not social_insurance_found_employer:
            print("   在雇主扣除项中未找到SOCIAL_INSURANCE_ADJUSTMENT")
        
        # 4. 查询所有类型的组件
        print("\n4. 查询所有激活的组件:")
        all_result = get_payroll_component_definitions(
            db,
            is_active=True,
            limit=1000
        )
        all_components = all_result["data"]
        print(f"   所有激活组件数量: {len(all_components)}")
        
        social_insurance_found_all = False
        for comp in all_components:
            if comp.code == 'SOCIAL_INSURANCE_ADJUSTMENT':
                print(f"   找到SOCIAL_INSURANCE_ADJUSTMENT: {comp.code} - {comp.name} - {comp.type} - 激活: {comp.is_active}")
                social_insurance_found_all = True
                break
        
        if not social_insurance_found_all:
            print("   在所有激活组件中未找到SOCIAL_INSURANCE_ADJUSTMENT")
        
        # 5. 创建component_map并检查
        print("\n5. 创建component_map:")
        component_map = {comp.code: comp.name for comp in personal_components}
        component_map.update({comp.code: comp.name for comp in employer_components})
        
        print(f"   component_map包含的代码数量: {len(component_map)}")
        print(f"   是否包含SOCIAL_INSURANCE_ADJUSTMENT: {'SOCIAL_INSURANCE_ADJUSTMENT' in component_map}")
        
        if 'SOCIAL_INSURANCE_ADJUSTMENT' in component_map:
            print(f"   SOCIAL_INSURANCE_ADJUSTMENT的名称: {component_map['SOCIAL_INSURANCE_ADJUSTMENT']}")
        
        # 6. 显示所有包含"SOCIAL"的组件
        print("\n6. 所有包含'SOCIAL'的组件:")
        for code, name in component_map.items():
            if 'SOCIAL' in code.upper():
                print(f"   {code} - {name}")
        
    except Exception as e:
        print(f"错误: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    debug_payroll_components()