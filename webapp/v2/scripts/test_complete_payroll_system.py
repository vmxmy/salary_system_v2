#!/usr/bin/env python3
"""
完整的薪资计算系统端到端测试
"""

import asyncio
import sys
import json
import requests
from datetime import datetime, date, timedelta
from decimal import Decimal
from typing import Dict, List, Any, Optional

# 测试配置
BASE_URL = "http://localhost:8080/v2"
TEST_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsInJvbGUiOiJcdThkODVcdTdlYTdcdTdiYTFcdTc0MDZcdTU0NTgiLCJleHAiOjE3NDg4ODgyODh9.r-fNi0KKLGcHObEJK5o6z9gpdmtmiGiRxFI7fj9A3ek"

class PayrollSystemTester:
    """薪资系统完整测试器"""
    
    def __init__(self):
        self.headers = {"Authorization": f"Bearer {TEST_TOKEN}"}
        self.test_data = {}
        self.results = {}
        
    def log_test(self, test_name: str, status: str, details: str = ""):
        """记录测试结果"""
        print(f"{'✅' if status == 'PASS' else '❌'} {test_name}: {status}")
        if details:
            print(f"   {details}")
        self.results[test_name] = {"status": status, "details": details}
    
    def make_request(self, method: str, endpoint: str, **kwargs) -> tuple:
        """发送HTTP请求"""
        url = f"{BASE_URL}{endpoint}"
        try:
            response = requests.request(method, url, headers=self.headers, **kwargs)
            return response.status_code, response.json() if response.text else {}
        except Exception as e:
            return 0, {"error": str(e)}
    
    async def run_complete_test(self):
        """运行完整测试套件"""
        print("🚀 开始薪资计算系统完整端到端测试")
        print("=" * 60)
        
        # 测试阶段1：基础验证
        await self.test_basic_connectivity()
        await self.test_configuration_apis()
        
        # 测试阶段2：数据准备
        await self.prepare_test_data()
        
        # 测试阶段3：集成薪资计算流程测试
        await self.run_payroll_flow_tests()
        
        # 生成测试报告
        self.generate_test_report()
    
    async def run_payroll_flow_tests(self):
        """运行薪资计算流程测试"""
        from test_payroll_flows import PayrollFlowTester
        
        flow_tester = PayrollFlowTester(BASE_URL, TEST_TOKEN)
        flow_tester.test_data = self.test_data  # 共享测试数据
        
        # 运行流程测试
        await flow_tester.test_employee_management()
        await flow_tester.test_calculation_configuration()
        await flow_tester.test_attendance_management()
        await flow_tester.test_payroll_calculation_flow()
        await flow_tester.test_edge_cases()
        await flow_tester.test_error_scenarios()
        await flow_tester.test_performance_scenarios()
        
        # 合并测试结果
        self.results.update(flow_tester.results)
    
    async def test_basic_connectivity(self):
        """测试基础连接性"""
        print("\n📡 测试基础连接性")
        
        # 测试API健康检查（使用已知存在的端点）
        status, data = self.make_request("GET", "/payroll/calculation-config/rule-sets")
        self.log_test("API连接", "PASS" if status == 200 else "FAIL", 
                     f"状态码: {status}")
        
        # 测试认证
        status, data = self.make_request("GET", "/payroll/calculation-config/rule-sets")
        self.log_test("认证验证", "PASS" if status == 200 else "FAIL",
                     f"状态码: {status}")
    
    async def test_configuration_apis(self):
        """测试配置API"""
        print("\n⚙️ 测试配置管理API")
        
        config_tests = [
            ("计算规则集API", "GET", "/payroll/calculation-config/rule-sets"),
            ("社保配置API", "GET", "/payroll/calculation-config/social-insurance"),
            ("税务配置API", "GET", "/payroll/calculation-config/tax-configs"),
            ("考勤周期API", "GET", "/attendance/periods"),
            ("考勤记录API", "GET", "/attendance/records"),
            ("考勤规则API", "GET", "/attendance/rules"),
        ]
        
        for test_name, method, endpoint in config_tests:
            status, data = self.make_request(method, endpoint)
            # 处理不同的响应格式
            if isinstance(data, list):
                record_count = len(data)
            elif isinstance(data, dict):
                record_count = len(data.get('data', []))
            else:
                record_count = 0
            
            self.log_test(test_name, "PASS" if status == 200 else "FAIL",
                         f"状态码: {status}, 记录数: {record_count}")
    
    async def prepare_test_data(self):
        """准备测试数据"""
        print("\n🔧 准备测试数据")
        
        # 创建测试用考勤周期
        period_data = {
            "name": f"端到端测试周期-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "start_date": (date.today() - timedelta(days=30)).isoformat(),
            "end_date": date.today().isoformat(),
            "is_active": True
        }
        
        status, data = self.make_request("POST", "/attendance/periods", json=period_data)
        if status == 200:
            self.test_data["attendance_period_id"] = data["id"]
            self.log_test("创建考勤周期", "PASS", f"周期ID: {data['id']}")
        else:
            self.log_test("创建考勤周期", "FAIL", f"状态码: {status}")
        
        # 获取或创建薪资周期
        await self.prepare_payroll_period()
        
        # 创建测试用计算规则集
        await self.prepare_calculation_ruleset()
    
    async def prepare_payroll_period(self):
        """准备薪资周期"""
        # 获取必要的字典值
        status, freq_data = self.make_request("GET", "/config/lookup-values?lookup_type_code=PAYROLL_FREQUENCY&code=MONTHLY")
        status, status_data = self.make_request("GET", "/config/lookup-values?lookup_type_code=PAYROLL_PERIOD_STATUS&code=OPEN")
        
        if status == 200 and freq_data.get("data"):
            freq_id = freq_data["data"][0]["id"]
            status_id = status_data["data"][0]["id"] if status_data.get("data") else None
            
            period_data = {
                "period_name": f"端到端测试薪资周期-{datetime.now().strftime('%Y%m%d')}",
                "start_date": (date.today() - timedelta(days=30)).isoformat(),
                "end_date": date.today().isoformat(),
                "frequency_lookup_value_id": freq_id,
                "status_lookup_value_id": status_id,
                "is_current": True
            }
            
            status, data = self.make_request("POST", "/payroll-periods", json=period_data)
            if status in [200, 201]:
                self.test_data["payroll_period_id"] = data["id"]
                self.log_test("创建薪资周期", "PASS", f"周期ID: {data['id']}")
            elif status == 422:
                # 周期已存在，获取现有的
                status, existing = self.make_request("GET", "/payroll-periods", 
                                                   params={"limit": 1, "is_current": True})
                if status == 200 and existing.get("data"):
                    self.test_data["payroll_period_id"] = existing["data"][0]["id"]
                    self.log_test("使用现有薪资周期", "PASS", f"周期ID: {existing['data'][0]['id']}")
    
    async def prepare_calculation_ruleset(self):
        """准备计算规则集"""
        ruleset_data = {
            "name": f"端到端测试规则集-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "description": "端到端测试用计算规则集",
            "effective_date": date.today().isoformat(),
            "is_active": True,
            "rules": [
                {
                    "name": "基本工资计算",
                    "component_code": "BASIC_SALARY",
                    "component_type": "EARNING",
                    "formula": "base_salary",
                    "execution_order": 1,
                    "is_active": True
                }
            ]
        }
        
        status, data = self.make_request("POST", "/payroll/calculation-config/rule-sets", json=ruleset_data)
        if status == 200:
            self.test_data["ruleset_id"] = data["id"]
            self.log_test("创建计算规则集", "PASS", f"规则集ID: {data['id']}")
        else:
            self.log_test("创建计算规则集", "FAIL", f"状态码: {status}")
    
    def generate_test_report(self):
        """生成测试报告"""
        print("\n📊 完整端到端测试报告")
        print("=" * 60)
        
        total_tests = len(self.results)
        passed_tests = sum(1 for r in self.results.values() if r["status"] == "PASS")
        failed_tests = sum(1 for r in self.results.values() if r["status"] == "FAIL")
        skipped_tests = sum(1 for r in self.results.values() if r["status"] == "SKIP")
        
        print(f"总测试数: {total_tests}")
        print(f"通过: {passed_tests} ✅")
        print(f"失败: {failed_tests} ❌")
        print(f"跳过: {skipped_tests} ⏭️")
        print(f"成功率: {(passed_tests/total_tests*100):.1f}%")
        
        # 按类别统计
        categories = {
            "基础连接": ["API连接", "认证验证"],
            "配置管理": ["计算规则集API", "社保配置API", "税务配置API", "考勤周期API", "考勤记录API", "考勤规则API"],
            "数据准备": ["创建考勤周期", "创建薪资周期", "使用现有薪资周期", "创建计算规则集"],
            "薪资计算": ["薪资计算预览", "薪资计算触发", "计算结果汇总"],
            "错误处理": ["无效薪资审核ID", "空员工列表", "无效认证", "无效JSON格式"],
            "性能测试": ["异步计算响应"]
        }
        
        print("\n📋 分类测试结果:")
        for category, test_names in categories.items():
            category_results = [self.results.get(name, {"status": "MISSING"}) for name in test_names]
            category_passed = sum(1 for r in category_results if r["status"] == "PASS")
            category_total = len([r for r in category_results if r["status"] != "MISSING"])
            
            if category_total > 0:
                print(f"  {category}: {category_passed}/{category_total} ({'✅' if category_passed == category_total else '⚠️'})")
        
        if failed_tests > 0:
            print("\n❌ 失败的测试:")
            for test_name, result in self.results.items():
                if result["status"] == "FAIL":
                    print(f"  • {test_name}: {result['details']}")
        
        print(f"\n🎯 端到端测试完成! 系统{'完全正常' if failed_tests == 0 else '存在问题'}!")
        
        # 保存测试结果到文件
        import json
        with open(f"test_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json", "w", encoding="utf-8") as f:
            json.dump({
                "timestamp": datetime.now().isoformat(),
                "summary": {
                    "total": total_tests,
                    "passed": passed_tests,
                    "failed": failed_tests,
                    "skipped": skipped_tests,
                    "success_rate": passed_tests/total_tests*100
                },
                "results": self.results,
                "test_data": self.test_data
            }, f, ensure_ascii=False, indent=2)
        
        return {"total": total_tests, "passed": passed_tests, "failed": failed_tests}


if __name__ == "__main__":
    tester = PayrollSystemTester()
    asyncio.run(tester.run_complete_test()) 