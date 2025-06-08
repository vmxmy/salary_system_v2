#!/usr/bin/env python3
"""
基于 payroll_component_definitions 表生成完整的薪资视图定义
"""

import psycopg2
from psycopg2.extras import RealDictCursor

# 数据库连接配置
DB_CONFIG = {
    'host': 'api.salary.ziikoo.com',
    'port': 25432,
    'database': 'salary_system_v2',
    'user': 'postgres',
    'password': '810705'
}

def get_payroll_components():
    """获取所有活跃的薪资组件定义"""
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        cursor.execute("""
            SELECT type, code, name, display_order
            FROM config.payroll_component_definitions 
            WHERE is_active = true
            ORDER BY type, display_order, code
        """)
        
        components = cursor.fetchall()
        
        # 按类型分组
        by_type = {}
        for comp in components:
            comp_type = comp['type']
            if comp_type not in by_type:
                by_type[comp_type] = []
            by_type[comp_type].append(comp)
        
        return by_type
        
    finally:
        cursor.close()
        conn.close()

def generate_field_definitions(components_by_type):
    """生成字段定义"""
    
    field_definitions = []
    
    # 应发项目 (EARNING)
    if 'EARNING' in components_by_type:
        field_definitions.append("        -- 应发项目（EARNING类型）- 展开为标准字段")
        for comp in components_by_type['EARNING']:
            code = comp['code']
            name = comp['name']
            field_name = code.lower()
            field_definitions.append(f"        COALESCE((pe.earnings_details->>'{code}')::numeric, 0.00) as {field_name}, -- {name}")
    
    # 个人扣除项目 (PERSONAL_DEDUCTION)
    if 'PERSONAL_DEDUCTION' in components_by_type:
        field_definitions.append("\n        -- 个人扣除项目（PERSONAL_DEDUCTION类型）- 展开为标准字段")
        for comp in components_by_type['PERSONAL_DEDUCTION']:
            code = comp['code']
            name = comp['name']
            field_name = code.lower()
            field_definitions.append(f"        COALESCE((pe.deductions_details->>'{code}')::numeric, 0.00) as {field_name}, -- {name}")
    
    # 单位扣除项目 (EMPLOYER_DEDUCTION)
    if 'EMPLOYER_DEDUCTION' in components_by_type:
        field_definitions.append("\n        -- 单位扣除项目（EMPLOYER_DEDUCTION类型）- 展开为标准字段")
        for comp in components_by_type['EMPLOYER_DEDUCTION']:
            code = comp['code']
            name = comp['name']
            field_name = code.lower()
            field_definitions.append(f"        COALESCE((pe.deductions_details->>'{code}')::numeric, 0.00) as {field_name}, -- {name}")
    
    # 计算基数 (CALCULATION_BASE)
    if 'CALCULATION_BASE' in components_by_type:
        field_definitions.append("\n        -- 计算基数（CALCULATION_BASE类型）- 展开为标准字段")
        for comp in components_by_type['CALCULATION_BASE']:
            code = comp['code']
            name = comp['name']
            field_name = code.lower()
            field_definitions.append(f"        COALESCE((pe.calculation_inputs->>'{code}')::numeric, 0.00) as {field_name}, -- {name}")
    
    # 计算费率 (CALCULATION_RATE)
    if 'CALCULATION_RATE' in components_by_type:
        field_definitions.append("\n        -- 计算费率（CALCULATION_RATE类型）- 展开为标准字段")
        for comp in components_by_type['CALCULATION_RATE']:
            code = comp['code']
            name = comp['name']
            field_name = code.lower()
            field_definitions.append(f"        COALESCE((pe.calculation_inputs->>'{code}')::numeric, 0.00) as {field_name}, -- {name}")
    
    # 计算结果 (CALCULATION_RESULT)
    if 'CALCULATION_RESULT' in components_by_type:
        field_definitions.append("\n        -- 计算结果（CALCULATION_RESULT类型）- 展开为标准字段")
        for comp in components_by_type['CALCULATION_RESULT']:
            code = comp['code']
            name = comp['name']
            field_name = code.lower()
            field_definitions.append(f"        COALESCE((pe.calculation_inputs->>'{code}')::numeric, 0.00) as {field_name}, -- {name}")
    
    # 其他字段 (OTHER)
    if 'OTHER' in components_by_type:
        field_definitions.append("\n        -- 其他字段（OTHER类型）- 展开为标准字段")
        for comp in components_by_type['OTHER']:
            code = comp['code']
            name = comp['name']
            field_name = code.lower()
            # 根据字段名判断数据类型
            if 'flag' in code.lower() or 'is_' in code.lower():
                field_definitions.append(f"        COALESCE((pe.calculation_inputs->>'{code}')::boolean, false) as {field_name}, -- {name}")
            else:
                field_definitions.append(f"        COALESCE((pe.calculation_inputs->>'{code}')::numeric, 0.00) as {field_name}, -- {name}")
    
    return field_definitions

def generate_complete_view_sql():
    """生成完整的视图SQL"""
    
    print("🔍 正在获取薪资组件定义...")
    components_by_type = get_payroll_components()
    
    print(f"📊 找到组件类型: {list(components_by_type.keys())}")
    for comp_type, comps in components_by_type.items():
        print(f"  - {comp_type}: {len(comps)} 个组件")
    
    print("\n🏗️ 生成字段定义...")
    field_definitions = generate_field_definitions(components_by_type)
    
    # 生成完整的视图SQL
    view_sql = f"""
CREATE OR REPLACE VIEW reports.v_comprehensive_employee_payroll AS
WITH personnel_hierarchy AS (
    -- 递归CTE获取人员身份的顶级分类
    WITH RECURSIVE category_tree AS (
        -- 基础查询：顶级分类
        SELECT 
            id,
            name,
            parent_category_id,
            id as root_id,
            name as root_name,
            0 as level
        FROM hr.personnel_categories 
        WHERE parent_category_id IS NULL
        
        UNION ALL
        
        -- 递归查询：子分类
        SELECT 
            pc.id,
            pc.name,
            pc.parent_category_id,
            ct.root_id,
            ct.root_name,
            ct.level + 1
        FROM hr.personnel_categories pc
        INNER JOIN category_tree ct ON pc.parent_category_id = ct.id
    )
    SELECT 
        id as category_id,
        root_id,
        root_name
    FROM category_tree
)
SELECT 
    -- 基本标识信息
    pe.id as payroll_entry_id,
    pe.employee_id,
    pe.payroll_period_id,
    pe.payroll_run_id,
    
    -- 员工基本信息
    e.employee_code,
    e.first_name,
    e.last_name,
    COALESCE(e.last_name || e.first_name, e.first_name, e.last_name, '未知姓名') as full_name,
    e.id_number,
    e.phone_number as phone,
    e.email,
    e.hire_date,
    COALESCE(e.is_active, false) as employee_is_active,
    
    -- 部门和职位信息
    COALESCE(d.name, '未分配部门') as department_name,
    COALESCE(pos.name, '未分配职位') as position_name,
    
    -- 人员身份分类信息
    COALESCE(pc.name, '未分类') as personnel_category_name,
    COALESCE(ph.root_name, '未分类') as root_personnel_category_name,
    
    -- 薪资期间信息
    COALESCE(pp.name, '未知期间') as payroll_period_name,
    pp.start_date as payroll_period_start_date,
    pp.end_date as payroll_period_end_date,
    pp.pay_date as payroll_period_pay_date,
    
    -- 薪资运行信息
    pr.run_date as payroll_run_date,
    
    -- 薪资汇总信息
    COALESCE(pe.gross_pay, 0.00) as gross_pay,
    COALESCE(pe.total_deductions, 0.00) as total_deductions,
    COALESCE(pe.net_pay, 0.00) as net_pay,
    
{chr(10).join(field_definitions)}
    
    -- 状态信息 - 提供默认值避免NULL
    COALESCE(pe.status_lookup_value_id, 1) as status_lookup_value_id,
    COALESCE(pe.remarks, '') as remarks,
    
    -- 审计信息
    pe.audit_status,
    pe.audit_timestamp,
    pe.auditor_id,
    pe.audit_notes,
    pe.version,
    
    -- 时间字段
    COALESCE(pe.calculated_at, pe.updated_at, NOW()) as calculated_at,
    pe.updated_at,
    
    -- 原始JSONB数据（保留用于调试和向后兼容）
    pe.earnings_details as raw_earnings_details,
    pe.deductions_details as raw_deductions_details,
    pe.calculation_inputs as raw_calculation_inputs,
    pe.calculation_log as raw_calculation_log
    
FROM payroll.payroll_entries pe
LEFT JOIN hr.employees e ON pe.employee_id = e.id
LEFT JOIN hr.departments d ON e.department_id = d.id
LEFT JOIN hr.positions pos ON e.actual_position_id = pos.id
LEFT JOIN hr.personnel_categories pc ON e.personnel_category_id = pc.id
LEFT JOIN personnel_hierarchy ph ON pc.id = ph.category_id
LEFT JOIN payroll.payroll_periods pp ON pe.payroll_period_id = pp.id
LEFT JOIN payroll.payroll_runs pr ON pe.payroll_run_id = pr.id;
"""
    
    return view_sql

if __name__ == "__main__":
    try:
        view_sql = generate_complete_view_sql()
        
        print("\n📄 生成的完整视图SQL:")
        print("=" * 80)
        print(view_sql)
        
        # 保存到文件
        with open('complete_payroll_view.sql', 'w', encoding='utf-8') as f:
            f.write(view_sql)
        
        print(f"\n✅ 视图SQL已保存到: complete_payroll_view.sql")
        
    except Exception as e:
        print(f"❌ 生成视图失败: {e}")
        import traceback
        traceback.print_exc() 