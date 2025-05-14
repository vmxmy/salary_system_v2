#!/usr/bin/env python
"""
v2认证接口诊断脚本 - 用于诊断v2版本的认证接口问题

使用方法:
    python diagnose_v2_auth.py
    python diagnose_v2_auth.py --username admin --password admin
    python diagnose_v2_auth.py --base-url http://localhost:8080
"""

import argparse
import json
import os
import sys
import traceback
import requests
from colorama import init, Fore, Style
import time

# 初始化colorama
init()

def check_server_status(base_url):
    """检查服务器状态"""
    print(f"{Fore.CYAN}检查服务器状态...{Style.RESET_ALL}")
    try:
        response = requests.get(f"{base_url}/")
        if response.status_code == 200:
            print(f"{Fore.GREEN}✓ 服务器正常运行，状态码: {response.status_code}{Style.RESET_ALL}")
            return True
        else:
            print(f"{Fore.YELLOW}⚠ 服务器返回非200状态码: {response.status_code}{Style.RESET_ALL}")
            return False
    except requests.exceptions.ConnectionError:
        print(f"{Fore.RED}✗ 无法连接到服务器: {base_url}{Style.RESET_ALL}")
        return False
    except Exception as e:
        print(f"{Fore.RED}✗ 检查服务器状态时发生错误: {str(e)}{Style.RESET_ALL}")
        return False

def check_v2_token_endpoint(base_url):
    """检查v2 token端点是否存在"""
    print(f"{Fore.CYAN}检查v2 token端点...{Style.RESET_ALL}")
    try:
        # 使用OPTIONS请求检查端点是否存在
        response = requests.options(f"{base_url}/v2/token")
        if response.status_code < 400:
            print(f"{Fore.GREEN}✓ v2 token端点存在，状态码: {response.status_code}{Style.RESET_ALL}")
            return True
        else:
            print(f"{Fore.RED}✗ v2 token端点不存在，状态码: {response.status_code}{Style.RESET_ALL}")
            return False
    except requests.exceptions.ConnectionError:
        print(f"{Fore.RED}✗ 无法连接到v2 token端点{Style.RESET_ALL}")
        return False
    except Exception as e:
        print(f"{Fore.RED}✗ 检查v2 token端点时发生错误: {str(e)}{Style.RESET_ALL}")
        return False

def test_v2_auth(base_url, username, password):
    """测试v2认证接口"""
    print(f"{Fore.CYAN}测试v2认证接口...{Style.RESET_ALL}")
    try:
        # 发送认证请求
        response = requests.post(
            f"{base_url}/v2/token",
            data={"username": username, "password": password},
            allow_redirects=False  # 不自动跟随重定向
        )
        
        # 打印响应状态码
        print(f"响应状态码: {response.status_code}")
        
        # 检查是否有重定向
        if response.status_code in (301, 302, 303, 307, 308):
            print(f"{Fore.YELLOW}⚠ 请求被重定向到: {response.headers.get('Location')}{Style.RESET_ALL}")
            print("这可能表明服务器配置有问题，或者端点路径不正确")
        
        # 打印响应头
        print(f"{Fore.CYAN}响应头:{Style.RESET_ALL}")
        for header, value in response.headers.items():
            print(f"  {header}: {value}")
        
        # 打印响应内容
        print(f"{Fore.CYAN}响应内容:{Style.RESET_ALL}")
        try:
            response_json = response.json()
            print(json.dumps(response_json, indent=2, ensure_ascii=False))
        except:
            print(response.text)
        
        # 判断认证是否成功
        if response.status_code == 200 and "access_token" in response.json():
            print(f"{Fore.GREEN}✓ 认证成功{Style.RESET_ALL}")
            return True
        else:
            print(f"{Fore.RED}✗ 认证失败{Style.RESET_ALL}")
            return False
    except Exception as e:
        print(f"{Fore.RED}✗ 测试认证接口时发生错误: {str(e)}{Style.RESET_ALL}")
        traceback.print_exc()
        return False

def check_v2_api_endpoints(base_url):
    """检查v2 API的其他端点"""
    print(f"{Fore.CYAN}检查v2 API的其他端点...{Style.RESET_ALL}")
    
    # 要检查的端点列表
    endpoints = [
        "/v2/config/parameters",
        "/v2/employees",
        "/v2/departments",
        "/v2/job-titles",
        "/v2/lookup/types",
        "/v2/payroll-periods",
        "/v2/users"
    ]
    
    results = []
    
    for endpoint in endpoints:
        try:
            print(f"检查端点: {endpoint}")
            response = requests.get(f"{base_url}{endpoint}", params={"page": 1, "size": 1})
            
            if response.status_code < 400:
                print(f"{Fore.GREEN}✓ 端点可访问，状态码: {response.status_code}{Style.RESET_ALL}")
                results.append((endpoint, True, response.status_code))
            else:
                print(f"{Fore.RED}✗ 端点不可访问，状态码: {response.status_code}{Style.RESET_ALL}")
                results.append((endpoint, False, response.status_code))
            
            # 避免请求过快
            time.sleep(0.5)
        except Exception as e:
            print(f"{Fore.RED}✗ 检查端点时发生错误: {str(e)}{Style.RESET_ALL}")
            results.append((endpoint, False, None))
    
    # 打印结果摘要
    print(f"\n{Fore.CYAN}端点检查摘要:{Style.RESET_ALL}")
    for endpoint, success, status_code in results:
        status = f"{Fore.GREEN}✓ 可访问" if success else f"{Fore.RED}✗ 不可访问"
        code = f"状态码: {status_code}" if status_code else "无响应"
        print(f"{endpoint}: {status} ({code}){Style.RESET_ALL}")
    
    # 计算可访问的端点数量
    accessible_count = sum(1 for _, success, _ in results if success)
    print(f"\n可访问端点: {accessible_count}/{len(endpoints)} ({accessible_count/len(endpoints)*100:.2f}%)")
    
    return accessible_count > 0

def diagnose_v2_auth(base_url, username, password):
    """诊断v2认证接口问题"""
    print(f"{Fore.CYAN}开始诊断v2认证接口问题...{Style.RESET_ALL}")
    print(f"基础URL: {base_url}")
    print(f"用户名: {username}")
    print(f"密码: {'*' * len(password)}")
    
    # 步骤1: 检查服务器状态
    server_ok = check_server_status(base_url)
    if not server_ok:
        print(f"{Fore.RED}✗ 服务器不可访问，请检查服务器是否正在运行{Style.RESET_ALL}")
        return False
    
    # 步骤2: 检查v2 token端点
    token_endpoint_ok = check_v2_token_endpoint(base_url)
    if not token_endpoint_ok:
        print(f"{Fore.RED}✗ v2 token端点不可访问，请检查API路由配置{Style.RESET_ALL}")
    
    # 步骤3: 测试v2认证接口
    auth_ok = test_v2_auth(base_url, username, password)
    
    # 步骤4: 检查v2 API的其他端点
    other_endpoints_ok = check_v2_api_endpoints(base_url)
    
    # 诊断结果
    print(f"\n{Fore.CYAN}诊断结果:{Style.RESET_ALL}")
    print(f"服务器状态: {'正常' if server_ok else '异常'}")
    print(f"v2 token端点: {'可访问' if token_endpoint_ok else '不可访问'}")
    print(f"v2认证接口: {'正常' if auth_ok else '异常'}")
    print(f"v2 API其他端点: {'部分可访问' if other_endpoints_ok else '全部不可访问'}")
    
    if not auth_ok:
        print(f"\n{Fore.YELLOW}可能的问题:{Style.RESET_ALL}")
        if not token_endpoint_ok:
            print("1. v2 token端点未正确配置或注册")
            print("   - 检查webapp/v2/routers/auth.py文件")
            print("   - 检查webapp/main.py中是否正确注册了v2_auth_router")
        else:
            print("1. 用户名或密码不正确")
            print("2. 数据库连接问题")
            print("3. 认证逻辑错误")
            print("4. bcrypt版本问题（根据错误日志）")
        
        print(f"\n{Fore.YELLOW}建议的解决方案:{Style.RESET_ALL}")
        print("1. 检查服务器日志以获取更详细的错误信息")
        print("2. 确认数据库连接字符串是否正确")
        print("3. 确认用户表中是否存在指定的用户")
        print("4. 检查bcrypt库的版本，可能需要更新或降级")
        print("5. 尝试使用不需要认证的API端点进行测试")
    
    return auth_ok

def main():
    parser = argparse.ArgumentParser(description="v2认证接口诊断脚本")
    parser.add_argument("--base-url", help="API基础URL", default=os.environ.get("API_BASE_URL", "http://localhost:8080"))
    parser.add_argument("--username", help="API用户名", default=os.environ.get("API_USERNAME", "admin"))
    parser.add_argument("--password", help="API密码", default=os.environ.get("API_PASSWORD", "admin"))
    
    args = parser.parse_args()
    
    # 诊断v2认证接口问题
    success = diagnose_v2_auth(args.base_url, args.username, args.password)
    
    # 设置退出码
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n{Fore.YELLOW}诊断被用户中断{Style.RESET_ALL}")
        sys.exit(1)
    except Exception as e:
        print(f"\n{Fore.RED}发生错误: {str(e)}{Style.RESET_ALL}")
        traceback.print_exc()
        sys.exit(1)
