#!/usr/bin/env python3
"""
测试数据库查询性能
"""

import time
import psycopg2
import requests

def test_direct_db_query():
    """测试直接数据库查询性能"""
    print("🔍 测试直接数据库查询性能...")
    
    start_time = time.time()
    conn = psycopg2.connect(
        host='localhost',
        port=5432,
        database='salary_system',
        user='postgres',
        password='postgres'
    )
    cursor = conn.cursor()

    # 测试简单查询
    cursor.execute('SELECT id, name, code FROM hr.departments LIMIT 10')
    results = cursor.fetchall()

    end_time = time.time()
    print(f'✅ 直接数据库查询时间: {(end_time - start_time)*1000:.2f}ms')
    print(f'📊 查询结果数量: {len(results)}')

    cursor.close()
    conn.close()

def test_api_performance():
    """测试API接口性能"""
    print("\n🔍 测试API接口性能...")
    
    apis = [
        ('/v2/views-optimized/health', '健康检查'),
        ('/v2/views-optimized/departments', '部门查询'),
        ('/v2/views-optimized/personnel-categories', '人员类别'),
        ('/v2/views-optimized/lookup-types', 'Lookup类型'),
    ]
    
    for endpoint, name in apis:
        start_time = time.time()
        try:
            response = requests.get(f'http://localhost:8080{endpoint}', timeout=10)
            end_time = time.time()
            
            if response.status_code == 200:
                print(f'✅ {name}: {(end_time - start_time)*1000:.2f}ms')
            else:
                print(f'❌ {name}: HTTP {response.status_code}')
        except Exception as e:
            print(f'❌ {name}: 请求失败 - {e}')

if __name__ == "__main__":
    test_direct_db_query()
    test_api_performance() 