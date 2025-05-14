#!/usr/bin/env python
"""
后端服务状态测试脚本 - 用于测试后端服务是否正常运行

使用方法:
    python test_server_status.py
    python test_server_status.py --base-url http://localhost:8080
"""

import argparse
import json
import os
import sys
import traceback
import time
import requests
from colorama import init, Fore, Style

# 初始化colorama
init()

def test_server_status(base_url):
    """测试后端服务状态"""
    print(f"{Fore.CYAN}测试后端服务状态...{Style.RESET_ALL}")
    print(f"服务器URL: {base_url}")
    
    try:
        # 测试根端点
        start_time = time.time()
        response = requests.get(f"{base_url}/")
        elapsed_time = time.time() - start_time
        
        print(f"响应状态码: {response.status_code}")
        print(f"响应时间: {elapsed_time:.2f}秒")
        
        if response.status_code == 200:
            print(f"{Fore.GREEN}✓ 服务器正在运行{Style.RESET_ALL}")
            
            # 打印服务器信息
            try:
                response_json = response.json()
                print(f"服务器信息: {json.dumps(response_json, indent=2, ensure_ascii=False)}")
            except:
                print(f"服务器响应: {response.text[:100]}...")
            
            # 测试API文档端点
            print(f"\n{Fore.CYAN}测试API文档端点...{Style.RESET_ALL}")
            try:
                docs_response = requests.get(f"{base_url}/docs")
                print(f"响应状态码: {docs_response.status_code}")
                
                if docs_response.status_code == 200:
                    print(f"{Fore.GREEN}✓ API文档可访问{Style.RESET_ALL}")
                else:
                    print(f"{Fore.YELLOW}⚠ API文档不可访问{Style.RESET_ALL}")
            except Exception as e:
                print(f"{Fore.RED}✗ 测试API文档端点时发生错误: {str(e)}{Style.RESET_ALL}")
            
            # 测试v2 API端点
            print(f"\n{Fore.CYAN}测试v2 API端点...{Style.RESET_ALL}")
            try:
                v2_response = requests.get(f"{base_url}/v2/config/parameters", params={"page": 1, "size": 1})
                print(f"响应状态码: {v2_response.status_code}")
                
                if v2_response.status_code < 400:
                    print(f"{Fore.GREEN}✓ v2 API端点可访问{Style.RESET_ALL}")
                    
                    try:
                        v2_response_json = v2_response.json()
                        print(f"响应内容: {json.dumps(v2_response_json, indent=2, ensure_ascii=False)}")
                    except:
                        print(f"响应内容: {v2_response.text[:100]}...")
                else:
                    print(f"{Fore.YELLOW}⚠ v2 API端点不可访问{Style.RESET_ALL}")
            except Exception as e:
                print(f"{Fore.RED}✗ 测试v2 API端点时发生错误: {str(e)}{Style.RESET_ALL}")
            
            return True
        else:
            print(f"{Fore.YELLOW}⚠ 服务器返回非200状态码{Style.RESET_ALL}")
            print(f"响应内容: {response.text[:100]}...")
            return False
            
    except requests.exceptions.ConnectionError:
        print(f"{Fore.RED}✗ 无法连接到服务器: {base_url}{Style.RESET_ALL}")
        return False
    except Exception as e:
        print(f"{Fore.RED}✗ 测试服务器状态时发生错误: {str(e)}{Style.RESET_ALL}")
        traceback.print_exc()
        return False

def main():
    parser = argparse.ArgumentParser(description="后端服务状态测试脚本")
    parser.add_argument("--base-url", help="API基础URL", default=os.environ.get("API_BASE_URL", "http://localhost:8080"))
    
    args = parser.parse_args()
    
    # 测试后端服务状态
    success = test_server_status(args.base_url)
    
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
