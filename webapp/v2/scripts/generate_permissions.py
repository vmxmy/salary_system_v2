#!/usr/bin/env python3
"""
根据权限命名规则生成自动化薪资计算引擎相关权限
"""

import asyncio
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime

# 导入数据库连接
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '..'))

from webapp.v2.database import SessionLocalV2

class PermissionGenerator:
    """权限生成器"""
    
    def __init__(self):
        self.db = SessionLocalV2()
        
        # 定义新的权限规则
        self.new_permissions = [
            # 薪资计算引擎权限
            ("payroll_calculation:trigger", "触发薪资计算"),
            ("payroll_calculation:preview", "预览薪资计算"),
            ("payroll_calculation:view_status", "查看计算状态"),
            ("payroll_calculation:view_summary", "查看计算汇总"),
            ("payroll_calculation:manage", "管理薪资计算"),
            ("payroll_calculation:cancel", "取消薪资计算"),
            
            # 计算配置权限
            ("calculation_config:view", "查看计算配置"),
            ("calculation_config:manage", "管理计算配置"),
            ("calculation_config:create_ruleset", "创建计算规则集"),
            ("calculation_config:edit_ruleset", "编辑计算规则集"),
            ("calculation_config:delete_ruleset", "删除计算规则集"),
            ("calculation_config:activate_ruleset", "激活计算规则集"),
            
            # 社保配置权限
            ("social_insurance_config:view", "查看社保配置"),
            ("social_insurance_config:create", "创建社保配置"),
            ("social_insurance_config:edit", "编辑社保配置"),
            ("social_insurance_config:delete", "删除社保配置"),
            ("social_insurance_config:manage", "管理社保配置"),
            
            # 税务配置权限
            ("tax_config:view", "查看税务配置"),
            ("tax_config:create", "创建税务配置"),
            ("tax_config:edit", "编辑税务配置"),
            ("tax_config:delete", "删除税务配置"),
            ("tax_config:manage", "管理税务配置"),
            
            # 考勤管理权限
            ("attendance:view", "查看考勤数据"),
            ("attendance:manage", "管理考勤数据"),
            ("attendance_period:view", "查看考勤周期"),
            ("attendance_period:create", "创建考勤周期"),
            ("attendance_period:edit", "编辑考勤周期"),
            ("attendance_period:delete", "删除考勤周期"),
            ("attendance_period:manage", "管理考勤周期"),
            
            # 考勤记录权限
            ("attendance_record:view", "查看考勤记录"),
            ("attendance_record:create", "创建考勤记录"),
            ("attendance_record:edit", "编辑考勤记录"),
            ("attendance_record:delete", "删除考勤记录"),
            ("attendance_record:import", "导入考勤记录"),
            ("attendance_record:export", "导出考勤记录"),
            ("attendance_record:manage", "管理考勤记录"),
            
            # 日考勤权限
            ("daily_attendance:view", "查看日考勤"),
            ("daily_attendance:create", "创建日考勤"),
            ("daily_attendance:edit", "编辑日考勤"),
            ("daily_attendance:delete", "删除日考勤"),
            ("daily_attendance:manage", "管理日考勤"),
            
            # 考勤规则权限
            ("attendance_rule:view", "查看考勤规则"),
            ("attendance_rule:create", "创建考勤规则"),
            ("attendance_rule:edit", "编辑考勤规则"),
            ("attendance_rule:delete", "删除考勤规则"),
            ("attendance_rule:manage", "管理考勤规则"),
            
            # 薪资组件配置权限
            ("employee_salary_config:view", "查看员工薪资配置"),
            ("employee_salary_config:create", "创建员工薪资配置"),
            ("employee_salary_config:edit", "编辑员工薪资配置"),
            ("employee_salary_config:delete", "删除员工薪资配置"),
            ("employee_salary_config:manage", "管理员工薪资配置"),
            
            # 计算审计权限
            ("calculation_audit:view", "查看计算审计日志"),
            ("calculation_audit:export", "导出计算审计日志"),
            ("calculation_audit:manage", "管理计算审计"),
            
            # 计算模板权限
            ("calculation_template:view", "查看计算模板"),
            ("calculation_template:create", "创建计算模板"),
            ("calculation_template:edit", "编辑计算模板"),
            ("calculation_template:delete", "删除计算模板"),
            ("calculation_template:copy", "复制计算模板"),
            ("calculation_template:manage", "管理计算模板"),
        ]
    
    def check_permission_exists(self, code: str) -> bool:
        """检查权限是否已存在"""
        result = self.db.execute(
            text("SELECT COUNT(*) FROM security.permissions WHERE code = :code"),
            {"code": code}
        ).scalar()
        return result > 0
    
    def create_permission(self, code: str, description: str) -> bool:
        """创建权限"""
        try:
            if self.check_permission_exists(code):
                print(f"⚠️  权限 {code} 已存在，跳过")
                return False
            
            self.db.execute(
                text("INSERT INTO security.permissions (code, description) VALUES (:code, :description)"),
                {"code": code, "description": description}
            )
            print(f"✅ 创建权限: {code} - {description}")
            return True
        except Exception as e:
            print(f"❌ 创建权限失败 {code}: {str(e)}")
            return False
    
    def generate_all_permissions(self):
        """生成所有新权限"""
        print("🔧 开始生成自动化薪资计算引擎权限")
        print("=" * 60)
        
        created_count = 0
        skipped_count = 0
        failed_count = 0
        
        for code, description in self.new_permissions:
            if self.create_permission(code, description):
                created_count += 1
            elif self.check_permission_exists(code):
                skipped_count += 1
            else:
                failed_count += 1
        
        # 提交事务
        try:
            self.db.commit()
            print("\n" + "=" * 60)
            print("📊 权限生成统计:")
            print(f"   新创建: {created_count} 个")
            print(f"   已存在: {skipped_count} 个")
            print(f"   失败: {failed_count} 个")
            print(f"   总计: {len(self.new_permissions)} 个")
            
            if failed_count == 0:
                print("\n🎉 所有权限生成成功！")
            else:
                print(f"\n⚠️  有 {failed_count} 个权限生成失败，请检查日志")
                
        except Exception as e:
            self.db.rollback()
            print(f"\n❌ 事务提交失败: {str(e)}")
            raise
    
    def list_existing_permissions(self):
        """列出现有权限（用于参考）"""
        print("\n📋 现有权限列表（按模块分组）:")
        print("-" * 40)
        
        result = self.db.execute(
            text("SELECT code, description FROM security.permissions ORDER BY code")
        ).fetchall()
        
        current_module = ""
        for row in result:
            code = row[0]
            description = row[1]
            module = code.split(':')[0] if ':' in code else 'other'
            
            if module != current_module:
                print(f"\n📁 {module.upper()}:")
                current_module = module
            
            print(f"   {code} - {description}")
    
    def generate_permission_summary(self):
        """生成权限汇总报告"""
        print("\n📈 权限汇总报告:")
        print("-" * 40)
        
        # 按模块统计
        modules = {}
        for code, description in self.new_permissions:
            module = code.split(':')[0] if ':' in code else 'other'
            if module not in modules:
                modules[module] = []
            modules[module].append((code, description))
        
        for module, permissions in modules.items():
            print(f"\n🔹 {module.upper()} ({len(permissions)} 个权限):")
            for code, desc in permissions:
                print(f"   • {code} - {desc}")
    
    def close(self):
        """关闭数据库连接"""
        self.db.close()


def main():
    """主函数"""
    generator = PermissionGenerator()
    
    try:
        # 生成权限汇总
        generator.generate_permission_summary()
        
        # 生成所有权限
        generator.generate_all_permissions()
        
        # 可选：列出现有权限（用于验证）
        # generator.list_existing_permissions()
        
    except Exception as e:
        print(f"❌ 权限生成过程中发生错误: {str(e)}")
        return 1
    finally:
        generator.close()
    
    return 0


if __name__ == "__main__":
    exit(main()) 