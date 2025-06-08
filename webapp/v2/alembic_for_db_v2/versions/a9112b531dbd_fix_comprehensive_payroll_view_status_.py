"""fix_comprehensive_payroll_view_status_field

Revision ID: a9112b531dbd
Revises: 56da847d2a8e
Create Date: 2025-06-08 20:42:17.579709

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a9112b531dbd'
down_revision: Union[str, None] = '56da847d2a8e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    
    # 删除现有视图
    op.execute("DROP VIEW IF EXISTS reports.v_comprehensive_employee_payroll CASCADE;")
    
    # 重新创建修复后的视图，确保所有字段都有合适的默认值
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
        
        -- 应发项目（EARNING类型）- 展开为标准字段
        COALESCE((pe.earnings_details->>'BASIC_SALARY')::numeric, 0.00) as basic_salary,
        COALESCE((pe.earnings_details->>'PERFORMANCE_BONUS')::numeric, 0.00) as performance_bonus,
        COALESCE((pe.earnings_details->>'BASIC_PERFORMANCE')::numeric, 0.00) as basic_performance_salary,
        COALESCE((pe.earnings_details->>'POSITION_SALARY_GENERAL')::numeric, 0.00) as position_salary_general,
        COALESCE((pe.earnings_details->>'GRADE_SALARY')::numeric, 0.00) as grade_salary,
        COALESCE((pe.earnings_details->>'SALARY_GRADE')::numeric, 0.00) as salary_grade,
        COALESCE((pe.earnings_details->>'ALLOWANCE_GENERAL')::numeric, 0.00) as allowance_general,
        COALESCE((pe.earnings_details->>'GENERAL_ALLOWANCE')::numeric, 0.00) as general_allowance,
        COALESCE((pe.earnings_details->>'TRAFFIC_ALLOWANCE')::numeric, 0.00) as traffic_allowance,
        COALESCE((pe.earnings_details->>'ONLY_CHILD_PARENT_BONUS')::numeric, 0.00) as only_child_parent_bonus,
        COALESCE((pe.earnings_details->>'TOWNSHIP_ALLOWANCE')::numeric, 0.00) as township_allowance,
        COALESCE((pe.earnings_details->>'POSITION_ALLOWANCE')::numeric, 0.00) as position_allowance,
        COALESCE((pe.earnings_details->>'CIVIL_STANDARD_ALLOWANCE')::numeric, 0.00) as civil_standard_allowance,
        COALESCE((pe.earnings_details->>'BACK_PAY')::numeric, 0.00) as back_pay,
        COALESCE((pe.earnings_details->>'OVERTIME_PAY')::numeric, 0.00) as overtime_pay,
        COALESCE((pe.earnings_details->>'HOLIDAY_PAY')::numeric, 0.00) as holiday_pay,
        COALESCE((pe.earnings_details->>'BONUS')::numeric, 0.00) as bonus,
        COALESCE((pe.earnings_details->>'COMMISSION')::numeric, 0.00) as commission,
        COALESCE((pe.earnings_details->>'SPECIAL_ALLOWANCE')::numeric, 0.00) as special_allowance,
        COALESCE((pe.earnings_details->>'MEAL_ALLOWANCE')::numeric, 0.00) as meal_allowance,
        COALESCE((pe.earnings_details->>'TRANSPORT_ALLOWANCE')::numeric, 0.00) as transport_allowance,
        COALESCE((pe.earnings_details->>'COMMUNICATION_ALLOWANCE')::numeric, 0.00) as communication_allowance,
        COALESCE((pe.earnings_details->>'EDUCATION_ALLOWANCE')::numeric, 0.00) as education_allowance,
        COALESCE((pe.earnings_details->>'HOUSING_ALLOWANCE')::numeric, 0.00) as housing_allowance,
        COALESCE((pe.earnings_details->>'MEDICAL_ALLOWANCE')::numeric, 0.00) as medical_allowance,
        COALESCE((pe.earnings_details->>'CHILD_CARE_ALLOWANCE')::numeric, 0.00) as child_care_allowance,
        
        -- 个人扣除项目（PERSONAL_DEDUCTION类型）- 展开为标准字段
        COALESCE((pe.deductions_details->>'PERSONAL_INCOME_TAX')::numeric, 0.00) as personal_income_tax,
        COALESCE((pe.deductions_details->>'PENSION_PERSONAL_AMOUNT')::numeric, 0.00) as pension_personal_amount,
        COALESCE((pe.deductions_details->>'MEDICAL_INS_PERSONAL_AMOUNT')::numeric, 0.00) as medical_ins_personal_amount,
        COALESCE((pe.deductions_details->>'UNEMPLOYMENT_PERSONAL_AMOUNT')::numeric, 0.00) as unemployment_personal_amount,
        COALESCE((pe.deductions_details->>'HOUSING_FUND_PERSONAL')::numeric, 0.00) as housing_fund_personal,
        COALESCE((pe.deductions_details->>'OCCUPATIONAL_PENSION_PERSONAL_AMOUNT')::numeric, 0.00) as occupational_pension_personal_amount,
        COALESCE((pe.deductions_details->>'UNION_DUES')::numeric, 0.00) as union_dues,
        COALESCE((pe.deductions_details->>'LOAN_DEDUCTION')::numeric, 0.00) as loan_deduction,
        COALESCE((pe.deductions_details->>'ADVANCE_DEDUCTION')::numeric, 0.00) as advance_deduction,
        COALESCE((pe.deductions_details->>'DISCIPLINARY_DEDUCTION')::numeric, 0.00) as disciplinary_deduction,
        COALESCE((pe.deductions_details->>'ABSENCE_DEDUCTION')::numeric, 0.00) as absence_deduction,
        COALESCE((pe.deductions_details->>'LATE_DEDUCTION')::numeric, 0.00) as late_deduction,
        COALESCE((pe.deductions_details->>'OTHER_PERSONAL_DEDUCTION')::numeric, 0.00) as other_personal_deduction,
        COALESCE((pe.deductions_details->>'INSURANCE_PREMIUM')::numeric, 0.00) as insurance_premium,
        
        -- 单位扣除项目（EMPLOYER_DEDUCTION类型）- 展开为标准字段
        COALESCE((pe.deductions_details->>'PENSION_EMPLOYER_AMOUNT')::numeric, 0.00) as pension_employer_amount,
        COALESCE((pe.deductions_details->>'MEDICAL_INS_EMPLOYER_AMOUNT')::numeric, 0.00) as medical_ins_employer_amount,
        COALESCE((pe.deductions_details->>'UNEMPLOYMENT_EMPLOYER_AMOUNT')::numeric, 0.00) as unemployment_employer_amount,
        COALESCE((pe.deductions_details->>'WORK_INJURY_EMPLOYER_AMOUNT')::numeric, 0.00) as work_injury_employer_amount,
        COALESCE((pe.deductions_details->>'MATERNITY_EMPLOYER_AMOUNT')::numeric, 0.00) as maternity_employer_amount,
        COALESCE((pe.deductions_details->>'HOUSING_FUND_EMPLOYER')::numeric, 0.00) as housing_fund_employer,
        COALESCE((pe.deductions_details->>'OCCUPATIONAL_PENSION_EMPLOYER_AMOUNT')::numeric, 0.00) as occupational_pension_employer_amount,
        COALESCE((pe.deductions_details->>'DISABILITY_INSURANCE_EMPLOYER')::numeric, 0.00) as disability_insurance_employer,
        
        -- 计算基数（CALCULATION_BASE类型）- 展开为标准字段
        COALESCE((pe.calculation_inputs->>'PENSION_BASE')::numeric, 0.00) as pension_base,
        COALESCE((pe.calculation_inputs->>'MEDICAL_BASE')::numeric, 0.00) as medical_base,
        COALESCE((pe.calculation_inputs->>'UNEMPLOYMENT_BASE')::numeric, 0.00) as unemployment_base,
        COALESCE((pe.calculation_inputs->>'WORK_INJURY_BASE')::numeric, 0.00) as work_injury_base,
        COALESCE((pe.calculation_inputs->>'MATERNITY_BASE')::numeric, 0.00) as maternity_base,
        COALESCE((pe.calculation_inputs->>'HOUSING_FUND_BASE')::numeric, 0.00) as housing_fund_base,
        COALESCE((pe.calculation_inputs->>'TAX_BASE')::numeric, 0.00) as tax_base,
        COALESCE((pe.calculation_inputs->>'BONUS_TAX_BASE')::numeric, 0.00) as bonus_tax_base,
        
        -- 计算费率（CALCULATION_RATE类型）- 展开为标准字段
        COALESCE((pe.calculation_inputs->>'PENSION_PERSONAL_RATE')::numeric, 0.00) as pension_personal_rate,
        COALESCE((pe.calculation_inputs->>'PENSION_EMPLOYER_RATE')::numeric, 0.00) as pension_employer_rate,
        COALESCE((pe.calculation_inputs->>'MEDICAL_PERSONAL_RATE')::numeric, 0.00) as medical_personal_rate,
        COALESCE((pe.calculation_inputs->>'MEDICAL_EMPLOYER_RATE')::numeric, 0.00) as medical_employer_rate,
        COALESCE((pe.calculation_inputs->>'UNEMPLOYMENT_PERSONAL_RATE')::numeric, 0.00) as unemployment_personal_rate,
        COALESCE((pe.calculation_inputs->>'UNEMPLOYMENT_EMPLOYER_RATE')::numeric, 0.00) as unemployment_employer_rate,
        COALESCE((pe.calculation_inputs->>'WORK_INJURY_RATE')::numeric, 0.00) as work_injury_rate,
        COALESCE((pe.calculation_inputs->>'MATERNITY_RATE')::numeric, 0.00) as maternity_rate,
        COALESCE((pe.calculation_inputs->>'HOUSING_FUND_PERSONAL_RATE')::numeric, 0.00) as housing_fund_personal_rate,
        COALESCE((pe.calculation_inputs->>'HOUSING_FUND_EMPLOYER_RATE')::numeric, 0.00) as housing_fund_employer_rate,
        
        -- 计算结果（CALCULATION_RESULT类型）- 展开为标准字段
        COALESCE((pe.calculation_inputs->>'TAX_DEDUCTION_AMOUNT')::numeric, 0.00) as tax_deduction_amount,
        COALESCE((pe.calculation_inputs->>'TAX_EXEMPTION_AMOUNT')::numeric, 0.00) as tax_exemption_amount,
        COALESCE((pe.calculation_inputs->>'TAXABLE_INCOME')::numeric, 0.00) as taxable_income,
        COALESCE((pe.calculation_inputs->>'TAX_RATE')::numeric, 0.00) as tax_rate,
        COALESCE((pe.calculation_inputs->>'QUICK_DEDUCTION')::numeric, 0.00) as quick_deduction,
        
        -- 其他字段（OTHER类型）- 展开为标准字段
        COALESCE((pe.calculation_inputs->>'UNIFIED_PAYROLL_FLAG')::boolean, false) as unified_payroll_flag,
        COALESCE((pe.calculation_inputs->>'FISCAL_SUPPORT_FLAG')::boolean, false) as fiscal_support_flag,
        COALESCE((pe.calculation_inputs->>'SPECIAL_CALCULATION_FLAG')::boolean, false) as special_calculation_flag,
        
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
    
    print("✅ 修复了 v_comprehensive_employee_payroll 视图的字段默认值问题")


def downgrade() -> None:
    """Downgrade schema."""
    
    # 删除修复后的视图
    op.execute("DROP VIEW IF EXISTS reports.v_comprehensive_employee_payroll CASCADE;")
    
    # 恢复原始视图（从之前的迁移复制）
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
        e.is_active as employee_is_active,
        
        -- 部门和职位信息
        d.name as department_name,
        pos.name as position_name,
        
        -- 人员身份分类信息
        pc.name as personnel_category_name,
        ph.root_name as root_personnel_category_name,
        
        -- 薪资期间信息
        pp.name as payroll_period_name,
        pp.start_date as payroll_period_start_date,
        pp.end_date as payroll_period_end_date,
        pp.pay_date as payroll_period_pay_date,
        
        -- 薪资运行信息
        pr.run_date as payroll_run_date,
        
        -- 薪资汇总信息
        pe.gross_pay,
        pe.total_deductions,
        pe.net_pay,
        
        -- 应发项目（EARNING类型）- 展开为标准字段
        (pe.earnings_details->>'BASIC_SALARY')::numeric as basic_salary,
        (pe.earnings_details->>'PERFORMANCE_BONUS')::numeric as performance_bonus,
        (pe.earnings_details->>'BASIC_PERFORMANCE')::numeric as basic_performance_salary,
        (pe.earnings_details->>'POSITION_SALARY_GENERAL')::numeric as position_salary_general,
        (pe.earnings_details->>'GRADE_SALARY')::numeric as grade_salary,
        (pe.earnings_details->>'SALARY_GRADE')::numeric as salary_grade,
        (pe.earnings_details->>'ALLOWANCE_GENERAL')::numeric as allowance_general,
        (pe.earnings_details->>'GENERAL_ALLOWANCE')::numeric as general_allowance,
        (pe.earnings_details->>'TRAFFIC_ALLOWANCE')::numeric as traffic_allowance,
        (pe.earnings_details->>'ONLY_CHILD_PARENT_BONUS')::numeric as only_child_parent_bonus,
        (pe.earnings_details->>'TOWNSHIP_ALLOWANCE')::numeric as township_allowance,
        (pe.earnings_details->>'POSITION_ALLOWANCE')::numeric as position_allowance,
        (pe.earnings_details->>'CIVIL_STANDARD_ALLOWANCE')::numeric as civil_standard_allowance,
        (pe.earnings_details->>'BACK_PAY')::numeric as back_pay,
        (pe.earnings_details->>'OVERTIME_PAY')::numeric as overtime_pay,
        (pe.earnings_details->>'HOLIDAY_PAY')::numeric as holiday_pay,
        (pe.earnings_details->>'BONUS')::numeric as bonus,
        (pe.earnings_details->>'COMMISSION')::numeric as commission,
        (pe.earnings_details->>'SPECIAL_ALLOWANCE')::numeric as special_allowance,
        (pe.earnings_details->>'MEAL_ALLOWANCE')::numeric as meal_allowance,
        (pe.earnings_details->>'TRANSPORT_ALLOWANCE')::numeric as transport_allowance,
        (pe.earnings_details->>'COMMUNICATION_ALLOWANCE')::numeric as communication_allowance,
        (pe.earnings_details->>'EDUCATION_ALLOWANCE')::numeric as education_allowance,
        (pe.earnings_details->>'HOUSING_ALLOWANCE')::numeric as housing_allowance,
        (pe.earnings_details->>'MEDICAL_ALLOWANCE')::numeric as medical_allowance,
        (pe.earnings_details->>'CHILD_CARE_ALLOWANCE')::numeric as child_care_allowance,
        
        -- 个人扣除项目（PERSONAL_DEDUCTION类型）- 展开为标准字段
        (pe.deductions_details->>'PERSONAL_INCOME_TAX')::numeric as personal_income_tax,
        (pe.deductions_details->>'PENSION_PERSONAL_AMOUNT')::numeric as pension_personal_amount,
        (pe.deductions_details->>'MEDICAL_INS_PERSONAL_AMOUNT')::numeric as medical_ins_personal_amount,
        (pe.deductions_details->>'UNEMPLOYMENT_PERSONAL_AMOUNT')::numeric as unemployment_personal_amount,
        (pe.deductions_details->>'HOUSING_FUND_PERSONAL')::numeric as housing_fund_personal,
        (pe.deductions_details->>'OCCUPATIONAL_PENSION_PERSONAL_AMOUNT')::numeric as occupational_pension_personal_amount,
        (pe.deductions_details->>'UNION_DUES')::numeric as union_dues,
        (pe.deductions_details->>'LOAN_DEDUCTION')::numeric as loan_deduction,
        (pe.deductions_details->>'ADVANCE_DEDUCTION')::numeric as advance_deduction,
        (pe.deductions_details->>'DISCIPLINARY_DEDUCTION')::numeric as disciplinary_deduction,
        (pe.deductions_details->>'ABSENCE_DEDUCTION')::numeric as absence_deduction,
        (pe.deductions_details->>'LATE_DEDUCTION')::numeric as late_deduction,
        (pe.deductions_details->>'OTHER_PERSONAL_DEDUCTION')::numeric as other_personal_deduction,
        (pe.deductions_details->>'INSURANCE_PREMIUM')::numeric as insurance_premium,
        
        -- 单位扣除项目（EMPLOYER_DEDUCTION类型）- 展开为标准字段
        (pe.deductions_details->>'PENSION_EMPLOYER_AMOUNT')::numeric as pension_employer_amount,
        (pe.deductions_details->>'MEDICAL_INS_EMPLOYER_AMOUNT')::numeric as medical_ins_employer_amount,
        (pe.deductions_details->>'UNEMPLOYMENT_EMPLOYER_AMOUNT')::numeric as unemployment_employer_amount,
        (pe.deductions_details->>'WORK_INJURY_EMPLOYER_AMOUNT')::numeric as work_injury_employer_amount,
        (pe.deductions_details->>'MATERNITY_EMPLOYER_AMOUNT')::numeric as maternity_employer_amount,
        (pe.deductions_details->>'HOUSING_FUND_EMPLOYER')::numeric as housing_fund_employer,
        (pe.deductions_details->>'OCCUPATIONAL_PENSION_EMPLOYER_AMOUNT')::numeric as occupational_pension_employer_amount,
        (pe.deductions_details->>'DISABILITY_INSURANCE_EMPLOYER')::numeric as disability_insurance_employer,
        
        -- 计算基数（CALCULATION_BASE类型）- 展开为标准字段
        (pe.calculation_inputs->>'PENSION_BASE')::numeric as pension_base,
        (pe.calculation_inputs->>'MEDICAL_BASE')::numeric as medical_base,
        (pe.calculation_inputs->>'UNEMPLOYMENT_BASE')::numeric as unemployment_base,
        (pe.calculation_inputs->>'WORK_INJURY_BASE')::numeric as work_injury_base,
        (pe.calculation_inputs->>'MATERNITY_BASE')::numeric as maternity_base,
        (pe.calculation_inputs->>'HOUSING_FUND_BASE')::numeric as housing_fund_base,
        (pe.calculation_inputs->>'TAX_BASE')::numeric as tax_base,
        (pe.calculation_inputs->>'BONUS_TAX_BASE')::numeric as bonus_tax_base,
        
        -- 计算费率（CALCULATION_RATE类型）- 展开为标准字段
        (pe.calculation_inputs->>'PENSION_PERSONAL_RATE')::numeric as pension_personal_rate,
        (pe.calculation_inputs->>'PENSION_EMPLOYER_RATE')::numeric as pension_employer_rate,
        (pe.calculation_inputs->>'MEDICAL_PERSONAL_RATE')::numeric as medical_personal_rate,
        (pe.calculation_inputs->>'MEDICAL_EMPLOYER_RATE')::numeric as medical_employer_rate,
        (pe.calculation_inputs->>'UNEMPLOYMENT_PERSONAL_RATE')::numeric as unemployment_personal_rate,
        (pe.calculation_inputs->>'UNEMPLOYMENT_EMPLOYER_RATE')::numeric as unemployment_employer_rate,
        (pe.calculation_inputs->>'WORK_INJURY_RATE')::numeric as work_injury_rate,
        (pe.calculation_inputs->>'MATERNITY_RATE')::numeric as maternity_rate,
        (pe.calculation_inputs->>'HOUSING_FUND_PERSONAL_RATE')::numeric as housing_fund_personal_rate,
        (pe.calculation_inputs->>'HOUSING_FUND_EMPLOYER_RATE')::numeric as housing_fund_employer_rate,
        
        -- 计算结果（CALCULATION_RESULT类型）- 展开为标准字段
        (pe.calculation_inputs->>'TAX_DEDUCTION_AMOUNT')::numeric as tax_deduction_amount,
        (pe.calculation_inputs->>'TAX_EXEMPTION_AMOUNT')::numeric as tax_exemption_amount,
        (pe.calculation_inputs->>'TAXABLE_INCOME')::numeric as taxable_income,
        (pe.calculation_inputs->>'TAX_RATE')::numeric as tax_rate,
        (pe.calculation_inputs->>'QUICK_DEDUCTION')::numeric as quick_deduction,
        
        -- 其他字段（OTHER类型）- 展开为标准字段
        (pe.calculation_inputs->>'UNIFIED_PAYROLL_FLAG')::boolean as unified_payroll_flag,
        (pe.calculation_inputs->>'FISCAL_SUPPORT_FLAG')::boolean as fiscal_support_flag,
        (pe.calculation_inputs->>'SPECIAL_CALCULATION_FLAG')::boolean as special_calculation_flag,
        
        -- 状态信息
        pe.status_lookup_value_id,
        pe.remarks,
        
        -- 审计信息
        pe.audit_status,
        pe.audit_timestamp,
        pe.auditor_id,
        pe.audit_notes,
        pe.version,
        
        -- 时间字段
        pe.calculated_at,
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
    
    print("⬇️ 恢复了原始的 v_comprehensive_employee_payroll 视图")
