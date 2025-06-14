#!/usr/bin/env python3
"""
简化的薪资条目API测试脚本 - 只测试视图优化方法
"""

import requests
import time
import json
from typing import Dict, Any

# API配置
BASE_URL = "http://localhost:8080"
ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsInJvbGUiOiJcdThkODVcdTdlYTdcdTdiYTFcdTc0MDZcdTU0NTgiLCJleHAiOjE3NDkzMjM2MDR9.I4v1dE_l22LSQnvbBi-oL9G6jFWfLGFE98TXe9nVBLM"

def make_request(endpoint: str, params: Dict[str, Any] = None) -> tuple[Dict[str, Any], float]:
    """发送API请求并测量响应时间"""
    headers = {
        "Authorization": f"Bearer {ACCESS_TOKEN}",
        "Content-Type": "application/json"
    }
    
    start_time = time.time()
    try:
        response = requests.get(f"{BASE_URL}{endpoint}", headers=headers, params=params)
        end_time = time.time()
        
        if response.status_code == 200:
            return response.json(), (end_time - start_time) * 1000  # 转换为毫秒
        else:
            print(f"❌ API请求失败: {response.status_code}")
            print(f"响应内容: {response.text}")
            return None, (end_time - start_time) * 1000
    except Exception as e:
        end_time = time.time()
        print(f"❌ 请求异常: {e}")
        return None, (end_time - start_time) * 1000

def test_view_optimization():
    """测试视图优化方法"""
    print("🚀 测试薪资条目API视图优化")
    print("=" * 50)
    
    # 测试参数
    test_params = {
        "page": 1,
        "size": 20,  # 较小的数据量
        "use_views": True  # 只测试视图优化
    }
    
    print(f"\n🔍 测试视图优化方法")
    result, response_time = make_request("/v2/payroll-entries", test_params)
    
    if result:
        count = len(result.get('data', []))
        total = result.get('meta', {}).get('total', 0)
        print(f"✅ 视图优化成功: {response_time:.2f}ms")
        print(f"   返回记录: {count} 条")
        print(f"   总记录数: {total} 条")
        
        # 显示第一条记录的结构
        if result.get('data'):
            first_entry = result['data'][0]
            print(f"   第一条记录ID: {first_entry.get('id')}")
            print(f"   员工ID: {first_entry.get('employee_id')}")
            print(f"   应发合计: {first_entry.get('gross_pay')}")
            print(f"   实发合计: {first_entry.get('net_pay')}")
    else:
        print(f"❌ 视图优化失败: {response_time:.2f}ms")

def test_with_filters():
    """测试带筛选条件的视图优化"""
    print("\n\n🔍 测试带筛选条件的视图优化")
    print("=" * 50)
    
    # 测试不同的筛选条件
    filter_tests = [
        {
            "name": "按薪资周期筛选",
            "params": {"period_id": 53, "size": 10, "use_views": True}
        },
        {
            "name": "按薪资范围筛选",
            "params": {"min_gross_pay": 5000, "max_gross_pay": 10000, "size": 10, "use_views": True}
        }
    ]
    
    for test in filter_tests:
        print(f"\n📋 {test['name']}")
        print("-" * 30)
        
        result, response_time = make_request("/v2/payroll-entries", test['params'])
        
        if result:
            count = len(result.get('data', []))
            total = result.get('meta', {}).get('total', 0)
            print(f"✅ 成功: {response_time:.2f}ms ({count}/{total} 条)")
        else:
            print(f"❌ 失败: {response_time:.2f}ms")

def main():
    """主函数"""
    print("🎯 薪资条目API视图优化测试")
    print("测试时间:", time.strftime("%Y-%m-%d %H:%M:%S"))
    
    try:
        # 基础测试
        test_view_optimization()
        
        # 筛选条件测试
        test_with_filters()
        
        print("\n" + "=" * 50)
        print("🎉 测试完成!")
        
    except KeyboardInterrupt:
        print("\n⚠️  测试被用户中断")
    except Exception as e:
        print(f"\n❌ 测试过程中发生错误: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main() 