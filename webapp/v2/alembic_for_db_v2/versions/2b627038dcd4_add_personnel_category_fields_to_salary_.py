"""add_personnel_category_fields_to_salary_view

Revision ID: 2b627038dcd4
Revises: 5eea6b8a2298
Create Date: 2025-06-08 19:45:26.815281

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2b627038dcd4'
down_revision: Union[str, None] = '5eea6b8a2298'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # 删除现有视图
    op.execute("DROP VIEW IF EXISTS reports.employee_salary_details_view")
    
    # 重新创建视图，添加人员身份层级字段
    op.execute("""
    CREATE VIEW reports.employee_salary_details_view AS
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
        pe.id AS payroll_entry_id,
        e.employee_code,
        e.first_name,
        e.last_name,
        d.name AS department_name,
        p.name AS position_name,
        
        -- 人员身份相关字段
        pc.id AS personnel_category_id,
        pc.name AS personnel_category_name,
        ph.root_id AS personnel_root_category_id,
        ph.root_name AS personnel_root_category_name,
        
        pp.name AS payroll_period_name,
        pp.start_date AS payroll_period_start_date,
        pp.end_date AS payroll_period_end_date,
        pp.pay_date AS payroll_pay_date,
        pr.run_date AS payroll_run_date,
        pe.gross_pay,
        pe.total_deductions,
        pe.net_pay,
        
        -- 应发项目
        ((pe.earnings_details -> 'BASIC_SALARY'::text) ->> 'amount'::text)::numeric AS basic_salary,
        ((pe.earnings_details -> 'ONLY_CHILD_PARENT_BONUS'::text) ->> 'amount'::text)::numeric AS only_child_parent_bonus,
        ((pe.earnings_details -> 'TRAFFIC_ALLOWANCE'::text) ->> 'amount'::text)::numeric AS traffic_allowance,
        ((pe.earnings_details -> 'PERFORMANCE_BONUS'::text) ->> 'amount'::text)::numeric AS performance_bonus,
        ((pe.earnings_details -> 'BASIC_PERFORMANCE_AWARD'::text) ->> 'amount'::text)::numeric AS basic_performance_award,
        ((pe.earnings_details -> 'BASIC_PERFORMANCE_SALARY'::text) ->> 'amount'::text)::numeric AS basic_performance_salary,
        ((pe.earnings_details -> 'BACK_PAY'::text) ->> 'amount'::text)::numeric AS back_pay,
        ((pe.earnings_details -> 'POSITION_ALLOWANCE'::text) ->> 'amount'::text)::numeric AS position_allowance,
        ((pe.earnings_details -> 'PETITION_ALLOWANCE'::text) ->> 'amount'::text)::numeric AS petition_allowance,
        ((pe.earnings_details -> 'POSITION_SALARY'::text) ->> 'amount'::text)::numeric AS position_salary,
        ((pe.earnings_details -> 'REFORM_ALLOWANCE_1993'::text) ->> 'amount'::text)::numeric AS reform_allowance_1993,
        ((pe.earnings_details -> 'CIVIL_STANDARD_ALLOWANCE'::text) ->> 'amount'::text)::numeric AS civil_standard_allowance,
        ((pe.earnings_details -> 'PROBATION_SALARY'::text) ->> 'amount'::text)::numeric AS probation_salary,
        ((pe.earnings_details -> 'STAFF_SALARY_GRADE'::text) ->> 'amount'::text)::numeric AS staff_salary_grade,
        ((pe.earnings_details -> 'GRADE_SALARY'::text) ->> 'amount'::text)::numeric AS grade_salary,
        ((pe.earnings_details -> 'SALARY_GRADE'::text) ->> 'amount'::text)::numeric AS salary_grade,
        ((pe.earnings_details -> 'LEVEL_SALARY'::text) ->> 'amount'::text)::numeric AS level_salary,
        ((pe.earnings_details -> 'TECH_GRADE_SALARY'::text) ->> 'amount'::text)::numeric AS tech_grade_salary,
        ((pe.earnings_details -> 'WORKER_POSITION_SALARY'::text) ->> 'amount'::text)::numeric AS worker_position_salary,
        ((pe.earnings_details -> 'STAFF_POSITION_SALARY'::text) ->> 'amount'::text)::numeric AS staff_position_salary,
        ((pe.earnings_details -> 'POSITION_TECH_GRADE_SALARY'::text) ->> 'amount'::text)::numeric AS position_tech_grade_salary,
        ((pe.earnings_details -> 'GRADE_POSITION_LEVEL_SALARY'::text) ->> 'amount'::text)::numeric AS grade_position_level_salary,
        ((pe.earnings_details -> 'POSITION_SALARY_GENERAL'::text) ->> 'amount'::text)::numeric AS position_salary_general,
        ((pe.earnings_details -> 'PERFORMANCE_BONUS_BACK_PAY'::text) ->> 'amount'::text)::numeric AS performance_bonus_back_pay,
        ((pe.earnings_details -> 'TOWNSHIP_ALLOWANCE'::text) ->> 'amount'::text)::numeric AS township_allowance,
        ((pe.earnings_details -> 'PERFORMANCE_SALARY'::text) ->> 'amount'::text)::numeric AS performance_salary,
        ((pe.earnings_details -> 'ALLOWANCE_GENERAL'::text) ->> 'amount'::text)::numeric AS allowance_general,
        ((pe.earnings_details -> 'BASIC_PERFORMANCE'::text) ->> 'amount'::text)::numeric AS basic_performance,
        ((pe.earnings_details -> 'GENERAL_ALLOWANCE'::text) ->> 'amount'::text)::numeric AS general_allowance,
        ((pe.earnings_details -> 'QUARTERLY_PERFORMANCE_ASSESSMENT'::text) ->> 'amount'::text)::numeric AS quarterly_performance_assessment,
        ((pe.earnings_details -> 'ONE_TIME_ADJUSTMENT'::text) ->> 'amount'::text)::numeric AS one_time_adjustment_earning,
        ((pe.earnings_details -> 'PERFORMANCE_BONUS_ADJUSTMENT'::text) ->> 'amount'::text)::numeric AS performance_bonus_adjustment_earning,
        ((pe.earnings_details -> 'REWARD_PERFORMANCE_ADJUSTMENT'::text) ->> 'amount'::text)::numeric AS reward_performance_adjustment_earning,
        ((pe.earnings_details -> 'REFUND_ADJUSTMENT'::text) ->> 'amount'::text)::numeric AS refund_adjustment_earning,
        
        -- 扣除项目
        ((pe.deductions_details -> 'PENSION_EMPLOYER_AMOUNT'::text) ->> 'amount'::text)::numeric AS pension_employer_amount,
        ((pe.deductions_details -> 'PENSION_PERSONAL_AMOUNT'::text) ->> 'amount'::text)::numeric AS pension_personal_amount,
        ((pe.deductions_details -> 'UNEMPLOYMENT_PERSONAL_AMOUNT'::text) ->> 'amount'::text)::numeric AS unemployment_personal_amount,
        ((pe.deductions_details -> 'INJURY_EMPLOYER_AMOUNT'::text) ->> 'amount'::text)::numeric AS injury_employer_amount,
        ((pe.deductions_details -> 'OCCUPATIONAL_PENSION_EMPLOYER_AMOUNT'::text) ->> 'amount'::text)::numeric AS occupational_pension_employer_amount,
        ((pe.deductions_details -> 'OCCUPATIONAL_PENSION_PERSONAL_AMOUNT'::text) ->> 'amount'::text)::numeric AS occupational_pension_personal_amount,
        ((pe.deductions_details -> 'MEDICAL_INS_PERSONAL_AMOUNT'::text) ->> 'amount'::text)::numeric AS medical_ins_personal_amount,
        ((pe.deductions_details -> 'MEDICAL_INS_PERSONAL_TOTAL'::text) ->> 'amount'::text)::numeric AS medical_ins_personal_total,
        ((pe.deductions_details -> 'MEDICAL_INS_EMPLOYER_AMOUNT'::text) ->> 'amount'::text)::numeric AS medical_ins_employer_amount,
        ((pe.deductions_details -> 'SERIOUS_ILLNESS_EMPLOYER_AMOUNT'::text) ->> 'amount'::text)::numeric AS serious_illness_employer_amount,
        ((pe.deductions_details -> 'MEDICAL_INS_EMPLOYER_TOTAL'::text) ->> 'amount'::text)::numeric AS medical_ins_employer_total,
        ((pe.deductions_details -> 'HOUSING_FUND_PERSONAL'::text) ->> 'amount'::text)::numeric AS housing_fund_personal,
        ((pe.deductions_details -> 'HOUSING_FUND_EMPLOYER'::text) ->> 'amount'::text)::numeric AS housing_fund_employer,
        ((pe.deductions_details -> 'PERSONAL_INCOME_TAX'::text) ->> 'amount'::text)::numeric AS personal_income_tax,
        ((pe.deductions_details -> 'SOCIAL_INSURANCE_ADJUSTMENT'::text) ->> 'amount'::text)::numeric AS social_insurance_adjustment,
        ((pe.deductions_details -> 'UNEMPLOYMENT_EMPLOYER_AMOUNT'::text) ->> 'amount'::text)::numeric AS unemployment_employer_amount,
        ((pe.deductions_details -> 'ONE_TIME_ADJUSTMENT'::text) ->> 'amount'::text)::numeric AS one_time_adjustment_deduction,
        ((pe.deductions_details -> 'PERFORMANCE_BONUS_DEDUCTION_ADJUSTMENT'::text) ->> 'amount'::text)::numeric AS performance_bonus_deduction_adjustment,
        ((pe.deductions_details -> 'REWARD_PERFORMANCE_DEDUCTION_ADJUSTMENT'::text) ->> 'amount'::text)::numeric AS reward_performance_deduction_adjustment,
        ((pe.deductions_details -> 'REFUND_DEDUCTION_ADJUSTMENT'::text) ->> 'amount'::text)::numeric AS refund_deduction_adjustment,
        ((pe.deductions_details -> 'MEDICAL_2022_DEDUCTION_ADJUSTMENT'::text) ->> 'amount'::text)::numeric AS medical_2022_deduction_adjustment,
        
        ls.name AS payroll_entry_status,
        pe.remarks AS payroll_entry_remarks,
        pe.calculation_inputs AS raw_calculation_inputs,
        pe.calculation_log AS raw_calculation_log
    FROM payroll.payroll_entries pe
        JOIN hr.employees e ON pe.employee_id = e.id
        LEFT JOIN hr.departments d ON e.department_id = d.id
        LEFT JOIN hr.positions p ON e.actual_position_id = p.id
        LEFT JOIN hr.personnel_categories pc ON e.personnel_category_id = pc.id
        LEFT JOIN personnel_hierarchy ph ON pc.id = ph.id
        JOIN payroll.payroll_periods pp ON pe.payroll_period_id = pp.id
        JOIN payroll.payroll_runs pr ON pe.payroll_run_id = pr.id
        LEFT JOIN config.lookup_values ls ON pe.status_lookup_value_id = ls.id;
    """)


def downgrade() -> None:
    """Downgrade schema."""
    # 删除修改后的视图
    op.execute("DROP VIEW IF EXISTS reports.employee_salary_details_view")
    
    # 恢复原始视图（不包含人员身份字段）
    op.execute("""
    CREATE VIEW reports.employee_salary_details_view AS
    SELECT 
        pe.id AS payroll_entry_id,
        e.employee_code,
        e.first_name,
        e.last_name,
        d.name AS department_name,
        p.name AS position_name,
        pp.name AS payroll_period_name,
        pp.start_date AS payroll_period_start_date,
        pp.end_date AS payroll_period_end_date,
        pp.pay_date AS payroll_pay_date,
        pr.run_date AS payroll_run_date,
        pe.gross_pay,
        pe.total_deductions,
        pe.net_pay,
        ((pe.earnings_details -> 'BASIC_SALARY'::text) ->> 'amount'::text)::numeric AS basic_salary,
        ((pe.earnings_details -> 'ONLY_CHILD_PARENT_BONUS'::text) ->> 'amount'::text)::numeric AS only_child_parent_bonus,
        ((pe.earnings_details -> 'TRAFFIC_ALLOWANCE'::text) ->> 'amount'::text)::numeric AS traffic_allowance,
        ((pe.earnings_details -> 'PERFORMANCE_BONUS'::text) ->> 'amount'::text)::numeric AS performance_bonus,
        ((pe.earnings_details -> 'BASIC_PERFORMANCE_AWARD'::text) ->> 'amount'::text)::numeric AS basic_performance_award,
        ((pe.earnings_details -> 'BASIC_PERFORMANCE_SALARY'::text) ->> 'amount'::text)::numeric AS basic_performance_salary,
        ((pe.earnings_details -> 'BACK_PAY'::text) ->> 'amount'::text)::numeric AS back_pay,
        ((pe.earnings_details -> 'POSITION_ALLOWANCE'::text) ->> 'amount'::text)::numeric AS position_allowance,
        ((pe.earnings_details -> 'PETITION_ALLOWANCE'::text) ->> 'amount'::text)::numeric AS petition_allowance,
        ((pe.earnings_details -> 'POSITION_SALARY'::text) ->> 'amount'::text)::numeric AS position_salary,
        ((pe.earnings_details -> 'REFORM_ALLOWANCE_1993'::text) ->> 'amount'::text)::numeric AS reform_allowance_1993,
        ((pe.earnings_details -> 'CIVIL_STANDARD_ALLOWANCE'::text) ->> 'amount'::text)::numeric AS civil_standard_allowance,
        ((pe.earnings_details -> 'PROBATION_SALARY'::text) ->> 'amount'::text)::numeric AS probation_salary,
        ((pe.earnings_details -> 'STAFF_SALARY_GRADE'::text) ->> 'amount'::text)::numeric AS staff_salary_grade,
        ((pe.earnings_details -> 'GRADE_SALARY'::text) ->> 'amount'::text)::numeric AS grade_salary,
        ((pe.earnings_details -> 'SALARY_GRADE'::text) ->> 'amount'::text)::numeric AS salary_grade,
        ((pe.earnings_details -> 'LEVEL_SALARY'::text) ->> 'amount'::text)::numeric AS level_salary,
        ((pe.earnings_details -> 'TECH_GRADE_SALARY'::text) ->> 'amount'::text)::numeric AS tech_grade_salary,
        ((pe.earnings_details -> 'WORKER_POSITION_SALARY'::text) ->> 'amount'::text)::numeric AS worker_position_salary,
        ((pe.earnings_details -> 'STAFF_POSITION_SALARY'::text) ->> 'amount'::text)::numeric AS staff_position_salary,
        ((pe.earnings_details -> 'POSITION_TECH_GRADE_SALARY'::text) ->> 'amount'::text)::numeric AS position_tech_grade_salary,
        ((pe.earnings_details -> 'GRADE_POSITION_LEVEL_SALARY'::text) ->> 'amount'::text)::numeric AS grade_position_level_salary,
        ((pe.earnings_details -> 'POSITION_SALARY_GENERAL'::text) ->> 'amount'::text)::numeric AS position_salary_general,
        ((pe.earnings_details -> 'PERFORMANCE_BONUS_BACK_PAY'::text) ->> 'amount'::text)::numeric AS performance_bonus_back_pay,
        ((pe.earnings_details -> 'TOWNSHIP_ALLOWANCE'::text) ->> 'amount'::text)::numeric AS township_allowance,
        ((pe.earnings_details -> 'PERFORMANCE_SALARY'::text) ->> 'amount'::text)::numeric AS performance_salary,
        ((pe.earnings_details -> 'ALLOWANCE_GENERAL'::text) ->> 'amount'::text)::numeric AS allowance_general,
        ((pe.earnings_details -> 'BASIC_PERFORMANCE'::text) ->> 'amount'::text)::numeric AS basic_performance,
        ((pe.earnings_details -> 'GENERAL_ALLOWANCE'::text) ->> 'amount'::text)::numeric AS general_allowance,
        ((pe.earnings_details -> 'QUARTERLY_PERFORMANCE_ASSESSMENT'::text) ->> 'amount'::text)::numeric AS quarterly_performance_assessment,
        ((pe.earnings_details -> 'ONE_TIME_ADJUSTMENT'::text) ->> 'amount'::text)::numeric AS one_time_adjustment_earning,
        ((pe.earnings_details -> 'PERFORMANCE_BONUS_ADJUSTMENT'::text) ->> 'amount'::text)::numeric AS performance_bonus_adjustment_earning,
        ((pe.earnings_details -> 'REWARD_PERFORMANCE_ADJUSTMENT'::text) ->> 'amount'::text)::numeric AS reward_performance_adjustment_earning,
        ((pe.earnings_details -> 'REFUND_ADJUSTMENT'::text) ->> 'amount'::text)::numeric AS refund_adjustment_earning,
        ((pe.deductions_details -> 'PENSION_EMPLOYER_AMOUNT'::text) ->> 'amount'::text)::numeric AS pension_employer_amount,
        ((pe.deductions_details -> 'PENSION_PERSONAL_AMOUNT'::text) ->> 'amount'::text)::numeric AS pension_personal_amount,
        ((pe.deductions_details -> 'UNEMPLOYMENT_PERSONAL_AMOUNT'::text) ->> 'amount'::text)::numeric AS unemployment_personal_amount,
        ((pe.deductions_details -> 'INJURY_EMPLOYER_AMOUNT'::text) ->> 'amount'::text)::numeric AS injury_employer_amount,
        ((pe.deductions_details -> 'OCCUPATIONAL_PENSION_EMPLOYER_AMOUNT'::text) ->> 'amount'::text)::numeric AS occupational_pension_employer_amount,
        ((pe.deductions_details -> 'OCCUPATIONAL_PENSION_PERSONAL_AMOUNT'::text) ->> 'amount'::text)::numeric AS occupational_pension_personal_amount,
        ((pe.deductions_details -> 'MEDICAL_INS_PERSONAL_AMOUNT'::text) ->> 'amount'::text)::numeric AS medical_ins_personal_amount,
        ((pe.deductions_details -> 'MEDICAL_INS_PERSONAL_TOTAL'::text) ->> 'amount'::text)::numeric AS medical_ins_personal_total,
        ((pe.deductions_details -> 'MEDICAL_INS_EMPLOYER_AMOUNT'::text) ->> 'amount'::text)::numeric AS medical_ins_employer_amount,
        ((pe.deductions_details -> 'SERIOUS_ILLNESS_EMPLOYER_AMOUNT'::text) ->> 'amount'::text)::numeric AS serious_illness_employer_amount,
        ((pe.deductions_details -> 'MEDICAL_INS_EMPLOYER_TOTAL'::text) ->> 'amount'::text)::numeric AS medical_ins_employer_total,
        ((pe.deductions_details -> 'HOUSING_FUND_PERSONAL'::text) ->> 'amount'::text)::numeric AS housing_fund_personal,
        ((pe.deductions_details -> 'HOUSING_FUND_EMPLOYER'::text) ->> 'amount'::text)::numeric AS housing_fund_employer,
        ((pe.deductions_details -> 'PERSONAL_INCOME_TAX'::text) ->> 'amount'::text)::numeric AS personal_income_tax,
        ((pe.deductions_details -> 'SOCIAL_INSURANCE_ADJUSTMENT'::text) ->> 'amount'::text)::numeric AS social_insurance_adjustment,
        ((pe.deductions_details -> 'UNEMPLOYMENT_EMPLOYER_AMOUNT'::text) ->> 'amount'::text)::numeric AS unemployment_employer_amount,
        ((pe.deductions_details -> 'ONE_TIME_ADJUSTMENT'::text) ->> 'amount'::text)::numeric AS one_time_adjustment_deduction,
        ((pe.deductions_details -> 'PERFORMANCE_BONUS_DEDUCTION_ADJUSTMENT'::text) ->> 'amount'::text)::numeric AS performance_bonus_deduction_adjustment,
        ((pe.deductions_details -> 'REWARD_PERFORMANCE_DEDUCTION_ADJUSTMENT'::text) ->> 'amount'::text)::numeric AS reward_performance_deduction_adjustment,
        ((pe.deductions_details -> 'REFUND_DEDUCTION_ADJUSTMENT'::text) ->> 'amount'::text)::numeric AS refund_deduction_adjustment,
        ((pe.deductions_details -> 'MEDICAL_2022_DEDUCTION_ADJUSTMENT'::text) ->> 'amount'::text)::numeric AS medical_2022_deduction_adjustment,
        ls.name AS payroll_entry_status,
        pe.remarks AS payroll_entry_remarks,
        pe.calculation_inputs AS raw_calculation_inputs,
        pe.calculation_log AS raw_calculation_log
    FROM payroll.payroll_entries pe
        JOIN hr.employees e ON pe.employee_id = e.id
        LEFT JOIN hr.departments d ON e.department_id = d.id
        LEFT JOIN hr.positions p ON e.actual_position_id = p.id
        JOIN payroll.payroll_periods pp ON pe.payroll_period_id = pp.id
        JOIN payroll.payroll_runs pr ON pe.payroll_run_id = pr.id
        LEFT JOIN config.lookup_values ls ON pe.status_lookup_value_id = ls.id;
    """)
