"""修正视图中JSONB字符串的解析逻辑

Revision ID: 944eb15444b1
Revises: a174d7a602d8
Create Date: 2025-06-04 20:49:20.869502

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '944eb15444b1'
down_revision: Union[str, None] = 'a174d7a602d8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    
    # 1. 修正 v_payroll_entries_detailed 视图
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
        pe.gross_pay,
        pe.net_pay,
        pe.total_deductions,

        -- 收入项目明细展开 (修正JSONB解析)
        COALESCE((((pe.earnings_details#>>'{}')::jsonb)->'BASIC_SALARY'->>'amount')::numeric, 0.00) as basic_salary,
        COALESCE((((pe.earnings_details#>>'{}')::jsonb)->'PERFORMANCE_SALARY'->>'amount')::numeric, 0.00) as performance_salary,
        COALESCE((((pe.earnings_details#>>'{}')::jsonb)->'POSITION_SALARY_GENERAL'->>'amount')::numeric, 0.00) as position_salary,
        COALESCE((((pe.earnings_details#>>'{}')::jsonb)->'GRADE_SALARY'->>'amount')::numeric, 0.00) as grade_salary,
        COALESCE((((pe.earnings_details#>>'{}')::jsonb)->'ALLOWANCE_GENERAL'->>'amount')::numeric, 0.00) as allowance,
        COALESCE((((pe.earnings_details#>>'{}')::jsonb)->'SUBSIDY'->>'amount')::numeric, 0.00) as subsidy,
        COALESCE((((pe.earnings_details#>>'{}')::jsonb)->'BASIC_PERFORMANCE'->>'amount')::numeric, 0.00) as basic_performance_salary,
        COALESCE((((pe.earnings_details#>>'{}')::jsonb)->'PERFORMANCE_WAGE'->>'amount')::numeric, 0.00) as performance_wage,
        COALESCE((((pe.earnings_details#>>'{}')::jsonb)->'TRAFFIC_ALLOWANCE'->>'amount')::numeric, 0.00) as traffic_allowance,
        COALESCE((((pe.earnings_details#>>'{}')::jsonb)->'ONLY_CHILD_PARENT_BONUS'->>'amount')::numeric, 0.00) as only_child_bonus,
        COALESCE((((pe.earnings_details#>>'{}')::jsonb)->'TOWNSHIP_ALLOWANCE'->>'amount')::numeric, 0.00) as township_allowance,
        COALESCE((((pe.earnings_details#>>'{}')::jsonb)->'POSITION_ALLOWANCE'->>'amount')::numeric, 0.00) as position_allowance,
        COALESCE((((pe.earnings_details#>>'{}')::jsonb)->'CIVIL_SERVANT_ALLOWANCE'->>'amount')::numeric, 0.00) as civil_servant_allowance,
        COALESCE((((pe.earnings_details#>>'{}')::jsonb)->'BACK_PAY'->>'amount')::numeric, 0.00) as back_pay,
        
        -- 个人扣除项目明细展开 (修正JSONB解析)
        COALESCE((((pe.deductions_details#>>'{}')::jsonb)->'PERSONAL_INCOME_TAX'->>'amount')::numeric, 0.00) as personal_income_tax,
        COALESCE((((pe.deductions_details#>>'{}')::jsonb)->'PENSION_PERSONAL_AMOUNT'->>'amount')::numeric, 0.00) as pension_personal,
        COALESCE((((pe.deductions_details#>>'{}')::jsonb)->'MEDICAL_INS_PERSONAL_AMOUNT'->>'amount')::numeric, 0.00) as medical_personal,
        COALESCE((((pe.deductions_details#>>'{}')::jsonb)->'UNEMPLOYMENT_PERSONAL_AMOUNT'->>'amount')::numeric, 0.00) as unemployment_personal,
        COALESCE((((pe.deductions_details#>>'{}')::jsonb)->'HOUSING_FUND_PERSONAL'->>'amount')::numeric, 0.00) as housing_fund_personal,
        COALESCE((((pe.deductions_details#>>'{}')::jsonb)->'ANNUITY_PERSONAL'->>'amount')::numeric, 0.00) as annuity_personal, -- Assuming ANNUITY_PERSONAL is the code key in JSON
        COALESCE((((pe.deductions_details#>>'{}')::jsonb)->'ADJUSTMENT_DEDUCTION'->>'amount')::numeric, 0.00) as adjustment_deduction,
        COALESCE((((pe.deductions_details#>>'{}')::jsonb)->'SOCIAL_SECURITY_ADJUSTMENT'->>'amount')::numeric, 0.00) as social_security_adjustment,
        
        -- 计算衍生字段 (修正JSONB解析)
        (COALESCE((((pe.earnings_details#>>'{}')::jsonb)->'BASIC_SALARY'->>'amount')::numeric, 0.00) + 
         COALESCE((((pe.earnings_details#>>'{}')::jsonb)->'POSITION_SALARY_GENERAL'->>'amount')::numeric, 0.00) + 
         COALESCE((((pe.earnings_details#>>'{}')::jsonb)->'GRADE_SALARY'->>'amount')::numeric, 0.00)) as basic_wage_total,
        
        (COALESCE((((pe.earnings_details#>>'{}')::jsonb)->'PERFORMANCE_SALARY'->>'amount')::numeric, 0.00) + 
         COALESCE((((pe.earnings_details#>>'{}')::jsonb)->'BASIC_PERFORMANCE'->>'amount')::numeric, 0.00) + 
         COALESCE((((pe.earnings_details#>>'{}')::jsonb)->'PERFORMANCE_WAGE'->>'amount')::numeric, 0.00)) as performance_total,
        
        (COALESCE((((pe.earnings_details#>>'{}')::jsonb)->'ALLOWANCE_GENERAL'->>'amount')::numeric, 0.00) + 
         COALESCE((((pe.earnings_details#>>'{}')::jsonb)->'SUBSIDY'->>'amount')::numeric, 0.00) + 
         COALESCE((((pe.earnings_details#>>'{}')::jsonb)->'TRAFFIC_ALLOWANCE'->>'amount')::numeric, 0.00) + 
         COALESCE((((pe.earnings_details#>>'{}')::jsonb)->'POSITION_ALLOWANCE'->>'amount')::numeric, 0.00)) as allowance_total,
        
        (COALESCE((((pe.deductions_details#>>'{}')::jsonb)->'PENSION_PERSONAL_AMOUNT'->>'amount')::numeric, 0.00) + 
         COALESCE((((pe.deductions_details#>>'{}')::jsonb)->'MEDICAL_INS_PERSONAL_AMOUNT'->>'amount')::numeric, 0.00) + 
         COALESCE((((pe.deductions_details#>>'{}')::jsonb)->'UNEMPLOYMENT_PERSONAL_AMOUNT'->>'amount')::numeric, 0.00) + 
         COALESCE((((pe.deductions_details#>>'{}')::jsonb)->'HOUSING_FUND_PERSONAL'->>'amount')::numeric, 0.00) + 
         COALESCE((((pe.deductions_details#>>'{}')::jsonb)->'ANNUITY_PERSONAL'->>'amount')::numeric, 0.00)) as social_insurance_total,
        
        pe.earnings_details as raw_earnings_details, -- Keep raw for reference
        pe.deductions_details as raw_deductions_details, -- Keep raw for reference
        pe.calculated_at,
        pe.updated_at,
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

    # 2. 修正 v_payroll_summary_analysis 视图
    op.execute("DROP VIEW IF EXISTS v_payroll_summary_analysis;")
    op.execute("""
    CREATE VIEW v_payroll_summary_analysis AS
    SELECT 
        pp.id as period_id,
        pp.name as period_name,
        d.id as department_id,
        d.name as department_name,
        COUNT(pe.id) as employee_count,
        COUNT(DISTINCT pe.employee_id) as unique_employee_count,
        SUM(COALESCE(pe.gross_pay, 0)) as total_gross_pay,
        SUM(COALESCE(pe.net_pay, 0)) as total_net_pay,
        SUM(COALESCE(pe.total_deductions, 0)) as total_deductions,
        AVG(COALESCE(pe.gross_pay, 0)) as avg_gross_pay,
        AVG(COALESCE(pe.net_pay, 0)) as avg_net_pay,
        AVG(COALESCE(pe.total_deductions, 0)) as avg_deductions,

        -- 主要收入项目汇总 (修正JSONB解析)
        SUM(COALESCE((((pe.earnings_details#>>'{}')::jsonb)->'BASIC_SALARY'->>'amount')::numeric, 0)) as total_basic_salary,
        SUM(COALESCE((((pe.earnings_details#>>'{}')::jsonb)->'PERFORMANCE_SALARY'->>'amount')::numeric, 0)) as total_performance_salary,
        SUM(COALESCE((((pe.earnings_details#>>'{}')::jsonb)->'ALLOWANCE_GENERAL'->>'amount')::numeric, 0)) as total_allowance,
        SUM(COALESCE((((pe.earnings_details#>>'{}')::jsonb)->'SUBSIDY'->>'amount')::numeric, 0)) as total_subsidy,
        
        -- 主要扣除项目汇总 (修正JSONB解析)
        SUM(COALESCE((((pe.deductions_details#>>'{}')::jsonb)->'PERSONAL_INCOME_TAX'->>'amount')::numeric, 0)) as total_income_tax,
        SUM(COALESCE((((pe.deductions_details#>>'{}')::jsonb)->'PENSION_PERSONAL_AMOUNT'->>'amount')::numeric, 0)) as total_pension_deduction,
        SUM(COALESCE((((pe.deductions_details#>>'{}')::jsonb)->'MEDICAL_INS_PERSONAL_AMOUNT'->>'amount')::numeric, 0)) as total_medical_deduction,
        SUM(COALESCE((((pe.deductions_details#>>'{}')::jsonb)->'HOUSING_FUND_PERSONAL'->>'amount')::numeric, 0)) as total_housing_fund_deduction,
        
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

    # 3. 修正 v_payroll_component_usage 视图
    op.execute("DROP VIEW IF EXISTS v_payroll_component_usage;")
    op.execute("""
    CREATE VIEW v_payroll_component_usage AS
    SELECT 
        pcd.id,
        pcd.code,
        pcd.name,
        pcd.type as component_type,
        pcd.is_active,
        
        CASE 
            WHEN pcd.type = 'EARNING' THEN
                (SELECT COUNT(*) 
                 FROM payroll.payroll_entries pe 
                 WHERE ((pe.earnings_details#>>'{}')::jsonb) ? pcd.code
                 AND ((((pe.earnings_details#>>'{}')::jsonb)->pcd.code->>'amount')::numeric) > 0)
            ELSE 0 
        END as earnings_usage_count,
        
        CASE 
            WHEN pcd.type IN ('PERSONAL_DEDUCTION', 'DEDUCTION') THEN
                (SELECT COUNT(*) 
                 FROM payroll.payroll_entries pe 
                 WHERE ((pe.deductions_details#>>'{}')::jsonb) ? pcd.code
                 AND ((((pe.deductions_details#>>'{}')::jsonb)->pcd.code->>'amount')::numeric) > 0)
            ELSE 0 
        END as deductions_usage_count,
        
        CASE 
            WHEN pcd.type = 'EARNING' THEN
                COALESCE((SELECT SUM(((((pe.earnings_details#>>'{}')::jsonb)->pcd.code->>'amount')::numeric)) 
                          FROM payroll.payroll_entries pe 
                          WHERE ((pe.earnings_details#>>'{}')::jsonb) ? pcd.code), 0.00)
            WHEN pcd.type IN ('PERSONAL_DEDUCTION', 'DEDUCTION') THEN
                COALESCE((SELECT SUM(((((pe.deductions_details#>>'{}')::jsonb)->pcd.code->>'amount')::numeric)) 
                          FROM payroll.payroll_entries pe 
                          WHERE ((pe.deductions_details#>>'{}')::jsonb) ? pcd.code), 0.00)
            ELSE 0.00 
        END as total_amount,
        
        CASE 
            WHEN pcd.type = 'EARNING' THEN
                COALESCE((SELECT AVG(((((pe.earnings_details#>>'{}')::jsonb)->pcd.code->>'amount')::numeric)) 
                          FROM payroll.payroll_entries pe 
                          WHERE ((pe.earnings_details#>>'{}')::jsonb) ? pcd.code
                          AND ((((pe.earnings_details#>>'{}')::jsonb)->pcd.code->>'amount')::numeric) > 0), 0.00)
            WHEN pcd.type IN ('PERSONAL_DEDUCTION', 'DEDUCTION') THEN
                COALESCE((SELECT AVG(((((pe.deductions_details#>>'{}')::jsonb)->pcd.code->>'amount')::numeric)) 
                          FROM payroll.payroll_entries pe 
                          WHERE ((pe.deductions_details#>>'{}')::jsonb) ? pcd.code
                          AND ((((pe.deductions_details#>>'{}')::jsonb)->pcd.code->>'amount')::numeric) > 0), 0.00)
            ELSE 0.00 
        END as average_amount,
        
        pcd.display_order,
        pcd.effective_date,
        pcd.end_date
    FROM config.payroll_component_definitions pcd
    WHERE pcd.is_active = true
    ORDER BY pcd.type, pcd.display_order;
    """)

def downgrade() -> None:
    """Downgrade schema."""
    # For downgrade, we'll drop these views. 
    # Restoring them to the 'a174d7a602d8' state would require re-running that migration's upgrade logic.
    op.execute("DROP VIEW IF EXISTS v_payroll_component_usage;")
    op.execute("DROP VIEW IF EXISTS v_payroll_summary_analysis;")
    op.execute("DROP VIEW IF EXISTS v_payroll_entries_detailed;")
    
    # Note: To fully revert, one might need to re-apply the view definitions from migration 'a174d7a602d8'.
    # This can be done by copying the CREATE VIEW statements from a174d7a602d8's upgrade() into this downgrade().
    # For simplicity here, we are just dropping.
    # Example (if full revert needed):
    # op.execute(""" CREATE VIEW v_payroll_entries_detailed AS ... (definition from a174d7a602d8) ... """)
