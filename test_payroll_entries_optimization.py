#!/usr/bin/env python3
"""
薪资条目API性能优化测试脚本

测试传统方法 vs 视图优化方法的性能差异
"""

import requests
import time
import json
import sys
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

def test_payroll_entries_performance():
    """测试薪资条目API性能"""
    print("🚀 开始测试薪资条目API性能优化")
    print("=" * 60)
    
    # 测试参数
    test_params = {
        "page": 1,
        "size": 50,  # 中等数据量
        "include_employee_details": True,
        "include_payroll_period": True
    }
    
    # 测试1: 传统方法
    print("\n📊 测试1: 传统方法 (use_views=false)")
    traditional_params = {**test_params, "use_views": False}
    traditional_result, traditional_time = make_request("/v2/payroll-entries", traditional_params)
    
    if traditional_result:
        traditional_count = len(traditional_result.get('data', []))
        traditional_total = traditional_result.get('meta', {}).get('total', 0)
        print(f"✅ 传统方法: {traditional_time:.2f}ms")
        print(f"   返回记录: {traditional_count} 条")
        print(f"   总记录数: {traditional_total} 条")
    else:
        print(f"❌ 传统方法失败: {traditional_time:.2f}ms")
        return
    
    # 等待一秒，避免缓存影响
    time.sleep(1)
    
    # 测试2: 视图优化方法
    print("\n🚀 测试2: 视图优化方法 (use_views=true)")
    optimized_params = {**test_params, "use_views": True}
    optimized_result, optimized_time = make_request("/v2/payroll-entries", optimized_params)
    
    if optimized_result:
        optimized_count = len(optimized_result.get('data', []))
        optimized_total = optimized_result.get('meta', {}).get('total', 0)
        print(f"✅ 视图优化: {optimized_time:.2f}ms")
        print(f"   返回记录: {optimized_count} 条")
        print(f"   总记录数: {optimized_total} 条")
    else:
        print(f"❌ 视图优化失败: {optimized_time:.2f}ms")
        return
    
    # 性能对比
    print("\n📈 性能对比结果")
    print("=" * 40)
    
    if traditional_time > 0 and optimized_time > 0:
        improvement = ((traditional_time - optimized_time) / traditional_time) * 100
        speedup = traditional_time / optimized_time
        
        print(f"传统方法:   {traditional_time:.2f}ms")
        print(f"视图优化:   {optimized_time:.2f}ms")
        print(f"性能提升:   {improvement:.1f}%")
        print(f"加速倍数:   {speedup:.1f}x")
        
        if improvement > 0:
            print(f"🎉 视图优化方法更快!")
        else:
            print(f"⚠️  传统方法更快")
    
    # 数据一致性检查
    print("\n🔍 数据一致性检查")
    print("=" * 40)
    
    if traditional_result and optimized_result:
        traditional_data = traditional_result.get('data', [])
        optimized_data = optimized_result.get('data', [])
        
        if traditional_count == optimized_count and traditional_total == optimized_total:
            print("✅ 数据数量一致")
            
            # 检查第一条记录的关键字段
            if traditional_data and optimized_data:
                trad_first = traditional_data[0]
                opt_first = optimized_data[0]
                
                key_fields = ['id', 'employee_id', 'gross_pay', 'net_pay', 'total_deductions']
                consistent = True
                
                for field in key_fields:
                    if trad_first.get(field) != opt_first.get(field):
                        print(f"❌ 字段 {field} 不一致: {trad_first.get(field)} vs {opt_first.get(field)}")
                        consistent = False
                
                if consistent:
                    print("✅ 关键字段数据一致")
                else:
                    print("❌ 关键字段数据不一致")
        else:
            print(f"❌ 数据数量不一致: {traditional_count}/{traditional_total} vs {optimized_count}/{optimized_total}")

def test_with_filters():
    """测试带筛选条件的性能"""
    print("\n\n🔍 测试带筛选条件的性能")
    print("=" * 60)
    
    # 测试不同的筛选条件
    filter_tests = [
        {
            "name": "按薪资周期筛选",
            "params": {"period_id": 53, "size": 30}
        },
        {
            "name": "按部门筛选",
            "params": {"department_name": "财政", "size": 20}
        },
        {
            "name": "按薪资范围筛选",
            "params": {"min_gross_pay": 5000, "max_gross_pay": 10000, "size": 25}
        },
        {
            "name": "搜索员工",
            "params": {"search": "张", "size": 15}
        }
    ]
    
    for test in filter_tests:
        print(f"\n📋 {test['name']}")
        print("-" * 30)
        
        # 传统方法
        traditional_params = {**test['params'], "use_views": False}
        traditional_result, traditional_time = make_request("/v2/payroll-entries", traditional_params)
        
        # 视图优化方法
        optimized_params = {**test['params'], "use_views": True}
        optimized_result, optimized_time = make_request("/v2/payroll-entries", optimized_params)
        
        if traditional_result and optimized_result:
            traditional_count = len(traditional_result.get('data', []))
            optimized_count = len(optimized_result.get('data', []))
            
            improvement = ((traditional_time - optimized_time) / traditional_time) * 100 if traditional_time > 0 else 0
            
            print(f"传统方法: {traditional_time:.2f}ms ({traditional_count} 条)")
            print(f"视图优化: {optimized_time:.2f}ms ({optimized_count} 条)")
            print(f"性能提升: {improvement:.1f}%")
            
            if traditional_count == optimized_count:
                print("✅ 数据一致")
            else:
                print(f"❌ 数据不一致: {traditional_count} vs {optimized_count}")

def main():
    """主函数"""
    print("🎯 薪资条目API性能优化测试")
    print("测试时间:", time.strftime("%Y-%m-%d %H:%M:%S"))
    
    try:
        # 基础性能测试
        test_payroll_entries_performance()
        
        # 筛选条件测试
        test_with_filters()
        
        print("\n" + "=" * 60)
        print("🎉 测试完成!")
        
    except KeyboardInterrupt:
        print("\n⚠️  测试被用户中断")
    except Exception as e:
        print(f"\n❌ 测试过程中发生错误: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main() 