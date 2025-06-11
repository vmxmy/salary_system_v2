#!/usr/bin/env python3
"""
测试动态工资组件映射功能 - 使用真实数据库数据
"""

import os
import sys
from decimal import Decimal

# 添加项目路径
sys.path.append(os.path.join(os.path.dirname(__file__), 'webapp'))

from webapp.v2.database import get_db_v2
from webapp.v2.models import Employee, PayrollEntry, PayrollRun, PayrollPeriod
from webapp.v2.payroll_engine.simple_calculator import SimplePayrollCalculator, SimplePayrollDataMapper

def test_dynamic_mapping():
    """测试动态工资组件映射"""
    print("🧪 **测试动态工资组件映射功能 - 使用真实数据**")
    print("=" * 60)
    
    db = next(get_db_v2())
    
    try:
        # 1. 初始化映射器
        print("📋 **初始化动态映射器**...")
        mapper = SimplePayrollDataMapper(db)
        
        # 2. 查看映射加载情况
        print("🔄 **加载工资组件映射**...")
        
        # 按类型显示组件分类
        components_by_type = mapper.COMPONENTS_BY_TYPE
        
        print("📊 **组件类型分布**:")
        for component_type, components in sorted(components_by_type.items()):
            print(f"   {component_type}: {len(components)} 个组件")
        print()
        
        # 3. 显示各类型的部分组件
        for component_type, components in sorted(components_by_type.items()):
            if len(components) > 0:
                emoji = {
                    'EARNING': '💰',
                    'PERSONAL_DEDUCTION': '💸', 
                    'EMPLOYER_DEDUCTION': '🏢',
                    'CALCULATION_BASE': '📐',
                    'CALCULATION_RATE': '📊',
                    'CALCULATION_RESULT': '🎯',
                    'OTHER': '📋'
                }.get(component_type, '📄')
                
                print(f"{emoji} **{component_type}类型组件示例** (前5个):")
                for i, (name, code) in enumerate(list(components.items())[:5], 1):
                    print(f"   {i:2d}. '{name}' -> '{code}'")
                if len(components) > 5:
                    print(f"   ... 还有 {len(components) - 5} 个{component_type}组件")
                print()
        
        # 4. 获取真实的工资记录数据
        print("🔍 **获取真实工资记录数据**...")
        
        # 查找最新的工资记录
        latest_entry = db.query(PayrollEntry).join(PayrollRun)\
            .order_by(PayrollEntry.id.desc())\
            .first()
            
        if not latest_entry:
            print("❌ 未找到工资记录")
            return
            
        employee = db.query(Employee).filter(Employee.id == latest_entry.employee_id).first()
        employee_name = f"{employee.first_name} {employee.last_name}" if employee else "未知员工"
        
        # 获取期间信息
        payroll_run = latest_entry.payroll_run
        period = db.query(PayrollPeriod).filter(PayrollPeriod.id == payroll_run.payroll_period_id).first()
        period_name = period.name if period else "未知期间"
        
        print(f"   使用员工: {employee_name} (ID: {latest_entry.employee_id})")
        print(f"   工资期间: {period_name}")
        print(f"   原始应发: {latest_entry.gross_pay}")
        print(f"   原始扣发: {latest_entry.total_deductions}")
        print(f"   原始实发: {latest_entry.net_pay}")
        print()
        
        # 5. 测试映射功能 - 使用真实数据
        print("🔧 **测试真实数据映射**...")
        
        # 构建模拟的Excel导入数据（基于真实工资记录的字段名）
        real_import_data = {}
        
        # 从收入明细中提取
        for code, detail in latest_entry.earnings_details.items():
            field_name = detail.get('name', code)
            amount = detail.get('amount', 0)
            real_import_data[field_name] = float(amount)
            
        # 从扣除明细中提取  
        for code, detail in latest_entry.deductions_details.items():
            field_name = detail.get('name', code)
            amount = detail.get('amount', 0) 
            real_import_data[field_name] = float(amount)
        
        print("   真实工资记录字段:")
        for field_name, amount in real_import_data.items():
            print(f"     {field_name}: {amount}")
        print()
        
        # 6. 执行映射
        print("⚙️ **执行动态映射**...")
        mapped_data = mapper.map_import_data_to_payroll_data(real_import_data)
        
        print("   映射后收入数据:")
        mapped_earnings_total = 0
        for code, info in mapped_data['earnings_data'].items():
            print(f"     {code}: {info['amount']} ({info['name']})")
            mapped_earnings_total += info['amount']
        print(f"   收入小计: {mapped_earnings_total}")
        print()
        
        print("   映射后扣除数据:")
        mapped_deductions_total = 0
        for code, info in mapped_data['deductions_data'].items():
            print(f"     {code}: {info['amount']} ({info['name']})")
            mapped_deductions_total += info['amount']
        print(f"   扣除小计: {mapped_deductions_total}")
        print()
        
        # 7. 测试计算引擎
        print("⚙️ **测试计算引擎**...")
        calculator = SimplePayrollCalculator(db)
        
        # 提取用于计算的简单数据
        earnings = {k: v['amount'] for k, v in mapped_data['earnings_data'].items()}
        deductions = {k: v['amount'] for k, v in mapped_data['deductions_data'].items()}
        
        result = calculator.calculate(
            employee_id=latest_entry.employee_id,
            earnings=earnings,
            deductions=deductions
        )
        
        print(f"   重新计算结果:")
        print(f"     应发合计: {result.gross_pay}")
        print(f"     扣发合计: {result.total_deductions}")
        print(f"     实发合计: {result.net_pay}")
        print()
        
        # 8. 对比分析
        print("📊 **映射准确性分析**:")
        original_gross = float(latest_entry.gross_pay)
        original_deductions = float(latest_entry.total_deductions)
        original_net = float(latest_entry.net_pay)
        
        calculated_gross = float(result.gross_pay)
        calculated_deductions = float(result.total_deductions)
        calculated_net = float(result.net_pay)
        
        gross_diff = calculated_gross - original_gross
        deductions_diff = calculated_deductions - original_deductions
        net_diff = calculated_net - original_net
        
        print(f"   应发对比: 原始={original_gross}, 计算={calculated_gross}, 差异={gross_diff:+.2f}")
        print(f"   扣发对比: 原始={original_deductions}, 计算={calculated_deductions}, 差异={deductions_diff:+.2f}")
        print(f"   实发对比: 原始={original_net}, 计算={calculated_net}, 差异={net_diff:+.2f}")
        
        # 判断映射准确性
        tolerance = 0.01  # 容忍1分钱的误差
        if abs(gross_diff) <= tolerance and abs(deductions_diff) <= tolerance and abs(net_diff) <= tolerance:
            print("   ✅ 映射和计算完全准确！")
        else:
            print("   ⚠️ 存在映射差异，可能有字段未正确映射")
        print()
        
        # 9. 映射覆盖率分析
        print("📈 **映射覆盖率分析**:")
        total_fields = len(real_import_data)
        mapped_fields = len(mapped_data['earnings_data']) + len(mapped_data['deductions_data'])
        unmapped_count = total_fields - mapped_fields
        coverage_rate = mapped_fields / total_fields * 100 if total_fields > 0 else 0
        
        print(f"   总字段数: {total_fields}")
        print(f"   已映射字段: {mapped_fields}")
        print(f"   未映射字段: {unmapped_count}")
        print(f"   映射覆盖率: {coverage_rate:.1f}%")
        
        if unmapped_count > 0:
            print("   未映射的字段:")
            mapped_names = set()
            for info in mapped_data['earnings_data'].values():
                mapped_names.add(info['name'])
            for info in mapped_data['deductions_data'].values():
                mapped_names.add(info['name'])
                
            for field_name in real_import_data.keys():
                if field_name not in mapped_names:
                    print(f"     - {field_name}")
        print()
        
        print("✅ **真实数据动态映射测试完成！**")
        
    except Exception as e:
        print(f"❌ **测试失败**: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_dynamic_mapping() 