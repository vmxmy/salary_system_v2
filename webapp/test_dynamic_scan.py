#!/usr/bin/env python3
"""
测试动态扫描数据源API的脚本
"""

import requests
import json
from typing import Dict, Any

def test_dynamic_scan():
    """测试动态扫描API"""
    
    # API端点
    base_url = "http://localhost:8080/v2"
    
    # 1. 测试动态扫描API
    print("🔍 测试动态扫描数据源API...")
    
    try:
        # 扫描reports schema下的v_monthly_开头的视图
        scan_url = f"{base_url}/report-config/data-sources/dynamic-scan"
        params = {
            "schema_name": "reports",
            "view_pattern": "v_monthly_%"
        }
        
        print(f"请求URL: {scan_url}")
        print(f"参数: {params}")
        
        # 注意：这里需要认证token，简单测试可以跳过认证
        response = requests.get(scan_url, params=params)
        
        print(f"响应状态码: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ 扫描成功！发现 {len(data)} 个月度报表视图:")
            
            for i, source in enumerate(data, 1):
                print(f"  {i}. {source['name']} - {source.get('description', '无描述')}")
                
        else:
            print(f"❌ 扫描失败: {response.status_code}")
            print(f"错误信息: {response.text}")
            
    except Exception as e:
        print(f"❌ 请求异常: {str(e)}")
        
    # 2. 测试普通数据源API（包含动态扫描）
    print("\n📋 测试获取数据源列表API（包含动态扫描）...")
    
    try:
        datasources_url = f"{base_url}/report-config/data-sources"
        params = {
            "include_dynamic": True,
            "schema_name": "reports"
        }
        
        response = requests.get(datasources_url, params=params)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ 获取成功！总共 {len(data)} 个数据源:")
            
            monthly_views = [ds for ds in data if 'monthly' in ds.get('name', '').lower()]
            if monthly_views:
                print(f"📊 其中月度报表视图 {len(monthly_views)} 个:")
                for view in monthly_views:
                    print(f"  - {view['name']}")
            else:
                print("📊 未发现月度报表视图")
                
        else:
            print(f"❌ 获取失败: {response.status_code}")
            print(f"错误信息: {response.text}")
            
    except Exception as e:
        print(f"❌ 请求异常: {str(e)}")

if __name__ == "__main__":
    print("🚀 开始测试动态扫描数据源功能...\n")
    test_dynamic_scan()
    print("\n🎯 测试完成！") 