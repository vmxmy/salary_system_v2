#!/usr/bin/env python3
"""
为管理员角色分配自动化薪资计算引擎相关权限
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '..'))

from sqlalchemy import text
from webapp.v2.database import SessionLocalV2

class PermissionAssigner:
    """权限分配器"""
    
    def __init__(self):
        self.db = SessionLocalV2()
        
        # 新权限模块列表
        self.new_permission_modules = [
            'payroll_calculation',
            'calculation_config', 
            'social_insurance_config',
            'tax_config',
            'attendance',
            'attendance_period',
            'attendance_record',
            'daily_attendance',
            'attendance_rule',
            'employee_salary_config',
            'calculation_audit',
            'calculation_template'
        ]
    
    def get_admin_role_id(self) -> int:
        """获取超级管理员角色ID"""
        result = self.db.execute(
            text("SELECT id FROM security.roles WHERE code = 'SUPER_ADMIN'")
        ).scalar()
        return result
    
    def get_new_permissions(self) -> list:
        """获取新创建的权限列表"""
        # 构建查询条件
        conditions = []
        params = {}
        
        for i, module in enumerate(self.new_permission_modules):
            param_name = f"module_{i}"
            conditions.append(f"code LIKE :{param_name}")
            params[param_name] = f"{module}:%"
        
        where_clause = " OR ".join(conditions)
        
        result = self.db.execute(
            text(f"SELECT id, code FROM security.permissions WHERE {where_clause} ORDER BY code"),
            params
        ).fetchall()
        
        return [(row[0], row[1]) for row in result]
    
    def check_permission_assigned(self, role_id: int, permission_id: int) -> bool:
        """检查权限是否已分配给角色"""
        result = self.db.execute(
            text("SELECT COUNT(*) FROM security.role_permissions WHERE role_id = :role_id AND permission_id = :permission_id"),
            {"role_id": role_id, "permission_id": permission_id}
        ).scalar()
        return result > 0
    
    def assign_permission(self, role_id: int, permission_id: int, permission_code: str) -> bool:
        """为角色分配权限"""
        try:
            if self.check_permission_assigned(role_id, permission_id):
                print(f"⚠️  权限 {permission_code} 已分配给角色，跳过")
                return False
            
            self.db.execute(
                text("INSERT INTO security.role_permissions (role_id, permission_id) VALUES (:role_id, :permission_id)"),
                {"role_id": role_id, "permission_id": permission_id}
            )
            print(f"✅ 分配权限: {permission_code}")
            return True
        except Exception as e:
            print(f"❌ 分配权限失败 {permission_code}: {str(e)}")
            return False
    
    def assign_all_permissions(self):
        """为管理员分配所有新权限"""
        print("🔧 开始为超级管理员分配自动化薪资计算引擎权限")
        print("=" * 60)
        
        # 获取管理员角色ID
        admin_role_id = self.get_admin_role_id()
        if not admin_role_id:
            print("❌ 未找到超级管理员角色")
            return False
        
        print(f"📋 超级管理员角色ID: {admin_role_id}")
        
        # 获取新权限列表
        new_permissions = self.get_new_permissions()
        print(f"📋 找到 {len(new_permissions)} 个新权限")
        
        assigned_count = 0
        skipped_count = 0
        failed_count = 0
        
        for permission_id, permission_code in new_permissions:
            if self.assign_permission(admin_role_id, permission_id, permission_code):
                assigned_count += 1
            elif self.check_permission_assigned(admin_role_id, permission_id):
                skipped_count += 1
            else:
                failed_count += 1
        
        # 提交事务
        try:
            self.db.commit()
            print("\n" + "=" * 60)
            print("📊 权限分配统计:")
            print(f"   新分配: {assigned_count} 个")
            print(f"   已存在: {skipped_count} 个")
            print(f"   失败: {failed_count} 个")
            print(f"   总计: {len(new_permissions)} 个")
            
            if failed_count == 0:
                print("\n🎉 所有权限分配成功！")
                print("🔐 超级管理员现在拥有完整的自动化薪资计算引擎权限")
            else:
                print(f"\n⚠️  有 {failed_count} 个权限分配失败，请检查日志")
                
        except Exception as e:
            self.db.rollback()
            print(f"\n❌ 事务提交失败: {str(e)}")
            raise
        
        return failed_count == 0
    
    def verify_permissions(self):
        """验证权限分配结果"""
        print("\n🔍 验证权限分配结果:")
        print("-" * 40)
        
        admin_role_id = self.get_admin_role_id()
        if not admin_role_id:
            print("❌ 未找到超级管理员角色")
            return
        
        # 查询管理员拥有的新权限
        result = self.db.execute(
            text("""
                SELECT p.code, p.description 
                FROM security.permissions p
                JOIN security.role_permissions rp ON p.id = rp.permission_id
                WHERE rp.role_id = :role_id 
                AND (p.code LIKE 'payroll_calculation:%' 
                     OR p.code LIKE 'calculation_config:%'
                     OR p.code LIKE 'social_insurance_config:%'
                     OR p.code LIKE 'tax_config:%'
                     OR p.code LIKE 'attendance%:%'
                     OR p.code LIKE 'daily_attendance:%'
                     OR p.code LIKE 'employee_salary_config:%'
                     OR p.code LIKE 'calculation_audit:%'
                     OR p.code LIKE 'calculation_template:%')
                ORDER BY p.code
            """),
            {"role_id": admin_role_id}
        ).fetchall()
        
        print(f"📋 超级管理员拥有的自动化薪资计算引擎权限 ({len(result)} 个):")
        
        current_module = ""
        for row in result:
            code = row[0]
            description = row[1]
            module = code.split(':')[0] if ':' in code else 'other'
            
            if module != current_module:
                print(f"\n🔹 {module.upper()}:")
                current_module = module
            
            print(f"   ✅ {code} - {description}")
    
    def close(self):
        """关闭数据库连接"""
        self.db.close()


def main():
    """主函数"""
    assigner = PermissionAssigner()
    
    try:
        # 分配权限
        success = assigner.assign_all_permissions()
        
        # 验证结果
        if success:
            assigner.verify_permissions()
        
        return 0 if success else 1
        
    except Exception as e:
        print(f"❌ 权限分配过程中发生错误: {str(e)}")
        return 1
    finally:
        assigner.close()


if __name__ == "__main__":
    exit(main()) 