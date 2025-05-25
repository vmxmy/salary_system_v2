#!/usr/bin/env python
"""
v2 API测试脚本 - 使用密码哈希直接生成JWT令牌，然后测试API端点

使用方法:
    python test_v2_api_with_hash.py
    python test_v2_api_with_hash.py --username admin --password-hash '$2b$12$YVBr/QMAoInO9Gfq3efSm.rmZX65hUsPTl2K0jWD0VQ57jfIexBk6'
    python test_v2_api_with_hash.py --base-url http://localhost:8080
    python test_v2_api_with_hash.py --test-all
    python test_v2_api_with_hash.py --categories employees,departments
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
import jwt
from datetime import datetime, timedelta
from pathlib import Path
from dotenv import load_dotenv

# 加载.env文件中的环境变量
env_path = Path(__file__).resolve().parents[2] / '.env'
if env_path.exists():
    print(f"加载环境变量文件: {env_path}")
    load_dotenv(dotenv_path=env_path)
else:
    print(f"警告: 环境变量文件不存在: {env_path}")

# 初始化colorama
init()

class APITesterWithHash:
    def __init__(self, db_url=None, base_url=None, username=None, password_hash=None, jwt_secret=None, jwt_algorithm=None):
        # 确保使用正确的数据库连接参数
        if db_url:
            self.db_url = db_url
        elif os.environ.get("DATABASE_URL"):
            self.db_url = os.environ.get("DATABASE_URL")
        else:
            raise ValueError("数据库连接参数未提供！请设置DATABASE_URL环境变量或通过--db-url参数提供。")

        self.base_url = base_url or os.environ.get("API_BASE_URL", "http://localhost:8080")
        self.username = username or os.environ.get("API_USERNAME", "admin")
        self.password_hash = password_hash or "$2b$12$YVBr/QMAoInO9Gfq3efSm.rmZX65hUsPTl2K0jWD0VQ57jfIexBk6"
        self.jwt_secret = jwt_secret or os.environ.get("JWT_SECRET_KEY", "your_jwt_secret_key_here")
        self.jwt_algorithm = jwt_algorithm or os.environ.get("JWT_ALGORITHM", "HS256")
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

            # 检查数据库版本
            self.db_cursor.execute("SELECT version();")
            version = self.db_cursor.fetchone()['version']
            print(f"数据库版本: {version}")

            # 检查security模式是否存在
            self.db_cursor.execute("""
                SELECT schema_name
                FROM information_schema.schemata
                WHERE schema_name = 'security';
            """)
            schema = self.db_cursor.fetchone()

            if schema:
                print(f"{Fore.GREEN}✓ security模式存在{Style.RESET_ALL}")

                # 检查security.users表是否存在
                self.db_cursor.execute("""
                    SELECT table_name
                    FROM information_schema.tables
                    WHERE table_schema = 'security' AND table_name = 'users';
                """)
                table = self.db_cursor.fetchone()

                if table:
                    print(f"{Fore.GREEN}✓ security.users表存在{Style.RESET_ALL}")

                    # 检查是否存在管理员用户
                    try:
                        self.db_cursor.execute("""
                            SELECT * FROM security.users
                            WHERE username = %s;
                        """, (self.username,))
                        user = self.db_cursor.fetchone()

                        if user:
                            print(f"{Fore.GREEN}✓ 管理员用户存在，ID: {user['id']}{Style.RESET_ALL}")
                            print(f"用户名: {user['username']}")
                            print(f"密码哈希: {user['password_hash']}")
                            print(f"是否激活: {user['is_active']}")

                            # 检查密码哈希是否匹配
                            if user['password_hash'] == self.password_hash:
                                print(f"{Fore.GREEN}✓ 密码哈希匹配{Style.RESET_ALL}")
                            else:
                                print(f"{Fore.YELLOW}⚠ 密码哈希不匹配{Style.RESET_ALL}")
                                print(f"数据库中的密码哈希: {user['password_hash']}")
                                print(f"提供的密码哈希: {self.password_hash}")
                        else:
                            print(f"{Fore.YELLOW}⚠ 管理员用户不存在{Style.RESET_ALL}")
                    except Exception as e:
                        print(f"{Fore.RED}✗ 查询管理员用户时出错: {str(e)}{Style.RESET_ALL}")
                else:
                    print(f"{Fore.YELLOW}⚠ security.users表不存在{Style.RESET_ALL}")
            else:
                print(f"{Fore.YELLOW}⚠ security模式不存在{Style.RESET_ALL}")

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

    def generate_token(self):
        """直接生成JWT令牌"""
        print(f"\n{Fore.CYAN}=== 步骤3: 生成JWT令牌 ==={Style.RESET_ALL}")
        print(f"用户名: {self.username}")
        print(f"密码哈希: {self.password_hash[:10]}...{self.password_hash[-10:]}")

        try:
            # 创建令牌数据
            token_data = {
                "sub": self.username,
                "role": "SUPER_ADMIN",  # 假设用户有SUPER_ADMIN角色
                "exp": datetime.utcnow() + timedelta(minutes=30)  # 30分钟过期
            }

            # 生成JWT令牌
            self.token = jwt.encode(token_data, self.jwt_secret, algorithm=self.jwt_algorithm)

            print(f"{Fore.GREEN}✓ 成功生成JWT令牌{Style.RESET_ALL}")
            print(f"令牌: {self.token[:20]}...{self.token[-20:] if len(self.token) > 40 else self.token}")

            # 设置会话头
            self.session.headers.update({"Authorization": f"Bearer {self.token}"})

            self.auth_success = True
            return True
        except Exception as e:
            print(f"{Fore.RED}✗ 生成JWT令牌失败: {str(e)}{Style.RESET_ALL}")
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
            print(f"{Fore.YELLOW}⚠ 数据库连接失败，但将继续测试{Style.RESET_ALL}")

        # 步骤2: 测试后端服务状态
        server_ok = self.test_server_status()
        if not server_ok:
            print(f"{Fore.RED}✗ 后端服务未正常运行，无法继续测试{Style.RESET_ALL}")
            return False

        # 步骤3: 生成JWT令牌
        auth_ok = self.generate_token()
        if not auth_ok:
            print(f"{Fore.RED}✗ 生成JWT令牌失败，无法继续测试{Style.RESET_ALL}")
            return False

        # 步骤4: 测试API端点
        api_ok = self.test_api_endpoints(categories)

        # 打印综合测试结果
        print(f"\n{Fore.CYAN}综合测试结果:{Style.RESET_ALL}")
        print(f"数据库连接: {'成功' if db_ok else '失败'}")
        print(f"后端服务状态: {'正常' if server_ok else '异常'}")
        print(f"JWT令牌生成: {'成功' if auth_ok else '失败'}")
        print(f"API端点测试: {'部分成功' if api_ok else '全部失败'}")

        return server_ok and auth_ok and api_ok

def main():
    parser = argparse.ArgumentParser(description="v2 API测试脚本 - 使用密码哈希直接生成JWT令牌")
    parser.add_argument("--db-url", help="数据库URL", default=os.environ.get("DATABASE_URL"))
    parser.add_argument("--base-url", help="API基础URL", default=os.environ.get("API_BASE_URL", "http://localhost:8080"))
    parser.add_argument("--username", help="用户名", default=os.environ.get("API_USERNAME", "admin"))
    parser.add_argument("--password-hash", help="密码哈希", default="$2b$12$YVBr/QMAoInO9Gfq3efSm.rmZX65hUsPTl2K0jWD0VQ57jfIexBk6")
    parser.add_argument("--jwt-secret", help="JWT密钥", default=os.environ.get("JWT_SECRET_KEY", "your_jwt_secret_key_here"))
    parser.add_argument("--jwt-algorithm", help="JWT算法", default=os.environ.get("JWT_ALGORITHM", "HS256"))
    parser.add_argument("--test-all", action="store_true", help="测试所有API端点")
    parser.add_argument("--categories", help="要测试的API分类，逗号分隔")

    args = parser.parse_args()

    # 确保使用正确的数据库连接参数
    db_url_to_use = args.db_url
    if not db_url_to_use:
        db_url_to_use = os.environ.get("DATABASE_URL")

    if not db_url_to_use:
        print(f"{Fore.RED}错误: 数据库连接参数未提供！请设置DATABASE_URL环境变量或通过--db-url参数提供。{Style.RESET_ALL}")
        sys.exit(1)

    tester = APITesterWithHash(
        db_url=db_url_to_use,
        base_url=args.base_url,
        username=args.username,
        password_hash=args.password_hash,
        jwt_secret=args.jwt_secret,
        jwt_algorithm=args.jwt_algorithm
    )

    if args.test_all or args.categories:
        success = tester.run_all_tests(args.categories)
    else:
        # 默认只测试数据库连接、后端服务状态和JWT令牌生成
        db_ok = tester.test_db_connection()
        server_ok = tester.test_server_status()
        if server_ok:
            auth_ok = tester.generate_token()
            success = server_ok and auth_ok
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
