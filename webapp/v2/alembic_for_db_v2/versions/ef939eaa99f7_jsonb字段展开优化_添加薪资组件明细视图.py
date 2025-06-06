"""JSONB字段展开优化_添加薪资组件明细视图

Revision ID: ef939eaa99f7
Revises: e84d8ddef3e3
Create Date: 2025-06-04 20:37:18.808722

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ef939eaa99f7'
down_revision: Union[str, None] = 'e84d8ddef3e3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    
    # 创建薪资条目明细展开视图 - 将JSONB字段展开为具体的薪资组件列
    op.execute("""
    CREATE VIEW v_payroll_entries_detailed AS
    SELECT 
        pe.id,
        pe.employee_id,
        e.employee_code,
        e.first_name || ' ' || e.last_name as employee_name,
        d.name as department_name,
        p.name as position_name,
        pe.payroll_period_id as period_id,
        pp.name as period_name,
        
        -- 基础薪资汇总
        pe.gross_pay,
        pe.net_pay,
        pe.total_deductions,
        
        -- 收入项目明细展开 (EARNING类型组件)
        COALESCE((pe.earnings_details->>'基本工资')::numeric, 0.00) as basic_salary,
        COALESCE((pe.earnings_details->>'奖励性绩效工资')::numeric, 0.00) as performance_salary,
        COALESCE((pe.earnings_details->>'岗位工资')::numeric, 0.00) as position_salary,
        COALESCE((pe.earnings_details->>'薪级工资')::numeric, 0.00) as grade_salary,
        COALESCE((pe.earnings_details->>'津贴')::numeric, 0.00) as allowance,
        COALESCE((pe.earnings_details->>'补助')::numeric, 0.00) as subsidy,
        COALESCE((pe.earnings_details->>'基础性绩效工资')::numeric, 0.00) as basic_performance_salary,
        COALESCE((pe.earnings_details->>'绩效工资')::numeric, 0.00) as performance_wage,
        COALESCE((pe.earnings_details->>'公务交通补贴')::numeric, 0.00) as traffic_allowance,
        COALESCE((pe.earnings_details->>'独生子女父母奖励金')::numeric, 0.00) as only_child_bonus,
        COALESCE((pe.earnings_details->>'乡镇工作补贴')::numeric, 0.00) as township_allowance,
        COALESCE((pe.earnings_details->>'岗位职务补贴')::numeric, 0.00) as position_allowance,
        COALESCE((pe.earnings_details->>'公务员规范后津补贴')::numeric, 0.00) as civil_servant_allowance,
        COALESCE((pe.earnings_details->>'补发工资')::numeric, 0.00) as back_pay,
        
        -- 个人扣除项目明细展开 (PERSONAL_DEDUCTION类型组件)
        COALESCE((pe.deductions_details->>'个人所得税')::numeric, 0.00) as personal_income_tax,
        COALESCE((pe.deductions_details->>'养老保险个人应缴金额')::numeric, 0.00) as pension_personal,
        COALESCE((pe.deductions_details->>'医疗保险个人缴纳金额')::numeric, 0.00) as medical_personal,
        COALESCE((pe.deductions_details->>'失业个人应缴金额')::numeric, 0.00) as unemployment_personal,
        COALESCE((pe.deductions_details->>'个人缴住房公积金')::numeric, 0.00) as housing_fund_personal,
        COALESCE((pe.deductions_details->>'职业年金个人应缴费额')::numeric, 0.00) as annuity_personal,
        COALESCE((pe.deductions_details->>'补扣（退）款')::numeric, 0.00) as adjustment_deduction,
        COALESCE((pe.deductions_details->>'补扣社保')::numeric, 0.00) as social_security_adjustment,
        
        -- 计算衍生字段
        (COALESCE((pe.earnings_details->>'基本工资')::numeric, 0.00) + 
         COALESCE((pe.earnings_details->>'岗位工资')::numeric, 0.00) + 
         COALESCE((pe.earnings_details->>'薪级工资')::numeric, 0.00)) as basic_wage_total,
        
        (COALESCE((pe.earnings_details->>'奖励性绩效工资')::numeric, 0.00) + 
         COALESCE((pe.earnings_details->>'基础性绩效工资')::numeric, 0.00) + 
         COALESCE((pe.earnings_details->>'绩效工资')::numeric, 0.00)) as performance_total,
        
        (COALESCE((pe.earnings_details->>'津贴')::numeric, 0.00) + 
         COALESCE((pe.earnings_details->>'补助')::numeric, 0.00) + 
         COALESCE((pe.earnings_details->>'公务交通补贴')::numeric, 0.00) + 
         COALESCE((pe.earnings_details->>'岗位职务补贴')::numeric, 0.00)) as allowance_total,
        
        (COALESCE((pe.deductions_details->>'养老保险个人应缴金额')::numeric, 0.00) + 
         COALESCE((pe.deductions_details->>'医疗保险个人缴纳金额')::numeric, 0.00) + 
         COALESCE((pe.deductions_details->>'失业个人应缴金额')::numeric, 0.00) + 
         COALESCE((pe.deductions_details->>'个人缴住房公积金')::numeric, 0.00) + 
         COALESCE((pe.deductions_details->>'职业年金个人应缴费额')::numeric, 0.00)) as social_insurance_total,
        
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
    
    # 创建薪资组件使用统计视图
    op.execute("""
    CREATE VIEW v_payroll_component_usage AS
    SELECT 
        pcd.id,
        pcd.code,
        pcd.name,
        pcd.type as component_type,
        pcd.is_active,
        
        -- 统计在earnings_details中的使用情况
        CASE WHEN pcd.type = 'EARNING' THEN
            (SELECT COUNT(*) 
             FROM payroll.payroll_entries pe 
             WHERE pe.earnings_details ? pcd.name 
             AND (pe.earnings_details->>pcd.name)::numeric > 0)
        ELSE 0 END as earnings_usage_count,
        
        -- 统计在deductions_details中的使用情况  
        CASE WHEN pcd.type IN ('PERSONAL_DEDUCTION', 'DEDUCTION') THEN
            (SELECT COUNT(*) 
             FROM payroll.payroll_entries pe 
             WHERE pe.deductions_details ? pcd.name 
             AND (pe.deductions_details->>pcd.name)::numeric > 0)
        ELSE 0 END as deductions_usage_count,
        
        -- 统计总金额
        CASE WHEN pcd.type = 'EARNING' THEN
            COALESCE((SELECT SUM((pe.earnings_details->>pcd.name)::numeric) 
                     FROM payroll.payroll_entries pe 
                     WHERE pe.earnings_details ? pcd.name), 0.00)
        WHEN pcd.type IN ('PERSONAL_DEDUCTION', 'DEDUCTION') THEN
            COALESCE((SELECT SUM((pe.deductions_details->>pcd.name)::numeric) 
                     FROM payroll.payroll_entries pe 
                     WHERE pe.deductions_details ? pcd.name), 0.00)
        ELSE 0.00 END as total_amount,
        
        -- 计算平均金额
        CASE WHEN pcd.type = 'EARNING' THEN
            COALESCE((SELECT AVG((pe.earnings_details->>pcd.name)::numeric) 
                     FROM payroll.payroll_entries pe 
                     WHERE pe.earnings_details ? pcd.name 
                     AND (pe.earnings_details->>pcd.name)::numeric > 0), 0.00)
        WHEN pcd.type IN ('PERSONAL_DEDUCTION', 'DEDUCTION') THEN
            COALESCE((SELECT AVG((pe.deductions_details->>pcd.name)::numeric) 
                     FROM payroll.payroll_entries pe 
                     WHERE pe.deductions_details ? pcd.name 
                     AND (pe.deductions_details->>pcd.name)::numeric > 0), 0.00)
        ELSE 0.00 END as average_amount,
        
        pcd.display_order,
        pcd.effective_date,
        pcd.end_date
    FROM config.payroll_component_definitions pcd
    WHERE pcd.is_active = true
    ORDER BY pcd.type, pcd.display_order;
    """)
    
    # 创建薪资汇总分析视图
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
        
        -- 主要收入项目汇总
        SUM(COALESCE((pe.earnings_details->>'基本工资')::numeric, 0)) as total_basic_salary,
        SUM(COALESCE((pe.earnings_details->>'奖励性绩效工资')::numeric, 0)) as total_performance_salary,
        SUM(COALESCE((pe.earnings_details->>'津贴')::numeric, 0)) as total_allowance,
        SUM(COALESCE((pe.earnings_details->>'补助')::numeric, 0)) as total_subsidy,
        
        -- 主要扣除项目汇总
        SUM(COALESCE((pe.deductions_details->>'个人所得税')::numeric, 0)) as total_income_tax,
        SUM(COALESCE((pe.deductions_details->>'养老保险个人应缴金额')::numeric, 0)) as total_pension_deduction,
        SUM(COALESCE((pe.deductions_details->>'医疗保险个人缴纳金额')::numeric, 0)) as total_medical_deduction,
        SUM(COALESCE((pe.deductions_details->>'个人缴住房公积金')::numeric, 0)) as total_housing_fund_deduction,
        
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
    op.execute("DROP VIEW IF EXISTS v_payroll_summary_analysis;")
    op.execute("DROP VIEW IF EXISTS v_payroll_component_usage;") 
    op.execute("DROP VIEW IF EXISTS v_payroll_entries_detailed;")
