#!/usr/bin/env python
"""
薪资计算引擎调试脚本
直接测试引擎以定位SOCIAL_INSURANCE异常
"""

import sys
import os
# 添加项目根目录到路径
script_dir = os.path.dirname(os.path.abspath(__file__))
webapp_dir = os.path.dirname(os.path.dirname(script_dir))  # webapp目录
project_root = os.path.dirname(webapp_dir)  # salary_system目录
sys.path.insert(0, project_root)

from decimal import Decimal
from datetime import date, datetime

# 直接导入需要的模块
import webapp.v2.payroll_engine.engine as engine_module
import webapp.v2.payroll_engine.models as models_module
import webapp.v2.database as db_module

PayrollCalculationEngine = engine_module.PayrollCalculationEngine
CalculationContext = models_module.CalculationContext
AttendanceData = models_module.AttendanceData
get_db_v2 = db_module.get_db_v2

def debug_engine():
    """调试薪资计算引擎"""
    print("=== 薪资计算引擎调试 ===")
    
    # 获取数据库连接
    db = next(get_db_v2())
    
    try:
        # 创建引擎
        print("1. 创建薪资计算引擎...")
        engine = PayrollCalculationEngine(db)
        
        # 检查注册的计算器
        print("2. 检查注册的计算器:")
        calculators = engine.get_available_calculators()
        for code, name in calculators.items():
            print(f"   - {code}: {name}")
        
        # 检查计算顺序
        print("3. 检查计算顺序:")
        for i, code in enumerate(engine.calculation_order):
            exists = "✓" if code in calculators else "✗"
            print(f"   {i+1}. {code} {exists}")
        
        # 验证计算设置
        print("4. 验证计算设置:")
        errors = engine.validate_calculation_setup()
        if errors:
            for error in errors:
                print(f"   ✗ {error}")
        else:
            print("   ✓ 计算设置验证通过")
        
        # 创建测试上下文
        print("5. 创建测试计算上下文...")
        context = CalculationContext(
            employee_id=349,
            period_id=13,
            period_start=date(2024, 1, 1),
            period_end=date(2024, 1, 31),
            base_salary=Decimal('8000'),
            employee_data={'base_salary': 8000, 'name': '测试员工'},
            salary_config={},
            attendance_data=AttendanceData(
                employee_id=349,
                period_start=date(2024, 1, 1),
                period_end=date(2024, 1, 31),
                work_days=22,
                actual_work_days=22
            )
        )
        
        # 逐个测试计算器
        print("6. 逐个测试计算器:")
        for code in engine.calculation_order:
            if code in engine.calculators:
                calculator = engine.calculators[code]
                print(f"   测试 {code} ({calculator.component_name})...")
                try:
                    result = calculator.calculate(context)
                    print(f"   ✓ {code}: {result.amount}")
                    # 更新上下文
                    context.add_calculation_result(code, result.amount)
                except Exception as e:
                    print(f"   ✗ {code}: {str(e)}")
                    print(f"      异常类型: {type(e).__name__}")
                    import traceback
                    traceback.print_exc()
                    break
        
        print("7. 测试完整计算...")
        try:
            result = engine.calculate(context)
            print(f"   ✓ 计算完成，状态: {result.status}")
            print(f"   组件数量: {len(result.components)}")
        except Exception as e:
            print(f"   ✗ 完整计算失败: {str(e)}")
            print(f"   异常类型: {type(e).__name__}")
            import traceback
            traceback.print_exc()
            
    except Exception as e:
        print(f"引擎调试失败: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    debug_engine() 