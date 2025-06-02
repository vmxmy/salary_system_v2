#!/usr/bin/env python3
"""
批量为calculation_config.py添加认证依赖
"""

import re

def add_auth_to_config():
    """为calculation_config.py添加认证依赖"""
    file_path = "../routers/calculation_config.py"
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 替换所有的 db: Session = Depends(get_db_v2) 为 db: Session = Depends(get_db_v2), current_user = Depends(get_current_user)
    pattern = r'(\s+)db: Session = Depends\(get_db_v2\)$'
    replacement = r'\1db: Session = Depends(get_db_v2),\n\1current_user = Depends(get_current_user)'
    
    new_content = re.sub(pattern, replacement, content, flags=re.MULTILINE)
    
    # 写回文件
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print("✅ 已为calculation_config.py添加认证依赖")


if __name__ == "__main__":
    add_auth_to_config() 