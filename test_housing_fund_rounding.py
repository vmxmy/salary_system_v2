#!/usr/bin/env python3
"""
测试公积金特殊进位处理逻辑

测试规则：
- 如果小数部分大于等于 0.1，就进一位取整
- 否则就舍掉小数部分
"""

from decimal import Decimal, getcontext
getcontext().prec = 10

def apply_housing_fund_rounding(amount: Decimal) -> Decimal:
    """
    公积金特殊进位处理：
    如果小数部分大于等于 0.1，就进一位取整
    否则就舍掉小数部分
    """
    # 获取整数部分和小数部分
    integer_part = amount.to_integral_value(rounding='ROUND_DOWN')
    decimal_part = amount - integer_part
    
    # 如果小数部分 >= 0.1，进一位
    if decimal_part >= Decimal('0.1'):
        result = integer_part + Decimal('1')
    else:
        # 否则舍去小数部分
        result = integer_part
    
    return result

def test_housing_fund_rounding():
    """测试公积金进位逻辑"""
    test_cases = [
        (Decimal('100.0'), Decimal('100')),    # 整数保持不变
        (Decimal('100.05'), Decimal('100')),   # 小数部分 < 0.1，舍去
        (Decimal('100.09'), Decimal('100')),   # 小数部分 < 0.1，舍去
        (Decimal('100.1'), Decimal('101')),    # 小数部分 = 0.1，进一位
        (Decimal('100.15'), Decimal('101')),   # 小数部分 > 0.1，进一位
        (Decimal('100.5'), Decimal('101')),    # 小数部分 > 0.1，进一位
        (Decimal('100.99'), Decimal('101')),   # 小数部分 > 0.1，进一位
        (Decimal('0.05'), Decimal('0')),       # 小于1的数值测试
        (Decimal('0.1'), Decimal('1')),        # 小于1的数值测试
        (Decimal('0.99'), Decimal('1')),       # 小于1的数值测试
    ]
    
    print("🧪 开始测试公积金特殊进位处理逻辑...")
    print("=" * 60)
    
    all_passed = True
    for i, (input_val, expected) in enumerate(test_cases, 1):
        result = apply_housing_fund_rounding(input_val)
        passed = result == expected
        
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"测试 {i:2d}: {input_val:>8} -> {result:>4} (期望: {expected:>4}) {status}")
        
        if not passed:
            all_passed = False
    
    print("=" * 60)
    if all_passed:
        print("🎉 所有测试通过！公积金特殊进位处理逻辑正确。")
    else:
        print("❌ 部分测试失败，请检查进位处理逻辑。")
    
    return all_passed

if __name__ == "__main__":
    test_housing_fund_rounding() 