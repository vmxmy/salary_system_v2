#!/usr/bin/env python
"""
API测试脚本 - 用于测试v2版本的API接口

使用方法:
    python api_tester.py --endpoint /v2/employees --method GET
    python api_tester.py --endpoint /v2/employees/1 --method GET
    python api_tester.py --endpoint /v2/employees --method POST --data '{"employee_code": "E001", "first_name": "John", "last_name": "Doe", "hire_date": "2023-01-01"}'
    python api_tester.py --endpoint /v2/employees/1 --method PUT --data '{"first_name": "Jane"}'
    python api_tester.py --endpoint /v2/employees/1 --method DELETE
    python api_tester.py --list-endpoints
    python api_tester.py --test-all

依赖:
    - requests: 用于发送HTTP请求
    - tabulate: 用于格式化输出表格
    - colorama: 用于彩色输出

如果没有安装这些依赖，请运行:
    pip install requests tabulate colorama
"""

import argparse
import json
import os
import sys
import time
from datetime import datetime
import traceback

try:
    import requests
    from tabulate import tabulate
    from colorama import init, Fore, Style
    init()  # 初始化colorama
except ImportError:
    print("缺少必要的依赖，请运行: pip install requests tabulate colorama")
    sys.exit(1)

# API端点配置
API_ENDPOINTS = {
    # 员工相关API
    "employees": {
        "GET": {
            "url": "/v2/employees",
            "description": "获取员工列表",
            "params": {"page": 1, "size": 10}
        },
        "GET_ONE": {
            "url": "/v2/employees/{id}",
            "description": "获取单个员工",
            "params": {}
        },
        "POST": {
            "url": "/v2/employees",
            "description": "创建员工",
            "data": {
                "employee_code": "E001",
                "first_name": "John",
                "last_name": "Doe",
                "hire_date": "2023-01-01",
                "status_lookup_value_id": 1,
                "date_of_birth": "1990-01-01",
                "gender_lookup_value_id": 1,
                "id_number": "123456789",
                "nationality": "中国",
                "email": "john.doe@example.com",
                "phone_number": "13800138000"
            }
        },
        "PUT": {
            "url": "/v2/employees/{id}",
            "description": "更新员工",
            "data": {
                "first_name": "Jane"
            }
        },
        "DELETE": {
            "url": "/v2/employees/{id}",
            "description": "删除员工",
            "params": {}
        }
    },
    # 部门相关API
    "departments": {
        "GET": {
            "url": "/v2/departments",
            "description": "获取部门列表",
            "params": {"page": 1, "size": 10}
        },
        "GET_ONE": {
            "url": "/v2/departments/{id}",
            "description": "获取单个部门",
            "params": {}
        },
        "POST": {
            "url": "/v2/departments",
            "description": "创建部门",
            "data": {
                "code": "D001",
                "name": "IT部门",
                "effective_date": "2023-01-01"
            }
        },
        "PUT": {
            "url": "/v2/departments/{id}",
            "description": "更新部门",
            "data": {
                "name": "技术部门"
            }
        },
        "DELETE": {
            "url": "/v2/departments/{id}",
            "description": "删除部门",
            "params": {}
        }
    },
    # 职位相关API
    "job_titles": {
        "GET": {
            "url": "/v2/job-titles",
            "description": "获取职位列表",
            "params": {"page": 1, "size": 10}
        },
        "GET_ONE": {
            "url": "/v2/job-titles/{id}",
            "description": "获取单个职位",
            "params": {}
        },
        "POST": {
            "url": "/v2/job-titles",
            "description": "创建职位",
            "data": {
                "code": "JT001",
                "name": "软件工程师",
                "effective_date": "2023-01-01"
            }
        },
        "PUT": {
            "url": "/v2/job-titles/{id}",
            "description": "更新职位",
            "data": {
                "name": "高级软件工程师"
            }
        },
        "DELETE": {
            "url": "/v2/job-titles/{id}",
            "description": "删除职位",
            "params": {}
        }
    },
    # 查找值相关API
    "lookup": {
        "GET_TYPES": {
            "url": "/v2/lookup/types",
            "description": "获取查找类型列表",
            "params": {"page": 1, "size": 10}
        },
        "GET_TYPE": {
            "url": "/v2/lookup/types/{id}",
            "description": "获取单个查找类型",
            "params": {}
        },
        "POST_TYPE": {
            "url": "/v2/lookup/types",
            "description": "创建查找类型",
            "data": {
                "code": "GENDER_TEST_2",
                "name": "性别测试2",
                "description": "性别测试描述2"
            }
        },
        "GET_VALUES": {
            "url": "/v2/lookup/values",
            "description": "获取查找值列表",
            "params": {"page": 1, "size": 10}
        },
        "GET_VALUE": {
            "url": "/v2/lookup/values/{id}",
            "description": "获取单个查找值",
            "params": {}
        },
        "POST_VALUE": {
            "url": "/v2/lookup/values",
            "description": "创建查找值",
            "data": {
                "lookup_type_id": 1,
                "code": "M_TEST_2",
                "name": "男测试2",
                "description": "男性测试描述2",
                "sort_order": 0,
                "is_active": True
            }
        }
    },
    # 配置相关API
    "config": {
        "GET_PARAMS": {
            "url": "/v2/config/parameters",
            "description": "获取系统参数列表",
            "params": {"page": 1, "size": 10}
        },
        "GET_PARAM": {
            "url": "/v2/config/parameters/{id}",
            "description": "获取单个系统参数",
            "params": {}
        },
        "POST_PARAM": {
            "url": "/v2/config/parameters",
            "description": "创建系统参数",
            "data": {
                "key": "DEFAULT_LANGUAGE_TEST_2",
                "value": "zh-CN",
                "description": "默认语言测试2"
            }
        },
        "GET_COMPONENTS": {
            "url": "/v2/config/payroll-components",
            "description": "获取工资组件列表",
            "params": {"page": 1, "size": 10}
        },
        "GET_TAX_BRACKETS": {
            "url": "/v2/config/tax-brackets",
            "description": "获取税率档位列表",
            "params": {"page": 1, "size": 10}
        },
        "GET_SOCIAL_RATES": {
            "url": "/v2/config/social-security-rates",
            "description": "获取社保费率列表",
            "params": {"page": 1, "size": 10}
        }
    },
    # 工资相关API
    "payroll": {
        "GET_PERIODS": {
            "url": "/v2/payroll-periods",
            "description": "获取工资周期列表",
            "params": {"page": 1, "size": 10}
        },
        "GET_PERIOD": {
            "url": "/v2/payroll-periods/{id}",
            "description": "获取单个工资周期",
            "params": {}
        },
        "POST_PERIOD": {
            "url": "/v2/payroll-periods",
            "description": "创建工资周期",
            "data": {
                "name": "2023-02-TEST",
                "start_date": "2023-02-01",
                "end_date": "2023-02-28",
                "pay_date": "2023-03-05",
                "frequency_lookup_value_id": 1
            }
        },
        "GET_RUNS": {
            "url": "/v2/payroll-runs",
            "description": "获取工资运行批次列表",
            "params": {"page": 1, "size": 10}
        },
        "GET_ENTRIES": {
            "url": "/v2/payroll-entries",
            "description": "获取工资明细列表",
            "params": {"page": 1, "size": 10}
        }
    },
    # 安全相关API
    "security": {
        "GET_USERS": {
            "url": "/v2/users",
            "description": "获取用户列表",
            "params": {"page": 1, "size": 10}
        },
        "GET_USER": {
            "url": "/v2/users/{id}",
            "description": "获取单个用户",
            "params": {}
        },
        "POST_USER": {
            "url": "/v2/users",
            "description": "创建用户",
            "data": {
                "username": "testuser3",
                "password": "password123",
                "employee_id": None,
                "is_active": True
            }
        },
        "GET_ROLES": {
            "url": "/v2/roles",
            "description": "获取角色列表",
            "params": {"page": 1, "size": 10}
        },
        "GET_PERMISSIONS": {
            "url": "/v2/permissions",
            "description": "获取权限列表",
            "params": {"page": 1, "size": 10}
        }
    }
}

class APITester:
    def __init__(self, base_url=None, username=None, password=None):
        self.base_url = base_url or os.environ.get("API_BASE_URL", "http://localhost:8080")
        self.username = username or os.environ.get("API_USERNAME", "admin")
        self.password = password or os.environ.get("API_PASSWORD", "admin")
        self.token = None
        self.session = requests.Session()
        self.results = []

    def login(self):
        """获取JWT令牌"""
        try:
            # 只使用v2版本的认证接口
            print(f"{Fore.CYAN}尝试使用v2认证接口登录...{Style.RESET_ALL}")
            response = self.session.post(
                f"{self.base_url}/v2/token",
                data={"username": self.username, "password": self.password}
            )

            # 打印详细的请求和响应信息，用于调试
            print(f"请求URL: {self.base_url}/v2/token")
            print(f"请求数据: username={self.username}, password={'*' * len(self.password)}")
            print(f"响应状态码: {response.status_code}")

            try:
                response_json = response.json()
                print(f"响应JSON: {json.dumps(response_json, indent=2, ensure_ascii=False)}")
            except:
                print(f"响应内容: {response.text}")

            if response.status_code == 200:
                self.token = response.json().get("access_token")
                self.session.headers.update({"Authorization": f"Bearer {self.token}"})
                print(f"{Fore.GREEN}✓ 登录成功，获取到JWT令牌{Style.RESET_ALL}")
                return True
            else:
                # 详细分析错误原因
                error_message = f"登录失败: {response.status_code}"

                if response.status_code == 500:
                    error_message += " - 服务器内部错误，请检查服务器日志"
                elif response.status_code == 401:
                    error_message += " - 认证失败，请检查用户名和密码"
                elif response.status_code == 404:
                    error_message += " - 认证接口不存在，请检查API路由配置"
                elif response.status_code == 307:
                    error_message += f" - 临时重定向到 {response.headers.get('Location', '未知位置')}"

                try:
                    error_message += f"\n响应内容: {response.text}"
                except:
                    pass

                print(f"{Fore.RED}✗ {error_message}{Style.RESET_ALL}")
                return False
        except requests.exceptions.ConnectionError as e:
            print(f"{Fore.RED}✗ 连接错误: 无法连接到服务器 {self.base_url}{Style.RESET_ALL}")
            print(f"详细错误: {str(e)}")
            return False
        except Exception as e:
            print(f"{Fore.RED}✗ 登录异常: {str(e)}{Style.RESET_ALL}")
            print(f"异常类型: {type(e).__name__}")
            traceback.print_exc()
            return False

    def send_request(self, endpoint, method="GET", params=None, data=None, id_value=None):
        """发送API请求"""
        url = f"{self.base_url}{endpoint}"
        if id_value and "{id}" in url:
            url = url.replace("{id}", str(id_value))

        headers = {"Content-Type": "application/json"}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"

        # 打印请求信息
        print(f"请求URL: {url}")
        print(f"请求方法: {method}")
        if params:
            print(f"请求参数: {json.dumps(params, ensure_ascii=False)}")
        if data:
            print(f"请求数据: {json.dumps(data, ensure_ascii=False)}")
        print(f"请求头: {json.dumps({k: v if k != 'Authorization' else '***' for k, v in headers.items()}, ensure_ascii=False)}")

        start_time = time.time()
        try:
            if method == "GET":
                response = self.session.get(url, params=params, headers=headers)
            elif method == "POST":
                response = self.session.post(url, json=data, headers=headers)
            elif method == "PUT":
                response = self.session.put(url, json=data, headers=headers)
            elif method == "DELETE":
                response = self.session.delete(url, headers=headers)
            else:
                raise ValueError(f"不支持的HTTP方法: {method}")

            elapsed_time = time.time() - start_time

            # 打印响应头信息
            if response.status_code >= 300:
                print(f"{Fore.YELLOW}响应头信息:{Style.RESET_ALL}")
                for header, value in response.headers.items():
                    print(f"  {header}: {value}")

            return response, elapsed_time
        except requests.exceptions.ConnectionError as e:
            elapsed_time = time.time() - start_time
            print(f"{Fore.RED}✗ 连接错误: 无法连接到服务器 {url}{Style.RESET_ALL}")
            print(f"详细错误: {str(e)}")
            return None, elapsed_time
        except requests.exceptions.Timeout as e:
            elapsed_time = time.time() - start_time
            print(f"{Fore.RED}✗ 请求超时: {url}{Style.RESET_ALL}")
            print(f"详细错误: {str(e)}")
            return None, elapsed_time
        except requests.exceptions.RequestException as e:
            elapsed_time = time.time() - start_time
            print(f"{Fore.RED}✗ 请求异常: {str(e)}{Style.RESET_ALL}")
            print(f"异常类型: {type(e).__name__}")
            return None, elapsed_time
        except Exception as e:
            elapsed_time = time.time() - start_time
            print(f"{Fore.RED}✗ 未知异常: {str(e)}{Style.RESET_ALL}")
            print(f"异常类型: {type(e).__name__}")
            traceback.print_exc()
            return None, elapsed_time

    def test_endpoint(self, endpoint, method="GET", params=None, data=None, id_value=None, description=None):
        """测试单个API端点"""
        print(f"\n{Fore.CYAN}测试: {method} {endpoint}{Style.RESET_ALL}")
        if description:
            print(f"{Fore.CYAN}描述: {description}{Style.RESET_ALL}")

        response, elapsed_time = self.send_request(endpoint, method, params, data, id_value)
        result = {
            "endpoint": endpoint,
            "method": method,
            "description": description,
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "elapsed_time": elapsed_time
        }

        if response:
            result["status_code"] = response.status_code
            try:
                result["response"] = response.json()
            except:
                result["response"] = response.text

            # 打印响应信息
            status_color = Fore.GREEN if 200 <= response.status_code < 300 else Fore.RED
            print(f"{status_color}状态码: {response.status_code}{Style.RESET_ALL}")
            print(f"响应时间: {elapsed_time:.4f}秒")

            # 打印响应内容（格式化JSON）
            try:
                print("响应内容:")
                formatted_json = json.dumps(response.json(), indent=2, ensure_ascii=False)
                print(formatted_json)
            except:
                print(f"响应内容: {response.text}")
        else:
            result["status_code"] = None
            result["response"] = None
            print(f"{Fore.RED}请求失败，无响应{Style.RESET_ALL}")

        self.results.append(result)
        return result

    def list_endpoints(self):
        """列出所有可用的API端点"""
        print(f"\n{Fore.CYAN}可用的API端点:{Style.RESET_ALL}")

        table_data = []
        for category, endpoints in API_ENDPOINTS.items():
            for method_key, endpoint_info in endpoints.items():
                method = method_key.split("_")[0] if "_" in method_key else method_key
                url = endpoint_info["url"]
                description = endpoint_info.get("description", "")
                table_data.append([category, method, url, description])

        print(tabulate(table_data, headers=["分类", "方法", "URL", "描述"], tablefmt="grid"))

    def test_all_endpoints(self, categories=None):
        """测试所有API端点或指定分类的端点"""
        # 尝试登录，但即使失败也继续测试
        login_success = self.login()
        if not login_success:
            print(f"{Fore.YELLOW}⚠ 登录失败，将继续测试不需要认证的端点...{Style.RESET_ALL}")

        if categories:
            categories = categories.split(",")
            filtered_endpoints = {k: v for k, v in API_ENDPOINTS.items() if k in categories}
        else:
            filtered_endpoints = API_ENDPOINTS

        total_tests = 0
        passed_tests = 0
        skipped_tests = 0

        # 创建列表存储失败和跳过的测试信息
        failed_tests = []
        skipped_tests_info = []

        for category, endpoints in filtered_endpoints.items():
            print(f"\n{Fore.YELLOW}测试分类: {category}{Style.RESET_ALL}")

            for method_key, endpoint_info in endpoints.items():
                total_tests += 1
                method = method_key.split("_")[0] if "_" in method_key else method_key
                url = endpoint_info["url"]
                params = endpoint_info.get("params", {})
                data = endpoint_info.get("data", {})
                description = endpoint_info.get("description", "")

                # 如果URL包含{id}，则需要先获取一个有效的ID
                id_value = None
                if "{id}" in url:
                    # 尝试获取列表，然后取第一个项目的ID
                    list_url = url.split("/{id}")[0]
                    list_response, _ = self.send_request(list_url, "GET", {"page": 1, "size": 1})
                    if list_response and list_response.status_code == 200:
                        try:
                            response_data = list_response.json()
                            if "data" in response_data and len(response_data["data"]) > 0:
                                id_value = response_data["data"][0]["id"]
                            else:
                                skip_reason = f"无法获取有效的ID，跳过测试: {method} {url}"
                                print(f"{Fore.YELLOW}⚠ {skip_reason}{Style.RESET_ALL}")
                                skipped_tests += 1
                                skipped_tests_info.append(f"{method} {url} - {skip_reason}")
                                continue
                        except:
                            skip_reason = f"无法解析响应获取ID，跳过测试: {method} {url}"
                            print(f"{Fore.YELLOW}⚠ {skip_reason}{Style.RESET_ALL}")
                            skipped_tests += 1
                            skipped_tests_info.append(f"{method} {url} - {skip_reason}")
                            continue
                    else:
                        skip_reason = f"无法获取列表数据，跳过测试: {method} {url}"
                        print(f"{Fore.YELLOW}⚠ {skip_reason}{Style.RESET_ALL}")
                        skipped_tests += 1
                        skipped_tests_info.append(f"{method} {url} - {skip_reason}")
                        continue

                result = self.test_endpoint(url, method, params, data, id_value, description)
                if result["status_code"] and 200 <= result["status_code"] < 300:
                    passed_tests += 1
                else:
                    # 添加失败的测试信息
                    fail_reason = f"状态码: {result.get('status_code', 'N/A')}"
                    failed_tests.append(f"{method} {url} - {fail_reason}")

        # 创建汇总字符串
        failed_tests_summary = "\n".join(failed_tests) if failed_tests else "无"
        skipped_tests_summary = "\n".join(skipped_tests_info) if skipped_tests_info else "无"

        # 创建测试摘要字符串
        summary = f"""
测试摘要:
总测试数: {total_tests}
通过测试: {passed_tests}
失败测试: {total_tests - passed_tests - skipped_tests}
跳过测试: {skipped_tests}
通过率: {passed_tests / (total_tests - skipped_tests) * 100:.2f}% (不包括跳过的测试)

失败的测试:
{failed_tests_summary}

跳过的测试:
{skipped_tests_summary}
"""

        # 打印测试摘要
        print(f"\n{Fore.CYAN}测试摘要:{Style.RESET_ALL}")
        print(f"总测试数: {total_tests}")
        print(f"通过测试: {passed_tests}")
        print(f"失败测试: {total_tests - passed_tests - skipped_tests}")
        print(f"跳过测试: {skipped_tests}")
        if total_tests > 0:
            print(f"通过率: {passed_tests / (total_tests - skipped_tests) * 100:.2f}% (不包括跳过的测试)")
        else:
            print("通过率: 0% (没有执行任何测试)")

        # 打印失败和跳过的测试详情
        if failed_tests:
            print(f"\n{Fore.RED}失败的测试详情:{Style.RESET_ALL}")
            for i, test in enumerate(failed_tests, 1):
                print(f"{i}. {test}")

        if skipped_tests_info:
            print(f"\n{Fore.YELLOW}跳过的测试详情:{Style.RESET_ALL}")
            for i, test in enumerate(skipped_tests_info, 1):
                print(f"{i}. {test}")

        # 返回测试摘要字符串
        return summary

    def generate_report(self, output_file=None):
        """生成测试报告"""
        if not self.results:
            print(f"{Fore.YELLOW}⚠ 没有测试结果可以生成报告{Style.RESET_ALL}")
            return

        report = {
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "base_url": self.base_url,
            "total_tests": len(self.results),
            "passed_tests": sum(1 for r in self.results if r["status_code"] and 200 <= r["status_code"] < 300),
            "results": self.results
        }

        if output_file:
            with open(output_file, "w", encoding="utf-8") as f:
                json.dump(report, f, indent=2, ensure_ascii=False)
            print(f"{Fore.GREEN}✓ 测试报告已保存到: {output_file}{Style.RESET_ALL}")

        return report

def main():
    parser = argparse.ArgumentParser(description="API测试脚本")
    parser.add_argument("--base-url", help="API基础URL", default=os.environ.get("API_BASE_URL", "http://localhost:8080"))
    parser.add_argument("--username", help="API用户名", default=os.environ.get("API_USERNAME", "admin"))
    parser.add_argument("--password", help="API密码", default=os.environ.get("API_PASSWORD", "admin"))
    parser.add_argument("--endpoint", help="API端点路径")
    parser.add_argument("--method", help="HTTP方法", choices=["GET", "POST", "PUT", "DELETE"], default="GET")
    parser.add_argument("--params", help="查询参数 (JSON格式)")
    parser.add_argument("--data", help="请求体数据 (JSON格式)")
    parser.add_argument("--id", help="资源ID，用于替换URL中的{id}")
    parser.add_argument("--list-endpoints", action="store_true", help="列出所有可用的API端点")
    parser.add_argument("--test-all", action="store_true", help="测试所有API端点")
    parser.add_argument("--test-auth", action="store_true", help="只测试v2认证接口")
    parser.add_argument("--categories", help="要测试的API分类，逗号分隔")
    parser.add_argument("--report", help="生成测试报告并保存到指定文件")
    parser.add_argument("--debug", action="store_true", help="启用详细调试输出")

    args = parser.parse_args()

    tester = APITester(args.base_url, args.username, args.password)

    if args.list_endpoints:
        tester.list_endpoints()
        return

    if args.test_auth:
        print(f"{Fore.CYAN}仅测试v2认证接口...{Style.RESET_ALL}")
        if tester.login():
            print(f"{Fore.GREEN}✓ v2认证接口测试成功{Style.RESET_ALL}")
        else:
            print(f"{Fore.RED}✗ v2认证接口测试失败{Style.RESET_ALL}")
        return

    if args.test_all:
        summary = tester.test_all_endpoints(args.categories)
        if args.report:
            tester.generate_report(args.report)
        # 将测试摘要保存到变量中，可以在其他地方使用
        test_summary = summary
        return test_summary

    if not args.endpoint:
        parser.print_help()
        return

    # 解析JSON参数
    params = None
    if args.params:
        try:
            params = json.loads(args.params)
        except json.JSONDecodeError:
            print(f"{Fore.RED}✗ 无效的JSON参数: {args.params}{Style.RESET_ALL}")
            return

    # 解析JSON数据
    data = None
    if args.data:
        try:
            data = json.loads(args.data)
        except json.JSONDecodeError:
            print(f"{Fore.RED}✗ 无效的JSON数据: {args.data}{Style.RESET_ALL}")
            return

    # 登录获取令牌
    if not tester.login():
        print(f"{Fore.YELLOW}⚠ 登录失败，尝试不使用认证继续测试...{Style.RESET_ALL}")

    # 测试指定端点
    tester.test_endpoint(args.endpoint, args.method, params, data, args.id)

    # 生成报告
    if args.report:
        tester.generate_report(args.report)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n{Fore.YELLOW}测试被用户中断{Style.RESET_ALL}")
    except Exception as e:
        print(f"\n{Fore.RED}发生错误: {str(e)}{Style.RESET_ALL}")
        traceback.print_exc()
