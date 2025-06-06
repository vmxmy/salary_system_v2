"""创建薪资系统核心业务视图层

Revision ID: 4e46e31c32d4
Revises: 57d6b0975bc7
Create Date: 2025-06-04 20:20:42.979618

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4e46e31c32d4'
down_revision: Union[str, None] = '57d6b0975bc7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """创建薪资系统核心业务视图层（简化版）"""
    
    # 1. 创建薪资周期详情视图
    op.execute("""
    CREATE VIEW v_payroll_periods_detail AS
    SELECT 
      pp.id,
      pp.name,
      pp.start_date,
      pp.end_date,
      pp.pay_date,
      
      -- 状态信息
      status.name as status_name,
      status.code as status_code,
      
      -- 频率信息
      freq.name as frequency_name,
      freq.code as frequency_code,
      
      -- 统计信息
      (SELECT COUNT(*) FROM payroll.payroll_runs pr WHERE pr.payroll_period_id = pp.id) as runs_count,
      (SELECT COUNT(*) FROM payroll.payroll_entries pe 
       JOIN payroll.payroll_runs pr ON pe.payroll_run_id = pr.id 
       WHERE pr.payroll_period_id = pp.id) as entries_count
       
    FROM payroll.payroll_periods pp
    LEFT JOIN config.lookup_values status ON pp.status_lookup_value_id = status.id
    LEFT JOIN config.lookup_values freq ON pp.frequency_lookup_value_id = freq.id;
    """)
    
    # 2. 创建薪资运行详情视图
    op.execute("""
    CREATE VIEW v_payroll_runs_detail AS
    SELECT 
      pr.id,
      pr.payroll_period_id,
      pr.run_date,
      
      -- 周期信息
      pp.name as period_name,
      pp.start_date as period_start,
      pp.end_date as period_end,
      
      -- 状态信息
      status.name as status_name,
      status.code as status_code,
      
      -- 创建人信息
      u.username as initiated_by_username,
      user_emp.first_name || ' ' || user_emp.last_name as initiated_by_name,
      
      -- 统计信息
      (SELECT COUNT(*) FROM payroll.payroll_entries pe WHERE pe.payroll_run_id = pr.id) as entries_count,
      (SELECT COUNT(*) FROM payroll.payroll_entries pe WHERE pe.payroll_run_id = pr.id AND pe.status_lookup_value_id = 65) as approved_entries_count,
      (SELECT COALESCE(SUM(pe.gross_pay), 0.00) FROM payroll.payroll_entries pe WHERE pe.payroll_run_id = pr.id) as total_gross_pay,
      (SELECT COALESCE(SUM(pe.net_pay), 0.00) FROM payroll.payroll_entries pe WHERE pe.payroll_run_id = pr.id) as total_net_pay
      
    FROM payroll.payroll_runs pr
    LEFT JOIN payroll.payroll_periods pp ON pr.payroll_period_id = pp.id
    LEFT JOIN config.lookup_values status ON pr.status_lookup_value_id = status.id
    LEFT JOIN security.users u ON pr.initiated_by_user_id = u.id
    LEFT JOIN hr.employees user_emp ON u.employee_id = user_emp.id;
    """)
    
    print("✅ 成功创建2个核心业务视图:")
    print("  - v_payroll_periods_detail (薪资周期详情)")
    print("  - v_payroll_runs_detail (薪资运行详情)")


def downgrade() -> None:
    """删除薪资系统核心业务视图层"""
    
    # 按依赖关系逆序删除视图
    op.execute("DROP VIEW IF EXISTS v_payroll_runs_detail;")
    op.execute("DROP VIEW IF EXISTS v_payroll_periods_detail;")
    
    print("✅ 成功删除核心业务视图")
