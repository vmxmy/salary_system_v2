"""添加员工和薪资条目核心视图

Revision ID: e84d8ddef3e3
Revises: 4e46e31c32d4
Create Date: 2025-06-04 20:28:10.162828

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e84d8ddef3e3'
down_revision: Union[str, None] = '4e46e31c32d4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """添加员工和薪资条目核心视图（简化版）"""
    
    # 1. 创建员工基础信息视图
    op.execute("""
    CREATE VIEW v_employees_basic AS
    SELECT 
      e.id,
      e.employee_code,
      e.first_name,
      e.last_name,
      e.first_name || ' ' || e.last_name AS full_name,
      e.email,
      e.phone_number,
      e.hire_date,
      e.is_active,
      
      -- 部门信息
      d.name as department_name,
      d.code as department_code,
      
      -- 职位信息
      p.name as position_name,
      p.code as position_code,
      
      -- 人员类别
      pc.name as personnel_category_name,
      
      -- 状态信息
      emp_status.name as employee_status,
      emp_status.code as employee_status_code
      
    FROM hr.employees e
    LEFT JOIN hr.departments d ON e.department_id = d.id
    LEFT JOIN hr.positions p ON e.actual_position_id = p.id
    LEFT JOIN hr.personnel_categories pc ON e.personnel_category_id = pc.id
    LEFT JOIN config.lookup_values emp_status ON e.status_lookup_value_id = emp_status.id;
    """)
    
    # 2. 创建薪资组件定义视图
    op.execute("""
    CREATE VIEW v_payroll_components_basic AS
    SELECT 
      pcd.id,
      pcd.code,
      pcd.name,
      pcd.type,
      pcd.calculation_method,
      pcd.calculation_parameters,
      pcd.is_taxable,
      pcd.is_social_security_base,
      pcd.is_housing_fund_base,
      pcd.display_order,
      pcd.is_active,
      pcd.effective_date,
      pcd.end_date,
      
      -- 统计信息
      (SELECT COUNT(*) FROM hr.employee_payroll_components epc WHERE epc.component_definition_id = pcd.id) as employees_count
      
    FROM config.payroll_component_definitions pcd;
    """)
    
    # 3. 创建薪资条目简化视图
    op.execute("""
    CREATE VIEW v_payroll_entries_basic AS
    SELECT 
      pe.id,
      pe.payroll_run_id,
      pe.employee_id,
      pe.updated_at,
      
      -- 员工基本信息
      e.employee_code,
      e.first_name || ' ' || e.last_name as employee_name,
      
      -- 部门信息
      d.name as department_name,
      
      -- 薪资汇总
      COALESCE(pe.gross_pay, 0.00) as gross_pay,
      COALESCE(pe.net_pay, 0.00) as net_pay,
      COALESCE(pe.total_deductions, 0.00) as total_deductions,
      
      -- 状态信息
      status.name as status_name,
      status.code as status_code,
      
      -- 详细薪资组件（JSONB）
      pe.earnings_details,
      pe.deductions_details
      
    FROM payroll.payroll_entries pe
    LEFT JOIN hr.employees e ON pe.employee_id = e.id
    LEFT JOIN hr.departments d ON e.department_id = d.id
    LEFT JOIN config.lookup_values status ON pe.status_lookup_value_id = status.id;
    """)
    
    print("✅ 成功创建3个基础业务视图:")
    print("  - v_employees_basic (员工基础信息)")
    print("  - v_payroll_components_basic (薪资组件基础)")
    print("  - v_payroll_entries_basic (薪资条目基础)")


def downgrade() -> None:
    """删除员工和薪资条目核心视图"""
    
    # 按依赖关系逆序删除视图
    op.execute("DROP VIEW IF EXISTS v_payroll_entries_basic;")
    op.execute("DROP VIEW IF EXISTS v_payroll_components_basic;")
    op.execute("DROP VIEW IF EXISTS v_employees_basic;")
    
    print("✅ 成功删除基础业务视图")
