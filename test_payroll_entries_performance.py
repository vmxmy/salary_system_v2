#!/usr/bin/env python3
"""
薪资条目API性能对比测试
"""
import requests
import time
import json
from datetime import datetime

# API配置
BASE_URL = "http://localhost:8080"
ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsInJvbGUiOiJcdThkODVcdTdlYTdcdTdiYTFcdTc0MDZcdTU0NTgiLCJleHAiOjE3NDkzMjQ1MDl9.-5EjAKQkqSp_sQdIVll0qmWWOIp41KQNUownFiJNLCI"

headers = {
    "Authorization": f"Bearer {ACCESS_TOKEN}",
    "Content-Type": "application/json"
}

def test_api_performance(use_views: bool, test_name: str, params: dict = None):
    """测试API性能"""
    if params is None:
        params = {}
    
    params.update({
        "page": 1,
        "size": 20,
        "use_views": use_views
    })
    
    url = f"{BASE_URL}/v2/payroll-entries"
    
    print(f"🔍 {test_name} ({'视图优化' if use_views else '传统方法'})")
    start_time = time.time()
    
    try:
        response = requests.get(url, headers=headers, params=params, timeout=30)
        end_time = time.time()
        duration = (end_time - start_time) * 1000
        
        if response.status_code == 200:
            data = response.json()
            record_count = len(data.get('data', []))
            total_count = data.get('meta', {}).get('total', 0)
            
            print(f"✅ 成功: {duration:.2f}ms")
            print(f"   返回记录: {record_count} 条")
            print(f"   总记录数: {total_count} 条")
            
            return {
                'success': True,
                'duration': duration,
                'record_count': record_count,
                'total_count': total_count
            }
        else:
            print(f"❌ 失败: {response.status_code}")
            print(f"   响应内容: {response.text[:200]}")
            return {
                'success': False,
                'duration': 0,
                'error': f"HTTP {response.status_code}"
            }
            
    except Exception as e:
        print(f"❌ 请求异常: {e}")
        return {
            'success': False,
            'duration': 0,
            'error': str(e)
        }

def run_performance_comparison():
    """运行性能对比测试"""
    print("🎯 薪资条目API性能对比测试")
    print(f"测试时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    test_cases = [
        {
            'name': '基础查询（无筛选条件）',
            'params': {}
        },
        {
            'name': '搜索查询（姓名搜索）',
            'params': {'search': '张'}
        },
        {
            'name': '薪资范围筛选',
            'params': {'min_gross_pay': 10000, 'max_gross_pay': 20000}
        },
        {
            'name': '部门筛选',
            'params': {'department_name': '财政'}
        },
        {
            'name': '大页面查询',
            'params': {'size': 50}
        }
    ]
    
    results = []
    
    for test_case in test_cases:
        print(f"\n📋 {test_case['name']}")
        print("-" * 40)
        
        # 测试传统方法
        traditional_result = test_api_performance(
            use_views=False, 
            test_name="传统方法", 
            params=test_case['params']
        )
        
        # 测试视图优化方法
        view_result = test_api_performance(
            use_views=True, 
            test_name="视图优化", 
            params=test_case['params']
        )
        
        # 计算性能提升
        if traditional_result['success'] and view_result['success']:
            improvement = ((traditional_result['duration'] - view_result['duration']) / traditional_result['duration']) * 100
            speedup = traditional_result['duration'] / view_result['duration']
            
            print(f"📈 性能提升: {improvement:.1f}% ({speedup:.1f}x 加速)")
            
            results.append({
                'test_name': test_case['name'],
                'traditional_ms': traditional_result['duration'],
                'view_optimized_ms': view_result['duration'],
                'improvement_percent': improvement,
                'speedup_factor': speedup,
                'data_consistency': traditional_result['total_count'] == view_result['total_count']
            })
        else:
            print("❌ 无法计算性能提升（部分测试失败）")
    
    # 输出总结
    print("\n" + "=" * 60)
    print("📊 性能测试总结")
    print("=" * 60)
    
    if results:
        avg_improvement = sum(r['improvement_percent'] for r in results) / len(results)
        avg_speedup = sum(r['speedup_factor'] for r in results) / len(results)
        
        print(f"平均性能提升: {avg_improvement:.1f}%")
        print(f"平均加速倍数: {avg_speedup:.1f}x")
        
        print("\n详细结果:")
        for result in results:
            print(f"• {result['test_name']}")
            print(f"  传统方法: {result['traditional_ms']:.0f}ms")
            print(f"  视图优化: {result['view_optimized_ms']:.0f}ms")
            print(f"  提升: {result['improvement_percent']:.1f}% ({result['speedup_factor']:.1f}x)")
            print(f"  数据一致性: {'✅' if result['data_consistency'] else '❌'}")
            print()
        
        # 保存结果到文件
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"payroll_entries_performance_test_{timestamp}.json"
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump({
                'timestamp': datetime.now().isoformat(),
                'summary': {
                    'avg_improvement_percent': avg_improvement,
                    'avg_speedup_factor': avg_speedup
                },
                'detailed_results': results
            }, f, indent=2, ensure_ascii=False)
        
        print(f"📁 详细结果已保存到: {filename}")
    
    print("\n🎉 性能测试完成!")

if __name__ == "__main__":
    run_performance_comparison() 