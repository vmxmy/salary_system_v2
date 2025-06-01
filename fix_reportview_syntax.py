#!/usr/bin/env python3
"""
修复 ReportView 页面中的语法错误
主要是 {t('...')} 应该改为 t('...') 的问题
"""

import re

def fix_reportview_syntax():
    """修复 ReportView 语法错误"""
    
    file_path = "frontend/v2/src/pages/Admin/ReportView/index.tsx"
    
    # 读取原文件
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 修复模式列表
    fixes = [
        # 修复 title: {t('...')} -> title: t('...')
        (r'title:\s*\{t\(([^}]+)\)\}', r'title: t(\1)'),
        
        # 修复 text: {t('...')} -> text: t('...')
        (r'text:\s*\{t\(([^}]+)\)\}', r'text: t(\1)'),
        
        # 修复 message.error({t('...')}) -> message.error(t('...'))
        (r'message\.error\(\{t\(([^}]+)\)\}\)', r'message.error(t(\1))'),
        
        # 修复 message.success({t('...')}) -> message.success(t('...'))
        (r'message\.success\(\{t\(([^}]+)\)\}\)', r'message.success(t(\1))'),
        
        # 修复配置对象中的属性: {t('...')} -> t('...')
        (r'(\w+):\s*\{t\(([^}]+)\)\}', r'\1: t(\2)'),
        
        # 修复特殊情况：tooltipTitle={t('...')} 保持不变，但其他需要修复
        # 这个已经在上面的通用规则中处理了
    ]
    
    # 应用修复
    for pattern, replacement in fixes:
        content = re.sub(pattern, replacement, content)
    
    # 写回文件
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("✅ 已修复 ReportView 语法错误")
    return True

if __name__ == "__main__":
    success = fix_reportview_syntax()
    if success:
        print("✅ ReportView 语法修复完成！")
        print("💡 现在前端应该可以正常编译了")
    else:
        print("❌ ReportView 语法修复失败！") 