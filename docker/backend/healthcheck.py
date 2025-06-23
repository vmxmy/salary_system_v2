#!/usr/bin/env python3
"""
健康检查脚本，用于Docker容器的健康检查
"""
import sys
import requests
import os

# 获取API地址，默认为localhost:8080
API_URL = os.environ.get('API_URL', 'http://localhost:8080')
# 更新为V2健康检查端点
HEALTH_ENDPOINT = f"{API_URL}/v2/system/health"

try:
    # 尝试请求健康检查端点
    response = requests.get(HEALTH_ENDPOINT, timeout=5)
    
    # 如果状态码为200，则服务健康
    if response.status_code == 200:
        print("服务健康")
        sys.exit(0)
    else:
        print(f"服务不健康，状态码：{response.status_code}")
        sys.exit(1)
except Exception as e:
    print(f"健康检查失败：{str(e)}")
    sys.exit(1) 