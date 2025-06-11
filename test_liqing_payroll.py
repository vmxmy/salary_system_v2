#!/usr/bin/env python3
"""
测试李庆的工资记录计算引擎
"""

import os
import sys
import json
from decimal import Decimal
from datetime import datetime

# 添加项目路径
sys.path.append(os.path.join(os.path.dirname(__file__), 'webapp'))

from webapp.v2.database import get_db_v2
from webapp.v2.models import Employee, PayrollEntry, PayrollRun, PayrollPeriod
from webapp.v2.payroll_engine.simple_calculator import SimplePayrollCalculator

def test_liqing_payroll():
    """测试李庆的工资记录"""
    print("🧪 **测试李庆工资记录计算引擎**")
    print("=" * 60)
    
    db = next(get_db_v2())
    calculator = SimplePayrollCalculator(db)
    
    try:
        # 1. 获取李庆员工信息
        employee = db.query(Employee).filter(
            Employee.first_name == '庆',
            Employee.last_name == '李'
        ).first()
        
        if not employee:
            print("❌ 未找到李庆的员工记录")
            return
            
        employee_name = f"{employee.first_name} {employee.last_name}"
        print(f"📋 **员工信息**: {employee_name} (ID: {employee.id})")
        
        # 2. 获取李庆的最新工资记录
        latest_entry = db.query(PayrollEntry).join(PayrollRun).join(PayrollPeriod)\
            .filter(PayrollEntry.employee_id == employee.id)\
            .order_by(PayrollPeriod.end_date.desc(), PayrollEntry.id.desc())\
            .first()
            
        if not latest_entry:
            print("❌ 未找到李庆的工资记录")
            return
            
        payroll_run = latest_entry.payroll_run
        period = payroll_run.period
        
        print(f"📅 **工资期间**: {period.name} ({period.start_date} 至 {period.end_date})")
        print(f"💼 **工资运行**: {payroll_run.run_name}")
        print()
        
        # 3. 显示原始数据
        print("💰 **原始工资数据**:")
        print("   收入项目:")
        for key, value in latest_entry.earnings_details.items():
            print(f"     - {key}: {value['amount']} ({value['name']})")
        print("   扣除项目:")
        for key, value in latest_entry.deductions_details.items():
            print(f"     - {key}: {value['amount']} ({value['name']})")
        print(f"   原始合计: 应发={latest_entry.gross_pay}, 扣发={latest_entry.total_deductions}, 实发={latest_entry.net_pay}")
        print()
        
        # 4. 测试简单计算引擎
        print("🔄 **使用简单计算引擎重新计算**...")
        
        # 准备计算数据（使用原始数据作为输入）
        earnings_data = {}
        deductions_data = {}
        
        for key, value in latest_entry.earnings_details.items():
            earnings_data[key] = float(value['amount'])
            
        for key, value in latest_entry.deductions_details.items():
            deductions_data[key] = float(value['amount'])
        
        # 执行计算
        result = calculator.calculate(
            employee_id=employee.id,
            earnings=earnings_data,
            deductions=deductions_data
        )
        
        print(f"   计算结果: 应发={result.gross_pay}, 扣发={result.total_deductions}, 实发={result.net_pay}")
        print()
        
        # 5. 对比分析
        print("📊 **计算对比分析**:")
        print(f"   数据源应发:     {latest_entry.gross_pay}")
        print(f"   引擎计算应发:   {result.gross_pay}")
        print(f"   数据源扣发:     {latest_entry.total_deductions}")
        print(f"   引擎计算扣发:   {result.total_deductions}")
        print(f"   数据源实发:     {latest_entry.net_pay}")
        print(f"   引擎计算实发:   {result.net_pay}")
        
        # 计算差异
        gross_diff = float(result.gross_pay) - float(latest_entry.gross_pay)
        deduction_diff = float(result.total_deductions) - float(latest_entry.total_deductions)
        net_diff = float(result.net_pay) - float(latest_entry.net_pay)
        
        print(f"   应发差异:       {gross_diff:+.2f}")
        print(f"   扣发差异:       {deduction_diff:+.2f}")
        print(f"   实发差异:       {net_diff:+.2f}")
        print()
        
        # 6. 测试其他月份记录（如果有）
        all_entries = db.query(PayrollEntry).join(PayrollRun).join(PayrollPeriod)\
            .filter(PayrollEntry.employee_id == employee.id)\
            .order_by(PayrollPeriod.end_date.desc())\
            .limit(3)\
            .all()
            
        if len(all_entries) > 1:
            print("📈 **历史记录对比测试**:")
            for i, entry in enumerate(all_entries, 1):
                period_name = entry.payroll_run.period.name
                
                # 提取收入和扣除数据
                earnings = {k: float(v['amount']) for k, v in entry.earnings_details.items()}
                deductions = {k: float(v['amount']) for k, v in entry.deductions_details.items()}
                
                # 重新计算
                calc_result = calculator.calculate(employee.id, earnings, deductions)
                
                print(f"   月份 {i} ({period_name}):")
                print(f"     原始: 应发={entry.gross_pay}, 实发={entry.net_pay}")
                print(f"     计算: 应发={calc_result.gross_pay}, 实发={calc_result.net_pay}")
                
                # 计算差异
                gross_diff = float(calc_result.gross_pay) - float(entry.gross_pay)
                net_diff = float(calc_result.net_pay) - float(entry.net_pay)
                print(f"     差异: 应发={gross_diff:+.2f}, 实发={net_diff:+.2f}")
        
        print()
        print("✅ **李庆工资记录测试完成！**")
        
    except Exception as e:
        print(f"❌ **测试失败**: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_liqing_payroll() 