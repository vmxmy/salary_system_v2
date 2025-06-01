#!/usr/bin/env python3
"""
备份报表相关文件的脚本
在回退到旧版本之前，先备份当前的报表模块代码
"""

import os
import shutil
import datetime
from pathlib import Path

def backup_report_files():
    """备份报表相关文件"""
    
    # 创建备份目录
    backup_dir = Path("backups") / f"report_backup_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}"
    backup_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"📁 创建备份目录: {backup_dir}")
    
    # 需要备份的文件列表
    files_to_backup = [
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
        
        # 数据库迁移文件（如果有）
        "webapp/v2/alembic_for_db_v2/versions/",
    ]
    
    backed_up_files = []
    
    for file_path in files_to_backup:
        source_path = Path(file_path)
        
        if source_path.exists():
            if source_path.is_file():
                # 备份单个文件
                dest_path = backup_dir / file_path
                dest_path.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(source_path, dest_path)
                backed_up_files.append(file_path)
                print(f"✅ 备份文件: {file_path}")
                
            elif source_path.is_dir():
                # 备份整个目录
                dest_path = backup_dir / file_path
                shutil.copytree(source_path, dest_path, dirs_exist_ok=True)
                backed_up_files.append(file_path)
                print(f"✅ 备份目录: {file_path}")
        else:
            print(f"⚠️  文件不存在: {file_path}")
    
    # 创建备份清单
    manifest_path = backup_dir / "backup_manifest.txt"
    with open(manifest_path, 'w', encoding='utf-8') as f:
        f.write(f"报表模块备份清单\n")
        f.write(f"备份时间: {datetime.datetime.now()}\n")
        f.write(f"备份目录: {backup_dir}\n\n")
        f.write("已备份的文件:\n")
        for file_path in backed_up_files:
            f.write(f"- {file_path}\n")
    
    print(f"\n📝 备份清单已保存到: {manifest_path}")
    print(f"🎯 总共备份了 {len(backed_up_files)} 个文件/目录")
    
    return backup_dir, backed_up_files

if __name__ == "__main__":
    backup_dir, files = backup_report_files()
    print(f"\n✅ 备份完成！备份位置: {backup_dir}") 