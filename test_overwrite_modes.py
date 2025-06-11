#!/usr/bin/env python3
"""
测试新的覆写模式功能
"""

import requests
import json
from datetime import datetime

# API 基础URL
BASE_URL = "http://localhost:8080/v2"

# 测试数据
test_employee_data = {
    "last_name": "李",
    "first_name": "洋洋",
    "id_number": ""  # 空身份证号，测试只用姓名匹配
}

test_payroll_entry = {
    "payroll_period_id": 1,  # 假设存在ID为1的薪资周期
    "payroll_run_id": 0,
    "gross_pay": 5000.00,
    "total_deductions": 1000.00,
    "net_pay": 4000.00,
    "status_lookup_value_id": 1,
    "remarks": "测试覆写模式",
    "earnings_details": {
        "BASIC_SALARY": {"amount": 5000.00, "name": "基本工资"}
    },
    "deductions_details": {
        "PERSONAL_INCOME_TAX": {"amount": 1000.00, "name": "个人所得税"}
    },
    "employee_info": test_employee_data
}

def test_overwrite_modes():
    """测试不同的覆写模式"""
    
    print("🧪 开始测试覆写模式功能...")
    
    # 测试数据
    test_payload = {
        "payroll_period_id": 1,
        "entries": [test_payroll_entry]
    }
    
    # 测试1: 不覆写模式 (NONE)
    print("\n📝 测试1: 不覆写模式 (NONE)")
    test_payload["overwrite_mode"] = "none"
    
    try:
        response = requests.post(
            f"{BASE_URL}/payroll-entries/bulk/validate",
            json=test_payload,
            headers={"Content-Type": "application/json"}
        )
        print(f"状态码: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"验证结果: 总计={result['total']}, 有效={result['valid']}, 无效={result['invalid']}, 警告={result['warnings']}")
        else:
            print(f"错误: {response.text}")
    except Exception as e:
        print(f"请求失败: {e}")
    
    # 测试2: 部分覆写模式 (PARTIAL)
    print("\n📝 测试2: 部分覆写模式 (PARTIAL)")
    test_payload["overwrite_mode"] = "partial"
    
    try:
        response = requests.post(
            f"{BASE_URL}/payroll-entries/bulk/validate",
            json=test_payload,
            headers={"Content-Type": "application/json"}
        )
        print(f"状态码: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"验证结果: 总计={result['total']}, 有效={result['valid']}, 无效={result['invalid']}, 警告={result['warnings']}")
        else:
            print(f"错误: {response.text}")
    except Exception as e:
        print(f"请求失败: {e}")
    
    # 测试3: 全量覆写模式 (FULL)
    print("\n📝 测试3: 全量覆写模式 (FULL)")
    test_payload["overwrite_mode"] = "full"
    
    try:
        response = requests.post(
            f"{BASE_URL}/payroll-entries/bulk/validate",
            json=test_payload,
            headers={"Content-Type": "application/json"}
        )
        print(f"状态码: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"验证结果: 总计={result['total']}, 有效={result['valid']}, 无效={result['invalid']}, 警告={result['warnings']}")
        else:
            print(f"错误: {response.text}")
    except Exception as e:
        print(f"请求失败: {e}")

def test_name_only_matching():
    """测试只用姓名匹配员工的功能"""
    
    print("\n🔍 测试只用姓名匹配员工...")
    
    # 查询数据库中的员工
    try:
        # 这里应该调用数据库查询，但为了简化，我们直接测试API
        test_payload = {
            "payroll_period_id": 1,
            "entries": [test_payroll_entry],
            "overwrite_mode": "none"
        }
        
        response = requests.post(
            f"{BASE_URL}/payroll-entries/bulk/validate",
            json=test_payload,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"姓名匹配测试状态码: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"姓名匹配结果: 找到员工={result['valid'] > 0}")
            if result.get('validatedData'):
                first_entry = result['validatedData'][0]
                if first_entry.get('employee_id'):
                    print(f"匹配到的员工ID: {first_entry['employee_id']}")
                    print(f"员工姓名: {first_entry.get('employee_full_name', '未知')}")
        else:
            print(f"姓名匹配测试失败: {response.text}")
            
    except Exception as e:
        print(f"姓名匹配测试请求失败: {e}")

if __name__ == "__main__":
    print("🚀 开始测试新的覆写模式功能")
    print("=" * 50)
    
    test_overwrite_modes()
    test_name_only_matching()
    
    print("\n" + "=" * 50)
    print("✅ 测试完成！") 