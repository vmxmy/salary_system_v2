#!/usr/bin/env python3
"""
清理慢速API调用脚本
自动将前端代码中的慢速API调用替换为优化接口
"""

import os
import re
import glob
from typing import List, Tuple

# 定义需要替换的API映射
API_REPLACEMENTS = {
    # 薪资组件定义
    "'/config/payroll-component-definitions'": "'/views-optimized/payroll-component-definitions'",
    '"/config/payroll-component-definitions"': '"/views-optimized/payroll-component-definitions"',
    "`/config/payroll-component-definitions`": "`/views-optimized/payroll-component-definitions`",
    
    # 部门查询
    "'/departments'": "'/views-optimized/departments'",
    '"/departments"': '"/views-optimized/departments"',
    "`/departments`": "`/views-optimized/departments`",
    "'/departments/'": "'/views-optimized/departments'",
    '"/departments/"': '"/views-optimized/departments"',
    "`/departments/`": "`/views-optimized/departments`",
    
    # 人员类别
    "'/personnel-categories'": "'/views-optimized/personnel-categories'",
    '"/personnel-categories"': '"/views-optimized/personnel-categories"',
    "`/personnel-categories`": "`/views-optimized/personnel-categories`",
    
    # Lookup类型
    "'/lookup/types'": "'/views-optimized/lookup-types'",
    '"/lookup/types"': '"/views-optimized/lookup-types"',
    "`/lookup/types`": "`/views-optimized/lookup-types`",
    
    # Lookup值（公共）
    "'/config/lookup-values-public'": "'/views-optimized/lookup-values-public'",
    '"/config/lookup-values-public"': '"/views-optimized/lookup-values-public"',
    "`/config/lookup-values-public`": "`/views-optimized/lookup-values-public`",
    
    # 简单薪资周期
    "'/simple-payroll/periods'": "'/views-optimized/simple-payroll/periods'",
    '"/simple-payroll/periods"': '"/views-optimized/simple-payroll/periods"',
    "`/simple-payroll/periods`": "`/views-optimized/simple-payroll/periods`",
    
    # 简单薪资版本
    "'/simple-payroll/versions'": "'/views-optimized/simple-payroll/versions'",
    '"/simple-payroll/versions"': '"/views-optimized/simple-payroll/versions"',
    "`/simple-payroll/versions`": "`/views-optimized/simple-payroll/versions`",
}

def find_typescript_files(directory: str) -> List[str]:
    """查找所有TypeScript和TSX文件"""
    patterns = ['**/*.ts', '**/*.tsx']
    files = []
    
    for pattern in patterns:
        files.extend(glob.glob(os.path.join(directory, pattern), recursive=True))
    
    # 排除node_modules和dist目录
    files = [f for f in files if 'node_modules' not in f and 'dist' not in f and 'build' not in f]
    return files

def replace_in_file(file_path: str, replacements: dict) -> Tuple[bool, List[str]]:
    """在文件中执行替换操作"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        changes = []
        
        for old_pattern, new_pattern in replacements.items():
            if old_pattern in content:
                content = content.replace(old_pattern, new_pattern)
                changes.append(f"  {old_pattern} → {new_pattern}")
        
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True, changes
        
        return False, []
    
    except Exception as e:
        print(f"❌ 处理文件 {file_path} 时出错: {e}")
        return False, []

def main():
    """主函数"""
    print("🧹 开始清理慢速API调用...")
    
    # 查找前端目录
    frontend_dir = "frontend/v2/src"
    if not os.path.exists(frontend_dir):
        print(f"❌ 前端目录不存在: {frontend_dir}")
        return
    
    # 查找所有TypeScript文件
    ts_files = find_typescript_files(frontend_dir)
    print(f"📁 找到 {len(ts_files)} 个TypeScript文件")
    
    # 统计信息
    total_files_changed = 0
    total_replacements = 0
    
    # 处理每个文件
    for file_path in ts_files:
        changed, changes = replace_in_file(file_path, API_REPLACEMENTS)
        
        if changed:
            total_files_changed += 1
            total_replacements += len(changes)
            relative_path = os.path.relpath(file_path, frontend_dir)
            print(f"✅ 更新文件: {relative_path}")
            for change in changes:
                print(change)
            print()
    
    print("🎉 清理完成!")
    print(f"📊 统计信息:")
    print(f"   - 处理文件总数: {len(ts_files)}")
    print(f"   - 修改文件数量: {total_files_changed}")
    print(f"   - 替换操作总数: {total_replacements}")
    
    if total_files_changed > 0:
        print("\n💡 建议:")
        print("   1. 运行 npm run build 检查TypeScript编译")
        print("   2. 测试前端应用确保功能正常")
        print("   3. 检查浏览器控制台确认使用了优化接口")

if __name__ == "__main__":
    main() 