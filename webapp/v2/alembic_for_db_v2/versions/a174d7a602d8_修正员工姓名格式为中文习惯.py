"""修正员工姓名格式为中文习惯

Revision ID: a174d7a602d8
Revises: ef939eaa99f7
Create Date: 2025-06-04 20:42:25.893186

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a174d7a602d8'
down_revision: Union[str, None] = 'ef939eaa99f7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    
    # 修正 v_employees_basic 视图中的姓名格式
    op.execute("DROP VIEW IF EXISTS v_employees_basic;")
    op.execute("""
    CREATE VIEW v_employees_basic AS
    SELECT 
        e.id,
        e.employee_code,
        e.first_name,
        e.last_name,
        COALESCE(e.last_name, '') || COALESCE(e.first_name, '') as full_name,
        e.phone_number,
        e.email,
        d.name as department_name,
        p.name as position_name,
        pc.name as personnel_category_name,
        lv_status.name as employee_status,
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
    
    # 修正 v_payroll_entries_basic 视图中的姓名格式
    op.execute("DROP VIEW IF EXISTS v_payroll_entries_basic;")
    op.execute("""
    CREATE VIEW v_payroll_entries_basic AS
    SELECT 
        pe.id,
        pe.employee_id,
        e.employee_code,
        COALESCE(e.last_name, '') || COALESCE(e.first_name, '') as employee_name,
        d.name as department_name,
        p.name as position_name,
        pe.payroll_period_id as period_id,
        pp.name as period_name,
        pe.gross_pay,
        pe.net_pay,
        pe.total_deductions,
        pe.earnings_details,
        pe.deductions_details,
        pe.calculated_at as created_at,
        pe.updated_at,
        e.department_id
    FROM payroll.payroll_entries pe
    JOIN hr.employees e ON pe.employee_id = e.id
    LEFT JOIN hr.departments d ON e.department_id = d.id
    LEFT JOIN hr.positions p ON e.actual_position_id = p.id
    LEFT JOIN payroll.payroll_periods pp ON pe.payroll_period_id = pp.id;
    """)
    
    # 修正 v_payroll_entries_detailed 视图中的姓名格式
    op.execute("DROP VIEW IF EXISTS v_payroll_entries_detailed;")
    op.execute("""
    CREATE VIEW v_payroll_entries_detailed AS
    SELECT 
        pe.id,
        pe.employee_id,
        e.employee_code,
        COALESCE(e.last_name, '') || COALESCE(e.first_name, '') as employee_name,
        d.name as department_name,
        p.name as position_name,
        pe.payroll_period_id as period_id,
        pp.name as period_name,
        
        -- 基础薪资汇总
        pe.gross_pay,
        pe.net_pay,
        pe.total_deductions,
        
        -- 收入项目明细展开 (使用代码键名)
        COALESCE((pe.earnings_details->'BASIC_SALARY'->>'amount')::numeric, 0.00) as basic_salary,
        COALESCE((pe.earnings_details->'PERFORMANCE_SALARY'->>'amount')::numeric, 0.00) as performance_salary,
        COALESCE((pe.earnings_details->'POSITION_SALARY_GENERAL'->>'amount')::numeric, 0.00) as position_salary,
        COALESCE((pe.earnings_details->'GRADE_SALARY'->>'amount')::numeric, 0.00) as grade_salary,
        COALESCE((pe.earnings_details->'ALLOWANCE_GENERAL'->>'amount')::numeric, 0.00) as allowance,
        COALESCE((pe.earnings_details->'SUBSIDY'->>'amount')::numeric, 0.00) as subsidy,
        COALESCE((pe.earnings_details->'BASIC_PERFORMANCE'->>'amount')::numeric, 0.00) as basic_performance_salary,
        COALESCE((pe.earnings_details->'PERFORMANCE_WAGE'->>'amount')::numeric, 0.00) as performance_wage,
        COALESCE((pe.earnings_details->'TRAFFIC_ALLOWANCE'->>'amount')::numeric, 0.00) as traffic_allowance,
        COALESCE((pe.earnings_details->'ONLY_CHILD_PARENT_BONUS'->>'amount')::numeric, 0.00) as only_child_bonus,
        COALESCE((pe.earnings_details->'TOWNSHIP_ALLOWANCE'->>'amount')::numeric, 0.00) as township_allowance,
        COALESCE((pe.earnings_details->'POSITION_ALLOWANCE'->>'amount')::numeric, 0.00) as position_allowance,
        COALESCE((pe.earnings_details->'CIVIL_SERVANT_ALLOWANCE'->>'amount')::numeric, 0.00) as civil_servant_allowance,
        COALESCE((pe.earnings_details->'BACK_PAY'->>'amount')::numeric, 0.00) as back_pay,
        
        -- 个人扣除项目明细展开 (使用代码键名)
        COALESCE((pe.deductions_details->'PERSONAL_INCOME_TAX'->>'amount')::numeric, 0.00) as personal_income_tax,
        COALESCE((pe.deductions_details->'PENSION_PERSONAL_AMOUNT'->>'amount')::numeric, 0.00) as pension_personal,
        COALESCE((pe.deductions_details->'MEDICAL_INS_PERSONAL_AMOUNT'->>'amount')::numeric, 0.00) as medical_personal,
        COALESCE((pe.deductions_details->'UNEMPLOYMENT_PERSONAL_AMOUNT'->>'amount')::numeric, 0.00) as unemployment_personal,
        COALESCE((pe.deductions_details->'HOUSING_FUND_PERSONAL'->>'amount')::numeric, 0.00) as housing_fund_personal,
        COALESCE((pe.deductions_details->'ANNUITY_PERSONAL'->>'amount')::numeric, 0.00) as annuity_personal,
        COALESCE((pe.deductions_details->'ADJUSTMENT_DEDUCTION'->>'amount')::numeric, 0.00) as adjustment_deduction,
        COALESCE((pe.deductions_details->'SOCIAL_SECURITY_ADJUSTMENT'->>'amount')::numeric, 0.00) as social_security_adjustment,
        
        -- 计算衍生字段
        (COALESCE((pe.earnings_details->'BASIC_SALARY'->>'amount')::numeric, 0.00) + 
         COALESCE((pe.earnings_details->'POSITION_SALARY_GENERAL'->>'amount')::numeric, 0.00) + 
         COALESCE((pe.earnings_details->'GRADE_SALARY'->>'amount')::numeric, 0.00)) as basic_wage_total,
        
        (COALESCE((pe.earnings_details->'PERFORMANCE_SALARY'->>'amount')::numeric, 0.00) + 
         COALESCE((pe.earnings_details->'BASIC_PERFORMANCE'->>'amount')::numeric, 0.00) + 
         COALESCE((pe.earnings_details->'PERFORMANCE_WAGE'->>'amount')::numeric, 0.00)) as performance_total,
        
        (COALESCE((pe.earnings_details->'ALLOWANCE_GENERAL'->>'amount')::numeric, 0.00) + 
         COALESCE((pe.earnings_details->'SUBSIDY'->>'amount')::numeric, 0.00) + 
         COALESCE((pe.earnings_details->'TRAFFIC_ALLOWANCE'->>'amount')::numeric, 0.00) + 
         COALESCE((pe.earnings_details->'POSITION_ALLOWANCE'->>'amount')::numeric, 0.00)) as allowance_total,
        
        (COALESCE((pe.deductions_details->'PENSION_PERSONAL_AMOUNT'->>'amount')::numeric, 0.00) + 
         COALESCE((pe.deductions_details->'MEDICAL_INS_PERSONAL_AMOUNT'->>'amount')::numeric, 0.00) + 
         COALESCE((pe.deductions_details->'UNEMPLOYMENT_PERSONAL_AMOUNT'->>'amount')::numeric, 0.00) + 
         COALESCE((pe.deductions_details->'HOUSING_FUND_PERSONAL'->>'amount')::numeric, 0.00) + 
         COALESCE((pe.deductions_details->'ANNUITY_PERSONAL'->>'amount')::numeric, 0.00)) as social_insurance_total,
        
        -- 原始JSONB字段保留（兼容性）
        pe.earnings_details,
        pe.deductions_details,
        
        -- 时间字段
        pe.calculated_at,
        pe.updated_at,
        
        -- 额外的关联字段
        e.department_id,
        e.actual_position_id,
        pc.name as personnel_category_name
    FROM payroll.payroll_entries pe
    JOIN hr.employees e ON pe.employee_id = e.id
    LEFT JOIN hr.departments d ON e.department_id = d.id
    LEFT JOIN hr.positions p ON e.actual_position_id = p.id
    LEFT JOIN payroll.payroll_periods pp ON pe.payroll_period_id = pp.id
    LEFT JOIN hr.personnel_categories pc ON e.personnel_category_id = pc.id;
    """)
    
    # 重新创建薪资汇总分析视图，修正姓名格式并使用正确的JSONB键名
    op.execute("DROP VIEW IF EXISTS v_payroll_summary_analysis;")
    op.execute("""
    CREATE VIEW v_payroll_summary_analysis AS
    SELECT 
        pp.id as period_id,
        pp.name as period_name,
        d.id as department_id,
        d.name as department_name,
        
        -- 人数统计
        COUNT(pe.id) as employee_count,
        COUNT(DISTINCT pe.employee_id) as unique_employee_count,
        
        -- 基础工资汇总
        SUM(COALESCE(pe.gross_pay, 0)) as total_gross_pay,
        SUM(COALESCE(pe.net_pay, 0)) as total_net_pay,
        SUM(COALESCE(pe.total_deductions, 0)) as total_deductions,
        
        -- 平均工资
        AVG(COALESCE(pe.gross_pay, 0)) as avg_gross_pay,
        AVG(COALESCE(pe.net_pay, 0)) as avg_net_pay,
        AVG(COALESCE(pe.total_deductions, 0)) as avg_deductions,
        
        -- 主要收入项目汇总（使用正确的JSONB键名）
        SUM(COALESCE((pe.earnings_details->'BASIC_SALARY'->>'amount')::numeric, 0)) as total_basic_salary,
        SUM(COALESCE((pe.earnings_details->'PERFORMANCE_SALARY'->>'amount')::numeric, 0)) as total_performance_salary,
        SUM(COALESCE((pe.earnings_details->'ALLOWANCE_GENERAL'->>'amount')::numeric, 0)) as total_allowance,
        SUM(COALESCE((pe.earnings_details->'SUBSIDY'->>'amount')::numeric, 0)) as total_subsidy,
        
        -- 主要扣除项目汇总（使用正确的JSONB键名）
        SUM(COALESCE((pe.deductions_details->'PERSONAL_INCOME_TAX'->>'amount')::numeric, 0)) as total_income_tax,
        SUM(COALESCE((pe.deductions_details->'PENSION_PERSONAL_AMOUNT'->>'amount')::numeric, 0)) as total_pension_deduction,
        SUM(COALESCE((pe.deductions_details->'MEDICAL_INS_PERSONAL_AMOUNT'->>'amount')::numeric, 0)) as total_medical_deduction,
        SUM(COALESCE((pe.deductions_details->'HOUSING_FUND_PERSONAL'->>'amount')::numeric, 0)) as total_housing_fund_deduction,
        
        -- 统计日期
        MIN(pe.calculated_at) as first_entry_date,
        MAX(pe.updated_at) as last_updated_date
    FROM payroll.payroll_periods pp
    LEFT JOIN payroll.payroll_entries pe ON pp.id = pe.payroll_period_id
    LEFT JOIN hr.employees e ON pe.employee_id = e.id
    LEFT JOIN hr.departments d ON e.department_id = d.id
    WHERE 1=1
    GROUP BY pp.id, pp.name, d.id, d.name
    ORDER BY pp.name DESC, d.name;
    """)


def downgrade() -> None:
    """Downgrade schema."""
    # 恢复原来的视图格式（名 + 姓）
    op.execute("DROP VIEW IF EXISTS v_payroll_summary_analysis;")
    op.execute("DROP VIEW IF EXISTS v_payroll_entries_detailed;")
    op.execute("DROP VIEW IF EXISTS v_payroll_entries_basic;")
    op.execute("DROP VIEW IF EXISTS v_employees_basic;")
    
    # 重新创建原来格式的视图（这里可以省略，因为通常不会降级）
