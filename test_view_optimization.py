#!/usr/bin/env python3
"""
测试视图优化效果
对比优化前后的API性能
"""
import requests
import time
import json
from datetime import datetime

# API配置
BASE_URL = "http://localhost:8080/v2"
ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsInJvbGUiOiJcdThkODVcdTdlYTdcdTdiYTFcdTc0MDZcdTU0NTgiLCJleHAiOjE3NDkzMjI3NzF9.BaMyJbR5xaJwH_9Sm2JqnACJPfgFMU2PISSoLJzbUJA"
HEADERS = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {ACCESS_TOKEN}"
}

def test_api_performance(url, params=None, description="API测试"):
    """测试API性能"""
    print(f"\n🔄 {description}")
    print(f"📍 URL: {url}")
    if params:
        print(f"📋 参数: {params}")
    
    start_time = time.time()
    
    try:
        response = requests.get(url, params=params, headers=HEADERS, timeout=120)
        end_time = time.time()
        
        duration = (end_time - start_time) * 1000  # 转换为毫秒
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ 成功 - 耗时: {duration:.2f}ms")
            
            # 尝试提取数据统计
            if 'data' in data:
                if isinstance(data['data'], list):
                    print(f"📊 返回记录数: {len(data['data'])}")
                elif isinstance(data['data'], dict):
                    if 'total_entries' in data['data']:
                        print(f"📊 总条目数: {data['data']['total_entries']}")
                    if 'total_anomalies' in data['data']:
                        print(f"🚨 异常数量: {data['data']['total_anomalies']}")
            
            return {
                'success': True,
                'duration_ms': duration,
                'status_code': response.status_code,
                'data': data
            }
        else:
            print(f"❌ 失败 - 状态码: {response.status_code}, 耗时: {duration:.2f}ms")
            print(f"📄 响应: {response.text[:200]}...")
            return {
                'success': False,
                'duration_ms': duration,
                'status_code': response.status_code,
                'error': response.text
            }
            
    except Exception as e:
        end_time = time.time()
        duration = (end_time - start_time) * 1000
        print(f"💥 异常 - 耗时: {duration:.2f}ms, 错误: {e}")
        return {
            'success': False,
            'duration_ms': duration,
            'error': str(e)
        }

def main():
    """主测试函数"""
    print("🎯 视图优化性能测试")
    print("=" * 60)
    print(f"⏰ 测试时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # 测试用的payroll_run_id（需要根据实际数据调整）
    test_payroll_run_id = 53  # 之前测试过的ID
    
    results = {}
    
    # 1. 测试审核汇总API - 传统方法 vs 视图优化
    print("\n" + "="*60)
    print("📊 测试1: 审核汇总API性能对比")
    print("="*60)
    
    # 传统方法
    traditional_summary = test_api_performance(
        f"{BASE_URL}/simple-payroll/audit/summary/{test_payroll_run_id}",
        params={"use_views": False},
        description="审核汇总 - 传统方法"
    )
    results['summary_traditional'] = traditional_summary
    
    time.sleep(1)  # 短暂等待
    
    # 视图优化方法
    optimized_summary = test_api_performance(
        f"{BASE_URL}/simple-payroll/audit/summary/{test_payroll_run_id}",
        params={"use_views": True},
        description="审核汇总 - 视图优化"
    )
    results['summary_optimized'] = optimized_summary
    
    # 2. 测试异常列表API - 传统方法 vs 视图优化
    print("\n" + "="*60)
    print("🚨 测试2: 异常列表API性能对比")
    print("="*60)
    
    # 传统方法
    traditional_anomalies = test_api_performance(
        f"{BASE_URL}/simple-payroll/audit/{test_payroll_run_id}/anomalies",
        params={"page": 1, "size": 100, "use_views": False},
        description="异常列表 - 传统方法"
    )
    results['anomalies_traditional'] = traditional_anomalies
    
    time.sleep(1)  # 短暂等待
    
    # 视图优化方法
    optimized_anomalies = test_api_performance(
        f"{BASE_URL}/simple-payroll/audit/{test_payroll_run_id}/anomalies",
        params={"page": 1, "size": 100, "use_views": True},
        description="异常列表 - 视图优化"
    )
    results['anomalies_optimized'] = optimized_anomalies
    
    # 3. 性能对比分析
    print("\n" + "="*60)
    print("📈 性能对比分析")
    print("="*60)
    
    def calculate_improvement(traditional, optimized):
        if traditional['success'] and optimized['success']:
            traditional_time = traditional['duration_ms']
            optimized_time = optimized['duration_ms']
            improvement = ((traditional_time - optimized_time) / traditional_time) * 100
            speedup = traditional_time / optimized_time
            return improvement, speedup
        return None, None
    
    # 审核汇总性能对比
    if 'summary_traditional' in results and 'summary_optimized' in results:
        improvement, speedup = calculate_improvement(
            results['summary_traditional'], 
            results['summary_optimized']
        )
        
        if improvement is not None:
            print(f"\n🎯 审核汇总API:")
            print(f"   📊 传统方法: {results['summary_traditional']['duration_ms']:.2f}ms")
            print(f"   🚀 视图优化: {results['summary_optimized']['duration_ms']:.2f}ms")
            print(f"   📈 性能提升: {improvement:.1f}%")
            print(f"   ⚡ 加速倍数: {speedup:.1f}x")
    
    # 异常列表性能对比
    if 'anomalies_traditional' in results and 'anomalies_optimized' in results:
        improvement, speedup = calculate_improvement(
            results['anomalies_traditional'], 
            results['anomalies_optimized']
        )
        
        if improvement is not None:
            print(f"\n🚨 异常列表API:")
            print(f"   📊 传统方法: {results['anomalies_traditional']['duration_ms']:.2f}ms")
            print(f"   🚀 视图优化: {results['anomalies_optimized']['duration_ms']:.2f}ms")
            print(f"   📈 性能提升: {improvement:.1f}%")
            print(f"   ⚡ 加速倍数: {speedup:.1f}x")
    
    # 4. 保存测试结果
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    result_file = f"view_optimization_test_results_{timestamp}.json"
    
    with open(result_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False, default=str)
    
    print(f"\n💾 测试结果已保存到: {result_file}")
    
    # 5. 总结
    print("\n" + "="*60)
    print("🎉 测试总结")
    print("="*60)
    
    successful_tests = sum(1 for result in results.values() if result.get('success', False))
    total_tests = len(results)
    
    print(f"✅ 成功测试: {successful_tests}/{total_tests}")
    
    if successful_tests == total_tests:
        print("🎊 所有测试都成功完成！视图优化已生效！")
    else:
        print("⚠️  部分测试失败，请检查服务状态和数据")
    
    print(f"\n📋 详细结果请查看: {result_file}")

if __name__ == "__main__":
    main() 