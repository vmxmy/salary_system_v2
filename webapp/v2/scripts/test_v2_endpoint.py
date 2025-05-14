#!/usr/bin/env python
"""
v2 API端点测试脚本 - 用于测试v2版本的特定API端点，不依赖于认证

使用方法:
    python test_v2_endpoint.py --endpoint /v2/config/parameters
    python test_v2_endpoint.py --endpoint /v2/employees --method POST --data '{"employee_code": "E001", "first_name": "John", "last_name": "Doe"}'
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

def test_endpoint(base_url, endpoint, method="GET", params=None, data=None, debug=False):
    """测试特定API端点"""
    print(f"{Fore.CYAN}测试API端点...{Style.RESET_ALL}")
    print(f"基础URL: {base_url}")
    print(f"端点: {endpoint}")
    print(f"方法: {method}")
    if params:
        print(f"参数: {json.dumps(params, ensure_ascii=False)}")
    if data:
        print(f"数据: {json.dumps(data, ensure_ascii=False)}")
    
    # 创建会话
    session = requests.Session()
    
    # 构建请求URL
    url = f"{base_url}{endpoint}"
    
    print(f"\n{Fore.CYAN}发送请求:{Style.RESET_ALL}")
    print(f"URL: {url}")
    
    try:
        # 发送请求
        if method == "GET":
            response = session.get(url, params=params)
        elif method == "POST":
            response = session.post(url, json=data)
        elif method == "PUT":
            response = session.put(url, json=data)
        elif method == "DELETE":
            response = session.delete(url)
        else:
            print(f"{Fore.RED}✗ 不支持的HTTP方法: {method}{Style.RESET_ALL}")
            return False
        
        # 打印响应状态码
        status_color = Fore.GREEN if 200 <= response.status_code < 300 else Fore.RED
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
        except:
            print(response.text)
            print(f"\n{Fore.YELLOW}⚠ 无法解析JSON响应{Style.RESET_ALL}")
        
        # 判断请求是否成功
        if 200 <= response.status_code < 300:
            print(f"\n{Fore.GREEN}✓ 请求成功{Style.RESET_ALL}")
            return True
        else:
            print(f"\n{Fore.RED}✗ 请求失败{Style.RESET_ALL}")
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
    parser = argparse.ArgumentParser(description="v2 API端点测试脚本")
    parser.add_argument("--base-url", help="API基础URL", default=os.environ.get("API_BASE_URL", "http://localhost:8080"))
    parser.add_argument("--endpoint", help="API端点路径", required=True)
    parser.add_argument("--method", help="HTTP方法", choices=["GET", "POST", "PUT", "DELETE"], default="GET")
    parser.add_argument("--params", help="查询参数 (JSON格式)")
    parser.add_argument("--data", help="请求体数据 (JSON格式)")
    parser.add_argument("--debug", action="store_true", help="启用调试模式")
    
    args = parser.parse_args()
    
    # 解析JSON参数
    params = None
    if args.params:
        try:
            params = json.loads(args.params)
        except json.JSONDecodeError:
            print(f"{Fore.RED}✗ 无效的JSON参数: {args.params}{Style.RESET_ALL}")
            sys.exit(1)
    
    # 解析JSON数据
    data = None
    if args.data:
        try:
            data = json.loads(args.data)
        except json.JSONDecodeError:
            print(f"{Fore.RED}✗ 无效的JSON数据: {args.data}{Style.RESET_ALL}")
            sys.exit(1)
    
    # 测试API端点
    success = test_endpoint(args.base_url, args.endpoint, args.method, params, data, args.debug)
    
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
