#!/usr/bin/env python3
"""
验证权限分配情况的脚本
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '..'))

from sqlalchemy import text
from webapp.v2.database import SessionLocalV2

class PermissionVerifier:
    """权限验证器"""
    
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
    
    def get_admin_role_info(self):
        """获取超级管理员角色信息"""
        result = self.db.execute(
            text("SELECT id, code, name FROM security.roles WHERE code = 'SUPER_ADMIN'")
        ).fetchone()
        
        if result:
            return {"id": result[0], "code": result[1], "name": result[2]}
        return None
    
    def get_admin_permissions_count(self, admin_role_id: int):
        """获取超级管理员拥有的新权限数量"""
        # 构建查询条件
        conditions = []
        params = {"role_id": admin_role_id}
        
        for i, module in enumerate(self.new_permission_modules):
            param_name = f"module_{i}"
            conditions.append(f"p.code LIKE :{param_name}")
            params[param_name] = f"{module}:%"
        
        where_clause = " OR ".join(conditions)
        
        result = self.db.execute(
            text(f"""
                SELECT COUNT(*) 
                FROM security.permissions p
                JOIN security.role_permissions rp ON p.id = rp.permission_id
                WHERE rp.role_id = :role_id 
                AND ({where_clause})
            """),
            params
        ).scalar()
        
        return result
    
    def get_admin_permissions_detail(self, admin_role_id: int):
        """获取超级管理员的详细权限信息"""
        # 构建查询条件
        conditions = []
        params = {"role_id": admin_role_id}
        
        for i, module in enumerate(self.new_permission_modules):
            param_name = f"module_{i}"
            conditions.append(f"p.code LIKE :{param_name}")
            params[param_name] = f"{module}:%"
        
        where_clause = " OR ".join(conditions)
        
        result = self.db.execute(
            text(f"""
                SELECT p.code, p.description 
                FROM security.permissions p
                JOIN security.role_permissions rp ON p.id = rp.permission_id
                WHERE rp.role_id = :role_id 
                AND ({where_clause})
                ORDER BY p.code
            """),
            params
        ).fetchall()
        
        return [(row[0], row[1]) for row in result]
    
    def get_total_new_permissions_count(self):
        """获取所有新权限的总数"""
        # 构建查询条件
        conditions = []
        params = {}
        
        for i, module in enumerate(self.new_permission_modules):
            param_name = f"module_{i}"
            conditions.append(f"code LIKE :{param_name}")
            params[param_name] = f"{module}:%"
        
        where_clause = " OR ".join(conditions)
        
        result = self.db.execute(
            text(f"SELECT COUNT(*) FROM security.permissions WHERE {where_clause}"),
            params
        ).scalar()
        
        return result
    
    def verify_permissions(self):
        """验证权限分配"""
        print("🔍 验证自动化薪资计算引擎权限分配")
        print("=" * 60)
        
        # 获取管理员角色信息
        admin_info = self.get_admin_role_info()
        if not admin_info:
            print("❌ 未找到超级管理员角色")
            return False
        
        print(f"📋 超级管理员角色信息:")
        print(f"   ID: {admin_info['id']}")
        print(f"   代码: {admin_info['code']}")
        print(f"   名称: {admin_info['name']}")
        
        # 获取权限统计
        total_new_permissions = self.get_total_new_permissions_count()
        admin_permissions_count = self.get_admin_permissions_count(admin_info['id'])
        
        print(f"\n📊 权限统计:")
        print(f"   系统中新权限总数: {total_new_permissions}")
        print(f"   超级管理员拥有的新权限: {admin_permissions_count}")
        print(f"   权限覆盖率: {admin_permissions_count/total_new_permissions*100:.1f}%" if total_new_permissions > 0 else "   权限覆盖率: 0%")
        
        # 详细权限列表
        admin_permissions = self.get_admin_permissions_detail(admin_info['id'])
        
        print(f"\n📋 超级管理员拥有的自动化薪资计算引擎权限 ({len(admin_permissions)} 个):")
        
        current_module = ""
        for code, description in admin_permissions:
            module = code.split(':')[0] if ':' in code else 'other'
            
            if module != current_module:
                print(f"\n🔹 {module.upper()}:")
                current_module = module
            
            print(f"   ✅ {code} - {description}")
        
        # 验证结果
        success = admin_permissions_count == total_new_permissions and admin_permissions_count > 0
        
        print(f"\n🎯 验证结果:")
        if success:
            print("   ✅ 权限分配完整，所有新权限已正确分配给超级管理员")
            print("   🔐 自动化薪资计算引擎权限系统运行正常")
        else:
            print("   ⚠️ 权限分配不完整或存在问题")
            if total_new_permissions == 0:
                print("   💡 可能需要先运行权限生成脚本")
            elif admin_permissions_count < total_new_permissions:
                print("   💡 可能需要重新运行权限分配脚本")
        
        return success
    
    def close(self):
        """关闭数据库连接"""
        self.db.close()


def main():
    """主函数"""
    verifier = PermissionVerifier()
    
    try:
        success = verifier.verify_permissions()
        return 0 if success else 1
        
    except Exception as e:
        print(f"❌ 权限验证过程中发生错误: {str(e)}")
        return 1
    finally:
        verifier.close()


if __name__ == "__main__":
    exit(main()) 