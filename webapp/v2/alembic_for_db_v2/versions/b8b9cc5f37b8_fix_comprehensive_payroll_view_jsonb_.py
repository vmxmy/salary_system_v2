"""fix_comprehensive_payroll_view_jsonb_path

Revision ID: b8b9cc5f37b8
Revises: 6b17edcb8a46
Create Date: 2025-01-08 21:25:46.123456

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b8b9cc5f37b8'
down_revision: Union[str, None] = '6b17edcb8a46'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """修复 v_comprehensive_employee_payroll 视图中的JSONB字段路径问题"""
    
    print("🔧 正在修复 v_comprehensive_employee_payroll 视图的JSONB路径...")
    
    # 删除现有视图
    op.execute("DROP VIEW IF EXISTS reports.v_comprehensive_employee_payroll CASCADE;")
    
    # 重新创建修复后的视图，使用正确的JSONB路径 ->'field'->>'amount'
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
        
        -- 应发项目（EARNING类型）- 使用正确的JSONB路径 ->'field'->>'amount'
        COALESCE((pe.earnings_details->'MONTHLY_PERFORMANCE_BONUS'->>'amount')::numeric, 0.00) as monthly_performance_bonus,
        COALESCE((pe.earnings_details->'BASIC_SALARY'->>'amount')::numeric, 0.00) as basic_salary,
        COALESCE((pe.earnings_details->'ONLY_CHILD_PARENT_BONUS'->>'amount')::numeric, 0.00) as only_child_parent_bonus,
        COALESCE((pe.earnings_details->'POSITION_TECH_GRADE_SALARY'->>'amount')::numeric, 0.00) as position_tech_grade_salary,
        COALESCE((pe.earnings_details->'TRAFFIC_ALLOWANCE'->>'amount')::numeric, 0.00) as traffic_allowance,
        COALESCE((pe.earnings_details->'GRADE_POSITION_LEVEL_SALARY'->>'amount')::numeric, 0.00) as grade_position_level_salary,
        COALESCE((pe.earnings_details->'PERFORMANCE_BONUS'->>'amount')::numeric, 0.00) as performance_bonus,
        COALESCE((pe.earnings_details->'BASIC_PERFORMANCE_AWARD'->>'amount')::numeric, 0.00) as basic_performance_award,
        COALESCE((pe.earnings_details->'POSITION_SALARY_GENERAL'->>'amount')::numeric, 0.00) as position_salary_general,
        COALESCE((pe.earnings_details->'BASIC_PERFORMANCE_SALARY'->>'amount')::numeric, 0.00) as basic_performance_salary,
        COALESCE((pe.earnings_details->'BACK_PAY'->>'amount')::numeric, 0.00) as back_pay,
        COALESCE((pe.earnings_details->'GRADE_SALARY'->>'amount')::numeric, 0.00) as grade_salary,
        COALESCE((pe.earnings_details->'PERFORMANCE_SALARY'->>'amount')::numeric, 0.00) as performance_salary,
        COALESCE((pe.earnings_details->'POSITION_ALLOWANCE'->>'amount')::numeric, 0.00) as position_allowance,
        COALESCE((pe.earnings_details->'ALLOWANCE_GENERAL'->>'amount')::numeric, 0.00) as allowance_general,
        COALESCE((pe.earnings_details->'SALARY_GRADE'->>'amount')::numeric, 0.00) as salary_grade,
        COALESCE((pe.earnings_details->'BASIC_PERFORMANCE'->>'amount')::numeric, 0.00) as basic_performance,
        COALESCE((pe.earnings_details->'GENERAL_ALLOWANCE'->>'amount')::numeric, 0.00) as general_allowance,
        COALESCE((pe.earnings_details->'PETITION_ALLOWANCE'->>'amount')::numeric, 0.00) as petition_allowance,
        COALESCE((pe.earnings_details->'QUARTERLY_PERFORMANCE_ASSESSMENT'->>'amount')::numeric, 0.00) as quarterly_performance_assessment,
        COALESCE((pe.earnings_details->'PERFORMANCE_BONUS_BACK_PAY'->>'amount')::numeric, 0.00) as performance_bonus_back_pay,
        COALESCE((pe.earnings_details->'REFORM_ALLOWANCE_1993'->>'amount')::numeric, 0.00) as reform_allowance_1993,
        COALESCE((pe.earnings_details->'CIVIL_STANDARD_ALLOWANCE'->>'amount')::numeric, 0.00) as civil_standard_allowance,
        COALESCE((pe.earnings_details->'PROBATION_SALARY'->>'amount')::numeric, 0.00) as probation_salary,
        COALESCE((pe.earnings_details->'STAFF_SALARY_GRADE'->>'amount')::numeric, 0.00) as staff_salary_grade,
        COALESCE((pe.earnings_details->'TOWNSHIP_ALLOWANCE'->>'amount')::numeric, 0.00) as township_allowance,
        COALESCE((pe.earnings_details->'QUARTERLY_PERFORMANCE_Q1'->>'amount')::numeric, 0.00) as quarterly_performance_q1,

        -- 个人扣除项目（PERSONAL_DEDUCTION类型）- 使用正确的JSONB路径
        COALESCE((pe.deductions_details->'MEDICAL_INS_PERSONAL_AMOUNT'->>'amount')::numeric, 0.00) as medical_ins_personal_amount,
        COALESCE((pe.deductions_details->'MEDICAL_INS_PERSONAL_TOTAL'->>'amount')::numeric, 0.00) as medical_ins_personal_total,
        COALESCE((pe.deductions_details->'OCCUPATIONAL_PENSION_PERSONAL_AMOUNT'->>'amount')::numeric, 0.00) as occupational_pension_personal_amount,
        COALESCE((pe.deductions_details->'PENSION_PERSONAL_AMOUNT'->>'amount')::numeric, 0.00) as pension_personal_amount,
        COALESCE((pe.deductions_details->'PERSONAL_INCOME_TAX'->>'amount')::numeric, 0.00) as personal_income_tax,
        COALESCE((pe.deductions_details->'UNEMPLOYMENT_PERSONAL_AMOUNT'->>'amount')::numeric, 0.00) as unemployment_personal_amount,
        COALESCE((pe.deductions_details->'ONE_TIME_ADJUSTMENT'->>'amount')::numeric, 0.00) as one_time_adjustment,
        COALESCE((pe.deductions_details->'PERFORMANCE_BONUS_ADJUSTMENT'->>'amount')::numeric, 0.00) as performance_bonus_adjustment,
        COALESCE((pe.deductions_details->'REWARD_PERFORMANCE_ADJUSTMENT'->>'amount')::numeric, 0.00) as reward_performance_adjustment,
        COALESCE((pe.deductions_details->'HOUSING_FUND_PERSONAL'->>'amount')::numeric, 0.00) as housing_fund_personal,
        COALESCE((pe.deductions_details->'PERFORMANCE_BONUS_DEDUCTION_ADJUSTMENT'->>'amount')::numeric, 0.00) as performance_bonus_deduction_adjustment,
        COALESCE((pe.deductions_details->'SOCIAL_INSURANCE_ADJUSTMENT'->>'amount')::numeric, 0.00) as social_insurance_adjustment,
        COALESCE((pe.deductions_details->'REFUND_DEDUCTION_ADJUSTMENT'->>'amount')::numeric, 0.00) as refund_deduction_adjustment,
        COALESCE((pe.deductions_details->'MEDICAL_2022_DEDUCTION_ADJUSTMENT'->>'amount')::numeric, 0.00) as medical_2022_deduction_adjustment,

        -- 单位扣除项目（EMPLOYER_DEDUCTION类型）- 使用正确的JSONB路径
        COALESCE((pe.deductions_details->'INJURY_EMPLOYER_AMOUNT'->>'amount')::numeric, 0.00) as injury_employer_amount,
        COALESCE((pe.deductions_details->'MEDICAL_INS_EMPLOYER_AMOUNT'->>'amount')::numeric, 0.00) as medical_ins_employer_amount,
        COALESCE((pe.deductions_details->'MEDICAL_INS_EMPLOYER_TOTAL'->>'amount')::numeric, 0.00) as medical_ins_employer_total,
        COALESCE((pe.deductions_details->'OCCUPATIONAL_PENSION_EMPLOYER_AMOUNT'->>'amount')::numeric, 0.00) as occupational_pension_employer_amount,
        COALESCE((pe.deductions_details->'PENSION_EMPLOYER_AMOUNT'->>'amount')::numeric, 0.00) as pension_employer_amount,
        COALESCE((pe.deductions_details->'SERIOUS_ILLNESS_EMPLOYER_AMOUNT'->>'amount')::numeric, 0.00) as serious_illness_employer_amount,
        COALESCE((pe.deductions_details->'UNEMPLOYMENT_EMPLOYER_AMOUNT'->>'amount')::numeric, 0.00) as unemployment_employer_amount,
        COALESCE((pe.deductions_details->'HOUSING_FUND_EMPLOYER'->>'amount')::numeric, 0.00) as housing_fund_employer,

        -- 计算基数（CALCULATION_BASE类型）- 使用正确的JSONB路径
        COALESCE((pe.calculation_inputs->'MEDICAL_INS_BASE'->>'amount')::numeric, 0.00) as medical_ins_base,
        COALESCE((pe.calculation_inputs->'MEDICAL_INS_BASE_SALARY'->>'amount')::numeric, 0.00) as medical_ins_base_salary,
        COALESCE((pe.calculation_inputs->'MEDICAL_INS_PAY_SALARY'->>'amount')::numeric, 0.00) as medical_ins_pay_salary,
        COALESCE((pe.calculation_inputs->'OCCUPATIONAL_PENSION_BASE'->>'amount')::numeric, 0.00) as occupational_pension_base,
        COALESCE((pe.calculation_inputs->'OCCUPATIONAL_PENSION_PAY_SALARY'->>'amount')::numeric, 0.00) as occupational_pension_pay_salary,
        COALESCE((pe.calculation_inputs->'PENSION_BASE'->>'amount')::numeric, 0.00) as pension_base,
        COALESCE((pe.calculation_inputs->'TAX_BASE'->>'amount')::numeric, 0.00) as tax_base,
        COALESCE((pe.calculation_inputs->'HOUSING_FUND_BASE'->>'amount')::numeric, 0.00) as housing_fund_base,

        -- 计算费率（CALCULATION_RATE类型）- 使用正确的JSONB路径
        COALESCE((pe.calculation_inputs->'MEDICAL_INS_EMPLOYER_RATE'->>'amount')::numeric, 0.00) as medical_ins_employer_rate,
        COALESCE((pe.calculation_inputs->'MEDICAL_INS_PERSONAL_RATE'->>'amount')::numeric, 0.00) as medical_ins_personal_rate,
        COALESCE((pe.calculation_inputs->'OCCUPATIONAL_PENSION_EMPLOYER_RATE'->>'amount')::numeric, 0.00) as occupational_pension_employer_rate,
        COALESCE((pe.calculation_inputs->'OCCUPATIONAL_PENSION_PERSONAL_RATE'->>'amount')::numeric, 0.00) as occupational_pension_personal_rate,
        COALESCE((pe.calculation_inputs->'PENSION_EMPLOYER_RATE'->>'amount')::numeric, 0.00) as pension_employer_rate,
        COALESCE((pe.calculation_inputs->'PENSION_PERSONAL_RATE'->>'amount')::numeric, 0.00) as pension_personal_rate,
        COALESCE((pe.calculation_inputs->'SERIOUS_ILLNESS_EMPLOYER_RATE'->>'amount')::numeric, 0.00) as serious_illness_employer_rate,
        COALESCE((pe.calculation_inputs->'TAX_RATE'->>'amount')::numeric, 0.00) as tax_rate,
        COALESCE((pe.calculation_inputs->'HOUSING_FUND_PERSONAL_RATE'->>'amount')::numeric, 0.00) as housing_fund_personal_rate,
        COALESCE((pe.calculation_inputs->'HOUSING_FUND_EMPLOYER_RATE'->>'amount')::numeric, 0.00) as housing_fund_employer_rate,

        -- 计算结果（CALCULATION_RESULT类型）- 使用正确的JSONB路径
        COALESCE((pe.calculation_inputs->'AFTER_TAX_SALARY'->>'amount')::numeric, 0.00) as after_tax_salary,
        COALESCE((pe.calculation_inputs->'QUICK_DEDUCTION'->>'amount')::numeric, 0.00) as quick_deduction,
        COALESCE((pe.calculation_inputs->'TAXABLE_INCOME'->>'amount')::numeric, 0.00) as taxable_income,
        COALESCE((pe.calculation_inputs->'TAX_DEDUCTION_AMOUNT'->>'amount')::numeric, 0.00) as tax_deduction_amount,
        COALESCE((pe.calculation_inputs->'TAX_EXEMPT_AMOUNT'->>'amount')::numeric, 0.00) as tax_exempt_amount,

        -- 其他字段（OTHER类型）- 使用正确的JSONB路径
        COALESCE((pe.calculation_inputs->'UNIFIED_PAYROLL_FLAG'->>'amount')::boolean, false) as unified_payroll_flag,
        COALESCE((pe.calculation_inputs->'FISCAL_SUPPORT_FLAG'->>'amount')::boolean, false) as fiscal_support_flag,
        COALESCE((pe.calculation_inputs->'ANNUAL_FIXED_SALARY_TOTAL'->>'amount')::numeric, 0.00) as annual_fixed_salary_total,
        
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
    """)
    
    print("✅ 成功修复 v_comprehensive_employee_payroll 视图的JSONB路径问题")


def downgrade() -> None:
    """恢复到之前的视图版本"""
    
    print("⬇️ 正在恢复到之前的视图版本...")
    
    # 删除当前视图
    op.execute("DROP VIEW IF EXISTS reports.v_comprehensive_employee_payroll CASCADE;")
    
    # 恢复到之前的版本（使用错误的JSONB路径）
    op.execute("""
    CREATE VIEW reports.v_comprehensive_employee_payroll AS
    WITH personnel_hierarchy AS (
        WITH RECURSIVE category_tree AS (
            SELECT 
                id, name, parent_category_id,
                id as root_id, name as root_name, 0 as level
            FROM hr.personnel_categories 
            WHERE parent_category_id IS NULL
            UNION ALL
            SELECT 
                pc.id, pc.name, pc.parent_category_id,
                ct.root_id, ct.root_name, ct.level + 1
            FROM hr.personnel_categories pc
            INNER JOIN category_tree ct ON pc.parent_category_id = ct.id
        )
        SELECT id as category_id, root_id, root_name FROM category_tree
    )
    SELECT 
        pe.id as payroll_entry_id, pe.employee_id, pe.payroll_period_id, pe.payroll_run_id,
        e.employee_code, e.first_name, e.last_name,
        COALESCE(e.last_name || e.first_name, e.first_name, e.last_name, '未知姓名') as full_name,
        e.id_number, e.phone_number as phone, e.email, e.hire_date,
        COALESCE(e.is_active, false) as employee_is_active,
        COALESCE(d.name, '未分配部门') as department_name,
        COALESCE(pos.name, '未分配职位') as position_name,
        COALESCE(pc.name, '未分类') as personnel_category_name,
        COALESCE(ph.root_name, '未分类') as root_personnel_category_name,
        COALESCE(pp.name, '未知期间') as payroll_period_name,
        pp.start_date as payroll_period_start_date,
        pp.end_date as payroll_period_end_date,
        pp.pay_date as payroll_period_pay_date,
        pr.run_date as payroll_run_date,
        COALESCE(pe.gross_pay, 0.00) as gross_pay,
        COALESCE(pe.total_deductions, 0.00) as total_deductions,
        COALESCE(pe.net_pay, 0.00) as net_pay,
        COALESCE(pe.status_lookup_value_id, 1) as status_lookup_value_id,
        COALESCE(pe.remarks, '') as remarks,
        pe.audit_status, pe.audit_timestamp, pe.auditor_id, pe.audit_notes, pe.version,
        COALESCE(pe.calculated_at, pe.updated_at, NOW()) as calculated_at,
        pe.updated_at,
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
    """)
    
    print("⬇️ 成功恢复到之前的视图版本")
