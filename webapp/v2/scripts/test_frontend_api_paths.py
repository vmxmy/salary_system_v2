#!/usr/bin/env python3
"""
测试前端API路径修复是否成功
验证薪资计算和考勤管理API的可访问性
"""

import requests
import json
from datetime import datetime

# 测试配置
BASE_URL = "http://localhost:8080/v2"
TEST_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsInJvbGUiOiJcdThkODVcdTdlYTdcdTc0MDZcdTU0NTgiLCJleHAiOjE3NDg4OTAyNjh9.pOJmsIZXeEaP8JAxMEoMZQZgItCal0HUnxXZGc4TSPw"

class FrontendAPIPathTester:
    """前端API路径测试器"""
    
    def __init__(self):
        self.headers = {"Authorization": f"Bearer {TEST_TOKEN}"}
        self.test_results = []
    
    def test_api_endpoint(self, method: str, endpoint: str, description: str, **kwargs) -> bool:
        """测试API端点"""
        url = f"{BASE_URL}{endpoint}"
        try:
            response = requests.request(method, url, headers=self.headers, timeout=10, **kwargs)
            success = response.status_code < 400
            
            result = {
                "description": description,
                "method": method,
                "endpoint": endpoint,
                "url": url,
                "status_code": response.status_code,
                "success": success,
                "timestamp": datetime.now().isoformat()
            }
            
            if success:
                print(f"✅ {description}: {response.status_code}")
            else:
                print(f"❌ {description}: {response.status_code}")
                if response.text:
                    try:
                        error_data = response.json()
                        print(f"   错误详情: {error_data}")
                    except:
                        print(f"   错误详情: {response.text[:200]}")
            
            self.test_results.append(result)
            return success
            
        except Exception as e:
            print(f"❌ {description}: 连接错误 - {str(e)}")
            result = {
                "description": description,
                "method": method,
                "endpoint": endpoint,
                "url": url,
                "status_code": 0,
                "success": False,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
            self.test_results.append(result)
            return False
    
    def run_tests(self):
        """运行所有测试"""
        print("🔧 测试前端API路径修复结果")
        print("=" * 50)
        
        # 1. 测试薪资计算API路径
        print("\n📊 薪资计算API测试:")
        self.test_api_endpoint("GET", "/payroll/calculation/summary/1", "薪资计算汇总API")
        
        # 2. 测试计算配置API路径
        print("\n⚙️ 计算配置API测试:")
        self.test_api_endpoint("GET", "/payroll/calculation-config/rule-sets", "计算规则集API")
        self.test_api_endpoint("GET", "/payroll/calculation-config/social-insurance", "社保配置API")
        self.test_api_endpoint("GET", "/payroll/calculation-config/tax-configs", "税务配置API")
        
        # 3. 测试考勤管理API路径
        print("\n📅 考勤管理API测试:")
        self.test_api_endpoint("GET", "/attendance/periods", "考勤周期API")
        self.test_api_endpoint("GET", "/attendance/records", "考勤记录API")
        self.test_api_endpoint("GET", "/attendance/daily-records", "日考勤API")
        self.test_api_endpoint("GET", "/attendance/rules", "考勤规则API")
        
        # 4. 测试其他核心API（确保没有破坏现有功能）
        print("\n👥 核心API测试:")
        self.test_api_endpoint("GET", "/employees", "员工管理API")
        self.test_api_endpoint("GET", "/payroll-periods", "薪资周期API")
        
        # 统计结果
        total_tests = len(self.test_results)
        successful_tests = sum(1 for r in self.test_results if r["success"])
        failed_tests = total_tests - successful_tests
        
        print("\n" + "=" * 50)
        print(f"📈 测试结果统计:")
        print(f"   总测试数: {total_tests}")
        print(f"   成功: {successful_tests} ✅")
        print(f"   失败: {failed_tests} ❌")
        print(f"   成功率: {(successful_tests/total_tests*100):.1f}%")
        
        # 保存详细结果
        with open("frontend_api_path_test_results.json", "w", encoding="utf-8") as f:
            json.dump(self.test_results, f, ensure_ascii=False, indent=2)
        
        print(f"\n📄 详细测试结果已保存到: frontend_api_path_test_results.json")
        
        if failed_tests == 0:
            print("\n🎉 所有API路径测试通过！前端404错误已完全修复！")
        else:
            print(f"\n⚠️ 还有 {failed_tests} 个API需要进一步检查")
        
        return failed_tests == 0


def main():
    tester = FrontendAPIPathTester()
    success = tester.run_tests()
    
    if success:
        print("\n🚀 前端API路径修复验证成功！")
        print("🔧 阶段6.3.3 - 前端API路径修复 已完成")
    else:
        print("\n🔍 需要进一步调试API路径问题")
    
    return 0 if success else 1


if __name__ == "__main__":
    exit(main()) 