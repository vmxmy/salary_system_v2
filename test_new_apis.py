#!/usr/bin/env python3
"""
薪资系统API V2测试脚本
测试基于视图的新API功能
"""

import requests
import json
import sys
from typing import Dict, Any

# API基础配置
BASE_URL = "http://localhost:8080"
API_V2_PREFIX = "/v2"

class APITester:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.session = requests.Session()
        self.test_results = []
    
    def test_endpoint(self, method: str, endpoint: str, description: str, **kwargs) -> Dict[str, Any]:
        """测试单个API端点"""
        url = f"{self.base_url}{endpoint}"
        
        try:
            print(f"🧪 测试: {description}")
            print(f"   {method} {endpoint}")
            
            response = self.session.request(method, url, **kwargs)
            
            result = {
                'endpoint': endpoint,
                'method': method,
                'description': description,
                'status_code': response.status_code,
                'success': response.status_code == 200,
                'response_time': response.elapsed.total_seconds(),
                'data_size': len(response.content) if response.content else 0
            }
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    result['data_count'] = len(data.get('data', [])) if isinstance(data.get('data'), list) else 1
                    result['message'] = data.get('message', '')
                    print(f"   ✅ 成功 - {result['message']} ({result['response_time']:.3f}s)")
                except:
                    print(f"   ✅ 成功 - 响应时间: {result['response_time']:.3f}s")
            else:
                print(f"   ❌ 失败 - HTTP {response.status_code}")
                try:
                    error_data = response.json()
                    result['error'] = error_data.get('detail', 'Unknown error')
                    print(f"   错误: {result['error']}")
                except:
                    result['error'] = response.text
            
            self.test_results.append(result)
            return result
            
        except Exception as e:
            print(f"   ❌ 异常 - {str(e)}")
            result = {
                'endpoint': endpoint,
                'method': method,
                'description': description,
                'success': False,
                'error': str(e)
            }
            self.test_results.append(result)
            return result
    
    def test_payroll_apis(self):
        """测试薪资API V2"""
        print("\n📊 测试薪资API V2")
        print("=" * 50)
        
        # 薪资周期
        self.test_endpoint('GET', f'{API_V2_PREFIX}/payroll/periods', '获取薪资周期列表')
        self.test_endpoint('GET', f'{API_V2_PREFIX}/payroll/periods?size=5', '获取薪资周期列表(限制5条)')
        
        # 薪资运行
        self.test_endpoint('GET', f'{API_V2_PREFIX}/payroll/runs', '获取薪资运行列表')
        
        # 薪资条目
        self.test_endpoint('GET', f'{API_V2_PREFIX}/payroll/entries?size=10', '获取薪资条目列表')
        
        # 薪资组件
        self.test_endpoint('GET', f'{API_V2_PREFIX}/payroll/components', '获取薪资组件列表')
        
        # 分析和仪表板
        self.test_endpoint('GET', f'{API_V2_PREFIX}/payroll/analysis/summary', '获取薪资汇总分析')
        self.test_endpoint('GET', f'{API_V2_PREFIX}/payroll/dashboard', '获取薪资仪表板数据')
    
    def test_config_apis(self):
        """测试配置API V2"""
        print("\n⚙️ 测试配置API V2")
        print("=" * 50)
        
        # 查找数据
        self.test_endpoint('GET', f'{API_V2_PREFIX}/config/lookup/types', '获取查找类型列表')
        self.test_endpoint('GET', f'{API_V2_PREFIX}/config/lookup/values/EMPLOYEE_STATUS', '获取员工状态查找值')
        self.test_endpoint('GET', f'{API_V2_PREFIX}/config/lookup/data', '获取查找数据字典')
        
        # 薪资配置
        self.test_endpoint('GET', f'{API_V2_PREFIX}/config/payroll/components', '获取薪资组件配置')
        self.test_endpoint('GET', f'{API_V2_PREFIX}/config/tax/brackets', '获取税率表')
        self.test_endpoint('GET', f'{API_V2_PREFIX}/config/social-security/rates', '获取社保费率')
        
        # 系统配置
        self.test_endpoint('GET', f'{API_V2_PREFIX}/config/system/parameters', '获取系统参数')
        self.test_endpoint('GET', f'{API_V2_PREFIX}/config/payroll/config', '获取薪资配置')
        self.test_endpoint('GET', f'{API_V2_PREFIX}/config/system/config', '获取系统配置')
        
        # 验证和仪表板
        self.test_endpoint('GET', f'{API_V2_PREFIX}/config/validation/integrity', '验证配置完整性')
        self.test_endpoint('GET', f'{API_V2_PREFIX}/config/dashboard', '获取配置管理仪表板')
    
    def test_hr_apis(self):
        """测试人力资源API V2"""
        print("\n👥 测试人力资源API V2")
        print("=" * 50)
        
        # 员工管理
        self.test_endpoint('GET', f'{API_V2_PREFIX}/hr/employees', '获取员工列表')
        self.test_endpoint('GET', f'{API_V2_PREFIX}/hr/employees?size=5', '获取员工列表(限制5条)')
        self.test_endpoint('GET', f'{API_V2_PREFIX}/hr/employees/search?q=张', '搜索员工')
        self.test_endpoint('GET', f'{API_V2_PREFIX}/hr/employees/statistics', '获取员工统计')
        
        # 部门管理
        self.test_endpoint('GET', f'{API_V2_PREFIX}/hr/departments', '获取部门列表')
        self.test_endpoint('GET', f'{API_V2_PREFIX}/hr/departments/hierarchy', '获取部门层级结构')
        self.test_endpoint('GET', f'{API_V2_PREFIX}/hr/departments/tree', '获取部门树形结构')
        
        # 职位和人员类别
        self.test_endpoint('GET', f'{API_V2_PREFIX}/hr/positions', '获取职位列表')
        self.test_endpoint('GET', f'{API_V2_PREFIX}/hr/personnel-categories', '获取人员类别')
        
        # 组织分析
        self.test_endpoint('GET', f'{API_V2_PREFIX}/hr/organization/overview', '获取组织架构概览')
        self.test_endpoint('GET', f'{API_V2_PREFIX}/hr/organization/distribution', '获取员工分布情况')
        
        # 验证和仪表板
        self.test_endpoint('GET', f'{API_V2_PREFIX}/hr/validation/integrity', '验证HR数据完整性')
        self.test_endpoint('GET', f'{API_V2_PREFIX}/hr/dashboard', '获取HR管理仪表板')
    
    def generate_report(self):
        """生成测试报告"""
        print("\n📋 测试报告")
        print("=" * 50)
        
        total_tests = len(self.test_results)
        successful_tests = len([r for r in self.test_results if r.get('success', False)])
        failed_tests = total_tests - successful_tests
        
        print(f"总测试数: {total_tests}")
        print(f"成功: {successful_tests} ✅")
        print(f"失败: {failed_tests} ❌")
        print(f"成功率: {(successful_tests/total_tests*100):.1f}%")
        
        if failed_tests > 0:
            print(f"\n❌ 失败的测试:")
            for result in self.test_results:
                if not result.get('success', False):
                    print(f"   - {result['method']} {result['endpoint']}: {result.get('error', 'Unknown error')}")
        
        # 性能统计
        successful_results = [r for r in self.test_results if r.get('success', False) and 'response_time' in r]
        if successful_results:
            avg_response_time = sum(r['response_time'] for r in successful_results) / len(successful_results)
            max_response_time = max(r['response_time'] for r in successful_results)
            min_response_time = min(r['response_time'] for r in successful_results)
            
            print(f"\n⚡ 性能统计:")
            print(f"   平均响应时间: {avg_response_time:.3f}s")
            print(f"   最快响应时间: {min_response_time:.3f}s")
            print(f"   最慢响应时间: {max_response_time:.3f}s")
        
        return successful_tests == total_tests

def main():
    """主函数"""
    print("🚀 薪资系统API V2测试开始")
    print(f"测试目标: {BASE_URL}")
    
    tester = APITester(BASE_URL)
    
    # 测试各个模块
    tester.test_payroll_apis()
    tester.test_config_apis()
    tester.test_hr_apis()
    
    # 生成报告
    success = tester.generate_report()
    
    print(f"\n🎯 测试完成 - {'全部通过' if success else '存在失败'}")
    
    # 保存详细结果到文件
    with open('api_test_results.json', 'w', encoding='utf-8') as f:
        json.dump(tester.test_results, f, ensure_ascii=False, indent=2)
    
    print(f"📄 详细结果已保存到: api_test_results.json")
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main()) 