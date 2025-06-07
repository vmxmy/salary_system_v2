#!/usr/bin/env python3
"""
测试银行文件生成API
"""
import requests
import json

# API配置
BASE_URL = "http://localhost:8080/v2"
USERNAME = "admin"
PASSWORD = "admin"

def get_auth_token():
    """获取认证token"""
    login_url = f"{BASE_URL}/auth/login"
    login_data = {
        "username": USERNAME,
        "password": PASSWORD
    }
    
    response = requests.post(login_url, json=login_data)
    if response.status_code == 200:
        return response.json()["data"]["access_token"]
    else:
        print(f"登录失败: {response.status_code} - {response.text}")
        return None

def test_bank_file_generation():
    """测试银行文件生成"""
    token = get_auth_token()
    if not token:
        return
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # 测试数据
    test_data = {
        "payroll_run_id": 51,
        "bank_type": "ICBC",
        "file_format": "csv",
        "include_summary": True
    }
    
    url = f"{BASE_URL}/simple-payroll/bank-file/generate"
    
    print(f"🔄 测试银行文件生成API...")
    print(f"URL: {url}")
    print(f"请求数据: {json.dumps(test_data, indent=2, ensure_ascii=False)}")
    
    response = requests.post(url, json=test_data, headers=headers)
    
    print(f"\n📊 响应状态: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print("✅ 银行文件生成成功!")
        print(f"📁 文件名: {result['data']['file_name']}")
        print(f"📊 记录数: {result['data']['total_records']}")
        print(f"💰 总金额: {result['data']['total_amount']}")
        print(f"🏦 银行类型: {result['data']['bank_type']}")
        print(f"📄 文件格式: {result['data']['file_format']}")
        
        # 显示文件内容的前几行
        file_content = result['data']['file_content']
        lines = file_content.split('\n')
        print(f"\n📄 文件内容预览 (前10行):")
        for i, line in enumerate(lines[:10]):
            print(f"{i+1:2d}: {line}")
        
        if len(lines) > 10:
            print(f"... (共{len(lines)}行)")
            
    else:
        print("❌ 银行文件生成失败!")
        try:
            error_data = response.json()
            print(f"错误信息: {json.dumps(error_data, indent=2, ensure_ascii=False)}")
        except:
            print(f"错误响应: {response.text}")

if __name__ == "__main__":
    test_bank_file_generation() 