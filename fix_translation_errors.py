#!/usr/bin/env python3
"""
修复前端代码中的翻译函数调用错误
这些错误是由自动翻译工具造成的，需要批量修复
"""

import os
import re
import glob
from pathlib import Path

def fix_translation_errors():
    """修复翻译错误"""
    print("🔧 开始修复前端翻译函数调用错误...")
    
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
        
        # 修复字符串中的错误翻译调用
        (r'\'[^\']*\{t\(\'common:auto_[^}]+\)\}[^\']*\'', '\'\''),
        
        # 修复注释中的错误翻译调用
        (r'//.*\{t\(\'common:auto_[^}]+\)\}.*', ''),
        
        # 修复console.log中的错误翻译调用
        (r'console\.(log|warn|error)\(\{t\(\'common:auto_[^}]+\)\}[^)]*\);?', ''),
        
        # 修复return语句中的错误翻译调用
        (r'return \{t\(\'common:auto_[^}]+\)\};', 'return \'\';'),
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
    
    # 提供手动修复建议
    print(f"\n💡 建议:")
    print(f"  1. 检查修复后的代码是否正常")
    print(f"  2. 运行前端项目测试")
    print(f"  3. 对于复杂的翻译调用，可能需要手动修复")

if __name__ == "__main__":
    fix_translation_errors() 