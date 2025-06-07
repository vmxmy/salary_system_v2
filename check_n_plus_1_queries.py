#!/usr/bin/env python3
"""
全面检查N+1查询问题的脚本
"""
import os
import re
import sys
from pathlib import Path

def find_potential_n_plus_1_issues():
    """查找潜在的N+1查询问题"""
    
    print("🔍 开始全面检查N+1查询问题...")
    print("=" * 60)
    
    # 定义要检查的目录
    check_dirs = [
        "webapp/v2/services",
        "webapp/v2/routers", 
        "webapp/v2/crud",
        "frontend/v2/src/pages",
        "frontend/v2/src/services"
    ]
    
    # 定义N+1查询的模式
    patterns = {
        "Python ORM N+1": [
            r"for\s+\w+\s+in\s+.*\.query\(",  # for item in query()
            r"for\s+\w+\s+in\s+.*\.all\(\):",  # for item in .all():
            r"for\s+\w+\s+in\s+.*\.filter\(",  # for item in .filter()
            r"\.query\(.*\)\.filter\(.*\.id\s*==",  # query().filter(model.id ==
            r"db\.query\(.*\)\.filter\(.*\.id\s*==\s*\w+\.id\)",  # db.query().filter(model.id == item.id)
        ],
        "缺少joinedload/selectinload": [
            r"\.query\([^)]+\)\.filter\(",  # query without options
            r"\.query\([^)]+\)\.all\(\)",   # query().all() without options
            r"\.query\([^)]+\)\.first\(\)", # query().first() without options
        ],
        "循环中的数据库查询": [
            r"for\s+.*:\s*\n.*db\.query",  # for loop with db.query
            r"for\s+.*:\s*\n.*\.query\(",  # for loop with .query
            r"for\s+.*:\s*\n.*\.filter\(", # for loop with .filter
        ],
        "关系属性访问": [
            r"\w+\.\w+\.\w+",  # model.relation.attribute (可能触发懒加载)
        ]
    }
    
    issues_found = []
    
    for check_dir in check_dirs:
        if not os.path.exists(check_dir):
            continue
            
        print(f"\n📁 检查目录: {check_dir}")
        print("-" * 40)
        
        for root, dirs, files in os.walk(check_dir):
            for file in files:
                if file.endswith(('.py', '.ts', '.tsx', '.js', '.jsx')):
                    file_path = os.path.join(root, file)
                    check_file_for_n_plus_1(file_path, patterns, issues_found)
    
    # 输出结果
    print("\n" + "=" * 60)
    print("📊 N+1查询问题检查结果")
    print("=" * 60)
    
    if not issues_found:
        print("✅ 未发现明显的N+1查询问题")
    else:
        print(f"⚠️  发现 {len(issues_found)} 个潜在问题:")
        
        # 按类型分组
        by_type = {}
        for issue in issues_found:
            issue_type = issue['type']
            if issue_type not in by_type:
                by_type[issue_type] = []
            by_type[issue_type].append(issue)
        
        for issue_type, type_issues in by_type.items():
            print(f"\n🚨 {issue_type} ({len(type_issues)} 个):")
            for issue in type_issues:
                print(f"   📄 {issue['file']}:{issue['line']}")
                print(f"      {issue['code'].strip()}")
                if issue.get('suggestion'):
                    print(f"      💡 建议: {issue['suggestion']}")
    
    # 生成详细报告
    generate_detailed_report(issues_found)

def check_file_for_n_plus_1(file_path, patterns, issues_found):
    """检查单个文件的N+1查询问题"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        for line_num, line in enumerate(lines, 1):
            for pattern_type, pattern_list in patterns.items():
                for pattern in pattern_list:
                    if re.search(pattern, line):
                        # 检查是否已经使用了优化方法
                        context_lines = lines[max(0, line_num-3):line_num+3]
                        context = ''.join(context_lines)
                        
                        # 跳过已经优化的代码
                        if any(opt in context.lower() for opt in ['joinedload', 'selectinload', 'subqueryload', 'options(']):
                            continue
                        
                        issue = {
                            'file': file_path,
                            'line': line_num,
                            'type': pattern_type,
                            'pattern': pattern,
                            'code': line,
                            'context': context
                        }
                        
                        # 添加建议
                        issue['suggestion'] = get_suggestion(pattern_type, line, context)
                        
                        issues_found.append(issue)
                        
    except Exception as e:
        print(f"❌ 检查文件 {file_path} 时出错: {e}")

def get_suggestion(pattern_type, line, context):
    """根据问题类型提供优化建议"""
    suggestions = {
        "Python ORM N+1": "使用 joinedload() 或 selectinload() 预加载关联数据",
        "缺少joinedload/selectinload": "添加 .options(joinedload(Model.relation)) 预加载关联",
        "循环中的数据库查询": "将查询移到循环外，使用批量查询或预加载",
        "关系属性访问": "检查是否需要预加载关联数据避免懒加载"
    }
    
    base_suggestion = suggestions.get(pattern_type, "检查是否存在N+1查询问题")
    
    # 根据具体代码内容提供更具体的建议
    if 'for' in line and 'query' in context:
        return f"{base_suggestion}，避免在循环中执行数据库查询"
    elif '.filter(' in line and '.id ==' in line:
        return f"{base_suggestion}，考虑使用 IN 查询替代多次单条查询"
    
    return base_suggestion

def generate_detailed_report(issues_found):
    """生成详细的检查报告"""
    report_file = "n_plus_1_check_report.md"
    
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write("# N+1查询问题检查报告\n\n")
        f.write(f"检查时间: {__import__('datetime').datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        
        if not issues_found:
            f.write("## ✅ 检查结果\n\n未发现明显的N+1查询问题。\n\n")
        else:
            f.write(f"## ⚠️ 发现 {len(issues_found)} 个潜在问题\n\n")
            
            # 按文件分组
            by_file = {}
            for issue in issues_found:
                file_path = issue['file']
                if file_path not in by_file:
                    by_file[file_path] = []
                by_file[file_path].append(issue)
            
            for file_path, file_issues in by_file.items():
                f.write(f"### 📄 {file_path}\n\n")
                
                for issue in file_issues:
                    f.write(f"**行 {issue['line']}** - {issue['type']}\n\n")
                    f.write("```python\n")
                    f.write(issue['code'])
                    f.write("```\n\n")
                    f.write(f"💡 **建议**: {issue['suggestion']}\n\n")
                    f.write("---\n\n")
        
        # 添加优化指南
        f.write("## 🛠️ N+1查询优化指南\n\n")
        f.write("### 1. 使用预加载\n\n")
        f.write("```python\n")
        f.write("# 错误：N+1查询\n")
        f.write("entries = db.query(PayrollEntry).all()\n")
        f.write("for entry in entries:\n")
        f.write("    print(entry.employee.name)  # 每次都查询数据库\n\n")
        f.write("# 正确：预加载\n")
        f.write("entries = db.query(PayrollEntry).options(\n")
        f.write("    joinedload(PayrollEntry.employee)\n")
        f.write(").all()\n")
        f.write("for entry in entries:\n")
        f.write("    print(entry.employee.name)  # 使用已加载的数据\n")
        f.write("```\n\n")
        
        f.write("### 2. 批量查询\n\n")
        f.write("```python\n")
        f.write("# 错误：循环查询\n")
        f.write("for employee_id in employee_ids:\n")
        f.write("    employee = db.query(Employee).filter(Employee.id == employee_id).first()\n\n")
        f.write("# 正确：批量查询\n")
        f.write("employees = db.query(Employee).filter(Employee.id.in_(employee_ids)).all()\n")
        f.write("```\n\n")
        
        f.write("### 3. 使用合适的加载策略\n\n")
        f.write("- `joinedload()`: 使用LEFT JOIN，适合一对一关系\n")
        f.write("- `selectinload()`: 使用IN查询，适合一对多关系\n")
        f.write("- `subqueryload()`: 使用子查询，适合复杂关系\n\n")
    
    print(f"\n📋 详细报告已生成: {report_file}")

if __name__ == "__main__":
    find_potential_n_plus_1_issues() 