#!/usr/bin/env python3
"""
测试智能复制功能的完整流程

用法：
    python test_smart_copy_feature.py --target-period 2 --source-period 1
"""

import argparse
import sys
import os
import requests
import json
from datetime import datetime

# 添加项目路径
sys.path.append(os.path.join(os.path.dirname(__file__), 'webapp'))

# 配置
API_BASE = "http://localhost:8080/v2"
DEFAULT_TOKEN = "your_test_token_here"  # 请替换为实际的测试token


def test_check_existing_data(period_id: int, token: str):
    """测试检查现有数据API"""
    print(f"🔍 [测试] 检查期间 {period_id} 的现有数据...")
    
    headers = {"Authorization": f"Bearer {token}"}
    url = f"{API_BASE}/simple-payroll/check-existing-data/{period_id}"
    
    try:
        response = requests.get(url, headers=headers)
        print(f"📊 [检查数据] HTTP状态: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            existing_info = data.get('data', {})
            
            print(f"✅ [检查数据] 检查成功")
            print(f"   期间名称: {existing_info.get('target_period_name')}")
            print(f"   是否有数据: {existing_info.get('has_any_data')}")
            print(f"   工资运行: {existing_info.get('summary', {}).get('total_payroll_runs')} 次")
            print(f"   工资条目: {existing_info.get('summary', {}).get('total_payroll_entries')} 条")
            print(f"   薪资配置: {existing_info.get('summary', {}).get('total_salary_configs')} 条")
            print(f"   涉及员工: {existing_info.get('summary', {}).get('employees_with_configs')} 人")
            
            return existing_info
        else:
            print(f"❌ [检查数据] 请求失败: {response.text}")
            return None
            
    except Exception as e:
        print(f"💥 [检查数据] 异常: {e}")
        return None


def test_copy_without_force(target_period: int, source_period: int, token: str):
    """测试不强制覆盖的复制（应该触发确认需求）"""
    print(f"\n🚀 [测试] 测试复制操作（不强制覆盖）...")
    
    headers = {"Authorization": f"Bearer {token}"}
    url = f"{API_BASE}/simple-payroll/copy-previous"
    
    payload = {
        "target_period_id": target_period,
        "source_period_id": source_period,
        "description": "测试智能复制功能",
        "force_overwrite": False
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        print(f"📊 [复制测试] HTTP状态: {response.status_code}")
        
        if response.status_code == 200:
            print(f"✅ [复制测试] 复制成功（目标期间可能没有数据）")
            data = response.json()
            return {"success": True, "data": data}
            
        elif response.status_code == 409:
            print(f"⚠️ [复制测试] 触发确认需求（符合预期）")
            error_data = response.json()
            
            if error_data.get('error', {}).get('code') == 'CONFIRMATION_REQUIRED':
                existing_data = error_data['error']['existing_data']
                suggestions = error_data['error']['suggestions']
                
                print(f"📋 [确认数据] 现有数据信息:")
                print(f"   期间: {existing_data.get('target_period_name')}")
                print(f"   工资记录: {existing_data.get('summary', {}).get('total_payroll_runs')} 次运行")
                print(f"   薪资配置: {existing_data.get('summary', {}).get('total_salary_configs')} 条配置")
                
                print(f"💡 [建议操作]:")
                for action in suggestions.get('actions', []):
                    print(f"   - {action['label']}: {action['description']}")
                
                return {
                    "success": False, 
                    "needs_confirmation": True,
                    "existing_data": existing_data,
                    "suggestions": suggestions
                }
            else:
                print(f"❌ [复制测试] 409错误但不是确认需求: {response.text}")
                return {"success": False, "error": "Unexpected 409 response"}
                
        else:
            print(f"❌ [复制测试] 请求失败: {response.text}")
            return {"success": False, "error": response.text}
            
    except Exception as e:
        print(f"💥 [复制测试] 异常: {e}")
        return {"success": False, "error": str(e)}


def test_copy_with_force(target_period: int, source_period: int, token: str):
    """测试强制覆盖的复制"""
    print(f"\n💪 [测试] 测试强制覆盖复制...")
    
    headers = {"Authorization": f"Bearer {token}"}
    url = f"{API_BASE}/simple-payroll/copy-previous"
    
    payload = {
        "target_period_id": target_period,
        "source_period_id": source_period,
        "description": "测试智能复制功能 - 强制覆盖",
        "force_overwrite": True
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        print(f"📊 [强制复制] HTTP状态: {response.status_code}")
        
        if response.status_code == 200:
            print(f"✅ [强制复制] 复制成功")
            data = response.json()
            payroll_run = data.get('data', {})
            print(f"   新运行ID: {payroll_run.get('id')}")
            print(f"   期间名称: {payroll_run.get('period_name')}")
            print(f"   版本号: {payroll_run.get('version_number')}")
            return {"success": True, "data": data}
        else:
            print(f"❌ [强制复制] 请求失败: {response.text}")
            return {"success": False, "error": response.text}
            
    except Exception as e:
        print(f"💥 [强制复制] 异常: {e}")
        return {"success": False, "error": str(e)}


def main():
    parser = argparse.ArgumentParser(description="测试智能复制功能")
    parser.add_argument("--target-period", type=int, required=True, help="目标期间ID")
    parser.add_argument("--source-period", type=int, required=True, help="源期间ID")
    parser.add_argument("--token", default=DEFAULT_TOKEN, help="API访问token")
    parser.add_argument("--skip-force-test", action="store_true", help="跳过强制覆盖测试")
    
    args = parser.parse_args()
    
    print("🧪 智能复制功能测试开始")
    print(f"📋 测试参数:")
    print(f"   目标期间ID: {args.target_period}")
    print(f"   源期间ID: {args.source_period}")
    print(f"   API基地址: {API_BASE}")
    print(f"   测试时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # 测试1: 检查现有数据
    print(f"\n" + "="*60)
    print(f"📍 测试1: 检查现有数据API")
    existing_data = test_check_existing_data(args.target_period, args.token)
    
    if existing_data is None:
        print(f"❌ 检查数据API测试失败，终止测试")
        return
    
    # 测试2: 不强制覆盖的复制
    print(f"\n" + "="*60)
    print(f"📍 测试2: 智能复制（不强制覆盖）")
    copy_result = test_copy_without_force(args.target_period, args.source_period, args.token)
    
    # 测试3: 强制覆盖的复制（如果用户允许）
    if not args.skip_force_test:
        print(f"\n" + "="*60)
        print(f"📍 测试3: 强制覆盖复制")
        
        if copy_result.get("needs_confirmation"):
            print(f"⚠️ 检测到需要确认的情况，继续测试强制覆盖...")
            force_result = test_copy_with_force(args.target_period, args.source_period, args.token)
            
            if force_result.get("success"):
                print(f"✅ 强制覆盖测试通过")
            else:
                print(f"❌ 强制覆盖测试失败")
        else:
            print(f"💡 未检测到确认需求，跳过强制覆盖测试")
    
    # 总结
    print(f"\n" + "="*60)
    print(f"📊 测试总结")
    print(f"✅ 检查数据API: {'通过' if existing_data else '失败'}")
    print(f"✅ 智能复制逻辑: {'通过' if copy_result else '失败'}")
    
    if copy_result.get("needs_confirmation"):
        print(f"✅ 确认需求检测: 通过")
        print(f"💡 前端应该显示确认对话框，让用户选择处理方式")
    elif copy_result.get("success"):
        print(f"✅ 直接复制: 通过（目标期间无冲突数据）")
    else:
        print(f"❌ 复制逻辑: 失败")
    
    print(f"\n🎉 智能复制功能测试完成！")


if __name__ == "__main__":
    main() 