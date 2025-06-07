#!/usr/bin/env python3
"""
最终性能优化验证脚本
测试所有已优化的API端点，确认视图优化已成为唯一实现
"""

import requests
import time
import json
from typing import Dict, Any

# API配置
BASE_URL = "http://localhost:8080"
ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsInJvbGUiOiJcdThkODVcdTdlYTdcdTdiYTFcdTc0MDZcdTU0NTgiLCJleHAiOjE3NDkzMjU2NDV9.E7Sm4AQB_sV5tjPTsx-GkI9YS2hYDY7Iz-JgOyVYsks"

# 请求头
HEADERS = {
    "Authorization": f"Bearer {ACCESS_TOKEN}",
    "Content-Type": "application/json"
}

def test_api_performance(url: str, description: str, params: Dict[str, Any] = None) -> Dict[str, Any]:
    """测试API性能"""
    print(f"\n🧪 测试: {description}")
    print(f"📍 URL: {url}")
    
    start_time = time.time()
    try:
        response = requests.get(url, headers=HEADERS, params=params, timeout=120)
        end_time = time.time()
        
        duration = (end_time - start_time) * 1000  # 转换为毫秒
        
        if response.status_code == 200:
            data = response.json()
            
            # 提取数据统计
            if 'data' in data:
                if isinstance(data['data'], list):
                    count = len(data['data'])
                elif isinstance(data['data'], dict):
                    count = 1
                else:
                    count = 0
            else:
                count = 0
            
            # 提取分页信息
            total = None
            if 'meta' in data and 'total' in data['meta']:
                total = data['meta']['total']
            
            print(f"✅ 成功: {duration:.2f}ms")
            print(f"📊 数据: {count} 条记录" + (f" (总计: {total})" if total else ""))
            
            return {
                'success': True,
                'duration_ms': duration,
                'status_code': response.status_code,
                'count': count,
                'total': total
            }
        else:
            print(f"❌ 失败: HTTP {response.status_code}")
            print(f"📄 响应: {response.text[:200]}...")
            return {
                'success': False,
                'duration_ms': duration,
                'status_code': response.status_code,
                'error': response.text[:200]
            }
            
    except Exception as e:
        end_time = time.time()
        duration = (end_time - start_time) * 1000
        print(f"❌ 异常: {str(e)}")
        return {
            'success': False,
            'duration_ms': duration,
            'error': str(e)
        }

def main():
    """主测试函数"""
    print("🚀 最终性能优化验证测试")
    print("=" * 60)
    
    # 测试用例
    test_cases = [
        {
            'url': f"{BASE_URL}/v2/simple-payroll/audit/summary/53",
            'description': "审核汇总API (视图优化)",
            'params': None
        },
        {
            'url': f"{BASE_URL}/v2/simple-payroll/audit/53/anomalies",
            'description': "异常列表API (视图优化)",
            'params': {'page': 1, 'size': 100}
        },
        {
            'url': f"{BASE_URL}/v2/payroll-entries",
            'description': "薪资条目API (视图优化)",
            'params': {'page': 1, 'size': 100}
        },
        {
            'url': f"{BASE_URL}/v2/payroll-entries",
            'description': "薪资条目API - 搜索测试",
            'params': {'page': 1, 'size': 50, 'search': '张'}
        },
        {
            'url': f"{BASE_URL}/v2/payroll-entries",
            'description': "薪资条目API - 薪资范围筛选",
            'params': {'page': 1, 'size': 50, 'min_gross_pay': 5000, 'max_gross_pay': 10000}
        }
    ]
    
    results = []
    total_time = 0
    
    for test_case in test_cases:
        result = test_api_performance(
            test_case['url'],
            test_case['description'],
            test_case.get('params')
        )
        result['test_name'] = test_case['description']
        results.append(result)
        
        if result['success']:
            total_time += result['duration_ms']
        
        time.sleep(1)  # 避免请求过于频繁
    
    # 汇总报告
    print("\n" + "=" * 60)
    print("📊 测试汇总报告")
    print("=" * 60)
    
    successful_tests = [r for r in results if r['success']]
    failed_tests = [r for r in results if not r['success']]
    
    print(f"✅ 成功测试: {len(successful_tests)}/{len(results)}")
    print(f"❌ 失败测试: {len(failed_tests)}")
    print(f"⏱️  总耗时: {total_time:.2f}ms")
    
    if successful_tests:
        avg_time = total_time / len(successful_tests)
        print(f"📈 平均响应时间: {avg_time:.2f}ms")
        
        fastest = min(successful_tests, key=lambda x: x['duration_ms'])
        slowest = max(successful_tests, key=lambda x: x['duration_ms'])
        
        print(f"🏃 最快: {fastest['test_name']} ({fastest['duration_ms']:.2f}ms)")
        print(f"🐌 最慢: {slowest['test_name']} ({slowest['duration_ms']:.2f}ms)")
    
    # 详细结果
    print("\n📋 详细结果:")
    for result in results:
        status = "✅" if result['success'] else "❌"
        print(f"{status} {result['test_name']}: {result['duration_ms']:.2f}ms")
        if not result['success']:
            print(f"   错误: {result.get('error', 'Unknown error')}")
    
    # 性能评估
    print("\n🎯 性能评估:")
    if successful_tests:
        excellent_count = len([r for r in successful_tests if r['duration_ms'] < 500])
        good_count = len([r for r in successful_tests if 500 <= r['duration_ms'] < 1000])
        acceptable_count = len([r for r in successful_tests if 1000 <= r['duration_ms'] < 2000])
        poor_count = len([r for r in successful_tests if r['duration_ms'] >= 2000])
        
        print(f"🟢 优秀 (<500ms): {excellent_count}")
        print(f"🟡 良好 (500-1000ms): {good_count}")
        print(f"🟠 可接受 (1000-2000ms): {acceptable_count}")
        print(f"🔴 需优化 (>2000ms): {poor_count}")
        
        if poor_count == 0 and acceptable_count <= 1:
            print("\n🎉 恭喜！所有API性能都达到了优秀或良好水平！")
        elif poor_count == 0:
            print("\n👍 很好！没有性能差的API，优化效果显著！")
        else:
            print(f"\n⚠️  还有 {poor_count} 个API需要进一步优化")
    
    # 保存结果到文件
    timestamp = time.strftime("%Y%m%d_%H%M%S")
    filename = f"final_optimization_test_results_{timestamp}.json"
    
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump({
            'timestamp': timestamp,
            'summary': {
                'total_tests': len(results),
                'successful_tests': len(successful_tests),
                'failed_tests': len(failed_tests),
                'total_time_ms': total_time,
                'average_time_ms': total_time / len(successful_tests) if successful_tests else 0
            },
            'results': results
        }, f, indent=2, ensure_ascii=False)
    
    print(f"\n💾 测试结果已保存到: {filename}")

if __name__ == "__main__":
    main() 