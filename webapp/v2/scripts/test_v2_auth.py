#!/usr/bin/env python
"""
v2认证接口测试脚本 - 专门用于测试v2版本的认证接口

使用方法:
    python test_v2_auth.py
    python test_v2_auth.py --username admin --password admin
    python test_v2_auth.py --base-url http://localhost:8080
"""

import argparse
import json
import os
import sys
import traceback
import requests
from colorama import init, Fore, Style

# 初始化colorama
init()

def test_v2_auth(base_url, username, password, debug=False):
    """测试v2认证接口"""
    print(f"{Fore.CYAN}测试v2认证接口...{Style.RESET_ALL}")
    print(f"基础URL: {base_url}")
    print(f"用户名: {username}")
    print(f"密码: {'*' * len(password)}")
    
    # 创建会话
    session = requests.Session()
    
    # 构建请求URL和数据
    url = f"{base_url}/v2/token"
    data = {"username": username, "password": password}
    
    print(f"\n{Fore.CYAN}发送请求:{Style.RESET_ALL}")
    print(f"URL: {url}")
    print(f"数据: {json.dumps(data, ensure_ascii=False)}")
    
    try:
        # 发送请求
        response = session.post(url, data=data)
        
        # 打印响应状态码
        status_color = Fore.GREEN if response.status_code == 200 else Fore.RED
        print(f"\n{status_color}响应状态码: {response.status_code}{Style.RESET_ALL}")
        
        # 打印响应头
        print(f"\n{Fore.CYAN}响应头:{Style.RESET_ALL}")
        for header, value in response.headers.items():
            print(f"  {header}: {value}")
        
        # 打印响应内容
        print(f"\n{Fore.CYAN}响应内容:{Style.RESET_ALL}")
        try:
            response_json = response.json()
            print(json.dumps(response_json, indent=2, ensure_ascii=False))
            
            # 检查是否成功获取令牌
            if response.status_code == 200 and "access_token" in response_json:
                print(f"\n{Fore.GREEN}✓ 认证成功，获取到JWT令牌{Style.RESET_ALL}")
                return True
            else:
                print(f"\n{Fore.RED}✗ 认证失败，未获取到有效的JWT令牌{Style.RESET_ALL}")
                return False
        except:
            print(response.text)
            print(f"\n{Fore.RED}✗ 无法解析JSON响应{Style.RESET_ALL}")
            return False
    
    except requests.exceptions.ConnectionError as e:
        print(f"\n{Fore.RED}✗ 连接错误: 无法连接到服务器 {url}{Style.RESET_ALL}")
        print(f"详细错误: {str(e)}")
        if debug:
            traceback.print_exc()
        return False
    except Exception as e:
        print(f"\n{Fore.RED}✗ 未知错误: {str(e)}{Style.RESET_ALL}")
        if debug:
            traceback.print_exc()
        return False

def main():
    parser = argparse.ArgumentParser(description="v2认证接口测试脚本")
    parser.add_argument("--base-url", help="API基础URL", default=os.environ.get("API_BASE_URL", "http://localhost:8080"))
    parser.add_argument("--username", help="API用户名", default=os.environ.get("API_USERNAME", "admin"))
    parser.add_argument("--password", help="API密码", default=os.environ.get("API_PASSWORD", "admin"))
    parser.add_argument("--debug", action="store_true", help="启用调试模式")
    
    args = parser.parse_args()
    
    # 测试v2认证接口
    success = test_v2_auth(args.base_url, args.username, args.password, args.debug)
    
    # 设置退出码
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
