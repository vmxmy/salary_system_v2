"""sync_comprehensive_payroll_view_with_database_actual_structure

Revision ID: 499a47843ad2
Revises: b1233e9b8fab
Create Date: 2025-06-14 21:26:25.352076

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '499a47843ad2'
down_revision: Union[str, None] = 'b1233e9b8fab'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """同步 v_comprehensive_employee_payroll 视图与数据库实际结构"""
    print("🔄 正在同步 v_comprehensive_employee_payroll 视图与数据库实际结构...")
    
    # 方案A：使用动态SQL（推荐）
    create_comprehensive_payroll_view()
    
    # 方案B：如果动态SQL失败，可以调用外部脚本
    # import subprocess
    # import os
    # script_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'update_comprehensive_view_from_db.py')
    # subprocess.run([sys.executable, script_path], check=True)
    
    print("✅ 成功同步 v_comprehensive_employee_payroll 视图结构")


def downgrade() -> None:
    """恢复到之前的视图定义"""
    print("⬇️ 正在恢复 v_comprehensive_employee_payroll 视图到之前版本...")
    
    # 删除当前视图
    op.execute("DROP VIEW IF EXISTS reports.v_comprehensive_employee_payroll CASCADE;")
    
    # 恢复到之前的英文字段名版本（简化版）
    restore_previous_view()
    
    print("⬇️ 已恢复到之前的视图版本")


def create_comprehensive_payroll_view():
    """创建分层薪资视图架构 - 基于配置表动态生成"""
    
    print("🏗️ 正在创建分层薪资视图架构...")
    
    # 方案：调用外部脚本生成分层视图
    import subprocess
    import sys
    import os
    
    try:
        # 获取脚本路径
        script_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        script_path = os.path.join(script_dir, 'create_dynamic_layered_payroll_views.py')
        
        if os.path.exists(script_path):
            print(f"📋 调用动态视图生成脚本: {script_path}")
            result = subprocess.run([sys.executable, script_path], 
                                  capture_output=True, text=True, check=True)
            print("✅ 分层视图生成成功")
            if result.stdout:
                print(result.stdout)
        else:
            print("⚠️ 动态视图生成脚本不存在，使用备用方案...")
            # 备用方案：创建简化的分层视图
            create_fallback_layered_views()
            
    except subprocess.CalledProcessError as e:
        print(f"⚠️ 动态视图生成失败: {e}")
        print("🔄 使用备用方案...")
        create_fallback_layered_views()
    except Exception as e:
        print(f"⚠️ 调用外部脚本失败: {e}")
        print("🔄 使用备用方案...")
        create_fallback_layered_views()

def create_fallback_layered_views():
    """备用方案：创建简化的分层视图"""
    
    # 1. 基础视图
    basic_view_sql = """
    CREATE OR REPLACE VIEW reports.v_payroll_basic AS
    SELECT 
        pe.id AS "薪资条目id",
        pe.employee_id AS "员工id",
        eb.employee_code AS "员工编号",
        eb.full_name AS "姓名",
        eb.department_name AS "部门名称",
        eb.position_name AS "职位名称",
        eb.personnel_category_name AS "人员类别",
        COALESCE(pp.name, '未知期间') AS "薪资期间名称",
        COALESCE(pe.gross_pay, 0.00) AS "应发合计",
        COALESCE(pe.total_deductions, 0.00) AS "扣除合计",
        COALESCE(pe.net_pay, 0.00) AS "实发合计",
        pe.updated_at AS "更新时间"
    FROM payroll.payroll_entries pe
        LEFT JOIN reports.v_employees_basic eb ON pe.employee_id = eb.id
        LEFT JOIN payroll.payroll_periods pp ON pe.payroll_period_id = pp.id;
    """
    
    # 2. 综合视图（保持兼容性）
    comprehensive_view_sql = """
    CREATE OR REPLACE VIEW reports.v_comprehensive_employee_payroll AS
    SELECT 
        pb.*,
        pe.earnings_details AS "原始应发明细",
        pe.deductions_details AS "原始扣除明细",
        pe.calculation_inputs AS "原始计算输入"
    FROM reports.v_payroll_basic pb
        LEFT JOIN payroll.payroll_entries pe ON pb."薪资条目id" = pe.id;
    """
    
    op.execute(basic_view_sql)
    op.execute(comprehensive_view_sql)
    print("✅ 备用分层视图创建成功")


def restore_previous_view():
    """恢复到之前的简化视图版本"""
    restore_sql = '''
    CREATE VIEW reports.v_comprehensive_employee_payroll AS
    SELECT 
        pe.id as payroll_entry_id,
        pe.employee_id,
        pe.payroll_period_id,
        pe.payroll_run_id,
        e.employee_code,
        e.first_name,
        e.last_name,
        COALESCE(e.last_name || e.first_name, e.first_name, e.last_name, '未知姓名') as full_name,
        COALESCE(pe.gross_pay, 0.00) as gross_pay,
        COALESCE(pe.total_deductions, 0.00) as total_deductions,
        COALESCE(pe.net_pay, 0.00) as net_pay,
        pe.earnings_details as raw_earnings_details,
        pe.deductions_details as raw_deductions_details,
        pe.calculation_inputs as raw_calculation_inputs
    FROM payroll.payroll_entries pe
    LEFT JOIN hr.employees e ON pe.employee_id = e.id
    LEFT JOIN payroll.payroll_periods pp ON pe.payroll_period_id = pp.id
    LEFT JOIN payroll.payroll_runs pr ON pe.payroll_run_id = pr.id;
    '''
    
    op.execute(restore_sql)
