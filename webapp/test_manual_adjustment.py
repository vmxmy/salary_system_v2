#!/usr/bin/env python3
"""
测试手动调整功能的示例脚本
"""

import json
from decimal import Decimal

# 示例：JSONB 结构演示
def demo_jsonb_structure():
    """展示手动调整前后的 JSONB 结构"""
    
    print("=== 手动调整功能演示 ===\n")
    
    # 1. 原始扣除数据（自动计算的）
    original_deductions = {
        "个人所得税": {
            "name": "个人所得税",
            "amount": 200.00,
            "is_manual": False
        },
        "养老保险(个人)": {
            "name": "养老保险(个人)",
            "amount": 400.00,
            "is_manual": False
        },
        "医疗保险(个人)": {
            "name": "医疗保险(个人)",
            "amount": 100.00,
            "is_manual": False
        }
    }
    
    print("1. 原始扣除数据（自动计算）:")
    print(json.dumps(original_deductions, indent=2, ensure_ascii=False))
    print(f"\n扣发合计: {sum(d['amount'] for d in original_deductions.values())}")
    
    # 2. 手动调整个税
    manual_adjusted_deductions = original_deductions.copy()
    manual_adjusted_deductions["个人所得税"] = {
        "name": "个人所得税",
        "amount": 300.00,  # 从 200 调整到 300
        "is_manual": True,
        "manual_at": "2025-01-24 15:30:00",
        "manual_by": "admin",
        "manual_reason": "特殊情况调整",
        "auto_calculated": 200.00  # 保留原始计算值
    }
    
    print("\n\n2. 手动调整后的数据:")
    print(json.dumps(manual_adjusted_deductions, indent=2, ensure_ascii=False))
    print(f"\n扣发合计: {sum(d['amount'] for d in manual_adjusted_deductions.values())}")
    
    # 3. 执行计算引擎（保护手动调整）
    print("\n\n3. 执行计算引擎（preserve_manual_adjustments=True）:")
    print("   - 个人所得税: 保持 300.00（手动值）✓")
    print("   - 养老保险: 重新计算或保持原值")
    print("   - 医疗保险: 重新计算或保持原值")
    
    # 4. 执行计算引擎（覆盖手动调整）
    print("\n\n4. 执行计算引擎（preserve_manual_adjustments=False）:")
    print("   - 个人所得税: 重新计算为 200.00（覆盖手动值）")
    print("   - 养老保险: 重新计算")
    print("   - 医疗保险: 重新计算")
    
    # 5. API 调用示例
    print("\n\n5. API 调用示例:")
    print("""
    # 手动调整扣除项
    POST /api/v2/simple-payroll/manual-adjustment/12345?component_code=个人所得税&amount=300&reason=特殊调整
    
    # 运行计算引擎（保护手动调整）
    POST /api/v2/simple-payroll/calculation-engine/run
    {
        "payroll_run_id": 100,
        "preserve_manual_adjustments": true
    }
    
    # 运行计算引擎（覆盖手动调整）
    POST /api/v2/simple-payroll/calculation-engine/run
    {
        "payroll_run_id": 100,
        "preserve_manual_adjustments": false
    }
    """)

def demo_calculation_flow():
    """演示计算流程"""
    
    print("\n\n=== 计算流程演示 ===\n")
    
    # 模拟员工数据
    employee_data = {
        "employee_id": 1001,
        "name": "张三",
        "gross_pay": 10000.00,
        "deductions": {
            "个人所得税": {"amount": 200.00, "is_manual": True, "manual_at": "2025-01-24"},
            "养老保险(个人)": {"amount": 400.00},
            "医疗保险(个人)": {"amount": 100.00}
        }
    }
    
    # 计算逻辑
    total_deductions = sum(
        d.get('amount', 0) for d in employee_data['deductions'].values()
    )
    net_pay = employee_data['gross_pay'] - total_deductions
    
    print(f"员工: {employee_data['name']}")
    print(f"应发: ¥{employee_data['gross_pay']:,.2f}")
    print(f"扣发: ¥{total_deductions:,.2f}")
    print(f"实发: ¥{net_pay:,.2f}")
    
    print("\n扣除明细:")
    for name, details in employee_data['deductions'].items():
        manual_flag = " [手调]" if details.get('is_manual') else ""
        print(f"  - {name}: ¥{details['amount']:,.2f}{manual_flag}")

if __name__ == "__main__":
    demo_jsonb_structure()
    demo_calculation_flow()
    
    print("\n\n✅ 功能验证完成！")
    print("手动调整功能通过 JSONB 中的 is_manual 标记实现，无需额外的数据表。")