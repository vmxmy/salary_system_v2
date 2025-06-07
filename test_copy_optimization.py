#!/usr/bin/env python3
"""
测试一键复制功能优化效果的脚本
"""

import requests
import json
from typing import Dict, Any

# 配置
API_BASE = "http://localhost:8080/v2/simple-payroll"
AUTH_TOKEN = "your_auth_token_here"  # 需要替换为实际的认证token

def test_periods_with_entries():
    """测试期间列表API是否返回正确的条目数量"""
    print("🔄 测试期间列表API...")
    
    headers = {"Authorization": f"Bearer {AUTH_TOKEN}"}
    response = requests.get(f"{API_BASE}/periods", headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        periods = data.get('data', [])
        
        print(f"✅ 获取到 {len(periods)} 个期间")
        
        # 显示有条目的期间
        periods_with_entries = [p for p in periods if p.get('entries_count', 0) > 0]
        print(f"📊 有工资条目的期间数量: {len(periods_with_entries)}")
        
        for period in periods_with_entries[:5]:  # 显示前5个
            print(f"  - ID={period['id']}, 名称={period['name']}, 条目数={period['entries_count']}")
        
        return periods_with_entries
    else:
        print(f"❌ API调用失败: {response.status_code}")
        return []

def test_copy_source_selection(periods_with_entries):
    """测试复制源选择逻辑"""
    print("\n🎯 测试复制源选择逻辑...")
    
    if not periods_with_entries:
        print("❌ 没有有条目的期间可供测试")
        return
    
    # 模拟前端的选择逻辑
    target_period_id = 50  # 假设目标期间
    
    # 过滤可复制的期间
    available_periods = [
        p for p in periods_with_entries 
        if p['id'] != target_period_id and 
           p.get('entries_count', 0) > 0 and
           p.get('runs_count', 0) > 0
    ]
    
    if available_periods:
        # 按条目数量降序，然后按ID降序排序
        sorted_periods = sorted(available_periods, key=lambda x: (-x['entries_count'], -x['id']))
        selected_period = sorted_periods[0]
        
        print(f"✅ 选择的复制源期间:")
        print(f"  - ID={selected_period['id']}")
        print(f"  - 名称={selected_period['name']}")
        print(f"  - 条目数={selected_period['entries_count']}")
        print(f"  - 运行数={selected_period['runs_count']}")
        
        return selected_period
    else:
        print("❌ 没有找到合适的复制源期间")
        return None

def main():
    """主测试函数"""
    print("🚀 开始测试一键复制功能优化...")
    
    # 测试期间列表API
    periods_with_entries = test_periods_with_entries()
    
    # 测试复制源选择逻辑
    selected_source = test_copy_source_selection(periods_with_entries)
    
    if selected_source:
        print(f"\n🎉 测试完成！优化后的逻辑将选择期间 {selected_source['name']} (ID={selected_source['id']}) 作为复制源")
        print(f"   该期间有 {selected_source['entries_count']} 条工资记录，确保复制操作有实际数据")
    else:
        print("\n⚠️ 测试完成，但没有找到合适的复制源期间")

if __name__ == "__main__":
    main() 