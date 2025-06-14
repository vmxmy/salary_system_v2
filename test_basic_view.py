#!/usr/bin/env python3
"""
基础视图查询测试
"""
import requests
import time
import json

# API配置
BASE_URL = "http://localhost:8080"
ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsInJvbGUiOiJcdThkODVcdTdlYTdcdTdiYTFcdTc0MDZcdTU0NTgiLCJleHAiOjE3NDkzMjQ1MDl9.-5EjAKQkqSp_sQdIVll0qmWWOIp41KQNUownFiJNLCI"

headers = {
    "Authorization": f"Bearer {ACCESS_TOKEN}",
    "Content-Type": "application/json"
}

def test_basic_view_query():
    """测试基础视图查询"""
    print("🎯 基础视图查询测试")
    print("=" * 50)
    
    # 测试最简单的查询
    url = f"{BASE_URL}/v2/payroll-entries"
    params = {
        "page": 1,
        "size": 10,
        "use_views": True
    }
    
    print("🔍 测试基础视图查询（无筛选条件）")
    start_time = time.time()
    
    try:
        response = requests.get(url, headers=headers, params=params, timeout=30)
        end_time = time.time()
        duration = (end_time - start_time) * 1000
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ 基础查询成功: {duration:.2f}ms")
            print(f"   返回记录: {len(data.get('data', []))} 条")
            print(f"   总记录数: {data.get('meta', {}).get('total', 0)} 条")
            
            # 显示第一条记录的结构
            if data.get('data'):
                first_record = data['data'][0]
                print(f"   第一条记录ID: {first_record.get('id')}")
                print(f"   员工姓名: {first_record.get('employee_name', 'N/A')}")
                print(f"   部门: {first_record.get('department_name', 'N/A')}")
                print(f"   应发合计: {first_record.get('gross_pay', 0)}")
                print(f"   实发合计: {first_record.get('net_pay', 0)}")
        else:
            print(f"❌ 查询失败: {response.status_code}")
            print(f"   响应内容: {response.text[:500]}")
            
    except Exception as e:
        print(f"❌ 请求异常: {e}")

def test_search_query():
    """测试搜索查询"""
    print("\n🔍 测试搜索查询")
    print("-" * 30)
    
    url = f"{BASE_URL}/v2/payroll-entries"
    params = {
        "search": "张",
        "size": 5,
        "use_views": True
    }
    
    start_time = time.time()
    
    try:
        response = requests.get(url, headers=headers, params=params, timeout=30)
        end_time = time.time()
        duration = (end_time - start_time) * 1000
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ 搜索查询成功: {duration:.2f}ms")
            print(f"   返回记录: {len(data.get('data', []))} 条")
            print(f"   总记录数: {data.get('meta', {}).get('total', 0)} 条")
        else:
            print(f"❌ 搜索失败: {response.status_code}")
            print(f"   响应内容: {response.text[:500]}")
            
    except Exception as e:
        print(f"❌ 请求异常: {e}")

if __name__ == "__main__":
    test_basic_view_query()
    test_search_query()
    print("\n🎉 测试完成!") 