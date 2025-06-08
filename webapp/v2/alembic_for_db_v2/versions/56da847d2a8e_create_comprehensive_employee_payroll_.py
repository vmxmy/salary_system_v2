"""create_comprehensive_employee_payroll_view

Revision ID: 56da847d2a8e
Revises: 73a4938a6f34
Create Date: 2025-06-08 20:13:18.579709

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '56da847d2a8e'
down_revision: Union[str, None] = '73a4938a6f34'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    
    # 创建完整的员工薪资视图，包含员工基本信息和详细薪资记录
    op.execute("""
    CREATE VIEW reports.v_comprehensive_employee_payroll AS
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
        -- 薪资记录基本信息
        pe.id AS payroll_entry_id,
        pe.payroll_period_id,
        pe.payroll_run_id,
        
        -- 员工基本信息（来自 v_employees_basic）
        e.id AS employee_id,
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
        e.personnel_category_id,
        
        -- 薪资期间信息
        pp.name AS payroll_period_name,
        pp.start_date AS payroll_period_start_date,
        pp.end_date AS payroll_period_end_date,
        pp.pay_date AS payroll_pay_date,
        pr.run_date AS payroll_run_date,
        
        -- 薪资汇总信息
        pe.gross_pay,
        pe.total_deductions,
        pe.net_pay,
        
        -- 应发项目（EARNING）
        ((pe.earnings_details -> 'BASIC_SALARY') ->> 'amount')::numeric AS basic_salary,
        ((pe.earnings_details -> 'ONLY_CHILD_PARENT_BONUS') ->> 'amount')::numeric AS only_child_parent_bonus,
        ((pe.earnings_details -> 'TRAFFIC_ALLOWANCE') ->> 'amount')::numeric AS traffic_allowance,
        ((pe.earnings_details -> 'PERFORMANCE_BONUS') ->> 'amount')::numeric AS performance_bonus,
        ((pe.earnings_details -> 'BASIC_PERFORMANCE_AWARD') ->> 'amount')::numeric AS basic_performance_award,
        ((pe.earnings_details -> 'BASIC_PERFORMANCE_SALARY') ->> 'amount')::numeric AS basic_performance_salary,
        ((pe.earnings_details -> 'BACK_PAY') ->> 'amount')::numeric AS back_pay,
        ((pe.earnings_details -> 'POSITION_ALLOWANCE') ->> 'amount')::numeric AS position_allowance,
        ((pe.earnings_details -> 'PETITION_ALLOWANCE') ->> 'amount')::numeric AS petition_allowance,
        ((pe.earnings_details -> 'POSITION_SALARY_GENERAL') ->> 'amount')::numeric AS position_salary_general,
        ((pe.earnings_details -> 'REFORM_ALLOWANCE_1993') ->> 'amount')::numeric AS reform_allowance_1993,
        ((pe.earnings_details -> 'CIVIL_STANDARD_ALLOWANCE') ->> 'amount')::numeric AS civil_standard_allowance,
        ((pe.earnings_details -> 'PROBATION_SALARY') ->> 'amount')::numeric AS probation_salary,
        ((pe.earnings_details -> 'STAFF_SALARY_GRADE') ->> 'amount')::numeric AS staff_salary_grade,
        ((pe.earnings_details -> 'GRADE_SALARY') ->> 'amount')::numeric AS grade_salary,
        ((pe.earnings_details -> 'SALARY_GRADE') ->> 'amount')::numeric AS salary_grade,
        ((pe.earnings_details -> 'POSITION_TECH_GRADE_SALARY') ->> 'amount')::numeric AS position_tech_grade_salary,
        ((pe.earnings_details -> 'GRADE_POSITION_LEVEL_SALARY') ->> 'amount')::numeric AS grade_position_level_salary,
        ((pe.earnings_details -> 'PERFORMANCE_BONUS_BACK_PAY') ->> 'amount')::numeric AS performance_bonus_back_pay,
        ((pe.earnings_details -> 'TOWNSHIP_ALLOWANCE') ->> 'amount')::numeric AS township_allowance,
        ((pe.earnings_details -> 'PERFORMANCE_SALARY') ->> 'amount')::numeric AS performance_salary,
        ((pe.earnings_details -> 'ALLOWANCE_GENERAL') ->> 'amount')::numeric AS allowance_general,
        ((pe.earnings_details -> 'BASIC_PERFORMANCE') ->> 'amount')::numeric AS basic_performance,
        ((pe.earnings_details -> 'GENERAL_ALLOWANCE') ->> 'amount')::numeric AS general_allowance,
        ((pe.earnings_details -> 'QUARTERLY_PERFORMANCE_ASSESSMENT') ->> 'amount')::numeric AS quarterly_performance_assessment,
        ((pe.earnings_details -> 'QUARTERLY_PERFORMANCE_Q1') ->> 'amount')::numeric AS quarterly_performance_q1,
        ((pe.earnings_details -> 'MONTHLY_PERFORMANCE_BONUS') ->> 'amount')::numeric AS monthly_performance_bonus,
        
        -- 个人扣除项目（PERSONAL_DEDUCTION）
        ((pe.deductions_details -> 'PERSONAL_INCOME_TAX') ->> 'amount')::numeric AS personal_income_tax,
        ((pe.deductions_details -> 'PENSION_PERSONAL_AMOUNT') ->> 'amount')::numeric AS pension_personal_amount,
        ((pe.deductions_details -> 'MEDICAL_INS_PERSONAL_AMOUNT') ->> 'amount')::numeric AS medical_ins_personal_amount,
        ((pe.deductions_details -> 'MEDICAL_INS_PERSONAL_TOTAL') ->> 'amount')::numeric AS medical_ins_personal_total,
        ((pe.deductions_details -> 'UNEMPLOYMENT_PERSONAL_AMOUNT') ->> 'amount')::numeric AS unemployment_personal_amount,
        ((pe.deductions_details -> 'OCCUPATIONAL_PENSION_PERSONAL_AMOUNT') ->> 'amount')::numeric AS occupational_pension_personal_amount,
        ((pe.deductions_details -> 'HOUSING_FUND_PERSONAL') ->> 'amount')::numeric AS housing_fund_personal,
        ((pe.deductions_details -> 'ONE_TIME_ADJUSTMENT') ->> 'amount')::numeric AS one_time_adjustment,
        ((pe.deductions_details -> 'PERFORMANCE_BONUS_ADJUSTMENT') ->> 'amount')::numeric AS performance_bonus_adjustment,
        ((pe.deductions_details -> 'REWARD_PERFORMANCE_ADJUSTMENT') ->> 'amount')::numeric AS reward_performance_adjustment,
        ((pe.deductions_details -> 'PERFORMANCE_BONUS_DEDUCTION_ADJUSTMENT') ->> 'amount')::numeric AS performance_bonus_deduction_adjustment,
        ((pe.deductions_details -> 'SOCIAL_INSURANCE_ADJUSTMENT') ->> 'amount')::numeric AS social_insurance_adjustment,
        ((pe.deductions_details -> 'REFUND_DEDUCTION_ADJUSTMENT') ->> 'amount')::numeric AS refund_deduction_adjustment,
        ((pe.deductions_details -> 'MEDICAL_2022_DEDUCTION_ADJUSTMENT') ->> 'amount')::numeric AS medical_2022_deduction_adjustment,
        
        -- 单位扣除项目（EMPLOYER_DEDUCTION）
        ((pe.deductions_details -> 'PENSION_EMPLOYER_AMOUNT') ->> 'amount')::numeric AS pension_employer_amount,
        ((pe.deductions_details -> 'MEDICAL_INS_EMPLOYER_AMOUNT') ->> 'amount')::numeric AS medical_ins_employer_amount,
        ((pe.deductions_details -> 'MEDICAL_INS_EMPLOYER_TOTAL') ->> 'amount')::numeric AS medical_ins_employer_total,
        ((pe.deductions_details -> 'SERIOUS_ILLNESS_EMPLOYER_AMOUNT') ->> 'amount')::numeric AS serious_illness_employer_amount,
        ((pe.deductions_details -> 'UNEMPLOYMENT_EMPLOYER_AMOUNT') ->> 'amount')::numeric AS unemployment_employer_amount,
        ((pe.deductions_details -> 'INJURY_EMPLOYER_AMOUNT') ->> 'amount')::numeric AS injury_employer_amount,
        ((pe.deductions_details -> 'OCCUPATIONAL_PENSION_EMPLOYER_AMOUNT') ->> 'amount')::numeric AS occupational_pension_employer_amount,
        ((pe.deductions_details -> 'HOUSING_FUND_EMPLOYER') ->> 'amount')::numeric AS housing_fund_employer,
        
        -- 计算基数（CALCULATION_BASE）
        ((pe.calculation_inputs -> 'PENSION_BASE') ->> 'amount')::numeric AS pension_base,
        ((pe.calculation_inputs -> 'MEDICAL_INS_BASE') ->> 'amount')::numeric AS medical_ins_base,
        ((pe.calculation_inputs -> 'MEDICAL_INS_BASE_SALARY') ->> 'amount')::numeric AS medical_ins_base_salary,
        ((pe.calculation_inputs -> 'MEDICAL_INS_PAY_SALARY') ->> 'amount')::numeric AS medical_ins_pay_salary,
        ((pe.calculation_inputs -> 'OCCUPATIONAL_PENSION_BASE') ->> 'amount')::numeric AS occupational_pension_base,
        ((pe.calculation_inputs -> 'OCCUPATIONAL_PENSION_PAY_SALARY') ->> 'amount')::numeric AS occupational_pension_pay_salary,
        ((pe.calculation_inputs -> 'TAX_BASE') ->> 'amount')::numeric AS tax_base,
        ((pe.calculation_inputs -> 'HOUSING_FUND_BASE') ->> 'amount')::numeric AS housing_fund_base,
        
        -- 计算费率（CALCULATION_RATE）
        ((pe.calculation_inputs -> 'PENSION_PERSONAL_RATE') ->> 'amount')::numeric AS pension_personal_rate,
        ((pe.calculation_inputs -> 'PENSION_EMPLOYER_RATE') ->> 'amount')::numeric AS pension_employer_rate,
        ((pe.calculation_inputs -> 'MEDICAL_INS_PERSONAL_RATE') ->> 'amount')::numeric AS medical_ins_personal_rate,
        ((pe.calculation_inputs -> 'MEDICAL_INS_EMPLOYER_RATE') ->> 'amount')::numeric AS medical_ins_employer_rate,
        ((pe.calculation_inputs -> 'SERIOUS_ILLNESS_EMPLOYER_RATE') ->> 'amount')::numeric AS serious_illness_employer_rate,
        ((pe.calculation_inputs -> 'OCCUPATIONAL_PENSION_PERSONAL_RATE') ->> 'amount')::numeric AS occupational_pension_personal_rate,
        ((pe.calculation_inputs -> 'OCCUPATIONAL_PENSION_EMPLOYER_RATE') ->> 'amount')::numeric AS occupational_pension_employer_rate,
        ((pe.calculation_inputs -> 'TAX_RATE') ->> 'amount')::numeric AS tax_rate,
        ((pe.calculation_inputs -> 'HOUSING_FUND_PERSONAL_RATE') ->> 'amount')::numeric AS housing_fund_personal_rate,
        ((pe.calculation_inputs -> 'HOUSING_FUND_EMPLOYER_RATE') ->> 'amount')::numeric AS housing_fund_employer_rate,
        
        -- 计算结果（CALCULATION_RESULT）
        ((pe.calculation_inputs -> 'TAX_EXEMPT_AMOUNT') ->> 'amount')::numeric AS tax_exempt_amount,
        ((pe.calculation_inputs -> 'TAXABLE_INCOME') ->> 'amount')::numeric AS taxable_income,
        ((pe.calculation_inputs -> 'TAX_DEDUCTION_AMOUNT') ->> 'amount')::numeric AS tax_deduction_amount,
        ((pe.calculation_inputs -> 'AFTER_TAX_SALARY') ->> 'amount')::numeric AS after_tax_salary,
        ((pe.calculation_inputs -> 'QUICK_DEDUCTION') ->> 'amount')::numeric AS quick_deduction,
        
        -- 其他字段（OTHER）
        ((pe.calculation_inputs -> 'UNIFIED_PAYROLL_FLAG') ->> 'amount')::numeric AS unified_payroll_flag,
        ((pe.calculation_inputs -> 'FISCAL_SUPPORT_FLAG') ->> 'amount')::numeric AS fiscal_support_flag,
        ((pe.calculation_inputs -> 'ANNUAL_FIXED_SALARY_TOTAL') ->> 'amount')::numeric AS annual_fixed_salary_total,
        
        -- 薪资记录状态和时间信息
        ls_entry.name AS payroll_entry_status,
        pe.remarks AS payroll_entry_remarks,
        pe.calculated_at,
        pe.updated_at,
        pe.audit_status,
        pe.audit_timestamp,
        pe.audit_notes,
        pe.version,
        
        -- 原始 JSONB 数据（用于调试或特殊需求）
        pe.earnings_details AS raw_earnings_details,
        pe.deductions_details AS raw_deductions_details,
        pe.calculation_inputs AS raw_calculation_inputs,
        pe.calculation_log AS raw_calculation_log
        
    FROM payroll.payroll_entries pe
        JOIN hr.employees e ON pe.employee_id = e.id
        LEFT JOIN hr.departments d ON e.department_id = d.id
        LEFT JOIN hr.positions p ON e.actual_position_id = p.id
        LEFT JOIN hr.personnel_categories pc ON e.personnel_category_id = pc.id
        LEFT JOIN personnel_hierarchy ph ON pc.id = ph.id
        LEFT JOIN config.lookup_values lv_status ON e.status_lookup_value_id = lv_status.id
        JOIN payroll.payroll_periods pp ON pe.payroll_period_id = pp.id
        JOIN payroll.payroll_runs pr ON pe.payroll_run_id = pr.id
        LEFT JOIN config.lookup_values ls_entry ON pe.status_lookup_value_id = ls_entry.id;
    """)


def downgrade() -> None:
    """Downgrade schema."""
    
    # 删除完整的员工薪资视图
    op.execute("DROP VIEW IF EXISTS reports.v_comprehensive_employee_payroll CASCADE")
