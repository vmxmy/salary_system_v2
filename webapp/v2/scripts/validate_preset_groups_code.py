#!/usr/bin/env python3
"""
预设分组功能代码验证脚本
检查代码结构、语法和完整性
"""

import os
import ast
import re
from typing import List, Dict, Any

class CodeValidator:
    def __init__(self):
        self.project_root = "/Users/xumingyang/app/高新区工资信息管理/salary_system/webapp/v2"
        self.errors = []
        self.warnings = []
        
    def log_error(self, message: str):
        self.errors.append(message)
        print(f"❌ {message}")
        
    def log_warning(self, message: str):
        self.warnings.append(message)
        print(f"⚠️ {message}")
        
    def log_success(self, message: str):
        print(f"✅ {message}")

    def validate_file_exists(self, file_path: str, description: str) -> bool:
        """验证文件是否存在"""
        full_path = os.path.join(self.project_root, file_path)
        if os.path.exists(full_path):
            self.log_success(f"{description} 文件存在: {file_path}")
            return True
        else:
            self.log_error(f"{description} 文件不存在: {file_path}")
            return False

    def validate_python_syntax(self, file_path: str, description: str) -> bool:
        """验证Python文件语法"""
        full_path = os.path.join(self.project_root, file_path)
        
        if not os.path.exists(full_path):
            return False
            
        try:
            with open(full_path, 'r', encoding='utf-8') as f:
                content = f.read()
                ast.parse(content)
            self.log_success(f"{description} 语法正确")
            return True
        except SyntaxError as e:
            self.log_error(f"{description} 语法错误: {e}")
            return False
        except Exception as e:
            self.log_error(f"{description} 读取失败: {e}")
            return False

    def validate_model_content(self) -> bool:
        """验证模型文件内容"""
        print("\n🧪 验证SQLAlchemy模型...")
        
        model_file = "models/reports.py"
        full_path = os.path.join(self.project_root, model_file)
        
        if not os.path.exists(full_path):
            self.log_error("模型文件不存在")
            return False
            
        try:
            with open(full_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            # 检查必要的模型定义
            required_patterns = [
                r'class ReportUserPreferenceGroup\(Base\):',
                r'__tablename__ = ["\']report_user_preference_groups["\']',
                r'user_id = Column\(BigInteger',
                r'name = Column\(String\(50\)',
                r'color = Column\(String\(7\)',
                r'icon = Column\(String\(50\)',
                r'sort_order = Column\(Integer',
                r'is_active = Column\(Boolean',
                r'created_at = Column\(DateTime',
                r'updated_at = Column\(DateTime'
            ]
            
            all_found = True
            for pattern in required_patterns:
                if re.search(pattern, content):
                    self.log_success(f"找到模型定义: {pattern}")
                else:
                    self.log_error(f"未找到模型定义: {pattern}")
                    all_found = False
                    
            return all_found
            
        except Exception as e:
            self.log_error(f"验证模型内容失败: {e}")
            return False

    def validate_pydantic_content(self) -> bool:
        """验证Pydantic模型内容"""
        print("\n🧪 验证Pydantic模型...")
        
        pydantic_file = "pydantic_models/user_preferences.py"
        full_path = os.path.join(self.project_root, pydantic_file)
        
        if not os.path.exists(full_path):
            self.log_error("Pydantic模型文件不存在")
            return False
            
        try:
            with open(full_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            # 检查必要的Pydantic模型
            required_classes = [
                'PresetGroupBase',
                'PresetGroupCreate',
                'PresetGroupUpdate',
                'PresetGroupResponse',
                'PresetGroupListResponse',
                'PresetGroupStatsResponse',
                'PresetGroupReorderRequest'
            ]
            
            all_found = True
            for class_name in required_classes:
                if f'class {class_name}' in content:
                    self.log_success(f"找到Pydantic模型: {class_name}")
                else:
                    self.log_error(f"未找到Pydantic模型: {class_name}")
                    all_found = False
                    
            return all_found
            
        except Exception as e:
            self.log_error(f"验证Pydantic模型内容失败: {e}")
            return False

    def validate_router_content(self) -> bool:
        """验证路由文件内容"""
        print("\n🧪 验证API路由...")
        
        router_file = "routers/config/user_preferences_router.py"
        full_path = os.path.join(self.project_root, router_file)
        
        if not os.path.exists(full_path):
            self.log_error("路由文件不存在")
            return False
            
        try:
            with open(full_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            # 检查必要的API端点
            required_endpoints = [
                r'async def get_preset_groups\(',
                r'async def create_preset_group\(',
                r'async def update_preset_group\(',
                r'async def delete_preset_group\(',
                r'async def get_preset_groups_stats\(',
                r'async def reorder_preset_groups\('
            ]
            
            # 检查路由装饰器
            required_routes = [
                r'@router\.get\(["\'][^"\']*groups["\']',
                r'@router\.post\(["\'][^"\']*groups["\']',
                r'@router\.put\(["\'][^"\']*groups/\{group_id\}["\']',
                r'@router\.delete\(["\'][^"\']*groups/\{group_id\}["\']',
                r'@router\.get\(["\'][^"\']*groups/stats["\']',
                r'@router\.put\(["\'][^"\']*groups/reorder["\']'
            ]
            
            all_found = True
            
            for pattern in required_endpoints:
                if re.search(pattern, content):
                    self.log_success(f"找到API端点函数: {pattern}")
                else:
                    self.log_error(f"未找到API端点函数: {pattern}")
                    all_found = False
                    
            for pattern in required_routes:
                if re.search(pattern, content):
                    self.log_success(f"找到路由装饰器: {pattern}")
                else:
                    self.log_error(f"未找到路由装饰器: {pattern}")
                    all_found = False
                    
            return all_found
            
        except Exception as e:
            self.log_error(f"验证路由内容失败: {e}")
            return False

    def validate_migration_content(self) -> bool:
        """验证迁移文件内容"""
        print("\n🧪 验证数据库迁移...")
        
        migration_file = "alembic_for_db_v2/versions/a1b2c3d4e5f6_add_report_user_preference_groups_table.py"
        full_path = os.path.join(self.project_root, migration_file)
        
        if not os.path.exists(full_path):
            self.log_error("迁移文件不存在")
            return False
            
        try:
            with open(full_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            # 检查必要的迁移内容
            required_patterns = [
                r'def upgrade\(\)',
                r'def downgrade\(\)',
                r'op\.create_table\(\s*["\']report_user_preference_groups["\']',
                r'sa\.Column\(["\']user_id["\']',
                r'sa\.Column\(["\']name["\']',
                r'sa\.Column\(["\']color["\']',
                r'sa\.Column\(["\']icon["\']',
                r'sa\.Column\(["\']sort_order["\']',
                r'sa\.Column\(["\']is_active["\']',
                r'op\.create_index\(',
                r'op\.drop_table\(["\']report_user_preference_groups["\']'
            ]
            
            all_found = True
            for pattern in required_patterns:
                if re.search(pattern, content, re.MULTILINE):
                    self.log_success(f"找到迁移内容: {pattern}")
                else:
                    self.log_error(f"未找到迁移内容: {pattern}")
                    all_found = False
                    
            return all_found
            
        except Exception as e:
            self.log_error(f"验证迁移内容失败: {e}")
            return False

    def validate_imports_and_dependencies(self) -> bool:
        """验证导入和依赖关系"""
        print("\n🧪 验证导入和依赖关系...")
        
        router_file = "routers/config/user_preferences_router.py"
        full_path = os.path.join(self.project_root, router_file)
        
        if not os.path.exists(full_path):
            return False
            
        try:
            with open(full_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            # 检查必要的导入
            required_imports = [
                'ReportUserPreferenceGroup',
                'PresetGroupCreate',
                'PresetGroupUpdate',
                'PresetGroupResponse',
                'PresetGroupListResponse',
                'PresetGroupStatsResponse',
                'PresetGroupReorderRequest'
            ]
            
            all_found = True
            for import_name in required_imports:
                if import_name in content:
                    self.log_success(f"找到导入: {import_name}")
                else:
                    self.log_error(f"未找到导入: {import_name}")
                    all_found = False
                    
            return all_found
            
        except Exception as e:
            self.log_error(f"验证导入失败: {e}")
            return False

    def run_validation(self) -> Dict[str, Any]:
        """运行所有验证"""
        print("🚀 开始预设分组功能代码验证...\n")
        
        # 验证文件存在性
        print("📁 验证文件存在性...")
        files_to_check = [
            ("models/reports.py", "SQLAlchemy模型"),
            ("pydantic_models/user_preferences.py", "Pydantic模型"),
            ("routers/config/user_preferences_router.py", "API路由"),
            ("alembic_for_db_v2/versions/a1b2c3d4e5f6_add_report_user_preference_groups_table.py", "数据库迁移")
        ]
        
        file_check_results = []
        for file_path, description in files_to_check:
            result = self.validate_file_exists(file_path, description)
            file_check_results.append(result)
        
        # 验证Python语法
        print("\n🐍 验证Python语法...")
        syntax_check_results = []
        for file_path, description in files_to_check:
            if file_path.endswith('.py'):
                result = self.validate_python_syntax(file_path, description)
                syntax_check_results.append(result)
        
        # 验证内容完整性
        content_results = [
            self.validate_model_content(),
            self.validate_pydantic_content(),
            self.validate_router_content(),
            self.validate_migration_content(),
            self.validate_imports_and_dependencies()
        ]
        
        # 汇总结果
        total_checks = len(file_check_results) + len(syntax_check_results) + len(content_results)
        passed_checks = sum(file_check_results) + sum(syntax_check_results) + sum(content_results)
        
        print(f"\n📊 验证结果: {passed_checks}/{total_checks} 项检查通过")
        
        if len(self.errors) == 0:
            print("🎉 所有验证通过！代码结构完整且语法正确")
        else:
            print(f"❌ 发现 {len(self.errors)} 个错误")
            for error in self.errors:
                print(f"   • {error}")
                
        if len(self.warnings) > 0:
            print(f"⚠️ 发现 {len(self.warnings)} 个警告")
            for warning in self.warnings:
                print(f"   • {warning}")
        
        return {
            "total_checks": total_checks,
            "passed_checks": passed_checks,
            "errors": self.errors,
            "warnings": self.warnings,
            "success": len(self.errors) == 0
        }

def main():
    """主函数"""
    validator = CodeValidator()
    result = validator.run_validation()
    
    # 返回退出码
    return 0 if result["success"] else 1

if __name__ == "__main__":
    exit(main())