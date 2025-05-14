#!/usr/bin/env python
"""
综合测试脚本 - 按顺序测试数据库连接、后端服务状态和API接口

使用方法:
    python comprehensive_v2_test.py
    python comprehensive_v2_test.py --db-url postgresql://postgres:password@localhost:5432/salary_system_v2
    python comprehensive_v2_test.py --base-url http://localhost:8080
    python comprehensive_v2_test.py --username admin --password admin
    python comprehensive_v2_test.py --test-all  # 测试所有API端点
    python comprehensive_v2_test.py --categories employees,departments  # 测试特定分类的API端点
"""

import argparse
import json
import os
import sys
import traceback
import time
import requests
import psycopg2
from psycopg2.extras import RealDictCursor
from colorama import init, Fore, Style

# 初始化colorama
init()

class ComprehensiveTester:
    def __init__(self, db_url=None, base_url=None, username=None, password=None):
        self.db_url = db_url or os.environ.get("DATABASE_URL", "postgresql://postgres:810705@localhost:5432/salary_system_v2")
        self.base_url = base_url or os.environ.get("API_BASE_URL", "http://localhost:8080")
        self.username = username or os.environ.get("API_USERNAME", "admin")
        self.password = password or os.environ.get("API_PASSWORD", "admin")
        self.token = None
        self.session = requests.Session()
        self.db_conn = None
        self.db_cursor = None
        
        # 测试结果
        self.db_connected = False
        self.server_running = False
        self.auth_success = False
        self.api_results = []
        
    def test_db_connection(self):
        """测试数据库连接"""
        print(f"\n{Fore.CYAN}=== 步骤1: 测试数据库连接 ==={Style.RESET_ALL}")
        print(f"数据库URL: {self.db_url}")
        
        try:
            # 解析数据库URL
            db_params = {}
            if "://" in self.db_url:
                # 格式: postgresql://user:password@host:port/dbname
                parts = self.db_url.split("://")[1].split("@")
                user_pass = parts[0].split(":")
                host_port_db = parts[1].split("/")
                host_port = host_port_db[0].split(":")
                
                db_params["user"] = user_pass[0]
                db_params["password"] = user_pass[1] if len(user_pass) > 1 else ""
                db_params["host"] = host_port[0]
                db_params["port"] = host_port[1] if len(host_port) > 1 else "5432"
                db_params["dbname"] = host_port_db[1]
            else:
                # 假设是DSN格式: "dbname=mydb user=postgres password=secret"
                db_params = {p.split("=")[0]: p.split("=")[1] for p in self.db_url.split() if "=" in p}
            
            print(f"连接参数: host={db_params.get('host')}, port={db_params.get('port')}, dbname={db_params.get('dbname')}, user={db_params.get('user')}")
            
            # 连接数据库
            start_time = time.time()
            self.db_conn = psycopg2.connect(
                **db_params,
                cursor_factory=RealDictCursor
            )
            self.db_cursor = self.db_conn.cursor()
            elapsed_time = time.time() - start_time
            
            print(f"{Fore.GREEN}✓ 成功连接到数据库 ({elapsed_time:.2f}秒){Style.RESET_ALL}")
            self.db_connected = True
            
            # 检查关键表是否存在
            self.db_cursor.execute("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'security' 
                AND table_name IN ('users', 'roles', 'permissions')
            """)
            tables = self.db_cursor.fetchall()
            table_names = [t['table_name'] for t in tables]
            
            if 'users' in table_names and 'roles' in table_names and 'permissions' in table_names:
                print(f"{Fore.GREEN}✓ 安全模式表存在: {', '.join(table_names)}{Style.RESET_ALL}")
            else:
                missing_tables = [t for t in ['users', 'roles', 'permissions'] if t not in table_names]
                print(f"{Fore.YELLOW}⚠ 部分安全模式表不存在: {', '.join(missing_tables)}{Style.RESET_ALL}")
            
            # 检查是否存在管理员用户
            self.db_cursor.execute("""
                SELECT COUNT(*) as count FROM security.users 
                WHERE username = 'admin'
            """)
            admin_count = self.db_cursor.fetchone()['count']
            
            if admin_count > 0:
                print(f"{Fore.GREEN}✓ 管理员用户存在{Style.RESET_ALL}")
            else:
                print(f"{Fore.YELLOW}⚠ 管理员用户不存在{Style.RESET_ALL}")
            
            # 检查是否存在SUPER_ADMIN角色
            self.db_cursor.execute("""
                SELECT COUNT(*) as count FROM security.roles 
                WHERE name = 'SUPER_ADMIN'
            """)
            role_count = self.db_cursor.fetchone()['count']
            
            if role_count > 0:
                print(f"{Fore.GREEN}✓ SUPER_ADMIN角色存在{Style.RESET_ALL}")
            else:
                print(f"{Fore.YELLOW}⚠ SUPER_ADMIN角色不存在{Style.RESET_ALL}")
            
            return True
            
        except Exception as e:
            print(f"{Fore.RED}✗ 数据库连接失败: {str(e)}{Style.RESET_ALL}")
            traceback.print_exc()
            return False
        
    def test_server_status(self):
        """测试后端服务状态"""
        print(f"\n{Fore.CYAN}=== 步骤2: 测试后端服务状态 ==={Style.RESET_ALL}")
        print(f"服务器URL: {self.base_url}")
        
        try:
            # 测试根端点
            start_time = time.time()
            response = self.session.get(f"{self.base_url}/")
            elapsed_time = time.time() - start_time
            
            if response.status_code == 200:
                print(f"{Fore.GREEN}✓ 服务器正在运行，响应时间: {elapsed_time:.2f}秒{Style.RESET_ALL}")
                self.server_running = True
                
                # 打印服务器信息
                try:
                    response_json = response.json()
                    print(f"服务器信息: {json.dumps(response_json, indent=2, ensure_ascii=False)}")
                except:
                    print(f"服务器响应: {response.text[:100]}...")
                
                return True
            else:
                print(f"{Fore.YELLOW}⚠ 服务器返回非200状态码: {response.status_code}, 响应时间: {elapsed_time:.2f}秒{Style.RESET_ALL}")
                print(f"响应内容: {response.text[:100]}...")
                return False
                
        except requests.exceptions.ConnectionError:
            print(f"{Fore.RED}✗ 无法连接到服务器: {self.base_url}{Style.RESET_ALL}")
            return False
        except Exception as e:
            print(f"{Fore.RED}✗ 测试服务器状态时发生错误: {str(e)}{Style.RESET_ALL}")
            traceback.print_exc()
            return False
    
    def login(self):
        """获取JWT令牌"""
        print(f"\n{Fore.CYAN}=== 步骤3: 测试认证接口 ==={Style.RESET_ALL}")
        print(f"认证URL: {self.base_url}/v2/token")
        print(f"用户名: {self.username}")
        print(f"密码: {'*' * len(self.password)}")
        
        try:
            # 尝试使用v2版本的认证接口
            response = self.session.post(
                f"{self.base_url}/v2/token",
                data={"username": self.username, "password": self.password}
            )
            
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
                self.auth_success = True
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
            traceback.print_exc()
            return False
    
    def test_api_endpoints(self, categories=None):
        """测试API端点"""
        print(f"\n{Fore.CYAN}=== 步骤4: 测试API端点 ==={Style.RESET_ALL}")
        
        # API端点配置
        API_ENDPOINTS = {
            # 员工相关API
            "employees": {
                "GET": {
                    "url": "/v2/employees",
                    "description": "获取员工列表",
                    "params": {"page": 1, "size": 10}
                }
            },
            # 部门相关API
            "departments": {
                "GET": {
                    "url": "/v2/departments",
                    "description": "获取部门列表",
                    "params": {"page": 1, "size": 10}
                }
            },
            # 职位相关API
            "job_titles": {
                "GET": {
                    "url": "/v2/job-titles",
                    "description": "获取职位列表",
                    "params": {"page": 1, "size": 10}
                }
            },
            # 查找值相关API
            "lookup": {
                "GET_TYPES": {
                    "url": "/v2/lookup/types",
                    "description": "获取查找类型列表",
                    "params": {"page": 1, "size": 10}
                }
            },
            # 配置相关API
            "config": {
                "GET_PARAMS": {
                    "url": "/v2/config/parameters",
                    "description": "获取系统参数列表",
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
                "GET_ENTRIES": {
                    "url": "/v2/payroll-entries",
                    "description": "获取工资明细列表",
                    "params": {"page": 1, "size": 10}
                }
            },
            # 安全相关API
            "security": {
                "GET_PERMISSIONS": {
                    "url": "/v2/permissions",
                    "description": "获取权限列表",
                    "params": {"page": 1, "size": 10}
                }
            }
        }
        
        if categories:
            categories = categories.split(",")
            filtered_endpoints = {k: v for k, v in API_ENDPOINTS.items() if k in categories}
        else:
            filtered_endpoints = API_ENDPOINTS
        
        total_tests = 0
        passed_tests = 0
        
        for category, endpoints in filtered_endpoints.items():
            print(f"\n{Fore.YELLOW}测试分类: {category}{Style.RESET_ALL}")
            
            for method_key, endpoint_info in endpoints.items():
                total_tests += 1
                method = method_key.split("_")[0] if "_" in method_key else method_key
                url = endpoint_info["url"]
                params = endpoint_info.get("params", {})
                data = endpoint_info.get("data", {})
                description = endpoint_info.get("description", "")
                
                print(f"\n{Fore.CYAN}测试: {method} {url}{Style.RESET_ALL}")
                if description:
                    print(f"{Fore.CYAN}描述: {description}{Style.RESET_ALL}")
                
                # 发送请求
                try:
                    full_url = f"{self.base_url}{url}"
                    print(f"请求URL: {full_url}")
                    
                    headers = {"Content-Type": "application/json"}
                    if self.token:
                        headers["Authorization"] = f"Bearer {self.token}"
                    
                    start_time = time.time()
                    if method == "GET":
                        response = self.session.get(full_url, params=params, headers=headers)
                    elif method == "POST":
                        response = self.session.post(full_url, json=data, headers=headers)
                    elif method == "PUT":
                        response = self.session.put(full_url, json=data, headers=headers)
                    elif method == "DELETE":
                        response = self.session.delete(full_url, headers=headers)
                    else:
                        raise ValueError(f"不支持的HTTP方法: {method}")
                    
                    elapsed_time = time.time() - start_time
                    
                    # 打印响应信息
                    status_color = Fore.GREEN if 200 <= response.status_code < 300 else Fore.RED
                    print(f"{status_color}状态码: {response.status_code}{Style.RESET_ALL}")
                    print(f"响应时间: {elapsed_time:.4f}秒")
                    
                    # 打印响应内容
                    try:
                        response_json = response.json()
                        print("响应内容:")
                        print(json.dumps(response_json, indent=2, ensure_ascii=False))
                    except:
                        print(f"响应内容: {response.text}")
                    
                    # 记录结果
                    result = {
                        "category": category,
                        "method": method,
                        "url": url,
                        "description": description,
                        "status_code": response.status_code,
                        "elapsed_time": elapsed_time,
                        "success": 200 <= response.status_code < 300
                    }
                    self.api_results.append(result)
                    
                    if result["success"]:
                        passed_tests += 1
                    
                except Exception as e:
                    print(f"{Fore.RED}✗ 请求异常: {str(e)}{Style.RESET_ALL}")
                    self.api_results.append({
                        "category": category,
                        "method": method,
                        "url": url,
                        "description": description,
                        "status_code": None,
                        "elapsed_time": None,
                        "success": False,
                        "error": str(e)
                    })
        
        # 打印测试摘要
        print(f"\n{Fore.CYAN}API测试摘要:{Style.RESET_ALL}")
        print(f"总测试数: {total_tests}")
        print(f"通过测试: {passed_tests}")
        print(f"失败测试: {total_tests - passed_tests}")
        if total_tests > 0:
            print(f"通过率: {passed_tests / total_tests * 100:.2f}%")
        
        return passed_tests > 0
    
    def run_all_tests(self, categories=None):
        """运行所有测试"""
        print(f"{Fore.CYAN}开始综合测试...{Style.RESET_ALL}")
        
        # 步骤1: 测试数据库连接
        db_ok = self.test_db_connection()
        if not db_ok:
            print(f"{Fore.RED}✗ 数据库连接失败，无法继续测试{Style.RESET_ALL}")
            return False
        
        # 步骤2: 测试后端服务状态
        server_ok = self.test_server_status()
        if not server_ok:
            print(f"{Fore.RED}✗ 后端服务未正常运行，无法继续测试{Style.RESET_ALL}")
            return False
        
        # 步骤3: 测试认证接口
        auth_ok = self.login()
        if not auth_ok:
            print(f"{Fore.YELLOW}⚠ 认证失败，将继续测试不需要认证的API端点{Style.RESET_ALL}")
        
        # 步骤4: 测试API端点
        api_ok = self.test_api_endpoints(categories)
        
        # 打印综合测试结果
        print(f"\n{Fore.CYAN}综合测试结果:{Style.RESET_ALL}")
        print(f"数据库连接: {'成功' if db_ok else '失败'}")
        print(f"后端服务状态: {'正常' if server_ok else '异常'}")
        print(f"认证接口: {'成功' if auth_ok else '失败'}")
        print(f"API端点测试: {'部分成功' if api_ok else '全部失败'}")
        
        return db_ok and server_ok and api_ok

def main():
    parser = argparse.ArgumentParser(description="综合测试脚本")
    parser.add_argument("--db-url", help="数据库URL", default=os.environ.get("DATABASE_URL", "postgresql://postgres:810705@localhost:5432/salary_system_v2"))
    parser.add_argument("--base-url", help="API基础URL", default=os.environ.get("API_BASE_URL", "http://localhost:8080"))
    parser.add_argument("--username", help="API用户名", default=os.environ.get("API_USERNAME", "admin"))
    parser.add_argument("--password", help="API密码", default=os.environ.get("API_PASSWORD", "admin"))
    parser.add_argument("--test-all", action="store_true", help="测试所有API端点")
    parser.add_argument("--categories", help="要测试的API分类，逗号分隔")
    
    args = parser.parse_args()
    
    tester = ComprehensiveTester(args.db_url, args.base_url, args.username, args.password)
    
    if args.test_all or args.categories:
        success = tester.run_all_tests(args.categories)
    else:
        # 默认只测试数据库连接和后端服务状态
        db_ok = tester.test_db_connection()
        if db_ok:
            server_ok = tester.test_server_status()
            success = db_ok and server_ok
        else:
            success = False
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n{Fore.YELLOW}测试被用户中断{Style.RESET_ALL}")
        sys.exit(1)
    except Exception as e:
        print(f"\n{Fore.RED}发生错误: {str(e)}{Style.RESET_ALL}")
        traceback.print_exc()
        sys.exit(1)
