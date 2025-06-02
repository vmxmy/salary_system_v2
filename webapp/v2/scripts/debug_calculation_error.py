#!/usr/bin/env python3
"""
调试薪资计算"COMPLETED"错误
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import date
from decimal import Decimal
from sqlalchemy.orm import sessionmaker, joinedload
from database import engine_v2
from models import Employee, PayrollRun
from payroll_engine.engine import PayrollCalculationEngine
from payroll_engine.models import CalculationContext, AttendanceData, CalculationStatus

# 创建数据库会话
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine_v2)

def debug_calculation():
    """调试薪资计算过程"""
    db = SessionLocal()
    
    try:
        print("=== 调试薪资计算引擎 ===")
        
        # 获取一个员工
        employee = db.query(Employee).filter(Employee.is_active == True).first()
        if not employee:
            print("❌ 没有找到活跃员工")
            return
        
        print(f"✓ 找到员工: ID={employee.id}, Name={getattr(employee, 'name', 'Unknown')}")
        
        # 获取一个薪资审核
        payroll_run = db.query(PayrollRun).options(joinedload(PayrollRun.payroll_period)).first()
        if not payroll_run:
            print("❌ 没有找到薪资审核")
            return
        
        print(f"✓ 找到薪资审核: ID={payroll_run.id}")
        print(f"  周期: {payroll_run.payroll_period.start_date} 到 {payroll_run.payroll_period.end_date}")
        
        # 创建计算上下文
        print("\n=== 创建计算上下文 ===")
        context = CalculationContext(
            employee_id=employee.id,
            period_id=payroll_run.id,
            period_start=payroll_run.payroll_period.start_date,
            period_end=payroll_run.payroll_period.end_date,
            base_salary=Decimal('5000'),  # 测试基础薪资
            attendance_data=AttendanceData(
                employee_id=employee.id,
                period_start=payroll_run.payroll_period.start_date,
                period_end=payroll_run.payroll_period.end_date,
                work_days=22,
                actual_work_days=22
            )
        )
        print(f"✓ 计算上下文创建成功")
        
        # 创建计算引擎
        print("\n=== 创建计算引擎 ===")
        engine = PayrollCalculationEngine(db)
        print(f"✓ 计算引擎创建成功")
        
        # 执行计算
        print("\n=== 执行计算 ===")
        try:
            result = engine.calculate(context)
            print(f"✓ 计算成功完成")
            print(f"  员工ID: {result.employee_id}")
            print(f"  状态: {result.status}")
            print(f"  总收入: {result.total_earnings}")
            print(f"  总扣除: {result.total_deductions}")
            print(f"  实发工资: {result.net_pay}")
            print(f"  组件数量: {len(result.components)}")
            
            # 检查状态
            if result.status == CalculationStatus.COMPLETED:
                print("✓ 计算状态正常")
            else:
                print(f"⚠️ 计算状态异常: {result.status}")
            
            return result
            
        except Exception as e:
            print(f"❌ 计算过程出错: {e}")
            print(f"错误类型: {type(e)}")
            import traceback
            traceback.print_exc()
            return None
        
    finally:
        db.close()

if __name__ == "__main__":
    debug_calculation() 