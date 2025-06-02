#!/usr/bin/env python3
"""
修复端到端测试中的422数据验证错误
"""

import asyncio
import json
import requests
from datetime import datetime, date, timedelta
from typing import Dict, List, Any, Optional

# 测试配置
BASE_URL = "http://localhost:8080/v2"
TEST_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsInJvbGUiOiJcdThkODVcdTdlYTdcdTdiYTFcdTc0MDZcdTU0NTgiLCJleHAiOjE3NDg4ODgyODh9.r-fNi0KKLGcHObEJK5o6z9gpdmtmiGiRxFI7fj9A3ek"

class ValidationErrorFixer:
    """数据验证错误修复器"""
    
    def __init__(self):
        self.headers = {"Authorization": f"Bearer {TEST_TOKEN}"}
        self.lookup_cache = {}
        
    def make_request(self, method: str, endpoint: str, **kwargs) -> tuple:
        """发送HTTP请求"""
        url = f"{BASE_URL}{endpoint}"
        try:
            response = requests.request(method, url, headers=self.headers, **kwargs)
            return response.status_code, response.json() if response.text else {}
        except Exception as e:
            return 0, {"error": str(e)}
    
    async def get_lookup_value_id(self, lookup_type_code: str, code: str) -> Optional[int]:
        """获取字典值ID"""
        cache_key = f"{lookup_type_code}:{code}"
        if cache_key in self.lookup_cache:
            return self.lookup_cache[cache_key]
        
        status, data = self.make_request("GET", f"/config/lookup-values", 
                                       params={"lookup_type_code": lookup_type_code, "code": code})
        if status == 200 and data.get("data"):
            lookup_id = data["data"][0]["id"]
            self.lookup_cache[cache_key] = lookup_id
            return lookup_id
        return None
    
    async def test_corrected_data_formats(self):
        """测试修正后的数据格式"""
        print("🔧 测试修正后的数据格式")
        
        # 1. 测试考勤周期创建
        await self.test_attendance_period_creation()
        
        # 2. 测试薪资审核创建
        await self.test_payroll_run_creation()
        
        # 3. 测试社保配置创建
        await self.test_social_insurance_config_creation()
        
        # 4. 测试税务配置创建
        await self.test_tax_config_creation()
        
        # 5. 测试考勤记录创建
        await self.test_attendance_record_creation()
        
        # 6. 测试计算规则集创建
        await self.test_calculation_ruleset_creation()
    
    async def test_attendance_period_creation(self):
        """测试考勤周期创建"""
        period_data = {
            "name": f"修复测试周期-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "start_date": (date.today() - timedelta(days=30)).isoformat(),
            "end_date": date.today().isoformat(),
            "is_active": True
        }
        
        status, data = self.make_request("POST", "/attendance/periods", json=period_data)
        print(f"✅ 考勤周期创建: {status} - {data.get('id', '失败')}")
        return status == 200
    
    async def test_payroll_run_creation(self):
        """测试薪资审核创建"""
        # 获取薪资周期
        status, periods = self.make_request("GET", "/payroll-periods", params={"limit": 1, "is_current": True})
        if status != 200 or not periods.get("data"):
            print("❌ 薪资审核创建: 无法获取薪资周期")
            return False
        
        period_id = periods["data"][0]["id"]
        status_id = await self.get_lookup_value_id("PAYROLL_RUN_STATUS", "PRUN_PENDING_CALC")
        
        if not status_id:
            print("❌ 薪资审核创建: 无法获取状态ID")
            return False
        
        payroll_run_data = {
            "payroll_period_id": period_id,
            "run_name": f"修复测试运行-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "description": "数据验证修复测试用薪资审核",
            "status_lookup_value_id": status_id
        }
        
        status, data = self.make_request("POST", "/payroll-runs", json=payroll_run_data)
        print(f"✅ 薪资审核创建: {status} - {data.get('id', '失败')}")
        return status in [200, 201]
    
    async def test_social_insurance_config_creation(self):
        """测试社保配置创建"""
        social_config = {
            "config_name": f"修复测试社保配置-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "effective_date": date.today().isoformat(),
            "config_data": {
                "insurance_type": "PENSION",  # 保险类型：PENSION, MEDICAL, UNEMPLOYMENT等
                "employee_rate": 0.08,  # 个人缴费比例
                "employer_rate": 0.16,  # 单位缴费比例
                "base_calculation_method": "basic_salary"  # 基数计算方法
            },
            "is_active": True
        }
        
        status, data = self.make_request("POST", "/payroll/calculation-config/social-insurance", 
                                       json=social_config)
        print(f"✅ 社保配置创建: {status} - {data.get('id', '失败')}")
        return status == 200
    
    async def test_tax_config_creation(self):
        """测试税务配置创建"""
        tax_config = {
            "config_name": f"修复测试税务配置-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "effective_date": date.today().isoformat(),
            "config_data": {
                "tax_type": "PERSONAL_INCOME",  # 税种类型：PERSONAL_INCOME, YEAR_END_BONUS
                "basic_deduction": 5000.0,  # 基本减除费用
                "tax_brackets": [
                    {"min_amount": 0, "max_amount": 3000, "rate": 0.03, "quick_deduction": 0},
                    {"min_amount": 3000, "max_amount": 12000, "rate": 0.10, "quick_deduction": 210},
                    {"min_amount": 12000, "max_amount": 25000, "rate": 0.20, "quick_deduction": 1410}
                ]
            },
            "is_active": True
        }
        
        status, data = self.make_request("POST", "/payroll/calculation-config/tax-configs", 
                                       json=tax_config)
        print(f"✅ 税务配置创建: {status} - {data.get('id', '失败')}")
        return status == 200
    
    async def test_attendance_record_creation(self):
        """测试考勤记录创建"""
        # 获取测试员工
        status, employees = self.make_request("GET", "/employees", params={"limit": 1})
        if status != 200 or not employees.get("data"):
            print("❌ 考勤记录创建: 无法获取员工")
            return False
        
        employee_id = employees["data"][0]["id"]
        
        # 获取考勤周期
        status, periods = self.make_request("GET", "/attendance/periods", params={"limit": 1})
        if status != 200 or not periods:
            print("❌ 考勤记录创建: 无法获取考勤周期")
            return False
        
        period_id = periods[0]["id"] if isinstance(periods, list) else periods["data"][0]["id"]
        
        attendance_record = {
            "employee_id": employee_id,
            "period_id": period_id,
            "work_days": 21,
            "overtime_hours": 8.0,
            "leave_days": 1,
            "late_times": 0,
            "early_leave_times": 0,
            "absent_days": 0
        }
        
        status, data = self.make_request("POST", "/attendance/records", json=attendance_record)
        print(f"✅ 考勤记录创建: {status} - {data.get('id', '失败')}")
        return status == 200
    
    async def test_calculation_ruleset_creation(self):
        """测试计算规则集创建"""
        ruleset_data = {
            "config_name": f"修复测试规则集-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "effective_date": date.today().isoformat(),
            "config_data": {
                "description": "数据验证修复测试用计算规则集",
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
            },
            "is_active": True
        }
        
        status, data = self.make_request("POST", "/payroll/calculation-config/rule-sets", 
                                       json=ruleset_data)
        print(f"✅ 计算规则集创建: {status} - {data.get('id', '失败')}")
        return status == 200
    
    async def generate_corrected_test_data(self):
        """生成修正后的测试数据模板"""
        print("\n📝 生成修正后的测试数据模板")
        
        corrected_data = {
            "attendance_period": {
                "name": "测试周期名称",
                "start_date": "2024-12-01",
                "end_date": "2024-12-31",
                "is_active": True
            },
            "payroll_run": {
                "payroll_period_id": "从/payroll-periods获取",
                "run_name": "测试运行名称",
                "description": "测试描述",
                "status_lookup_value_id": "60 (PRUN_PENDING_CALC)"
            },
            "social_insurance_config": {
                "config_name": "社保配置名称",
                "pension_rate_employee": 0.08,
                "pension_rate_employer": 0.16,
                "medical_rate_employee": 0.02,
                "medical_rate_employer": 0.06,
                "unemployment_rate_employee": 0.005,
                "unemployment_rate_employer": 0.005,
                "housing_fund_rate_employee": 0.12,
                "housing_fund_rate_employer": 0.12,
                "effective_date": "2025-01-01",
                "is_active": True
            },
            "tax_config": {
                "config_name": "税务配置名称",
                "tax_threshold": 5000.0,
                "tax_brackets": [
                    {"min_amount": 0, "max_amount": 3000, "rate": 0.03, "quick_deduction": 0}
                ],
                "effective_date": "2025-01-01",
                "is_active": True
            },
            "attendance_record": {
                "employee_id": "从/employees获取",
                "period_id": "从/attendance/periods获取",
                "total_work_days": 22,
                "actual_work_days": 21,
                "standard_work_days": 22,
                "overtime_hours": 8.0,
                "leave_days": 1,
                "late_count": 0,
                "early_leave_count": 0
            },
            "calculation_ruleset": {
                "name": "规则集名称",
                "description": "规则集描述",
                "effective_date": "2025-01-01",
                "is_active": True,
                "rules": [
                    {
                        "name": "规则名称",
                        "component_code": "BASIC_SALARY",
                        "component_type": "EARNING",
                        "formula": "base_salary",
                        "execution_order": 1,
                        "is_active": True
                    }
                ]
            }
        }
        
        with open("corrected_test_data_template.json", "w", encoding="utf-8") as f:
            json.dump(corrected_data, f, ensure_ascii=False, indent=2)
        
        print("✅ 修正后的测试数据模板已保存到 corrected_test_data_template.json")


async def main():
    fixer = ValidationErrorFixer()
    await fixer.test_corrected_data_formats()
    await fixer.generate_corrected_test_data()
    print("\n🎯 数据验证错误修复测试完成!")


if __name__ == "__main__":
    asyncio.run(main()) 