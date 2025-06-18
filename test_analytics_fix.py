#!/usr/bin/env python3
"""
测试分析服务修复是否生效
"""

import sys
import os
sys.path.append('/Users/xumingyang/app/高新区工资信息管理/salary_system')

from webapp.v2.database import get_db_v2
from webapp.v2.services.simple_payroll.analytics_service import PayrollAnalyticsService

def test_analytics_service():
    """测试分析服务"""
    print("🔧 测试分析服务修复...")
    
    try:
        db = next(get_db_v2())
        service = PayrollAnalyticsService(db)
        
        # 测试部门成本分析
        print("\n📊 测试部门成本分析...")
        try:
            result = service.get_department_cost_analysis(83)  # 使用日志中的期间ID
            print(f"✅ 部门成本分析成功! 分析了 {len(result.departments)} 个部门")
            if result.departments:
                print(f"   示例部门: {result.departments[0].department_name} - {result.departments[0].current_cost}")
        except Exception as e:
            print(f"❌ 部门成本分析失败: {e}")
        
        # 测试员工编制分析
        print("\n👥 测试员工编制分析...")
        try:
            result = service.get_employee_type_analysis(83)
            print(f"✅ 员工编制分析成功! 分析了 {len(result.employee_types)} 种编制")
            if result.employee_types:
                print(f"   示例编制: {result.employee_types[0].type_name} - {result.employee_types[0].employee_count}人")
        except Exception as e:
            print(f"❌ 员工编制分析失败: {e}")
        
        # 测试工资趋势分析
        print("\n📈 测试工资趋势分析...")
        try:
            result = service.get_salary_trend_analysis(12)
            print(f"✅ 工资趋势分析成功! 包含 {len(result.data_points)} 个数据点")
            if result.data_points:
                latest = result.data_points[0]
                print(f"   最新数据: {latest.period_name} - 应发{latest.gross_salary}")
        except Exception as e:
            print(f"❌ 工资趋势分析失败: {e}")
            
    except Exception as e:
        print(f"❌ 初始化失败: {e}")
    finally:
        if 'db' in locals():
            db.close()

if __name__ == "__main__":
    test_analytics_service()