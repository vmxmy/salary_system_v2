#!/usr/bin/env python
"""
薪资计算调试脚本
详细追踪薪资计算过程中的错误
"""

import requests
import json
import traceback
from datetime import datetime, date

def debug_payroll_calculation():
    """调试薪资计算"""
    base_url = "http://localhost:8080"
    token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsInJvbGUiOiJcdThkODVcdTdlYTdcdTdiYTFcdTc0MDZcdTU0NTgiLCJleHAiOjE3NDg4NjY4ODJ9.nVt91htNtxyhPr2Y7efornyJTkvQ1f8FCj11KxIKE28"
    
    session = requests.Session()
    session.headers.update({"Authorization": f"Bearer {token}"})
    
    print("=== 薪资计算调试 ===")
    
    # 测试计算预览
    print("1. 测试计算预览API")
    preview_data = {
        "payroll_run_id": 13,
        "employee_ids": [349],  # 只测试一个员工
        "calculation_config": {
            "include_overtime": True,
            "tax_calculation_method": "progressive"
        },
        "preview_limit": 1
    }
    
    try:
        response = session.post(
            f"{base_url}/v2/payroll/calculation/preview", 
            json=preview_data
        )
        print(f"   状态码: {response.status_code}")
        
        if response.status_code != 200:
            print(f"   错误响应: {response.text}")
            
            # 尝试解析错误详情
            try:
                error_data = response.json()
                print(f"   错误详情: {json.dumps(error_data, indent=2, ensure_ascii=False)}")
            except:
                print("   无法解析错误响应为JSON")
        else:
            result = response.json()
            print(f"   成功响应: {json.dumps(result, indent=2, ensure_ascii=False)}")
            
    except Exception as e:
        print(f"   请求异常: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    debug_payroll_calculation() 