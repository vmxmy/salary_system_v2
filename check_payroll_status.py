import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

try:
    conn = psycopg2.connect(
        host=os.getenv('DATABASE_HOST', 'localhost'),
        port=os.getenv('DATABASE_PORT', '5432'), 
        database=os.getenv('DATABASE_NAME', 'salary_system'),
        user=os.getenv('DATABASE_USER', 'postgres'),
        password=os.getenv('DATABASE_PASSWORD')
    )
    cur = conn.cursor()

    print('📊 查询薪资条目状态(PAYROLL_ENTRY_STATUS):')
    cur.execute('''
        SELECT lv.id, lv.code, lv.name, lv.description, lv.sort_order, lv.is_active
        FROM config.lookup_values lv
        JOIN config.lookup_types lt ON lv.lookup_type_id = lt.id
        WHERE lt.code = 'PAYROLL_ENTRY_STATUS' AND lv.is_active = true
        ORDER BY lv.sort_order, lv.id;
    ''')

    results = cur.fetchall()
    if results:
        for row in results:
            print(f'ID: {row[0]}, Code: {row[1]}, Name: {row[2]}, Description: {row[3]}, Order: {row[4]}, Active: {row[5]}')
    else:
        print('❌ 未找到PAYROLL_ENTRY_STATUS类型的lookup值')
        print('📊 检查所有lookup类型:')
        cur.execute('SELECT id, code, name FROM config.lookup_types ORDER BY code;')
        types = cur.fetchall()
        for t in types:
            print(f'  Type: {t[1]} ({t[2]}), ID: {t[0]}')
            
        print('\n📊 检查所有lookup值(前20个):')
        cur.execute('SELECT lv.id, lt.code as type_code, lv.code, lv.name FROM config.lookup_values lv JOIN config.lookup_types lt ON lv.lookup_type_id = lt.id WHERE lv.is_active = true ORDER BY lv.id LIMIT 20;')
        values = cur.fetchall()
        for v in values:
            print(f'  ID: {v[0]}, Type: {v[1]}, Code: {v[2]}, Name: {v[3]}')

    cur.close()
    conn.close()
except Exception as e:
    print(f'❌ 数据库连接错误: {e}') 