#!/usr/bin/env python3
"""
测试报表生成器自动推断功能
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

def test_get_generators():
    """测试获取所有生成器"""
    print("🔍 测试获取所有生成器...")
    response = requests.get(f"{BASE_URL}/generators", headers=headers)
    
    if response.status_code == 200:
        generators = response.json()
        print(f"✅ 成功获取 {len(generators)} 个生成器:")
        for gen in generators:
            print(f"  - {gen['display_name']}: {gen['class_name']}")
        return True
    else:
        print(f"❌ 获取生成器失败: {response.status_code} - {response.text}")
        return False

def test_auto_infer(test_cases):
    """测试自动推断功能"""
    print("\n🚀 测试自动推断功能...")
    
    for i, case in enumerate(test_cases, 1):
        print(f"\n📝 测试案例 {i}: {case['report_name']}")
        
        response = requests.post(
            f"{BASE_URL}/generators/auto-infer",
            headers=headers,
            json=case
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ 推断结果:")
            print(f"   生成器类: {result['generator_class']}")
            print(f"   模块路径: {result['generator_module']}")
            print(f"   是否有效: {result['is_valid']}")
            print(f"   推荐原因: {result['recommendation_reason']}")
        else:
            print(f"❌ 推断失败: {response.status_code} - {response.text}")

def test_create_report_with_auto_infer():
    """测试创建报表时的自动推断"""
    print("\n📊 测试创建报表时的自动推断...")
    
    test_report = {
        "code": "auto_infer_test_report",
        "name": "个税申报明细表",
        "description": "测试自动推断功能",
        "category": "tax",
        "data_source_id": 10538,  # 动态数据源
        "fields": "1,2,3,4,5",
        "is_active": True,
        "is_system": False,
        "sort_order": 0
        # 注意：没有手动指定 generator_class 和 generator_module
    }
    
    response = requests.post(
        f"{BASE_URL}/types",
        headers=headers,
        json=test_report
    )
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ 报表创建成功:")
        print(f"   报表ID: {result['id']}")
        print(f"   自动推断的生成器类: {result.get('generator_class', 'N/A')}")
        print(f"   自动推断的模块路径: {result.get('generator_module', 'N/A')}")
        return result['id']
    else:
        print(f"❌ 报表创建失败: {response.status_code} - {response.text}")
        return None

def main():
    """主测试函数"""
    print("🧪 开始测试报表生成器自动推断功能\n")
    
    # 测试案例
    test_cases = [
        {
            "report_name": "薪资明细表",
            "report_category": "payroll"
        },
        {
            "report_name": "薪资汇总统计",
            "report_category": "payroll"
        },
        {
            "report_name": "部门汇总报表"
        },
        {
            "report_name": "个税申报表",
            "report_category": "tax"
        },
        {
            "report_name": "社保缴费统计",
            "data_source_name": "social_insurance_data"
        },
        {
            "report_name": "考勤汇总表",
            "report_category": "attendance"
        },
        {
            "report_name": "月度薪资详情",
            "data_source_name": "v_monthly_fulltime_net_pay"
        }
    ]
    
    # 执行测试
    success_count = 0
    
    # 1. 测试获取生成器列表
    if test_get_generators():
        success_count += 1
    
    # 2. 测试自动推断
    test_auto_infer(test_cases)
    success_count += 1
    
    # 3. 测试创建报表时的自动推断
    report_id = test_create_report_with_auto_infer()
    if report_id:
        success_count += 1
        
        # 清理测试数据
        print(f"\n🧹 清理测试数据...")
        delete_response = requests.delete(
            f"{BASE_URL}/types/{report_id}",
            headers=headers
        )
        if delete_response.status_code == 200:
            print("✅ 测试数据清理成功")
        else:
            print(f"⚠️ 测试数据清理失败: {delete_response.status_code}")
    
    print(f"\n🎯 测试完成! 成功: {success_count}/3")
    
    if success_count == 3:
        print("🎉 所有测试通过！生成器自动推断功能正常工作。")
    else:
        print("⚠️ 部分测试失败，请检查日志。")

if __name__ == "__main__":
    main() 