#!/usr/bin/env python
"""
薪资计算API测试脚本
测试新的薪资计算引擎和考勤管理功能
"""

import requests
import json
import sys
from datetime import datetime, date, timedelta

class PayrollCalculationTester:
    def __init__(self, base_url="http://localhost:8080"):
        self.base_url = base_url
        self.session = requests.Session()
        self.token = None
        self.current_payroll_run_id = None
        self.current_attendance_period_id = None
        self.payroll_period_id = None
        self.timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        self.payroll_frequency_lookup_type_id = None
        self.monthly_frequency_lookup_value_id = None
        self.payroll_period_status_lookup_type_id = None
        self.open_payroll_period_status_lookup_value_id = None
        self.payroll_run_status_lookup_type_id = None
        self.new_payroll_run_status_lookup_value_id = None
        self.payroll_entry_status_lookup_type_id = None
        self.calculated_payroll_entry_status_id = None
        self.error_payroll_entry_status_id = None
        
    def login(self, username="admin", password="admin"):
        """登录获取token"""
        # 使用新生成的有效token (24小时有效期)
        self.token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsInJvbGUiOiJcdThkODVcdTdlYTdcdTdiYTFcdTc0MDZcdTU0NTgiLCJleHAiOjE3NDg5NzU5NzF9._pAYXND8B7o1EMhoSSIHtnp8H2nakZTd5f06vU58zWs"
        self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        print("✓ 使用新生成的token登录成功")
        return True
    
    def test_calculation_config_apis(self):
        """测试计算配置API"""
        print("\n=== 测试计算配置API ===")
        
        # 测试规则集API
        print("1. 测试计算规则集API")
        response = self.session.get(f"{self.base_url}/v2/payroll/calculation-config/rule-sets")
        print(f"   GET 规则集列表: {response.status_code}")
        
        # 测试社保配置API
        print("2. 测试社保配置API")
        response = self.session.get(f"{self.base_url}/v2/payroll/calculation-config/social-insurance")
        print(f"   GET 社保配置列表: {response.status_code}")
        
        # 测试税务配置API
        print("3. 测试税务配置API")
        response = self.session.get(f"{self.base_url}/v2/payroll/calculation-config/tax-configs")
        print(f"   GET 税务配置列表: {response.status_code}")
    
    def test_attendance_apis(self):
        """测试考勤管理API"""
        print("\n=== 测试考勤管理API ===")
        
        # 测试考勤周期API
        print("1. 测试考勤周期API")
        response = self.session.get(f"{self.base_url}/v2/attendance/periods")
        print(f"   GET 考勤周期列表: {response.status_code}")
        
        # 测试考勤记录API
        print("2. 测试考勤记录API")
        response = self.session.get(f"{self.base_url}/v2/attendance/records")
        print(f"   GET 考勤记录列表: {response.status_code}")
        
        # 测试日考勤API
        print("3. 测试日考勤API")
        response = self.session.get(f"{self.base_url}/v2/attendance/daily-records")
        print(f"   GET 日考勤列表: {response.status_code}")
        
        # 测试考勤规则API
        print("4. 测试考勤规则API")
        response = self.session.get(f"{self.base_url}/v2/attendance/rules")
        print(f"   GET 考勤规则列表: {response.status_code}")
    
    def test_payroll_calculation_apis(self):
        """测试薪资计算API"""
        print("\n=== 测试薪资计算API ===")

        if not hasattr(self, 'current_payroll_run_id') or not self.current_payroll_run_id:
            print("  测试薪资计算API跳过: 薪资审核ID未设置 (可能由于创建失败)。")
            return

        payroll_run_id_to_use = self.current_payroll_run_id
        print(f"  使用薪资审核ID: {payroll_run_id_to_use}进行测试")
        
        # 测试计算预览
        print("1. 测试计算预览API")
        preview_payload = {"payroll_run_id": payroll_run_id_to_use, "employee_ids": [349, 350]} 
        response = self.session.post(f"{self.base_url}/v2/payroll/calculation/preview", json=preview_payload)
        if response.status_code == 200:
            print(f"   POST 计算预览: {response.status_code}")
        else:
            print(f"   POST 计算预览: {response.status_code}")
            try:
                print(f"   错误信息: {response.json()}") # Print full JSON
                print(f"   完整响应文本: {response.text}") 
            except requests.exceptions.JSONDecodeError:
                print(f"   无法解析JSON响应: {response.text}")
        
        # 测试计算触发
        print("2. 测试计算触发API")
        trigger_payload = {"payroll_run_id": payroll_run_id_to_use, "employee_ids": [349, 350]}
        response = self.session.post(f"{self.base_url}/v2/payroll/calculation/trigger", json=trigger_payload)
        if response.status_code == 200:
            print(f"   POST 触发计算: {response.status_code}")
        else:
            print(f"   POST 触发计算: {response.status_code}")
            try:
                print(f"   错误信息: {response.json()}") # Print full JSON
                print(f"   完整响应文本: {response.text}")
            except requests.exceptions.JSONDecodeError:
                print(f"   无法解析JSON响应: {response.text}")
    
    def test_create_sample_data(self):
        """创建测试数据"""
        print("\n=== 创建测试数据 ===")
        
        # 0. 创建基础配置数据
        print("0. 创建基础配置数据")
        self.create_payroll_frequency_lookup_type()
        self.create_monthly_payroll_frequency_lookup_value()
        self.create_payroll_period_status_lookup_type()
        self.create_open_payroll_period_status_lookup_value()
        self.create_payroll_run_status_lookup_type()
        self.create_new_payroll_run_status_lookup_value()
        self.create_payroll_entry_status_lookup_type()
        self.create_calculated_payroll_entry_status_lookup_value()
        self.create_error_payroll_entry_status_lookup_value()

        # 1. 创建考勤周期
        self.create_attendance_period()

        # 2. 创建薪资周期 (PayrollPeriod)
        self.create_payroll_period()

        # 3. 创建薪资审核 (PayrollRun)
        # Only attempt if payroll_period_id was successfully created
        if self.payroll_period_id and self.new_payroll_run_status_lookup_value_id:
            payroll_run_data = {
                "payroll_period_id": self.payroll_period_id,
                "status_lookup_value_id": self.new_payroll_run_status_lookup_value_id # Corrected field name and using dynamic ID
                # initiated_by_user_id is optional, can be added later if needed
            }
            response_payroll_run = self.session.post(f"{self.base_url}/v2/payroll-runs", json=payroll_run_data) # CORRECTED ENDPOINT
            print(f"创建薪资审核 (PayrollRun): {response_payroll_run.status_code}")
            created_payroll_run_id = None
            if response_payroll_run.status_code == 200 or response_payroll_run.status_code == 201: # Handle 201 Created
                try:
                    response_data = response_payroll_run.json()
                    created_payroll_run_id = response_data.get("data", {}).get("id") # Corrected ID extraction
                    print(f"  薪资审核ID: {created_payroll_run_id}")
                    self.current_payroll_run_id = created_payroll_run_id # Store for later tests
                except requests.exceptions.JSONDecodeError:
                    print(f"  无法解析薪资审核创建响应: {response_payroll_run.text}")
                    self.current_payroll_run_id = None
            else:
                try:
                    print(f"  错误: {response_payroll_run.json()}")
                except requests.exceptions.JSONDecodeError:
                    print(f"  错误文本: {response_payroll_run.text}")
                self.current_payroll_run_id = None
        else:
            print("  跳过创建薪资审核，因为薪资周期创建失败或运行状态ID创建失败。")
            self.current_payroll_run_id = None

        # 4. 创建计算规则集 (已有)
        ruleset_data = {
            "config_name": f"Test RuleSet {datetime.now().strftime('%Y%m%d%H%M%S')}",
            "config_data": {
                "description": "Test calculation rule set",
                "version": "1.0",
                "is_default": False # Typically don't want test data to be default
            },
            "effective_date": "2024-01-01"
        }
        response_ruleset = self.session.post(f"{self.base_url}/v2/payroll/calculation-config/rule-sets", json=ruleset_data)
        print(f"创建计算规则集: {response_ruleset.status_code}")

    def create_payroll_period(self):
        """创建薪资周期 (PayrollPeriod)"""
        if not self.token:
            print("  登录失败，无法创建薪资周期。")
            return

        # 确保有可用的考勤周期ID
        if not self.current_attendance_period_id:
            print("  没有可用的考勤周期ID，无法创建薪资周期。")
            if not self.current_attendance_period_id:
                 print("  尝试创建考勤周期失败，无法创建薪资周期。")
                 return

        # 确保有可用的薪资频率
        if not self.monthly_frequency_lookup_value_id:
            print("  没有可用的 'MONTHLY' 薪资频率ID，尝试创建。")
            if not self.monthly_frequency_lookup_value_id:
                 print("  尝试创建 'MONTHLY' 薪资频率ID失败，无法创建薪资周期。")
                 return
        
        # 确保有可用的薪资周期状态ID
        if not self.open_payroll_period_status_lookup_value_id:
            print("  没有可用的 'OPEN' 薪资周期状态ID，尝试创建。")
            if not self.open_payroll_period_status_lookup_value_id:
                print("  尝试创建 'OPEN' 薪资周期状态ID失败，无法创建薪资周期。")
                return

        payroll_frequency_id_to_use = self.monthly_frequency_lookup_value_id

        payload = {
            "name": f"Test Payroll Period {self.timestamp}",
            "start_date": (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d"),
            "end_date": datetime.now().strftime("%Y-%m-%d"),
            "pay_date": (datetime.now() + timedelta(days=5)).strftime("%Y-%m-%d"), 
            "status_lookup_value_id": self.open_payroll_period_status_lookup_value_id,
            "frequency_lookup_value_id": payroll_frequency_id_to_use,
            "attendance_period_id": self.current_attendance_period_id
        }
        # Corrected endpoint
        response = self.session.post(f"{self.base_url}/v2/payroll-periods", json=payload)
        if response.status_code == 201:
            try:
                self.payroll_period_id = response.json().get("data", {}).get("id")
                if self.payroll_period_id:
                    print(f"创建薪资周期 (PayrollPeriod): {response.status_code} (ID: {self.payroll_period_id})")
                else:
                    print(f"创建薪资周期 (PayrollPeriod): {response.status_code} - 但未返回ID")
                    print(f"  响应: {response.text}")
            except ValueError:
                 print(f"创建薪资周期 (PayrollPeriod): {response.status_code} - JSON解析错误")
                 print(f"  响应: {response.text}")
        elif response.status_code == 422:
            print(f"创建薪资周期 (PayrollPeriod) 返回422: {response.text}")
            try:
                error_details = response.json().get("detail", {}).get("error", {}).get("details", "")
                if "Payroll period with the same date range and frequency already exists" in error_details:
                    print("  尝试获取已存在的薪资周期...")
                    # Prepare params to fetch the existing period
                    # Dates must match exactly what was attempted in payload
                    fetch_params = {
                        "start_date": payload["start_date"],
                        "end_date": payload["end_date"],
                        "frequency_lookup_value_id": payload["frequency_lookup_value_id"]
                        # We might need to fetch all and filter if API doesn't support exact match on these three
                    }
                    get_response = self.session.get(f"{self.base_url}/v2/payroll-periods", params=fetch_params)
                    if get_response.status_code == 200:
                        periods_data = get_response.json().get("data", [])
                        if periods_data and isinstance(periods_data, list) and len(periods_data) > 0:
                            # Assuming the first match is the one we want, or if API guarantees uniqueness on these params
                            self.payroll_period_id = periods_data[0].get("id")
                            print(f"  已获取现有薪资周期ID: {self.payroll_period_id}")
                        else:
                            print("  获取现有薪资周期失败: 未找到匹配的周期。")
                            self.payroll_period_id = None
                    else:
                        print(f"  获取现有薪资周期失败: {get_response.status_code} - {get_response.text}")
                        self.payroll_period_id = None
                else:
                    self.payroll_period_id = None # Other 422 error
            except Exception as e:
                print(f"  解析422错误或获取现有周期时出错: {e}")
                self.payroll_period_id = None
        else:
            print(f"创建薪资周期 (PayrollPeriod): {response.status_code}")
            print(f"  错误: {response.text}")
            self.payroll_period_id = None

    def create_attendance_period(self):
        """创建考勤周期并设置 self.current_attendance_period_id"""
        if not self.token:
            print("  登录失败，无法创建考勤周期。")
            return

        attendance_period_data = {
            "name": f"Test Attendance Period {self.timestamp}", # Use unique name
            "start_date": (datetime.now() - timedelta(days=60)).strftime("%Y-%m-%d"),
            "end_date": (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d"),
            "is_active": True
        }
        response = self.session.post(f"{self.base_url}/v2/attendance/periods", json=attendance_period_data)
        print(f"创建考勤周期: {response.status_code}")
        if response.status_code == 200 or response.status_code == 201: # Accept 200 or 201
            try:
                # Parse response directly if not nested under "data"
                response_data = response.json()
                self.current_attendance_period_id = response_data.get("id")
                if self.current_attendance_period_id:
                    print(f"  考勤周期ID: {self.current_attendance_period_id}")
                else:
                    print("  考勤周期创建成功但未返回ID。")
                    print(f"  响应: {response.text}")
            except ValueError: 
                print(f"  无法解析考勤周期创建响应: {response.text}")
                self.current_attendance_period_id = None
        else:
            print(f"  考勤周期创建失败: {response.status_code}")
            try:
                print(f"  错误: {response.json()}")
            except ValueError:
                print(f"  错误文本: {response.text}")
            self.current_attendance_period_id = None
    
    def create_payroll_frequency_lookup_type(self):
        """创建 'PAYROLL_FREQUENCY' 字典类型"""
        if not self.token:
            print("  登录失败，无法创建字典类型。")
            return

        payload = {
            "code": "PAYROLL_FREQUENCY",
            "name": "Payroll Frequency",
            "description": "Defines how often payroll is run (e.g., Monthly, Bi-weekly)",
            "module": "Payroll"
        }
        response = self.session.post(f"{self.base_url}/v2/config/lookup-types", json=payload)
        print(f"创建 'PAYROLL_FREQUENCY' 字典类型: {response.status_code}")
        if response.status_code == 201:
            try:
                self.payroll_frequency_lookup_type_id = response.json()["data"]["id"]
                print(f"  字典类型 'PAYROLL_FREQUENCY' ID: {self.payroll_frequency_lookup_type_id}")
            except (KeyError, TypeError) as e:
                print(f"  解析 'PAYROLL_FREQUENCY' 字典类型ID失败: {e}. 响应: {response.text}")
                self.payroll_frequency_lookup_type_id = None
        elif response.status_code == 422: 
            print(f"  字典类型 'PAYROLL_FREQUENCY' 可能已存在或数据无效. 尝试获取现有ID. 响应: {response.text}")
            get_response = self.session.get(f"{self.base_url}/v2/config/lookup-types/PAYROLL_FREQUENCY")
            if get_response.status_code == 200:
                try:
                    self.payroll_frequency_lookup_type_id = get_response.json()["data"]["id"]
                    print(f"  已获取现有 'PAYROLL_FREQUENCY' 字典类型ID: {self.payroll_frequency_lookup_type_id}")
                except (KeyError, TypeError) as e:
                    print(f"  解析现有 'PAYROLL_FREQUENCY' 字典类型ID失败: {e}. 响应: {get_response.text}")
                    self.payroll_frequency_lookup_type_id = None  
            else:
                print(f"  获取现有 'PAYROLL_FREQUENCY' 字典类型失败: {get_response.status_code}")
                self.payroll_frequency_lookup_type_id = None
        else:
            print(f"  字典类型创建失败. 错误: {response.text}")
            self.payroll_frequency_lookup_type_id = None
        
        if not self.payroll_frequency_lookup_type_id:
            self.payroll_frequency_lookup_type_id = None

    def create_monthly_payroll_frequency_lookup_value(self):
        """创建 'MONTHLY' 字典值 for 'PAYROLL_FREQUENCY'"""
        if not self.token:
            print("  登录失败，无法创建字典值。")
            return
        if not self.payroll_frequency_lookup_type_id:
            print("  'PAYROLL_FREQUENCY' 字典类型ID未设置，尝试创建。")
            self.create_payroll_frequency_lookup_type()
            if not self.payroll_frequency_lookup_type_id:
                 print("  尝试创建 'PAYROLL_FREQUENCY' 字典类型失败，无法创建字典值。")
                 return

        payload = {
            "lookup_type_id": self.payroll_frequency_lookup_type_id,
            "code": "MONTHLY",
            "name": "Monthly",
            "description": "Payroll is processed once per month.",
            "display_order": 1,
            "is_active": True
        }
        response = self.session.post(f"{self.base_url}/v2/config/lookup-values", json=payload)
        print(f"创建 'MONTHLY' 字典值 (for PAYROLL_FREQUENCY): {response.status_code}")
        if response.status_code == 201:
            try:
                self.monthly_frequency_lookup_value_id = response.json().get("data", {}).get("id")
                if self.monthly_frequency_lookup_value_id:
                    print(f"  字典值 'MONTHLY' ID: {self.monthly_frequency_lookup_value_id}")
                else:
                    print(f"  字典值创建成功但未返回ID。响应: {response.text}")
            except ValueError:
                print(f"  无法解析字典值创建响应: {response.text}")
                self.monthly_frequency_lookup_value_id = None
        else:
            if response.status_code == 422:
                print(f"  字典值 'MONTHLY' 可能已存在或数据无效. 尝试获取现有ID. 响应: {response.text}")
                get_lv_response = self.session.get(f"{self.base_url}/v2/config/lookup-values", 
                                                params={"lookup_type_id": self.payroll_frequency_lookup_type_id, "search": "MONTHLY"})
                if get_lv_response.status_code == 200:
                    try:
                        values = get_lv_response.json().get("data", [])
                        if values and isinstance(values, list) and len(values) > 0:
                            self.monthly_frequency_lookup_value_id = values[0].get("id")
                            if self.monthly_frequency_lookup_value_id:
                                print(f"  已获取现有字典值 'MONTHLY' ID: {self.monthly_frequency_lookup_value_id}")
                    except ValueError:
                        print(f"  无法解析获取现有字典值 'MONTHLY' 响应: {get_lv_response.text}")
                else:
                    print(f"  获取现有字典值 'MONTHLY' 失败: {get_lv_response.status_code} {get_lv_response.text}")
            else:
                print(f"  字典值创建失败. 错误: {response.text}")
            if not self.monthly_frequency_lookup_value_id:
                self.monthly_frequency_lookup_value_id = None

    def create_payroll_period_status_lookup_type(self):
        """创建 'PAYROLL_PERIOD_STATUS' 字典类型"""
        if not self.token:
            print("  登录失败，无法创建字典类型。")
            return

        payload = {
            "code": "PAYROLL_PERIOD_STATUS",
            "name": "薪资周期状态",
            "description": "薪资周期的可能状态值",
            "module": "Payroll"
        }
        response = self.session.post(f"{self.base_url}/v2/config/lookup-types", json=payload)
        print(f"创建 'PAYROLL_PERIOD_STATUS' 字典类型: {response.status_code}")
        if response.status_code == 201:
            try:
                self.payroll_period_status_lookup_type_id = response.json()["data"]["id"]
                print(f"  字典类型 'PAYROLL_PERIOD_STATUS' ID: {self.payroll_period_status_lookup_type_id}")
            except (KeyError, TypeError) as e:
                print(f"  解析 'PAYROLL_PERIOD_STATUS' 字典类型ID失败: {e}. 响应: {response.text}")
                self.payroll_period_status_lookup_type_id = None
        elif response.status_code == 422: # Already exists or validation error
            print(f"  'PAYROLL_PERIOD_STATUS' 字典类型可能已存在或数据无效. 尝试获取现有ID. 响应: {response.text}")
            # Attempt to fetch existing by code
            get_response = self.session.get(f"{self.base_url}/v2/config/lookup-types/PAYROLL_PERIOD_STATUS")
            if get_response.status_code == 200:
                try:
                    self.payroll_period_status_lookup_type_id = get_response.json()["data"]["id"]
                    print(f"  已获取现有 'PAYROLL_PERIOD_STATUS' 字典类型ID: {self.payroll_period_status_lookup_type_id}")
                except (KeyError, TypeError) as e:
                    print(f"  解析现有 'PAYROLL_PERIOD_STATUS' 字典类型ID失败: {e}. 响应: {get_response.text}")
                    self.payroll_period_status_lookup_type_id = None  
            else:
                print(f"  获取现有 'PAYROLL_PERIOD_STATUS' 字典类型失败: {get_response.status_code}")
                self.payroll_period_status_lookup_type_id = None
        elif response.status_code == 404: # ADDED: Diagnostic for 404 on POST
            print(f"  创建 'PAYROLL_PERIOD_STATUS' 字典类型时 POST 返回 404. 响应: {response.text}")
            print(f"  尝试 GET /v2/config/lookup-types/PAYROLL_PERIOD_STATUS 进行诊断...")
            diagnostic_get_response = self.session.get(f"{self.base_url}/v2/config/lookup-types/PAYROLL_PERIOD_STATUS")
            print(f"  诊断 GET 结果: {diagnostic_get_response.status_code}, 响应: {diagnostic_get_response.text}")
            self.payroll_period_status_lookup_type_id = None
        else:
            print(f"  字典类型创建失败. 错误: {response.text}")
            self.payroll_period_status_lookup_type_id = None
        
        if not self.payroll_period_status_lookup_type_id: # Ensure it's None if all attempts fail
            self.payroll_period_status_lookup_type_id = None

    def create_open_payroll_period_status_lookup_value(self):
        """为 'PAYROLL_PERIOD_STATUS' 创建 'OPEN' 字典值"""
        if not self.token:
            print("  登录失败，无法创建字典值。")
            return
        if not self.payroll_period_status_lookup_type_id:
            print("  'PAYROLL_PERIOD_STATUS' 字典类型ID未设置，尝试创建。")
            self.create_payroll_period_status_lookup_type()
            if not self.payroll_period_status_lookup_type_id:
                 print("  尝试创建 'PAYROLL_PERIOD_STATUS' 字典类型失败，无法创建字典值。")
                 return

        payload = {
            "lookup_type_id": self.payroll_period_status_lookup_type_id,
            "code": "OPEN", # Assuming 'OPEN' is a valid code for an initial payroll period status
            "name": "Open",
            "description": "Payroll period is open for processing.",
            "display_order": 1,
            "is_active": True
        }
        response = self.session.post(f"{self.base_url}/v2/config/lookup-values", json=payload)
        print(f"创建 'OPEN' 字典值 (for PAYROLL_PERIOD_STATUS): {response.status_code}")
        if response.status_code == 201:
            try:
                self.open_payroll_period_status_lookup_value_id = response.json()["data"]["id"]
                print(f"  字典值 'OPEN' ID: {self.open_payroll_period_status_lookup_value_id}")
            except (KeyError, TypeError) as e:
                print(f"  解析 'OPEN' 字典值ID失败: {e}. 响应: {response.text}")
                self.open_payroll_period_status_lookup_value_id = None
        elif response.status_code == 422: # Already exists or validation error
            print(f"  'OPEN' 字典值 (for PAYROLL_PERIOD_STATUS) 可能已存在或数据无效. 尝试获取现有ID. 响应: {response.text}")
            # Attempt to fetch existing by code by searching within the lookup_type_id
            get_response = self.session.get(f"{self.base_url}/v2/config/lookup-values", 
                                            params={"lookup_type_id": self.payroll_period_status_lookup_type_id, "search": "OPEN"})
            if get_response.status_code == 200:
                try:
                    values = get_response.json().get("data", [])
                    found_value = next((v for v in values if v.get("code") == "OPEN"), None)
                    if found_value:
                        self.open_payroll_period_status_lookup_value_id = found_value["id"]
                        print(f"  已获取现有 'OPEN' 字典值ID (for PAYROLL_PERIOD_STATUS): {self.open_payroll_period_status_lookup_value_id}")
                    else:
                        print(f"  未找到 code='OPEN' 的现有字典值 (for PAYROLL_PERIOD_STATUS)。")
                        self.open_payroll_period_status_lookup_value_id = None
                except (KeyError, TypeError, StopIteration) as e:
                    print(f"  解析现有 'OPEN' 字典值ID失败: {e}. 响应: {get_response.text}")
                    self.open_payroll_period_status_lookup_value_id = None
            else:
                print(f"  获取现有 'OPEN' 字典值失败: {get_response.status_code}. 响应: {get_response.text}")
                self.open_payroll_period_status_lookup_value_id = None
        else:
            print(f"  'OPEN' 字典值创建失败. 错误: {response.text}")
            self.open_payroll_period_status_lookup_value_id = None

        if not self.open_payroll_period_status_lookup_value_id:
            self.open_payroll_period_status_lookup_value_id = None

    def create_payroll_run_status_lookup_type(self):
        """创建 'PAYROLL_RUN_STATUS' 字典类型"""
        if not self.token:
            print("  登录失败，无法创建字典类型。")
            return

        payload = {
            "code": "PAYROLL_RUN_STATUS",
            "name": "薪资审核状态",
            "description": "薪资审核批次的可能状态值",
            "module": "Payroll"
        }
        response = self.session.post(f"{self.base_url}/v2/config/lookup-types", json=payload)
        print(f"创建 'PAYROLL_RUN_STATUS' 字典类型: {response.status_code}")
        if response.status_code == 201:
            try:
                self.payroll_run_status_lookup_type_id = response.json()["data"]["id"]
                print(f"  字典类型 'PAYROLL_RUN_STATUS' ID: {self.payroll_run_status_lookup_type_id}")
            except (KeyError, TypeError) as e:
                print(f"  解析 'PAYROLL_RUN_STATUS' 字典类型ID失败: {e}. 响应: {response.text}")
                self.payroll_run_status_lookup_type_id = None
        elif response.status_code == 422: # Already exists or validation error
            print(f"  'PAYROLL_RUN_STATUS' 字典类型可能已存在或数据无效. 尝试获取现有ID. 响应: {response.text}")
            get_response = self.session.get(f"{self.base_url}/v2/config/lookup-types/PAYROLL_RUN_STATUS")
            if get_response.status_code == 200:
                try:
                    self.payroll_run_status_lookup_type_id = get_response.json()["data"]["id"]
                    print(f"  已获取现有 'PAYROLL_RUN_STATUS' 字典类型ID: {self.payroll_run_status_lookup_type_id}")
                except (KeyError, TypeError) as e:
                    print(f"  解析现有 'PAYROLL_RUN_STATUS' 字典类型ID失败: {e}. 响应: {get_response.text}")
                    self.payroll_run_status_lookup_type_id = None  
            else:
                print(f"  获取现有 'PAYROLL_RUN_STATUS' 字典类型失败: {get_response.status_code}")
                self.payroll_run_status_lookup_type_id = None
        else:
            print(f"  字典类型创建失败. 错误: {response.text}")
            self.payroll_run_status_lookup_type_id = None
        
        if not self.payroll_run_status_lookup_type_id:
            self.payroll_run_status_lookup_type_id = None

    def create_new_payroll_run_status_lookup_value(self):
        """为 'PAYROLL_RUN_STATUS' 创建 'NEW_RUN' 字典值"""
        if not self.token:
            print("  登录失败，无法创建字典值。")
            return
        if not self.payroll_run_status_lookup_type_id:
            print("  'PAYROLL_RUN_STATUS' 字典类型ID未设置，尝试创建。")
            self.create_payroll_run_status_lookup_type()
            if not self.payroll_run_status_lookup_type_id:
                 print("  尝试创建 'PAYROLL_RUN_STATUS' 字典类型失败，无法创建字典值。")
                 return

        payload = {
            "lookup_type_id": self.payroll_run_status_lookup_type_id,
            "code": "NEW_RUN", 
            "name": "New Run",
            "description": "Payroll run has been created but not processed.",
            "display_order": 1,
            "is_active": True
        }
        response = self.session.post(f"{self.base_url}/v2/config/lookup-values", json=payload)
        print(f"创建 'NEW_RUN' 字典值 (for PAYROLL_RUN_STATUS): {response.status_code}")
        if response.status_code == 201:
            try:
                self.new_payroll_run_status_lookup_value_id = response.json()["data"]["id"]
                print(f"  字典值 'NEW_RUN' ID: {self.new_payroll_run_status_lookup_value_id}")
            except (KeyError, TypeError) as e:
                print(f"  解析 'NEW_RUN' 字典值ID失败: {e}. 响应: {response.text}")
                self.new_payroll_run_status_lookup_value_id = None
        elif response.status_code == 422: 
            print(f"  'NEW_RUN' 字典值 (for PAYROLL_RUN_STATUS) 可能已存在或数据无效. 尝试获取现有ID. 响应: {response.text}")
            get_response = self.session.get(f"{self.base_url}/v2/config/lookup-values", 
                                            params={"lookup_type_id": self.payroll_run_status_lookup_type_id, "search": "NEW_RUN"})
            if get_response.status_code == 200:
                try:
                    values = get_response.json().get("data", [])
                    found_value = next((v for v in values if v.get("code") == "NEW_RUN"), None)
                    if found_value:
                        self.new_payroll_run_status_lookup_value_id = found_value["id"]
                        print(f"  已获取现有 'NEW_RUN' 字典值ID (for PAYROLL_RUN_STATUS): {self.new_payroll_run_status_lookup_value_id}")
                    else:
                        print(f"  未找到 code='NEW_RUN' 的现有字典值 (for PAYROLL_RUN_STATUS)。")
                        self.new_payroll_run_status_lookup_value_id = None
                except (KeyError, TypeError, StopIteration) as e:
                    print(f"  解析现有 'NEW_RUN' 字典值ID失败: {e}. 响应: {get_response.text}")
                    self.new_payroll_run_status_lookup_value_id = None
            else:
                print(f"  获取现有 'NEW_RUN' 字典值失败: {get_response.status_code}. 响应: {get_response.text}")
                self.new_payroll_run_status_lookup_value_id = None
        else:
            print(f"  'NEW_RUN' 字典值创建失败. 错误: {response.text}")
            self.new_payroll_run_status_lookup_value_id = None

        if not self.new_payroll_run_status_lookup_value_id:
            self.new_payroll_run_status_lookup_value_id = None

    def create_payroll_entry_status_lookup_type(self):
        """创建 'PAYROLL_ENTRY_STATUS' 字典类型"""
        if not self.token:
            print("  登录失败，无法创建字典类型。")
            return

        payload = {
            "code": "PAYROLL_ENTRY_STATUS",
            "name": "薪资条目状态",
            "description": "薪资计算条目的状态 (例如：已计算, 错误)",
            "module": "Payroll"
        }
        response = self.session.post(f"{self.base_url}/v2/config/lookup-types", json=payload)
        print(f"创建 'PAYROLL_ENTRY_STATUS' 字典类型: {response.status_code}")
        if response.status_code == 201:
            try:
                self.payroll_entry_status_lookup_type_id = response.json()["data"]["id"]
                print(f"  字典类型 'PAYROLL_ENTRY_STATUS' ID: {self.payroll_entry_status_lookup_type_id}")
            except (KeyError, TypeError) as e:
                print(f"  解析 'PAYROLL_ENTRY_STATUS' 字典类型ID失败: {e}. 响应: {response.text}")
        elif response.status_code == 422:
            print(f"  'PAYROLL_ENTRY_STATUS' 字典类型可能已存在. 尝试获取现有ID. 响应: {response.text}")
            get_response = self.session.get(f"{self.base_url}/v2/config/lookup-types/PAYROLL_ENTRY_STATUS")
            if get_response.status_code == 200:
                try:
                    self.payroll_entry_status_lookup_type_id = get_response.json()["data"]["id"]
                    print(f"  已获取现有 'PAYROLL_ENTRY_STATUS' 字典类型ID: {self.payroll_entry_status_lookup_type_id}")
                except (KeyError, TypeError) as e:
                    print(f"  解析现有 'PAYROLL_ENTRY_STATUS' 字典类型ID失败: {e}. 响应: {get_response.text}")
            else:
                print(f"  获取现有 'PAYROLL_ENTRY_STATUS' 字典类型失败: {get_response.status_code}")
        else:
            print(f"  字典类型创建失败. 错误: {response.text}")
        
        if not hasattr(self, 'payroll_entry_status_lookup_type_id') or not self.payroll_entry_status_lookup_type_id:
            self.payroll_entry_status_lookup_type_id = None
            
    def create_calculated_payroll_entry_status_lookup_value(self):
        """为 'PAYROLL_ENTRY_STATUS' 创建 'CALCULATED_ENTRY' 字典值"""
        if not self.token:
            print("  登录失败，无法创建字典值。")
            return
        if not self.payroll_entry_status_lookup_type_id:
            print("  'PAYROLL_ENTRY_STATUS' 字典类型ID未设置，无法创建 'CALCULATED_ENTRY' 字典值。")
            return

        payload = {
            "lookup_type_id": self.payroll_entry_status_lookup_type_id,
            "code": "CALCULATED_ENTRY", 
            "name": "已计算",
            "description": "薪资条目已成功计算",
            "display_order": 1,
            "is_active": True
        }
        response = self.session.post(f"{self.base_url}/v2/config/lookup-values", json=payload)
        print(f"创建 'CALCULATED_ENTRY' 字典值 (for PAYROLL_ENTRY_STATUS): {response.status_code}")
        if response.status_code == 201:
            try:
                self.calculated_payroll_entry_status_id = response.json()["data"]["id"]
                print(f"  字典值 'CALCULATED_ENTRY' ID: {self.calculated_payroll_entry_status_id}")
            except (KeyError, TypeError) as e:
                print(f"  解析 'CALCULATED_ENTRY' 字典值ID失败: {e}. 响应: {response.text}")
        elif response.status_code == 422:
            print(f"  'CALCULATED_ENTRY' 字典值可能已存在. 尝试获取现有ID. 响应: {response.text}")
            get_response = self.session.get(f"{self.base_url}/v2/config/lookup-values", 
                                            params={"lookup_type_id": self.payroll_entry_status_lookup_type_id, "code": "CALCULATED_ENTRY"}) # Search by code
            if get_response.status_code == 200:
                values = get_response.json().get("data", [])
                if values and isinstance(values, list) and len(values) > 0:
                     self.calculated_payroll_entry_status_id = values[0].get("id")
                     print(f"  已获取现有 'CALCULATED_ENTRY' 字典值ID: {self.calculated_payroll_entry_status_id}")
                else: # If not found by code, try by name (less reliable)
                    get_response_name = self.session.get(f"{self.base_url}/v2/config/lookup-values", 
                                            params={"lookup_type_id": self.payroll_entry_status_lookup_type_id, "search": "已计算"})
                    if get_response_name.status_code == 200:
                        values_name = get_response_name.json().get("data", [])
                        found_value = next((v for v in values_name if v.get("code") == "CALCULATED_ENTRY"), None)
                        if found_value:
                            self.calculated_payroll_entry_status_id = found_value.get("id")
                            print(f"  已获取现有 'CALCULATED_ENTRY' 字典值ID (by name search): {self.calculated_payroll_entry_status_id}")
            else:
                print(f"  获取现有 'CALCULATED_ENTRY' 字典值失败: {get_response.status_code}")
        else:
            print(f"  'CALCULATED_ENTRY' 字典值创建失败. 错误: {response.text}")

        if not hasattr(self, 'calculated_payroll_entry_status_id') or not self.calculated_payroll_entry_status_id:
            self.calculated_payroll_entry_status_id = None
            
    def create_error_payroll_entry_status_lookup_value(self):
        """为 'PAYROLL_ENTRY_STATUS' 创建 'ERROR_ENTRY' 字典值"""
        if not self.token:
            print("  登录失败，无法创建字典值。")
            return
        if not self.payroll_entry_status_lookup_type_id:
            print("  'PAYROLL_ENTRY_STATUS' 字典类型ID未设置，无法创建 'ERROR_ENTRY' 字典值。")
            return

        payload = {
            "lookup_type_id": self.payroll_entry_status_lookup_type_id,
            "code": "ERROR_ENTRY", 
            "name": "计算错误",
            "description": "薪资条目计算时发生错误",
            "display_order": 2,
            "is_active": True
        }
        response = self.session.post(f"{self.base_url}/v2/config/lookup-values", json=payload)
        print(f"创建 'ERROR_ENTRY' 字典值 (for PAYROLL_ENTRY_STATUS): {response.status_code}")
        if response.status_code == 201:
            try:
                self.error_payroll_entry_status_id = response.json()["data"]["id"]
                print(f"  字典值 'ERROR_ENTRY' ID: {self.error_payroll_entry_status_id}")
            except (KeyError, TypeError) as e:
                print(f"  解析 'ERROR_ENTRY' 字典值ID失败: {e}. 响应: {response.text}")
        elif response.status_code == 422:
            print(f"  'ERROR_ENTRY' 字典值可能已存在. 尝试获取现有ID. 响应: {response.text}")
            get_response = self.session.get(f"{self.base_url}/v2/config/lookup-values", 
                                            params={"lookup_type_id": self.payroll_entry_status_lookup_type_id, "code": "ERROR_ENTRY"}) # Search by code
            if get_response.status_code == 200:
                values = get_response.json().get("data", [])
                if values and isinstance(values, list) and len(values) > 0:
                    self.error_payroll_entry_status_id = values[0].get("id")
                    print(f"  已获取现有 'ERROR_ENTRY' 字典值ID: {self.error_payroll_entry_status_id}")
                else: # If not found by code, try by name (less reliable)
                    get_response_name = self.session.get(f"{self.base_url}/v2/config/lookup-values", 
                                            params={"lookup_type_id": self.payroll_entry_status_lookup_type_id, "search": "计算错误"})
                    if get_response_name.status_code == 200:
                        values_name = get_response_name.json().get("data", [])
                        found_value = next((v for v in values_name if v.get("code") == "ERROR_ENTRY"), None)
                        if found_value:
                            self.error_payroll_entry_status_id = found_value.get("id")
                            print(f"  已获取现有 'ERROR_ENTRY' 字典值ID (by name search): {self.error_payroll_entry_status_id}")
            else:
                print(f"  获取现有 'ERROR_ENTRY' 字典值失败: {get_response.status_code}")
        else:
            print(f"  'ERROR_ENTRY' 字典值创建失败. 错误: {response.text}")

        if not hasattr(self, 'error_payroll_entry_status_id') or not self.error_payroll_entry_status_id:
            self.error_payroll_entry_status_id = None

    def run_all_tests(self):
        """运行所有测试"""
        print("开始薪资计算系统测试...")
        
        if not self.login():
            return False
            
        try:
            # First, test basic GET APIs that don't rely on created data
            self.test_calculation_config_apis()
            self.test_attendance_apis()
            
            # Next, create all necessary sample data, including PayrollRun
            self.test_create_sample_data()
            
            # Finally, test APIs that depend on the created PayrollRun ID
            self.test_payroll_calculation_apis()
            
            print("\n✓ 所有测试完成")
            return True
        except Exception as e:
            print(f"\n✗ 测试失败: {e}")
            import traceback
            traceback.print_exc()
            return False

def main():
    """主函数"""
    import argparse
    parser = argparse.ArgumentParser(description="薪资计算API测试")
    parser.add_argument("--base-url", default="http://localhost:8080", help="API基础URL")
    parser.add_argument("--username", default="admin", help="用户名")
    parser.add_argument("--password", default="admin", help="密码")
    
    args = parser.parse_args()
    
    tester = PayrollCalculationTester(args.base_url)
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
