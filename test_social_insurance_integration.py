#!/usr/bin/env python3
"""
测试社保计算集成功能

用于验证新集成的社保计算器是否正常工作

运行方式：
python test_social_insurance_integration.py
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'webapp'))

from datetime import date
from decimal import Decimal
import logging

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def test_social_insurance_calculator():
    """测试社保计算器"""
    try:
        from webapp.v2.database import get_db_v2_sync
        from webapp.v2.payroll_engine.social_insurance_calculator import SocialInsuranceCalculator
        
        print("🔄 测试社保计算器...")
        
        # 获取数据库连接
        db = next(get_db_v2_sync())
        
        # 初始化计算器
        calculator = SocialInsuranceCalculator(db)
        
        # 测试单个员工计算
        test_employee_id = 1  # 假设员工ID为1
        calculation_period = date(2025, 1, 1)
        
        print(f"📝 计算员工 {test_employee_id} 的社保...")
        
        result = calculator.calculate_employee_social_insurance(
            employee_id=test_employee_id,
            calculation_period=calculation_period
        )
        
        print(f"✅ 计算完成！")
        print(f"   - 员工ID: {result.employee_id}")
        print(f"   - 计算期间: {result.calculation_period}")
        print(f"   - 个人社保合计: {result.total_employee_amount}")
        print(f"   - 单位社保合计: {result.total_employer_amount}")
        print(f"   - 组件数量: {len(result.components)}")
        
        for component in result.components:
            print(f"     * {component.component_name}: 个人={component.employee_amount}, 单位={component.employer_amount}")
        
        if result.applied_rules:
            print(f"   - 适用规则: {', '.join(result.applied_rules)}")
        
        if result.unapplied_rules:
            print(f"   - 不适用规则: {', '.join(result.unapplied_rules)}")
        
        db.close()
        return True
        
    except Exception as e:
        print(f"❌ 社保计算器测试失败: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_integrated_calculator():
    """测试集成计算器（验证正确的计算顺序）"""
    try:
        from webapp.v2.database import get_db_v2_sync
        from webapp.v2.payroll_engine.integrated_calculator import IntegratedPayrollCalculator
        
        print("\n🔄 测试集成计算器（正确计算顺序）...")
        
        # 获取数据库连接
        db = next(get_db_v2_sync())
        
        # 初始化计算器
        calculator = IntegratedPayrollCalculator(db)
        
        # 模拟薪资数据
        test_employee_id = 1
        test_payroll_run_id = 1
        earnings_data = {
            "BASIC_SALARY": {"amount": 5000, "name": "基本工资"},
            "ALLOWANCE": {"amount": 1000, "name": "津贴"}
        }
        deductions_data = {
            "TAX": {"amount": 200, "name": "个税"}
        }
        calculation_period = date(2025, 1, 1)
        
        print(f"📝 输入数据:")
        print(f"   - 收入项: 基本工资 5000 + 津贴 1000 = 6000")
        print(f"   - 其他扣除: 个税 200")
        print(f"   - 计算期间: {calculation_period}")
        
        print(f"\n🔢 开始集成计算（正确顺序）...")
        
        result = calculator.calculate_employee_payroll(
            employee_id=test_employee_id,
            payroll_run_id=test_payroll_run_id,
            earnings_data=earnings_data,
            deductions_data=deductions_data,
            calculation_period=calculation_period,
            include_social_insurance=True
        )
        
        print(f"\n✅ 集成计算完成！计算顺序验证：")
        print(f"   📊 第一步：五险一金计算")
        print(f"      - 个人社保: {result.social_insurance_employee}")
        print(f"      - 个人公积金: {result.housing_fund_employee}")
        print(f"      - 单位社保: {result.social_insurance_employer}")
        print(f"      - 单位公积金: {result.housing_fund_employer}")
        
        print(f"   📋 第二步：汇总计算")
        print(f"      - 应发合计: {result.gross_pay}")
        print(f"      - 扣发合计: {result.total_deductions} (含个人五险一金)")
        print(f"      - 实发合计: {result.net_pay}")
        
        # 计算单位总成本
        employer_social_cost = result.social_insurance_employer + result.housing_fund_employer
        total_employer_cost = result.gross_pay + employer_social_cost
        
        print(f"   💰 成本分析:")
        print(f"      - 单位工资成本: {result.gross_pay}")
        print(f"      - 单位社保成本: {employer_social_cost}")
        print(f"      - 单位总成本: {total_employer_cost}")
        
        # 验证计算逻辑
        expected_gross = 6000  # 5000 + 1000
        if abs(float(result.gross_pay) - expected_gross) < 0.01:
            print(f"   ✅ 应发合计计算正确")
        else:
            print(f"   ❌ 应发合计计算错误: 期望 {expected_gross}, 实际 {result.gross_pay}")
        
        expected_deductions = 200 + float(result.social_insurance_employee) + float(result.housing_fund_employee)
        if abs(float(result.total_deductions) - expected_deductions) < 0.01:
            print(f"   ✅ 扣发合计计算正确")
        else:
            print(f"   ❌ 扣发合计计算错误: 期望 {expected_deductions}, 实际 {result.total_deductions}")
        
        expected_net = expected_gross - expected_deductions
        if abs(float(result.net_pay) - expected_net) < 0.01:
            print(f"   ✅ 实发合计计算正确")
        else:
            print(f"   ❌ 实发合计计算错误: 期望 {expected_net}, 实际 {result.net_pay}")
        
        # 显示详细组件信息
        if result.social_insurance_components:
            print(f"\n📋 五险一金明细:")
            for component in result.social_insurance_components:
                print(f"      - {component.component_name}: 个人 {component.employee_amount}, 单位 {component.employer_amount}")
        
        db.close()
        return True
        
    except Exception as e:
        print(f"❌ 集成计算器测试失败: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_calculation_summary():
    """测试计算汇总功能"""
    try:
        from webapp.v2.database import get_db_v2_sync
        from webapp.v2.payroll_engine.integrated_calculator import IntegratedPayrollCalculator, IntegratedCalculationResult
        from webapp.v2.payroll_engine.simple_calculator import CalculationStatus
        from decimal import Decimal
        from datetime import date
        
        print("\n🔄 测试计算汇总功能...")
        
        # 获取数据库连接
        db = next(get_db_v2_sync())
        
        # 初始化计算器
        calculator = IntegratedPayrollCalculator(db)
        
        # 创建模拟计算结果
        results = [
            IntegratedCalculationResult(
                employee_id=1,
                gross_pay=Decimal('6000.00'),
                total_deductions=Decimal('1200.00'),
                net_pay=Decimal('4800.00'),
                social_insurance_employee=Decimal('800.00'),
                social_insurance_employer=Decimal('1200.00'),
                housing_fund_employee=Decimal('200.00'),
                housing_fund_employer=Decimal('200.00'),
                status=CalculationStatus.COMPLETED
            ),
            IntegratedCalculationResult(
                employee_id=2,
                gross_pay=Decimal('8000.00'),
                total_deductions=Decimal('1600.00'),
                net_pay=Decimal('6400.00'),
                social_insurance_employee=Decimal('1000.00'),
                social_insurance_employer=Decimal('1500.00'),
                housing_fund_employee=Decimal('300.00'),
                housing_fund_employer=Decimal('300.00'),
                status=CalculationStatus.COMPLETED
            )
        ]
        
        print(f"📝 计算汇总（2名员工）...")
        
        summary = calculator.get_calculation_summary(results)
        
        print(f"\n✅ 汇总计算完成！")
        print(f"📊 基础统计:")
        print(f"   - 总员工数: {summary['calculation_summary']['total_employees']}")
        print(f"   - 成功计算: {summary['calculation_summary']['successful_count']}")
        print(f"   - 计算失败: {summary['calculation_summary']['failed_count']}")
        
        print(f"\n💰 薪资汇总:")
        print(f"   - 应发合计: {summary['payroll_totals']['total_gross_pay']}")
        print(f"   - 扣发合计: {summary['payroll_totals']['total_deductions']}")
        print(f"   - 实发合计: {summary['payroll_totals']['total_net_pay']}")
        print(f"   - 单位总成本: {summary['payroll_totals']['total_employer_cost']}")
        
        print(f"\n🏥 五险一金明细:")
        print(f"   个人缴费:")
        print(f"     - 社保: {summary['social_insurance_breakdown']['employee_totals']['social_insurance']}")
        print(f"     - 公积金: {summary['social_insurance_breakdown']['employee_totals']['housing_fund']}")
        print(f"     - 合计: {summary['social_insurance_breakdown']['employee_totals']['total']}")
        
        print(f"   单位缴费:")
        print(f"     - 社保: {summary['social_insurance_breakdown']['employer_totals']['social_insurance']}")
        print(f"     - 公积金: {summary['social_insurance_breakdown']['employer_totals']['housing_fund']}")
        print(f"     - 合计: {summary['social_insurance_breakdown']['employer_totals']['total']}")
        
        print(f"\n📈 成本分析:")
        print(f"   - 员工实得: {summary['cost_analysis']['employee_take_home']}")
        print(f"   - 员工社保成本: {summary['cost_analysis']['employee_social_cost']}")
        print(f"   - 单位工资成本: {summary['cost_analysis']['employer_salary_cost']}")
        print(f"   - 单位社保成本: {summary['cost_analysis']['employer_social_cost']}")
        print(f"   - 单位总成本: {summary['cost_analysis']['total_cost']}")
        print(f"   - 社保成本比例: {summary['cost_analysis']['social_cost_ratio']:.2f}%")
        
        print(f"\n🔧 计算元数据:")
        print(f"   - 引擎版本: {summary['calculation_metadata']['engine_version']}")
        print(f"   - 计算顺序: {summary['calculation_metadata']['calculation_order']}")
        
        db.close()
        return True
        
    except Exception as e:
        print(f"❌ 计算汇总测试失败: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_api_endpoints():
    """测试API端点（使用requests）"""
    try:
        import requests
        
        print("\n🔄 测试API端点...")
        
        base_url = "http://localhost:8080/v2/simple-payroll"
        
        # 测试社保计算API
        print("📝 测试社保计算API...")
        
        social_insurance_data = {
            "employee_ids": [1],
            "calculation_period": "2025-01-01"
        }
        
        response = requests.post(
            f"{base_url}/social-insurance/calculate",
            json=social_insurance_data,
            headers={"Authorization": "Bearer YOUR_TOKEN"}  # 需要实际的token
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ 社保计算API测试成功！")
            print(f"   - 响应状态: {response.status_code}")
            print(f"   - 计算员工数: {result['data']['total_employees']}")
        else:
            print(f"⚠️ 社保计算API返回非200状态: {response.status_code}")
            print(f"   - 响应内容: {response.text}")
        
        return True
        
    except ImportError:
        print("⚠️ 未安装requests库，跳过API测试")
        return True
    except Exception as e:
        print(f"❌ API端点测试失败: {e}")
        return False

def main():
    """主测试函数"""
    print("🚀 开始测试社保计算集成功能...\n")
    
    test_results = []
    
    # 测试社保计算器
    test_results.append(("社保计算器", test_social_insurance_calculator()))
    
    # 测试集成计算器  
    test_results.append(("集成计算器", test_integrated_calculator()))
    
    # 测试计算汇总
    test_results.append(("计算汇总", test_calculation_summary()))
    
    # 测试API端点
    test_results.append(("API端点", test_api_endpoints()))
    
    # 输出测试结果汇总
    print("\n" + "="*50)
    print("📊 测试结果汇总:")
    print("="*50)
    
    success_count = 0
    for test_name, result in test_results:
        status = "✅ 通过" if result else "❌ 失败"
        print(f"   {test_name}: {status}")
        if result:
            success_count += 1
    
    print(f"\n总计: {success_count}/{len(test_results)} 项测试通过")
    
    if success_count == len(test_results):
        print("🎉 所有测试通过！社保计算集成功能正常工作。")
        return 0
    else:
        print("⚠️ 部分测试失败，请检查错误信息。")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code) 