#!/usr/bin/env python3
"""
测试工资运行新字段的更新功能
"""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'webapp'))

from webapp.v2.database import get_db_v2
from webapp.v2.models.payroll import PayrollRun
from sqlalchemy import text

def test_payroll_run_fields():
    """测试工资运行字段"""
    
    # 获取数据库连接
    db = next(get_db_v2())
    
    try:
        # 查看工资运行50的当前状态
        payroll_run = db.query(PayrollRun).filter(PayrollRun.id == 50).first()
        
        if payroll_run:
            print(f"🔍 工资运行 {payroll_run.id} 当前状态:")
            print(f"   状态ID: {payroll_run.status_lookup_value_id}")
            print(f"   员工总数: {payroll_run.total_employees}")
            print(f"   总应发: {payroll_run.total_gross_pay}")
            print(f"   总扣发: {payroll_run.total_deductions}")
            print(f"   总实发: {payroll_run.total_net_pay}")
            
            # 查询状态名称
            status_result = db.execute(
                text("SELECT lv.name, lv.code FROM config.lookup_values lv WHERE lv.id = :status_id"),
                {"status_id": payroll_run.status_lookup_value_id}
            ).first()
            
            if status_result:
                print(f"   状态名称: {status_result.name} ({status_result.code})")
                
                # 检查是否是已计算状态
                if status_result.code == "PRUN_CALCULATED":
                    print(f"⚠️ 警告: 工资运行当前状态为「{status_result.name}」，重新计算将覆盖原有计算结果")
            
            # 计算当前工资条目的汇总数据
            summary_result = db.execute(
                text("""
                SELECT 
                    COUNT(*) as entry_count,
                    COALESCE(SUM(gross_pay), 0) as total_gross,
                    COALESCE(SUM(total_deductions), 0) as total_deductions,
                    COALESCE(SUM(net_pay), 0) as total_net
                FROM payroll.payroll_entries 
                WHERE payroll_run_id = :run_id
                """),
                {"run_id": 50}
            ).first()
            
            if summary_result:
                print(f"\n📊 工资条目汇总数据:")
                print(f"   条目数量: {summary_result.entry_count}")
                print(f"   应发合计: {summary_result.total_gross}")
                print(f"   扣发合计: {summary_result.total_deductions}")
                print(f"   实发合计: {summary_result.total_net}")
                
                # 检查数据一致性
                if payroll_run.total_net_pay and abs(float(payroll_run.total_net_pay) - float(summary_result.total_net)) > 0.01:
                    print(f"⚠️ 数据不一致: 运行表实发({payroll_run.total_net_pay}) vs 条目汇总({summary_result.total_net})")
        else:
            print("❌ 工资运行50不存在")
            
    except Exception as e:
        print(f"❌ 测试失败: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    test_payroll_run_fields() 