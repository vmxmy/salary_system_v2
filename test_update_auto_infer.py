#!/usr/bin/env python3
"""
测试编辑报表时的生成器自动推断功能
"""

import requests
import json

# API配置
BASE_URL = "http://localhost:8080/v2/report-config"
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsInJvbGUiOiJcdThkODVcdTdlYTdcdTdiYTFcdTc0MDZcdTU0NTgiLCJleHAiOjE3NDk1NzE0Nzl9.Xj2EKsXI25nl1j99YBFhQBwPHs11gPzx1_yBorU7ruU"

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

def create_test_report():
    """创建测试报表（不指定生成器）"""
    print("📝 创建测试报表...")
    
    test_report = {
        "code": "edit_auto_infer_test",
        "name": "测试汇总报表",
        "description": "用于测试编辑时自动推断",
        "category": "summary",
        "data_source_id": 10538,
        "fields": "1,2,3",
        "is_active": True,
        "is_system": False,
        "sort_order": 0
        # 注意：不指定 generator_class 和 generator_module
    }
    
    response = requests.post(f"{BASE_URL}/types", headers=headers, json=test_report)
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ 报表创建成功:")
        print(f"   报表ID: {result['id']}")
        print(f"   初始生成器类: {result.get('generator_class', 'N/A')}")
        print(f"   初始模块路径: {result.get('generator_module', 'N/A')}")
        return result['id'], result
    else:
        print(f"❌ 报表创建失败: {response.status_code} - {response.text}")
        return None, None

def test_update_scenarios(report_id):
    """测试不同的编辑场景"""
    print(f"\n🔄 测试编辑场景（报表ID: {report_id}）...")
    
    scenarios = [
        {
            "name": "场景1: 更改报表名称为薪资明细",
            "data": {
                "name": "薪资明细统计表",
                "description": "更新为薪资明细类型"
            },
            "expected_generator": "PayrollDetailGenerator"
        },
        {
            "name": "场景2: 更改分类为个税",
            "data": {
                "name": "个人所得税申报表",
                "category": "tax",
                "description": "更新为个税申报类型"
            },
            "expected_generator": "TaxDeclarationGenerator"
        },
        {
            "name": "场景3: 更改为考勤汇总",
            "data": {
                "name": "员工考勤汇总表",
                "category": "attendance",
                "description": "更新为考勤汇总类型"
            },
            "expected_generator": "AttendanceSummaryGenerator"
        },
        {
            "name": "场景4: 手动指定生成器（不应自动推断）",
            "data": {
                "name": "手动指定生成器的报表",
                "generator_class": "PayrollSummaryGenerator",
                "generator_module": "webapp.v2.services.report_generators.payroll_summary_generator",
                "description": "手动指定生成器，不应被自动推断覆盖"
            },
            "expected_generator": "PayrollSummaryGenerator"
        }
    ]
    
    results = []
    
    for i, scenario in enumerate(scenarios, 1):
        print(f"\n📋 {scenario['name']}")
        
        response = requests.put(
            f"{BASE_URL}/types/{report_id}",
            headers=headers,
            json=scenario['data']
        )
        
        if response.status_code == 200:
            result = response.json()
            actual_generator = result.get('generator_class', 'N/A')
            expected_generator = scenario['expected_generator']
            
            success = actual_generator == expected_generator
            status = "✅" if success else "❌"
            
            print(f"{status} 更新结果:")
            print(f"   期望生成器: {expected_generator}")
            print(f"   实际生成器: {actual_generator}")
            print(f"   模块路径: {result.get('generator_module', 'N/A')}")
            
            results.append({
                "scenario": scenario['name'],
                "success": success,
                "expected": expected_generator,
                "actual": actual_generator
            })
        else:
            print(f"❌ 更新失败: {response.status_code} - {response.text}")
            results.append({
                "scenario": scenario['name'],
                "success": False,
                "error": f"{response.status_code} - {response.text}"
            })
    
    return results

def get_report_details(report_id):
    """获取报表详情"""
    response = requests.get(f"{BASE_URL}/types/{report_id}", headers=headers)
    if response.status_code == 200:
        return response.json()
    return None

def cleanup_test_report(report_id):
    """清理测试数据"""
    print(f"\n🧹 清理测试数据（报表ID: {report_id}）...")
    response = requests.delete(f"{BASE_URL}/types/{report_id}", headers=headers)
    
    if response.status_code == 200:
        print("✅ 测试数据清理成功")
        return True
    else:
        print(f"⚠️ 测试数据清理失败: {response.status_code}")
        return False

def main():
    """主测试函数"""
    print("🧪 开始测试编辑时的生成器自动推断功能\n")
    
    # 1. 创建测试报表
    report_id, initial_report = create_test_report()
    if not report_id:
        print("❌ 无法创建测试报表，退出测试")
        return
    
    try:
        # 2. 测试各种编辑场景
        results = test_update_scenarios(report_id)
        
        # 3. 统计结果
        success_count = sum(1 for r in results if r.get('success', False))
        total_count = len(results)
        
        print(f"\n🎯 测试结果汇总:")
        print(f"   总测试场景: {total_count}")
        print(f"   成功场景: {success_count}")
        print(f"   失败场景: {total_count - success_count}")
        
        # 4. 详细结果
        print(f"\n📊 详细结果:")
        for result in results:
            status = "✅" if result.get('success', False) else "❌"
            print(f"   {status} {result['scenario']}")
            if not result.get('success', False) and 'error' in result:
                print(f"      错误: {result['error']}")
            elif not result.get('success', False):
                print(f"      期望: {result.get('expected', 'N/A')} 实际: {result.get('actual', 'N/A')}")
        
        if success_count == total_count:
            print("\n🎉 所有测试通过！编辑时的生成器自动推断功能正常工作。")
        else:
            print(f"\n⚠️ {total_count - success_count} 个测试失败，请检查实现。")
    
    finally:
        # 5. 清理测试数据
        cleanup_test_report(report_id)

if __name__ == "__main__":
    main() 