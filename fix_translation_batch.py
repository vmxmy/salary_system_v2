#!/usr/bin/env python3
"""
批量修复前端代码中的翻译函数调用错误
"""

import os
import re
import glob

def fix_translation_errors():
    """批量修复翻译错误"""
    print("🔧 开始批量修复前端翻译函数调用错误...")
    
    # 定义需要修复的文件模式
    file_patterns = [
        'frontend/v2/src/**/*.ts',
        'frontend/v2/src/**/*.tsx'
    ]
    
    # 收集所有需要修复的文件
    files_to_fix = []
    for pattern in file_patterns:
        files_to_fix.extend(glob.glob(pattern, recursive=True))
    
    print(f"📁 找到 {len(files_to_fix)} 个文件需要检查")
    
    # 定义修复规则
    fix_rules = [
        # 修复对象字面量中的错误翻译调用
        (r'\{t\(\'common:auto_[^}]+\)\}', ''),
        
        # 修复字符串连接中的错误翻译调用
        (r'\'[^\']*\{t\(\'common:auto_[^}]+\)\}[^\']*\'', "''"),
        
        # 修复console语句中的错误翻译调用
        (r'console\.(log|warn|error)\(\{t\(\'common:auto_[^}]+\)\}[^)]*\)', ''),
        
        # 修复return语句中的错误翻译调用
        (r'return \{t\(\'common:auto_[^}]+\)\};', "return '';"),
        
        # 修复函数参数中的错误翻译调用
        (r',\s*\{t\(\'common:auto_[^}]+\)\}', ''),
        
        # 修复数组中的错误翻译调用
        (r'\[\s*\{t\(\'common:auto_[^}]+\)\}\s*\]', '[]'),
        
        # 修复注释中的错误翻译调用
        (r'//.*\{t\(\'common:auto_[^}]+\)\}.*', ''),
    ]
    
    fixed_files = 0
    total_fixes = 0
    
    for file_path in files_to_fix:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            original_content = content
            file_fixes = 0
            
            # 应用修复规则
            for pattern, replacement in fix_rules:
                matches = re.findall(pattern, content)
                if matches:
                    content = re.sub(pattern, replacement, content)
                    file_fixes += len(matches)
            
            # 如果有修改，写回文件
            if content != original_content:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                
                fixed_files += 1
                total_fixes += file_fixes
                print(f"  ✅ 修复 {file_path}: {file_fixes} 处错误")
        
        except Exception as e:
            print(f"  ❌ 处理文件 {file_path} 时出错: {e}")
    
    print(f"\n🎉 修复完成!")
    print(f"  📁 修复文件数: {fixed_files}")
    print(f"  🔧 总修复数: {total_fixes}")

if __name__ == "__main__":
    fix_translation_errors() 