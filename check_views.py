#!/usr/bin/env python3
"""
检查数据库视图的存在和数据
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from webapp.v2.database import get_db_v2
from sqlalchemy import text

def check_views():
    """检查视图状态"""
    print("🔍 检查数据库视图状态")
    print("=" * 50)
    
    db = next(get_db_v2())
    
    try:
        # 检查视图是否存在
        result = db.execute(text("SELECT schemaname, viewname FROM pg_views WHERE schemaname IN ('payroll', 'reports')"))
        views = result.fetchall()
        
        print('📊 现有视图:')
        for view in views:
            print(f'  - {view.schemaname}.{view.viewname}')
        
        # 检查审核概览视图的数据
        print('\n🔍 检查审核概览视图:')
        try:
            result = db.execute(text('SELECT COUNT(*) as count FROM payroll.audit_overview'))
            count = result.fetchone()
            print(f'  审核概览视图记录数: {count.count if count else 0}')
            
            # 查看具体数据
            result = db.execute(text('SELECT payroll_run_id, total_entries, total_anomalies FROM payroll.audit_overview LIMIT 5'))
            rows = result.fetchall()
            print('  前5条记录:')
            for row in rows:
                print(f'    Run ID: {row.payroll_run_id}, 条目: {row.total_entries}, 异常: {row.total_anomalies}')
                
        except Exception as e:
            print(f'  ❌ 审核概览视图错误: {e}')
        
        # 检查异常详情视图的数据
        print('\n🚨 检查异常详情视图:')
        try:
            result = db.execute(text('SELECT COUNT(*) as count FROM payroll.audit_anomalies_detail'))
            count = result.fetchone()
            print(f'  异常详情视图记录数: {count.count if count else 0}')
            
            # 查看具体数据
            result = db.execute(text('SELECT payroll_run_id, employee_name, anomaly_type FROM payroll.audit_anomalies_detail LIMIT 5'))
            rows = result.fetchall()
            print('  前5条记录:')
            for row in rows:
                print(f'    Run ID: {row.payroll_run_id}, 员工: {row.employee_name}, 类型: {row.anomaly_type}')
                
        except Exception as e:
            print(f'  ❌ 异常详情视图错误: {e}')
        
        # 检查员工薪资详情视图
        print('\n💰 检查员工薪资详情视图:')
        try:
            result = db.execute(text('SELECT COUNT(*) as count FROM reports.employee_salary_details_view'))
            count = result.fetchone()
            print(f'  员工薪资详情视图记录数: {count.count if count else 0}')
            
        except Exception as e:
            print(f'  ❌ 员工薪资详情视图错误: {e}')
            
        # 检查特定payroll_run_id=53的数据
        print('\n🎯 检查payroll_run_id=53的数据:')
        try:
            # 检查PayrollRun表
            result = db.execute(text('SELECT id, total_employees FROM payroll.payroll_runs WHERE id = 53'))
            run = result.fetchone()
            if run:
                print(f'  PayrollRun 53: 员工数 {run.total_employees}')
            else:
                print('  ❌ PayrollRun 53 不存在')
            
            # 检查PayrollEntry表
            result = db.execute(text('SELECT COUNT(*) as count FROM payroll.payroll_entries WHERE payroll_run_id = 53'))
            count = result.fetchone()
            print(f'  PayrollEntry 53: 条目数 {count.count if count else 0}')
            
            # 检查PayrollAuditAnomaly表
            result = db.execute(text('SELECT COUNT(*) as count FROM payroll.payroll_audit_anomalies WHERE payroll_run_id = 53'))
            count = result.fetchone()
            print(f'  PayrollAuditAnomaly 53: 异常数 {count.count if count else 0}')
            
        except Exception as e:
            print(f'  ❌ 检查payroll_run_id=53数据错误: {e}')
        
    except Exception as e:
        print(f'❌ 总体错误: {e}')
    finally:
        db.close()

if __name__ == "__main__":
    check_views() 