"""cleanup_public_schema_and_migrate_views

Revision ID: 73a4938a6f34
Revises: 2b627038dcd4
Create Date: 2025-06-08 19:50:29.828134

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '73a4938a6f34'
down_revision: Union[str, None] = '2b627038dcd4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    
    # 1. 删除 reports.employee_salary_details_view 视图
    op.execute("DROP VIEW IF EXISTS reports.employee_salary_details_view CASCADE")
    
    # 2. 删除 public 模式下的所有视图（按依赖顺序）
    view_drop_order = [
        'v_employee_salary_history',
        'v_payroll_summary_analysis', 
        'v_payroll_entries_detailed',
        'v_payroll_entries_basic',
        'v_payroll_runs_detail',
        'v_payroll_periods_detail',
        'v_payroll_component_usage',
        'v_payroll_components_basic',
        'v_employees_basic'
    ]
    
    for view_name in view_drop_order:
        op.execute(f"DROP VIEW IF EXISTS public.{view_name} CASCADE")
    
    # 3. 在 reports 模式下重新创建这些视图
    
    # v_employees_basic - 添加人员身份顶级分类字段
    op.execute("""
    CREATE VIEW reports.v_employees_basic AS
    WITH personnel_hierarchy AS (
        -- 递归CTE获取人员身份的顶级分类
        WITH RECURSIVE category_tree AS (
            -- 基础查询：顶级分类
            SELECT 
                id,
                name,
                parent_category_id,
                0 as level,
                id as root_id,
                name as root_name
            FROM hr.personnel_categories 
            WHERE parent_category_id IS NULL
            
            UNION ALL
            
            -- 递归查询：子分类
            SELECT 
                pc.id,
                pc.name,
                pc.parent_category_id,
                ct.level + 1,
                ct.root_id,
                ct.root_name
            FROM hr.personnel_categories pc
            JOIN category_tree ct ON pc.parent_category_id = ct.id
        )
        SELECT 
            id,
            name,
            root_id,
            root_name
        FROM category_tree
    )
    SELECT 
        e.id,
        e.employee_code,
        e.first_name,
        e.last_name,
        COALESCE(e.last_name, '')::text || COALESCE(e.first_name, '')::text AS full_name,
        e.phone_number,
        e.email,
        d.name AS department_name,
        p.name AS position_name,
        pc.name AS personnel_category_name,
        ph.root_name AS root_personnel_category_name,
        lv_status.name AS employee_status,
        e.hire_date,
        e.department_id,
        e.actual_position_id,
        e.personnel_category_id
    FROM hr.employees e
        LEFT JOIN hr.departments d ON e.department_id = d.id
        LEFT JOIN hr.positions p ON e.actual_position_id = p.id
        LEFT JOIN hr.personnel_categories pc ON e.personnel_category_id = pc.id
        LEFT JOIN personnel_hierarchy ph ON pc.id = ph.id
        LEFT JOIN config.lookup_values lv_status ON e.status_lookup_value_id = lv_status.id;
    """)
    
    # v_payroll_components_basic
    op.execute("""
    CREATE VIEW reports.v_payroll_components_basic AS
    SELECT 
        pcd.id,
        pcd.code,
        pcd.name,
        pcd.type as component_type,
        pcd.calculation_method,
        pcd.is_active,
        pcd.is_taxable,
        pcd.display_order
    FROM config.payroll_component_definitions pcd
    WHERE pcd.is_active = true
    ORDER BY pcd.display_order, pcd.name;
    """)
    
    # v_payroll_periods_detail
    op.execute("""
    CREATE VIEW reports.v_payroll_periods_detail AS
    SELECT 
        pp.id,
        pp.name,
        pp.start_date,
        pp.end_date,
        pp.pay_date,
        lv_status.name as status,
        COUNT(pe.id) as total_entries,
        SUM(pe.gross_pay) as total_gross_pay,
        SUM(pe.total_deductions) as total_deductions,
        SUM(pe.net_pay) as total_net_pay
    FROM payroll.payroll_periods pp
        LEFT JOIN config.lookup_values lv_status ON pp.status_lookup_value_id = lv_status.id
        LEFT JOIN payroll.payroll_entries pe ON pp.id = pe.payroll_period_id
    GROUP BY pp.id, pp.name, pp.start_date, pp.end_date, pp.pay_date, lv_status.name;
    """)
    
    # v_payroll_runs_detail
    op.execute("""
    CREATE VIEW reports.v_payroll_runs_detail AS
    SELECT 
        pr.id,
        pr.run_date,
        lv_status.name as status,
        pp.name as period_name,
        pp.start_date as period_start,
        pp.end_date as period_end,
        COUNT(pe.id) as entries_count,
        SUM(pe.gross_pay) as total_gross,
        SUM(pe.total_deductions) as total_deductions,
        SUM(pe.net_pay) as total_net
    FROM payroll.payroll_runs pr
        LEFT JOIN config.lookup_values lv_status ON pr.status_lookup_value_id = lv_status.id
        JOIN payroll.payroll_periods pp ON pr.payroll_period_id = pp.id
        LEFT JOIN payroll.payroll_entries pe ON pr.id = pe.payroll_run_id
    GROUP BY pr.id, pr.run_date, lv_status.name, pp.name, pp.start_date, pp.end_date;
    """)
    
    # v_payroll_entries_basic
    op.execute("""
    CREATE VIEW reports.v_payroll_entries_basic AS
    SELECT 
        pe.id,
        e.employee_code,
        e.first_name,
        e.last_name,
        d.name as department_name,
        p.name as position_name,
        pp.name as period_name,
        pe.gross_pay,
        pe.total_deductions,
        pe.net_pay,
        pe.calculated_at
    FROM payroll.payroll_entries pe
        JOIN hr.employees e ON pe.employee_id = e.id
        LEFT JOIN hr.departments d ON e.department_id = d.id
        LEFT JOIN hr.positions p ON e.actual_position_id = p.id
        JOIN payroll.payroll_periods pp ON pe.payroll_period_id = pp.id;
    """)
    
    # v_payroll_entries_detailed
    op.execute("""
    CREATE VIEW reports.v_payroll_entries_detailed AS
    SELECT 
        pe.id,
        pe.employee_id,
        e.employee_code,
        e.first_name,
        e.last_name,
        d.name as department_name,
        p.name as position_name,
        pc.name as personnel_category_name,
        pp.name as period_name,
        pp.start_date as period_start,
        pp.end_date as period_end,
        pe.gross_pay,
        pe.total_deductions,
        pe.net_pay,
        pe.earnings_details,
        pe.deductions_details,
        pe.calculation_inputs,
        pe.remarks,
        pe.calculated_at
    FROM payroll.payroll_entries pe
        JOIN hr.employees e ON pe.employee_id = e.id
        LEFT JOIN hr.departments d ON e.department_id = d.id
        LEFT JOIN hr.positions p ON e.actual_position_id = p.id
        LEFT JOIN hr.personnel_categories pc ON e.personnel_category_id = pc.id
        JOIN payroll.payroll_periods pp ON pe.payroll_period_id = pp.id;
    """)
    
    # v_payroll_component_usage
    op.execute("""
    CREATE VIEW reports.v_payroll_component_usage AS
    SELECT 
        pcd.code,
        pcd.name,
        pcd.type as component_type,
        COUNT(DISTINCT pe.id) as usage_count,
        COUNT(DISTINCT pe.employee_id) as employee_count,
        AVG(CASE 
            WHEN pcd.type = 'EARNING' THEN 
                ((pe.earnings_details -> pcd.code) ->> 'amount')::numeric
            ELSE 
                ((pe.deductions_details -> pcd.code) ->> 'amount')::numeric
        END) as avg_amount,
        SUM(CASE 
            WHEN pcd.type = 'EARNING' THEN 
                ((pe.earnings_details -> pcd.code) ->> 'amount')::numeric
            ELSE 
                ((pe.deductions_details -> pcd.code) ->> 'amount')::numeric
        END) as total_amount
    FROM config.payroll_component_definitions pcd
        LEFT JOIN payroll.payroll_entries pe ON (
            (pcd.type = 'EARNING' AND pe.earnings_details ? pcd.code) OR
            (pcd.type IN ('DEDUCTION', 'PERSONAL_DEDUCTION', 'EMPLOYER_DEDUCTION') AND pe.deductions_details ? pcd.code)
        )
    WHERE pcd.is_active = true
    GROUP BY pcd.code, pcd.name, pcd.type;
    """)
    
    # v_employee_salary_history
    op.execute("""
    CREATE VIEW reports.v_employee_salary_history AS
    SELECT 
        pe.employee_id,
        e.employee_code,
        e.first_name,
        e.last_name,
        pp.name as period_name,
        pp.start_date as period_start,
        pp.end_date as period_end,
        pe.gross_pay,
        pe.total_deductions,
        pe.net_pay,
        pe.calculated_at,
        ROW_NUMBER() OVER (PARTITION BY pe.employee_id ORDER BY pp.start_date DESC) as period_rank
    FROM payroll.payroll_entries pe
        JOIN hr.employees e ON pe.employee_id = e.id
        JOIN payroll.payroll_periods pp ON pe.payroll_period_id = pp.id
    ORDER BY pe.employee_id, pp.start_date DESC;
    """)
    
    # v_payroll_summary_analysis
    op.execute("""
    CREATE VIEW reports.v_payroll_summary_analysis AS
    SELECT 
        pp.id as period_id,
        pp.name as period_name,
        pp.start_date,
        pp.end_date,
        COUNT(pe.id) as total_employees,
        SUM(pe.gross_pay) as total_gross_pay,
        SUM(pe.total_deductions) as total_deductions,
        SUM(pe.net_pay) as total_net_pay,
        AVG(pe.gross_pay) as avg_gross_pay,
        AVG(pe.total_deductions) as avg_deductions,
        AVG(pe.net_pay) as avg_net_pay,
        MIN(pe.gross_pay) as min_gross_pay,
        MAX(pe.gross_pay) as max_gross_pay
    FROM payroll.payroll_periods pp
        LEFT JOIN payroll.payroll_entries pe ON pp.id = pe.payroll_period_id
    GROUP BY pp.id, pp.name, pp.start_date, pp.end_date
    ORDER BY pp.start_date DESC;
    """)
    
    # 4. 删除 public 模式下的 departments 和 employees 表
    # 注意：这些表的数据已经迁移到 hr 模式，所以可以安全删除
    op.execute("DROP TABLE IF EXISTS public.employees CASCADE")
    op.execute("DROP TABLE IF EXISTS public.departments CASCADE")


def downgrade() -> None:
    """Downgrade schema."""
    
    # 1. 删除 reports 模式下的视图
    view_names = [
        'v_employee_salary_history',
        'v_payroll_summary_analysis', 
        'v_payroll_entries_detailed',
        'v_payroll_entries_basic',
        'v_payroll_runs_detail',
        'v_payroll_periods_detail',
        'v_payroll_component_usage',
        'v_payroll_components_basic',
        'v_employees_basic'
    ]
    
    for view_name in view_names:
        op.execute(f"DROP VIEW IF EXISTS reports.{view_name} CASCADE")
    
    # 2. 重新创建 public 模式下的表（从 hr 模式复制结构，但不复制数据）
    # 注意：这里只是为了降级兼容性，实际上这些表已经废弃
    op.execute("""
    CREATE TABLE IF NOT EXISTS public.departments (
        id BIGINT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(50),
        description TEXT,
        parent_id BIGINT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
    """)
    
    op.execute("""
    CREATE TABLE IF NOT EXISTS public.employees (
        id BIGINT PRIMARY KEY,
        employee_code VARCHAR(50) UNIQUE NOT NULL,
        first_name VARCHAR(50) NOT NULL,
        last_name VARCHAR(50),
        phone_number VARCHAR(20),
        email VARCHAR(100),
        hire_date DATE,
        department_id BIGINT,
        position_id BIGINT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
    """)
    
    # 3. 重新创建 public 模式下的视图（简化版本，因为原始定义可能依赖已删除的表）
    op.execute("""
    CREATE VIEW public.v_employees_basic AS
    SELECT 
        e.id,
        e.employee_code,
        e.first_name,
        e.last_name,
        COALESCE(e.last_name, '')::text || COALESCE(e.first_name, '')::text AS full_name,
        e.phone_number,
        e.email,
        d.name AS department_name,
        p.name AS position_name,
        pc.name AS personnel_category_name,
        lv_status.name AS employee_status,
        e.hire_date,
        e.department_id,
        e.actual_position_id,
        e.personnel_category_id
    FROM hr.employees e
        LEFT JOIN hr.departments d ON e.department_id = d.id
        LEFT JOIN hr.positions p ON e.actual_position_id = p.id
        LEFT JOIN hr.personnel_categories pc ON e.personnel_category_id = pc.id
        LEFT JOIN config.lookup_values lv_status ON e.status_lookup_value_id = lv_status.id;
    """)
    
    # 注意：其他视图的降级创建被省略，因为它们依赖的表结构可能已经改变
    # 在实际生产环境中，应该避免降级这种破坏性的迁移
