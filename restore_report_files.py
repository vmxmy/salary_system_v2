#!/usr/bin/env python3
"""
恢复报表相关文件的脚本
从备份中恢复报表模块代码
"""

import os
import shutil
from pathlib import Path

def restore_report_files(backup_dir="backups/report_backup_20250531_222807"):
    """从备份恢复报表相关文件"""
    
    backup_path = Path(backup_dir)
    if not backup_path.exists():
        print(f"❌ 备份目录不存在: {backup_path}")
        return False
    
    print(f"📁 从备份目录恢复: {backup_path}")
    
    # 需要恢复的文件列表
    files_to_restore = [
        # 后端模型
        "webapp/v2/models/reports.py",
        "webapp/v2/pydantic_models/reports.py",
        
        # 后端CRUD
        "webapp/v2/crud/reports/report_view_crud.py",
        "webapp/v2/crud/reports/_report_view_helpers.py",
        
        # 后端路由
        "webapp/v2/routers/reports.py",
        
        # 前端类型定义
        "frontend/v2/src/types/reportView.ts",
        
        # 前端API
        "frontend/v2/src/api/reportView.ts",
        
        # 前端组件
        "frontend/v2/src/components/ReportView/",
        "frontend/v2/src/components/common/ReportViewDetailTemplate.tsx",
        
        # 前端页面
        "frontend/v2/src/pages/Admin/ReportView/",
        
        # 文档
        "frontend/v2/docs/ReportViewDetailTemplate.md",
        "frontend/v2/src/components/ReportView/ReportViewData_Debug.md",
    ]
    
    restored_files = []
    
    for file_path in files_to_restore:
        source_path = backup_path / file_path
        dest_path = Path(file_path)
        
        if source_path.exists():
            if source_path.is_file():
                # 恢复单个文件
                dest_path.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(source_path, dest_path)
                restored_files.append(file_path)
                print(f"✅ 恢复文件: {file_path}")
                
            elif source_path.is_dir():
                # 恢复整个目录
                if dest_path.exists():
                    shutil.rmtree(dest_path)
                shutil.copytree(source_path, dest_path)
                restored_files.append(file_path)
                print(f"✅ 恢复目录: {file_path}")
        else:
            print(f"⚠️  备份中不存在: {file_path}")
    
    print(f"\n🎯 总共恢复了 {len(restored_files)} 个文件/目录")
    return True

if __name__ == "__main__":
    success = restore_report_files()
    if success:
        print(f"\n✅ 报表模块恢复完成！")
        print(f"💡 现在你有了 'stable before fix' 版本的基础代码 + 最新的报表模块")
    else:
        print(f"\n❌ 恢复失败！") 