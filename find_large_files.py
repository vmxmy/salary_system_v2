#!/usr/bin/env python3
"""
查找项目中所有行数超过 1000 行的代码文件
"""

import os
import sys
from pathlib import Path

# 定义代码文件扩展名
CODE_EXTENSIONS = {
    '.py', '.js', '.ts', '.tsx', '.java', '.c', '.cpp', '.h', '.hpp', 
    '.go', '.rb', '.php', '.html', '.css', '.less', '.scss', '.vue', 
    '.jsx', '.sql', '.sh', '.bash', '.zsh', '.yaml', '.yml', '.json',
    '.xml', '.md', '.rst', '.txt'
}

def count_lines_in_file(file_path):
    """统计文件行数"""
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            return sum(1 for _ in f)
    except Exception as e:
        print(f"警告: 无法读取文件 {file_path}: {e}", file=sys.stderr)
        return 0

def is_code_file(file_path):
    """判断是否为代码文件"""
    return file_path.suffix.lower() in CODE_EXTENSIONS

def should_skip_directory(dir_name):
    """判断是否应该跳过某个目录"""
    skip_dirs = {
        'node_modules', '.git', '__pycache__', '.pytest_cache', 
        'venv', 'env', '.env', 'dist', 'build', '.next', 
        'coverage', '.coverage', 'logs', 'log'
    }
    return dir_name in skip_dirs

def find_large_code_files(root_dir, min_lines=1000):
    """查找超过指定行数的代码文件"""
    root_path = Path(root_dir)
    large_files = []
    
    print(f"正在扫描目录: {root_path}")
    print(f"查找行数超过 {min_lines} 行的代码文件...")
    print("-" * 60)
    
    total_files_scanned = 0
    
    for file_path in root_path.rglob('*'):
        # 跳过目录
        if file_path.is_dir():
            continue
            
        # 跳过特定目录中的文件
        if any(should_skip_directory(part) for part in file_path.parts):
            continue
            
        # 只处理代码文件
        if not is_code_file(file_path):
            continue
            
        total_files_scanned += 1
        
        # 统计行数
        line_count = count_lines_in_file(file_path)
        
        if line_count > min_lines:
            # 计算相对路径
            try:
                relative_path = file_path.relative_to(root_path)
            except ValueError:
                relative_path = file_path
                
            large_files.append((str(relative_path), line_count))
            print(f"发现大文件: {relative_path} ({line_count} 行)")
    
    print(f"\n扫描完成! 共扫描了 {total_files_scanned} 个代码文件")
    return large_files

def main():
    # 使用当前目录作为根目录
    root_dir = "/Users/xumingyang/app/高新区工资信息管理/salary_system"
    
    if not os.path.exists(root_dir):
        print(f"错误: 目录 {root_dir} 不存在")
        sys.exit(1)
    
    large_files = find_large_code_files(root_dir, min_lines=1000)
    
    print("\n" + "=" * 80)
    print("查找结果汇总")
    print("=" * 80)
    
    if large_files:
        print(f"\n找到 {len(large_files)} 个行数超过 1000 行的代码文件:\n")
        
        # 按行数排序（降序）
        large_files.sort(key=lambda x: x[1], reverse=True)
        
        for file_path, line_count in large_files:
            print(f"{line_count:>6} 行  {file_path}")
    else:
        print("\n未找到行数超过 1000 行的代码文件。")
    
    print("\n" + "=" * 80)

if __name__ == "__main__":
    main()