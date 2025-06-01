#!/usr/bin/env python3
"""
修复 config.py 文件中的语法错误
主要是中文标点符号导致的问题
"""

def fix_config_syntax():
    """修复 config.py 语法错误"""
    
    config_file = "webapp/v2/routers/config.py"
    
    # 读取原文件
    with open(config_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 修复中文标点符号
    replacements = [
        ('。', '.'),  # 中文句号替换为英文句号
        ('，', ','),  # 中文逗号替换为英文逗号
        ('：', ':'),  # 中文冒号替换为英文冒号
        ('；', ';'),  # 中文分号替换为英文分号
        ('（', '('),  # 中文左括号替换为英文左括号
        ('）', ')'),  # 中文右括号替换为英文右括号
    ]
    
    # 应用替换
    for old, new in replacements:
        content = content.replace(old, new)
    
    # 删除重复的兼容性路由定义
    # 找到最后一个兼容性路由部分并删除重复的
    lines = content.split('\n')
    new_lines = []
    skip_until_next_router = False
    found_compat_section = False
    
    i = 0
    while i < len(lines):
        line = lines[i]
        
        # 检查是否是兼容性路由的开始
        if "# ==================== 兼容性路由别名 ====================" in line:
            if found_compat_section:
                # 这是重复的兼容性路由部分，跳过
                skip_until_next_router = True
                i += 1
                continue
            else:
                found_compat_section = True
        
        # 如果正在跳过重复部分
        if skip_until_next_router:
            # 检查是否到了文件末尾或下一个主要部分
            if i == len(lines) - 1 or (line.strip() and not line.startswith(' ') and not line.startswith('\t') and '@router.' in line and 'compat' not in line):
                skip_until_next_router = False
                # 不跳过这一行，因为它是新的路由
                new_lines.append(line)
            i += 1
            continue
        
        new_lines.append(line)
        i += 1
    
    content = '\n'.join(new_lines)
    
    # 写回文件
    with open(config_file, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("✅ 已修复语法错误")
    return True

if __name__ == "__main__":
    success = fix_config_syntax()
    if success:
        print("✅ 语法修复完成！")
    else:
        print("❌ 语法修复失败！") 