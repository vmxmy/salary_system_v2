#!/usr/bin/env python3
"""
简化的动态映射测试 - 逐步调试
"""

import os
import sys

# 添加项目路径
sys.path.append(os.path.join(os.path.dirname(__file__), 'webapp'))

def test_basic_connection():
    """测试基本数据库连接"""
    print("🔧 **测试基本数据库连接**")
    
    try:
        from webapp.v2.database import get_db_v2
        db = next(get_db_v2())
        print("✅ 数据库连接成功")
        
        # 测试简单查询
        from webapp.v2.models import PayrollComponentDefinition
        print("🔍 测试工资组件定义查询...")
        
        # 查询总数
        total_count = db.query(PayrollComponentDefinition).count()
        print(f"   工资组件定义总数: {total_count}")
        
        # 查询活跃组件
        active_count = db.query(PayrollComponentDefinition).filter(
            PayrollComponentDefinition.is_active == True
        ).count()
        print(f"   活跃组件数量: {active_count}")
        
        # 按类型统计
        print("📊 按类型统计:")
        from sqlalchemy import func
        types_query = db.query(
            PayrollComponentDefinition.type,
            func.count(PayrollComponentDefinition.id)
        ).filter(
            PayrollComponentDefinition.is_active == True
        ).group_by(PayrollComponentDefinition.type).all()
        
        for component_type, count in types_query:
            print(f"   {component_type}: {count} 个")
            
        # 查看几个示例
        print("\n🔍 收入类型示例（前3个）:")
        earnings = db.query(PayrollComponentDefinition).filter(
            PayrollComponentDefinition.type == 'EARNING',
            PayrollComponentDefinition.is_active == True
        ).limit(3).all()
        
        for earning in earnings:
            print(f"   {earning.code}: {earning.name}")
            
        print("\n🔍 扣除类型示例（前3个）:")
        deductions = db.query(PayrollComponentDefinition).filter(
            PayrollComponentDefinition.type == 'PERSONAL_DEDUCTION',
            PayrollComponentDefinition.is_active == True
        ).limit(3).all()
        
        for deduction in deductions:
            print(f"   {deduction.code}: {deduction.name}")
            
        db.close()
        print("✅ 基本测试完成")
        
    except Exception as e:
        print(f"❌ 测试失败: {str(e)}")
        import traceback
        traceback.print_exc()

def test_simple_mapping():
    """测试简化的映射功能"""
    print("\n🧪 **测试简化映射功能**")
    
    try:
        from webapp.v2.database import get_db_v2
        from webapp.v2.payroll_engine.simple_calculator import SimplePayrollDataMapper
        
        db = next(get_db_v2())
        print("✅ 数据库连接成功")
        
        print("🔄 创建映射器...")
        mapper = SimplePayrollDataMapper(db)
        
        print("🔄 加载组件映射...")
        # 直接调用内部方法来看具体进度
        mapper._load_component_mappings()
        
        print("📊 映射结果:")
        print(f"   收入映射数量: {len(mapper._earnings_mapping)}")
        print(f"   扣除映射数量: {len(mapper._deductions_mapping)}")
        print(f"   总映射数量: {len(mapper._all_components_mapping)}")
        
        # 显示几个示例
        print("\n💰 收入映射示例:")
        for i, (name, code) in enumerate(list(mapper._earnings_mapping.items())[:3], 1):
            print(f"   {i}. '{name}' -> '{code}'")
            
        print("\n💸 扣除映射示例:")
        for i, (name, code) in enumerate(list(mapper._deductions_mapping.items())[:3], 1):
            print(f"   {i}. '{name}' -> '{code}'")
        
        db.close()
        print("✅ 映射测试完成")
        
    except Exception as e:
        print(f"❌ 映射测试失败: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_basic_connection()
    test_simple_mapping() 