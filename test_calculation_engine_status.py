#!/usr/bin/env python3
"""
测试计算引擎的状态校验功能
"""
import requests
import json

# API配置
BASE_URL = "http://localhost:8080/v2"
HEADERS = {
    "Content-Type": "application/json",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsImV4cCI6MTczMzU1NjAwMH0.YQI_bsVJkKOQBOQGGLdNZXiVOSEQJOQGGLdNZXiVOSE"
}

def test_calculation_engine_status_check():
    """测试计算引擎的状态校验功能"""
    
    # 测试工资运行ID
    payroll_run_id = 50
    
    print(f"🔄 测试计算引擎状态校验功能 - 工资运行ID: {payroll_run_id}")
    
    # 调用计算引擎API
    url = f"{BASE_URL}/simple-payroll/calculation-engine/run"
    payload = {
        "payroll_run_id": payroll_run_id,
        "recalculate_all": True
    }
    
    try:
        print(f"📡 发送请求: {url}")
        print(f"📝 请求数据: {json.dumps(payload, indent=2)}")
        
        response = requests.post(url, headers=HEADERS, json=payload, timeout=300)
        
        print(f"📊 响应状态码: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ 请求成功!")
            print(f"📋 响应数据:")
            print(json.dumps(result, indent=2, ensure_ascii=False))
            
            # 检查是否有警告信息
            if "warning" in result.get("data", {}):
                print(f"⚠️ 警告信息: {result['data']['warning']}")
            
            # 检查状态信息
            if "status_info" in result.get("data", {}):
                status_info = result["data"]["status_info"]
                print(f"📈 状态变化:")
                print(f"   原状态: {status_info.get('previous_status')} ({status_info.get('previous_status_code')})")
                print(f"   新状态: {status_info.get('new_status')} ({status_info.get('new_status_code')})")
        else:
            print(f"❌ 请求失败: {response.status_code}")
            print(f"错误信息: {response.text}")
            
    except requests.exceptions.Timeout:
        print("⏰ 请求超时")
    except Exception as e:
        print(f"❌ 请求异常: {e}")

if __name__ == "__main__":
    test_calculation_engine_status_check() 