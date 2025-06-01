import os
import re
import glob

print("🔧 开始批量修复前端翻译函数调用错误...")

file_patterns = ['frontend/v2/src/**/*.ts', 'frontend/v2/src/**/*.tsx']
files_to_fix = []
for pattern in file_patterns:
    files_to_fix.extend(glob.glob(pattern, recursive=True))

print(f"📁 找到 {len(files_to_fix)} 个文件需要检查")

fix_rules = [
    (r'\{t\(\'common:auto_[^}]+\)\}', ''),
    (r'\'[^\']*\{t\(\'common:auto_[^}]+\)\}[^\']*\'', "''"),
    (r'console\.(log|warn|error)\(\{t\(\'common:auto_[^}]+\)\}[^)]*\)', ''),
    (r'return \{t\(\'common:auto_[^}]+\)\};', "return '';"),
    (r',\s*\{t\(\'common:auto_[^}]+\)\}', ''),
    (r'\[\s*\{t\(\'common:auto_[^}]+\)\}\s*\]', '[]'),
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
        
        for pattern, replacement in fix_rules:
            matches = re.findall(pattern, content)
            if matches:
                content = re.sub(pattern, replacement, content)
                file_fixes += len(matches)
        
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