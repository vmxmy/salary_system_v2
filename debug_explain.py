#!/usr/bin/env python3
"""
调试EXPLAIN查询返回格式
"""
import psycopg2
from psycopg2.extras import RealDictCursor

DB_CONFIG = {
    'host': 'pg.debian.ziikoo.com',
    'port': 25432,
    'database': 'salary_system_v2',
    'user': 'postgres',
    'password': '810705'
}

def debug_explain_format():
    conn = psycopg2.connect(**DB_CONFIG)
    
    with conn.cursor(cursor_factory=RealDictCursor) as cursor:
        cursor.execute('EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) SELECT * FROM reports.v_employees_basic LIMIT 5;')
        result = cursor.fetchone()
        
        print('返回结果类型:', type(result))
        print('返回结果内容:', result)
        
        if result:
            print('结果keys:', list(result.keys()) if hasattr(result, 'keys') else 'No keys')
            
            # 尝试不同的访问方式
            for key in result.keys():
                print(f'Key "{key}" 的内容:', result[key])
                print(f'Key "{key}" 的类型:', type(result[key]))
    
    conn.close()

if __name__ == "__main__":
    debug_explain_format() 