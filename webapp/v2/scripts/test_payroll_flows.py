#!/usr/bin/env python3
"""
薪资计算流程专项测试模块
"""

import asyncio
import json
import requests
from datetime import datetime, date, timedelta
from typing import Dict, List, Any, Optional

class PayrollFlowTester:
    """薪资计算流程测试器"""
    
    def __init__(self, base_url: str, token: str):
        self.base_url = base_url
        self.headers = {"Authorization": f"Bearer {token}"}
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
        url = f"{self.base_url}{endpoint}"
        try:
            response = requests.request(method, url, headers=self.headers, **kwargs)
            return response.status_code, response.json() if response.text else {}
        except Exception as e:
            return 0, {"error": str(e)}
    
    async def test_employee_management(self):
        """测试员工管理"""
        print("\n👥 测试员工管理")
        
        # 获取现有员工
        status, data = self.make_request("GET", "/employees", params={"limit": 5})
        if status == 200 and data.get("data"):
            employees = data["data"]
            self.test_data["test_employees"] = employees[:2]  # 取前2个员工用于测试
            self.log_test("获取测试员工", "PASS", f"获取到 {len(employees)} 个员工")
            
            # 测试员工详情获取
            for emp in self.test_data["test_employees"]:
                status, emp_data = self.make_request("GET", f"/employees/{emp['id']}")
                # 使用正确的字段名
                emp_name = emp.get('name') or emp.get('full_name') or f"员工{emp['id']}"
                self.log_test(f"员工详情-{emp_name}", 
                             "PASS" if status == 200 else "FAIL",
                             f"员工ID: {emp['id']}")
        else:
            self.log_test("获取测试员工", "FAIL", f"状态码: {status}")
    
    async def test_calculation_configuration(self):
        """测试计算配置"""
        print("\n🔧 测试计算配置")
        
        # 测试社保配置
        social_config = {
            "config_name": f"端到端测试社保配置-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "pension_rate_employee": 0.08,
            "pension_rate_employer": 0.16,
            "medical_rate_employee": 0.02,
            "medical_rate_employer": 0.06,
            "unemployment_rate_employee": 0.005,
            "unemployment_rate_employer": 0.005,
            "effective_date": date.today().isoformat(),
            "is_active": True
        }
        
        status, data = self.make_request("POST", "/payroll/calculation-config/social-insurance", 
                                       json=social_config)
        if status == 200:
            self.test_data["social_config_id"] = data["id"]
            self.log_test("创建社保配置", "PASS", f"配置ID: {data['id']}")
        else:
            self.log_test("创建社保配置", "FAIL", f"状态码: {status}")
        
        # 测试税务配置
        tax_config = {
            "config_name": f"端到端测试税务配置-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "tax_threshold": 5000.0,
            "tax_brackets": [
                {"min_amount": 0, "max_amount": 3000, "rate": 0.03, "quick_deduction": 0},
                {"min_amount": 3000, "max_amount": 12000, "rate": 0.10, "quick_deduction": 210},
                {"min_amount": 12000, "max_amount": 25000, "rate": 0.20, "quick_deduction": 1410}
            ],
            "effective_date": date.today().isoformat(),
            "is_active": True
        }
        
        status, data = self.make_request("POST", "/payroll/calculation-config/tax-configs", 
                                       json=tax_config)
        if status == 200:
            self.test_data["tax_config_id"] = data["id"]
            self.log_test("创建税务配置", "PASS", f"配置ID: {data['id']}")
        else:
            self.log_test("创建税务配置", "FAIL", f"状态码: {status}")
    
    async def test_attendance_management(self):
        """测试考勤管理"""
        print("\n⏰ 测试考勤管理")
        
        if not self.test_data.get("test_employees"):
            self.log_test("考勤管理测试", "SKIP", "没有测试员工数据")
            return
        
        # 为测试员工创建考勤记录
        for emp in self.test_data["test_employees"]:
            attendance_record = {
                "employee_id": emp["id"],
                "period_id": self.test_data.get("attendance_period_id"),
                "total_work_days": 22,
                "actual_work_days": 21,
                "standard_work_days": 22,
                "overtime_hours": 8.0,
                "leave_days": 1,
                "late_count": 0,
                "early_leave_count": 0
            }
            
            status, data = self.make_request("POST", "/attendance/records", json=attendance_record)
            emp_name = emp.get('name') or emp.get('full_name') or f"员工{emp['id']}"
            self.log_test(f"创建考勤记录-{emp_name}", 
                         "PASS" if status == 200 else "FAIL",
                         f"员工ID: {emp['id']}, 状态码: {status}")
    
    async def test_payroll_calculation_flow(self):
        """测试薪资计算流程"""
        print("\n💰 测试薪资计算流程")
        
        if not self.test_data.get("payroll_period_id"):
            self.log_test("薪资计算流程", "SKIP", "没有薪资周期数据")
            return
        
        # 创建薪资审核
        payroll_run_data = {
            "payroll_period_id": self.test_data["payroll_period_id"],
            "run_name": f"端到端测试运行-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "description": "端到端测试用薪资审核",
            "status_lookup_value_id": 60  # PRUN_PENDING_CALC - 待计算
        }
        
        status, data = self.make_request("POST", "/payroll-runs", json=payroll_run_data)
        if status in [200, 201]:
            payroll_run_id = data["id"]
            self.test_data["payroll_run_id"] = payroll_run_id
            self.log_test("创建薪资审核", "PASS", f"运行ID: {payroll_run_id}")
            
            # 测试计算预览
            await self.test_calculation_preview(payroll_run_id)
            
            # 测试计算触发
            await self.test_calculation_trigger(payroll_run_id)
            
            # 测试计算结果查询
            await self.test_calculation_results(payroll_run_id)
            
        else:
            self.log_test("创建薪资审核", "FAIL", f"状态码: {status}")
    
    async def test_calculation_preview(self, payroll_run_id: int):
        """测试计算预览"""
        preview_request = {
            "payroll_run_id": payroll_run_id,
            "preview_limit": 5,
            "calculation_config": {
                "include_overtime": True,
                "tax_calculation_method": "progressive"
            }
        }
        
        status, data = self.make_request("POST", "/payroll/calculation/preview", 
                                       json=preview_request)
        self.log_test("薪资计算预览", "PASS" if status == 200 else "FAIL",
                     f"状态码: {status}, 预览员工数: {data.get('preview_count', 0)}")
    
    async def test_calculation_trigger(self, payroll_run_id: int):
        """测试计算触发"""
        calculation_request = {
            "payroll_run_id": payroll_run_id,
            "calculation_config": {
                "include_overtime": True,
                "tax_calculation_method": "progressive"
            },
            "force_async": False
        }
        
        status, data = self.make_request("POST", "/payroll/calculation/trigger", 
                                       json=calculation_request)
        self.log_test("薪资计算触发", "PASS" if status == 200 else "FAIL",
                     f"状态码: {status}, 总员工数: {data.get('total_employees', 0)}")
        
        if status == 200:
            self.test_data["calculation_response"] = data
    
    async def test_calculation_results(self, payroll_run_id: int):
        """测试计算结果查询"""
        status, data = self.make_request("GET", f"/payroll/calculation/summary/{payroll_run_id}")
        self.log_test("计算结果汇总", "PASS" if status == 200 else "FAIL",
                     f"状态码: {status}")
    
    async def test_edge_cases(self):
        """测试边界情况"""
        print("\n🔍 测试边界情况")
        
        # 测试无效薪资审核ID
        invalid_request = {
            "payroll_run_id": 99999,
            "calculation_config": {}
        }
        
        status, data = self.make_request("POST", "/payroll/calculation/preview", 
                                       json=invalid_request)
        self.log_test("无效薪资审核ID", "PASS" if status == 404 else "FAIL",
                     f"状态码: {status}")
        
        # 测试空员工列表
        if self.test_data.get("payroll_run_id"):
            empty_request = {
                "payroll_run_id": self.test_data["payroll_run_id"],
                "employee_ids": [],
                "calculation_config": {}
            }
            
            status, data = self.make_request("POST", "/payroll/calculation/trigger", 
                                           json=empty_request)
            self.log_test("空员工列表", "PASS" if status in [400, 422] else "FAIL",
                         f"状态码: {status}")
    
    async def test_error_scenarios(self):
        """测试错误场景"""
        print("\n⚠️ 测试错误场景")
        
        # 测试无效认证
        invalid_headers = {"Authorization": "Bearer invalid_token"}
        response = requests.get(f"{self.base_url}/payroll/calculation-config/rule-sets", 
                              headers=invalid_headers)
        self.log_test("无效认证", "PASS" if response.status_code == 401 else "FAIL",
                     f"状态码: {response.status_code}")
        
        # 测试无效JSON格式
        response = requests.post(f"{self.base_url}/payroll/calculation/preview",
                               headers=self.headers,
                               data="invalid json")
        self.log_test("无效JSON格式", "PASS" if response.status_code == 422 else "FAIL",
                     f"状态码: {response.status_code}")
    
    async def test_performance_scenarios(self):
        """测试性能场景"""
        print("\n🚀 测试性能场景")
        
        if not self.test_data.get("payroll_run_id"):
            self.log_test("性能测试", "SKIP", "没有薪资审核数据")
            return
        
        # 测试大批量计算（强制异步）
        large_batch_request = {
            "payroll_run_id": self.test_data["payroll_run_id"],
            "force_async": True,
            "calculation_config": {}
        }
        
        start_time = datetime.now()
        status, data = self.make_request("POST", "/payroll/calculation/trigger", 
                                       json=large_batch_request)
        end_time = datetime.now()
        
        response_time = (end_time - start_time).total_seconds()
        self.log_test("异步计算响应", "PASS" if status == 200 and response_time < 5 else "FAIL",
                     f"状态码: {status}, 响应时间: {response_time:.2f}s")
    
    def generate_test_report(self):
        """生成测试报告"""
        print("\n📊 测试报告")
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
        
        if failed_tests > 0:
            print("\n失败的测试:")
            for test_name, result in self.results.items():
                if result["status"] == "FAIL":
                    print(f"  ❌ {test_name}: {result['details']}")
        
        print("\n🎯 测试完成!")
        return {"total": total_tests, "passed": passed_tests, "failed": failed_tests} 