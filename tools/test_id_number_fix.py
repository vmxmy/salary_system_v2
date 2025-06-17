#!/usr/bin/env python3
"""
测试身份证号导入修复效果的脚本
"""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from webapp.v2.crud.hr.employee import normalize_id_number
from webapp.v2.crud.payroll.bulk_operations import normalize_id_number as payroll_normalize_id_number

def test_id_number_normalization():
    """测试身份证号标准化函数"""
    
    print("🔍 测试身份证号标准化函数")
    print("=" * 50)
    
    # 测试用例
    test_cases = [
        # (输入值, 期望输出, 描述)
        ("110101199001011234", "110101199001011234", "标准18位身份证号"),
        ("11010119900101123X", "11010119900101123X", "末位为X的身份证号"),
        ("11010119900101123x", "11010119900101123X", "末位为小写x的身份证号"),
        (110101199001011234, "110101199001011234", "数字类型的身份证号"),
        ("1.1010119900101e+17", "110101199001010000", "科学计数法表示的身份证号"),
        ("", "", "空字符串"),
        (None, "", "None值"),
        ("  110101199001011234  ", "110101199001011234", "带空格的身份证号"),
        ("1101011990010112341", "110101199001011234", "超过18位的身份证号"),
        ("11010119900101123", "11010119900101123", "不足18位的身份证号"),
        ("11010119900101123a", "11010119900101123A", "末位为字母a的身份证号"),
    ]
    
    print("HR模块测试结果:")
    print("-" * 30)
    for i, (input_val, expected, description) in enumerate(test_cases, 1):
        try:
            result = normalize_id_number(input_val)
            status = "✅" if result == expected else "❌"
            print(f"{i:2d}. {status} {description}")
            print(f"    输入: {repr(input_val)}")
            print(f"    期望: {repr(expected)}")
            print(f"    实际: {repr(result)}")
            if result != expected:
                print(f"    ⚠️  不匹配!")
            print()
        except Exception as e:
            print(f"{i:2d}. ❌ {description}")
            print(f"    输入: {repr(input_val)}")
            print(f"    错误: {str(e)}")
            print()
    
    print("Payroll模块测试结果:")
    print("-" * 30)
    for i, (input_val, expected, description) in enumerate(test_cases, 1):
        try:
            result = payroll_normalize_id_number(input_val)
            status = "✅" if result == expected else "❌"
            print(f"{i:2d}. {status} {description}")
            print(f"    输入: {repr(input_val)}")
            print(f"    期望: {repr(expected)}")
            print(f"    实际: {repr(result)}")
            if result != expected:
                print(f"    ⚠️  不匹配!")
            print()
        except Exception as e:
            print(f"{i:2d}. ❌ {description}")
            print(f"    输入: {repr(input_val)}")
            print(f"    错误: {str(e)}")
            print()


def test_frontend_validation():
    """测试前端验证规则"""
    import re
    
    print("🔍 测试前端身份证号验证规则")
    print("=" * 50)
    
    # 前端验证正则表达式（修复后的）
    frontend_pattern = r'^\d{17}[\dXx]$'
    
    test_cases = [
        ("110101199001011234", True, "标准18位身份证号"),
        ("11010119900101123X", True, "末位为大写X的身份证号"),
        ("11010119900101123x", True, "末位为小写x的身份证号"),
        ("1101011990010112", False, "17位身份证号"),
        ("11010119900101123a", False, "末位为字母a的身份证号"),
        ("1101011990010112341", False, "19位身份证号"),
        ("", False, "空字符串"),
    ]
    
    for i, (input_val, expected, description) in enumerate(test_cases, 1):
        result = bool(re.match(frontend_pattern, input_val))
        status = "✅" if result == expected else "❌"
        print(f"{i:2d}. {status} {description}")
        print(f"    输入: {repr(input_val)}")
        print(f"    期望: {expected}")
        print(f"    实际: {result}")
        if result != expected:
            print(f"    ⚠️  不匹配!")
        print()


if __name__ == "__main__":
    test_id_number_normalization()
    test_frontend_validation()
    
    print("🎯 修复总结:")
    print("=" * 50)
    print("1. ✅ 统一前后端身份证号验证规则: /^\\d{17}[\\dXx]$/")
    print("2. ✅ 增强Excel数字精度处理，避免科学计数法问题")
    print("3. ✅ 添加身份证号标准化函数，处理各种格式")
    print("4. ✅ 修复员工匹配逻辑，使用标准化后的身份证号")
    print("5. ✅ 增加调试日志，便于排查问题")
    print()
    print("💡 建议测试流程:")
    print("1. 准备包含身份证号的Excel文件")
    print("2. 测试薪资批量导入功能")
    print("3. 检查浏览器控制台日志中的身份证号处理信息")
    print("4. 验证员工匹配是否成功") 