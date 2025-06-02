#!/usr/bin/env python
"""
PayrollRun模型调试脚本
"""

import sys
import os
# 添加项目根目录到路径
script_dir = os.path.dirname(os.path.abspath(__file__))
webapp_dir = os.path.dirname(os.path.dirname(script_dir))
project_root = os.path.dirname(webapp_dir)
sys.path.insert(0, project_root)

# 直接导入需要的模块
import webapp.v2.database as db_module
import webapp.v2.models.payroll as payroll_models
from sqlalchemy.orm import joinedload

def debug_payroll_run():
    """调试PayrollRun模型"""
    print("=== PayrollRun模型调试 ===")
    
    # 获取数据库连接
    db = next(db_module.get_db_v2())
    
    try:
        # 查询PayrollRun
        print("1. 查询PayrollRun记录...")
        payroll_runs = db.query(payroll_models.PayrollRun).limit(5).all()
        print(f"   找到 {len(payroll_runs)} 条记录")
        
        if payroll_runs:
            run = payroll_runs[0]
            print(f"   第一条记录ID: {run.id}")
            print(f"   payroll_period_id: {run.payroll_period_id}")
            
            # 检查属性
            print("2. 检查PayrollRun属性...")
            attrs = dir(run)
            period_attrs = [attr for attr in attrs if 'period' in attr.lower()]
            print(f"   包含'period'的属性: {period_attrs}")
            
            # 尝试访问payroll_period关系
            print("3. 测试payroll_period关系...")
            try:
                period = run.payroll_period
                if period:
                    print(f"   ✓ payroll_period加载成功")
                    print(f"   start_date: {period.start_date}")
                    print(f"   end_date: {period.end_date}")
                else:
                    print("   ⚠️ payroll_period为None")
            except Exception as e:
                print(f"   ❌ 访问payroll_period失败: {e}")
            
            # 使用joinedload重新查询
            print("4. 使用joinedload重新查询...")
            try:
                run_with_period = db.query(payroll_models.PayrollRun).options(
                    joinedload(payroll_models.PayrollRun.payroll_period)
                ).filter(payroll_models.PayrollRun.id == run.id).first()
                
                if run_with_period and run_with_period.payroll_period:
                    print(f"   ✓ 使用joinedload成功")
                    print(f"   start_date: {run_with_period.payroll_period.start_date}")
                    print(f"   end_date: {run_with_period.payroll_period.end_date}")
                else:
                    print("   ⚠️ joinedload后payroll_period仍为None")
            except Exception as e:
                print(f"   ❌ joinedload查询失败: {e}")
        
    except Exception as e:
        print(f"❌ 调试失败: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        db.close()

if __name__ == "__main__":
    debug_payroll_run() 