"""Add employee salary history view

Revision ID: 386b390211c2
Revises: 944eb15444b1
Create Date: 2025-06-05 11:43:19.703419

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '386b390211c2'
down_revision: Union[str, None] = '944eb15444b1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # 创建员工薪资历史趋势视图
    op.execute("""
    CREATE VIEW v_employee_salary_history AS
    WITH salary_data AS (
        SELECT 
            pe.employee_id,
            e.employee_code,
            CONCAT(e.last_name, e.first_name) as employee_name,
            COALESCE(d.name, '未分配部门') as department_name,
            COALESCE(p.name, '未分配职位') as position_name,
            pp.name as period_name,
            pp.start_date as period_start_date,
            pp.end_date as period_end_date,
            pe.gross_pay,
            pe.net_pay,
            pe.total_deductions,
            -- 从JSONB中提取基本薪资组件（使用实际的字段结构）
            COALESCE((pe.earnings_details->'POSITION_TECH_GRADE_SALARY'->>'amount')::numeric, 0) + 
            COALESCE((pe.earnings_details->'GRADE_POSITION_LEVEL_SALARY'->>'amount')::numeric, 0) as basic_salary,
            COALESCE((pe.earnings_details->'PERFORMANCE_BONUS'->>'amount')::numeric, 0) as performance_salary,
            COALESCE((pe.earnings_details->'GENERAL_ALLOWANCE'->>'amount')::numeric, 0) + 
            COALESCE((pe.earnings_details->'TRAFFIC_ALLOWANCE'->>'amount')::numeric, 0) + 
            COALESCE((pe.earnings_details->'REFORM_ALLOWANCE_1993'->>'amount')::numeric, 0) as allowance_total,
            -- 添加排序字段
            ROW_NUMBER() OVER (PARTITION BY pe.employee_id ORDER BY pp.start_date) as period_sequence
        FROM payroll.payroll_entries pe
        JOIN hr.employees e ON pe.employee_id = e.id
        LEFT JOIN hr.departments d ON e.department_id = d.id
        LEFT JOIN hr.positions p ON e.actual_position_id = p.id
        JOIN payroll.payroll_runs pr ON pe.payroll_run_id = pr.id
        JOIN payroll.payroll_periods pp ON pe.payroll_period_id = pp.id
        JOIN config.lookup_values lv ON pe.status_lookup_value_id = lv.id
        WHERE lv.code IN ('PENTRY_APPROVED', 'PENTRY_ENTRY', 'CALCULATED_ENTRY')
    ),
    salary_with_changes AS (
        SELECT 
            *,
            -- 计算与上期对比
            LAG(gross_pay) OVER (PARTITION BY employee_id ORDER BY period_start_date) as previous_gross_pay,
            -- 计算年初至今累计
            SUM(gross_pay) OVER (
                PARTITION BY employee_id, EXTRACT(YEAR FROM period_start_date) 
                ORDER BY period_start_date 
                ROWS UNBOUNDED PRECEDING
            ) as ytd_gross_pay,
            -- 计算年初至今平均
            AVG(gross_pay) OVER (
                PARTITION BY employee_id, EXTRACT(YEAR FROM period_start_date) 
                ORDER BY period_start_date 
                ROWS UNBOUNDED PRECEDING
            ) as ytd_average_gross_pay
        FROM salary_data
    )
    SELECT 
        employee_id,
        employee_code,
        employee_name,
        department_name,
        position_name,
        period_name,
        period_start_date,
        period_end_date,
        gross_pay,
        net_pay,
        total_deductions,
        basic_salary,
        performance_salary,
        allowance_total,
        previous_gross_pay,
        -- 计算薪资变化
        CASE 
            WHEN previous_gross_pay IS NOT NULL AND previous_gross_pay > 0 
            THEN gross_pay - previous_gross_pay 
            ELSE NULL 
        END as gross_pay_change,
        CASE 
            WHEN previous_gross_pay IS NOT NULL AND previous_gross_pay > 0 
            THEN ROUND(((gross_pay - previous_gross_pay) / previous_gross_pay * 100), 2)
            ELSE NULL 
        END as gross_pay_change_pct,
        ROUND(ytd_gross_pay, 2) as ytd_gross_pay,
        ROUND(ytd_average_gross_pay, 2) as ytd_average_gross_pay,
        -- 部门内薪资排名
        RANK() OVER (
            PARTITION BY department_name, period_name 
            ORDER BY gross_pay DESC
        ) as salary_rank_in_department,
        -- 同职位薪资排名
        RANK() OVER (
            PARTITION BY position_name, period_name 
            ORDER BY gross_pay DESC
        ) as salary_rank_in_position
    FROM salary_with_changes
    ORDER BY employee_id, period_start_date;
    """)


def downgrade() -> None:
    """Downgrade schema."""
    # 删除员工薪资历史趋势视图
    op.execute("DROP VIEW IF EXISTS v_employee_salary_history;")
