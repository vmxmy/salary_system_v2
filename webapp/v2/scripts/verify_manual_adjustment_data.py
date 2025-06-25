#!/usr/bin/env python3
"""
手动调整数据验证工具
直接查询数据库验证手动调整数据的存储和读取
"""

import sys
import json
from pathlib import Path

# 添加项目根目录到路径
sys.path.append(str(Path(__file__).parent.parent.parent))

from sqlalchemy.orm import Session
from webapp.v2.database import get_db_v2
from webapp.v2.models.payroll import PayrollEntry
from webapp.v2.crud.payroll.payroll_entries import get_payroll_entry

def verify_manual_adjustment_storage(entry_id: int):
    """验证手动调整数据的存储"""
    print(f"\n🔍 验证工资条目 {entry_id} 的手动调整数据")
    print("=" * 60)
    
    db = next(get_db_v2())
    
    try:
        # 1. 直接从数据库查询原始数据
        print("\n1️⃣ 直接查询数据库原始数据")
        print("-" * 40)
        
        raw_entry = db.query(PayrollEntry).filter(PayrollEntry.id == entry_id).first()
        if not raw_entry:
            print(f"❌ 工资条目 {entry_id} 不存在")
            return
        
        print(f"✅ 找到工资条目: ID={raw_entry.id}, 员工ID={raw_entry.employee_id}")
        
        # 检查扣除详情
        if raw_entry.deductions_details:
            print(f"📊 扣除详情数据类型: {type(raw_entry.deductions_details)}")
            print(f"📊 扣除详情完整数据:")
            print(json.dumps(raw_entry.deductions_details, indent=2, ensure_ascii=False))
            
            # 专门检查五险一金的手动调整信息
            social_insurance_codes = [
                'PENSION_PERSONAL_AMOUNT',
                'MEDICAL_PERSONAL_AMOUNT',
                'UNEMPLOYMENT_PERSONAL_AMOUNT',
                'OCCUPATIONAL_PENSION_PERSONAL_AMOUNT',
                'HOUSING_FUND_PERSONAL'
            ]
            
            print(f"\n🏦 五险一金手动调整状态:")
            for code in social_insurance_codes:
                if code in raw_entry.deductions_details:
                    field_data = raw_entry.deductions_details[code]
                    print(f"  {code}:")
                    if isinstance(field_data, dict):
                        print(f"    amount: {field_data.get('amount', 'N/A')}")
                        print(f"    is_manual: {field_data.get('is_manual', 'N/A')} (类型: {type(field_data.get('is_manual'))})")
                        print(f"    manual_at: {field_data.get('manual_at', 'N/A')}")
                        print(f"    manual_by: {field_data.get('manual_by', 'N/A')}")
                        print(f"    manual_reason: {field_data.get('manual_reason', 'N/A')}")
                        print(f"    auto_calculated: {field_data.get('auto_calculated', 'N/A')}")
                    else:
                        print(f"    原始值: {field_data} (类型: {type(field_data)})")
                else:
                    print(f"  {code}: 不存在")
        else:
            print("❌ 扣除详情为空")
        
        # 2. 通过CRUD函数查询数据
        print(f"\n2️⃣ 通过CRUD函数查询数据")
        print("-" * 40)
        
        crud_entry = get_payroll_entry(db, entry_id, include_employee_details=True)
        if crud_entry:
            print(f"✅ CRUD查询成功")
            print(f"📊 CRUD扣除详情数据类型: {type(crud_entry.deductions_details)}")
            
            if crud_entry.deductions_details:
                print(f"🏦 CRUD查询的五险一金手动调整状态:")
                for code in social_insurance_codes:
                    if code in crud_entry.deductions_details:
                        field_data = crud_entry.deductions_details[code]
                        print(f"  {code}:")
                        if isinstance(field_data, dict):
                            print(f"    amount: {field_data.get('amount', 'N/A')}")
                            print(f"    is_manual: {field_data.get('is_manual', 'N/A')} (类型: {type(field_data.get('is_manual'))})")
                            print(f"    manual_at: {field_data.get('manual_at', 'N/A')}")
                        else:
                            print(f"    原始值: {field_data} (类型: {type(field_data)})")
        else:
            print("❌ CRUD查询失败")
        
        # 3. 比较原始查询和CRUD查询的差异
        print(f"\n3️⃣ 数据一致性检查")
        print("-" * 40)
        
        if raw_entry.deductions_details and crud_entry and crud_entry.deductions_details:
            for code in social_insurance_codes:
                if code in raw_entry.deductions_details and code in crud_entry.deductions_details:
                    raw_data = raw_entry.deductions_details[code]
                    crud_data = crud_entry.deductions_details[code]
                    
                    if isinstance(raw_data, dict) and isinstance(crud_data, dict):
                        raw_is_manual = raw_data.get('is_manual')
                        crud_is_manual = crud_data.get('is_manual')
                        
                        if raw_is_manual == crud_is_manual:
                            print(f"  ✅ {code}: is_manual 一致 ({raw_is_manual})")
                        else:
                            print(f"  ❌ {code}: is_manual 不一致 - 原始: {raw_is_manual}, CRUD: {crud_is_manual}")
                    else:
                        print(f"  ⚠️ {code}: 数据格式不同 - 原始: {type(raw_data)}, CRUD: {type(crud_data)}")
        
        print(f"\n✅ 验证完成")
        
    except Exception as e:
        print(f"❌ 验证过程中发生错误: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

def list_entries_with_manual_adjustments():
    """列出所有包含手动调整的工资条目"""
    print(f"\n🔍 查找所有包含手动调整的工资条目")
    print("=" * 60)
    
    db = next(get_db_v2())
    
    try:
        # 查询所有有扣除详情的条目
        entries = db.query(PayrollEntry).filter(
            PayrollEntry.deductions_details.isnot(None)
        ).limit(100).all()
        
        manual_entries = []
        
        for entry in entries:
            if entry.deductions_details:
                for key, value in entry.deductions_details.items():
                    if isinstance(value, dict) and value.get('is_manual'):
                        manual_entries.append({
                            'entry_id': entry.id,
                            'employee_id': entry.employee_id,
                            'component': key,
                            'is_manual': value.get('is_manual'),
                            'manual_at': value.get('manual_at'),
                            'manual_by': value.get('manual_by'),
                            'amount': value.get('amount')
                        })
                        break
        
        if manual_entries:
            print(f"✅ 找到 {len(manual_entries)} 个包含手动调整的工资条目:")
            for item in manual_entries:
                print(f"  条目ID: {item['entry_id']}, 员工ID: {item['employee_id']}, "
                     f"组件: {item['component']}, 金额: {item['amount']}, "
                     f"调整时间: {item['manual_at']}")
        else:
            print("❌ 没有找到包含手动调整的工资条目")
        
        return manual_entries
        
    except Exception as e:
        print(f"❌ 查询过程中发生错误: {e}")
        import traceback
        traceback.print_exc()
        return []
    finally:
        db.close()

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="验证手动调整数据")
    parser.add_argument("--entry-id", type=int, help="要验证的工资条目ID")
    parser.add_argument("--list-all", action="store_true", help="列出所有包含手动调整的条目")
    
    args = parser.parse_args()
    
    if args.entry_id:
        verify_manual_adjustment_storage(args.entry_id)
    elif args.list_all:
        entries = list_entries_with_manual_adjustments()
        if entries and len(entries) > 0:
            print(f"\n建议使用以下命令验证具体条目:")
            for item in entries[:3]:  # 只显示前3个
                print(f"  python verify_manual_adjustment_data.py --entry-id {item['entry_id']}")
    else:
        print("请指定 --entry-id 或 --list-all 参数")
        print("示例:")
        print("  python verify_manual_adjustment_data.py --list-all")
        print("  python verify_manual_adjustment_data.py --entry-id 3540")