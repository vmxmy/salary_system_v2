"""
初始化报表管理相关的权限
"""
from sqlalchemy.orm import Session
from ..models.security import Permission, Role, role_permissions
from ..database import get_db_v2

# 报表管理权限定义
REPORT_PERMISSIONS = [
    # 数据源管理
    ("report:view_datasources", "查看数据源列表"),
    ("report:create_datasource", "创建数据源"),
    ("report:edit_datasource", "编辑数据源"),
    ("report:delete_datasource", "删除数据源"),
    ("report:detect_fields", "检测数据源字段"),
    
    # 计算字段管理
    ("report:view_calculated_fields", "查看计算字段"),
    ("report:create_calculated_field", "创建计算字段"),
    ("report:edit_calculated_field", "编辑计算字段"),
    ("report:delete_calculated_field", "删除计算字段"),
    ("report:test_formula", "测试计算公式"),
    
    # 报表模板管理
    ("report:view_templates", "查看报表模板"),
    ("report:create_template", "创建报表模板"),
    ("report:edit_template", "编辑报表模板"),
    ("report:delete_template", "删除报表模板"),
    ("report:copy_template", "复制报表模板"),
    ("report:share_template", "分享报表模板"),
    
    # 报表执行
    ("report:execute_report", "执行报表"),
    ("report:view_executions", "查看执行记录"),
    ("report:export_report", "导出报表"),
    
    # 报表设计器
    ("report:use_designer", "使用报表设计器"),
    ("report:preview_report", "预览报表"),
    
    # 高级权限
    ("report:manage_global_fields", "管理全局计算字段"),
    ("report:view_all_templates", "查看所有用户的模板"),
    ("report:admin", "报表管理员权限"),
]

def init_report_permissions():
    """初始化报表管理权限"""
    db = next(get_db_v2())
    
    try:
        # 创建权限
        for permission_code, description in REPORT_PERMISSIONS:
            existing = db.query(Permission).filter(Permission.code == permission_code).first()
            if not existing:
                permission = Permission(
                    code=permission_code,
                    description=description
                )
                db.add(permission)
                print(f"创建权限: {permission_code} - {description}")
        
        # 创建报表管理员角色
        admin_role = db.query(Role).filter(Role.code == "report_admin").first()
        if not admin_role:
            admin_role = Role(
                code="report_admin",
                name="报表管理员"
            )
            db.add(admin_role)
            db.flush()
        
        # 为报表管理员角色分配所有报表权限
        for permission_code, _ in REPORT_PERMISSIONS:
            permission = db.query(Permission).filter(Permission.code == permission_code).first()
            if permission:
                # 检查是否已经有这个权限
                existing = db.query(role_permissions).filter(
                    role_permissions.c.role_id == admin_role.id,
                    role_permissions.c.permission_id == permission.id
                ).first()
                if not existing:
                    db.execute(role_permissions.insert().values(
                        role_id=admin_role.id,
                        permission_id=permission.id
                    ))
        
        # 创建报表用户角色（基础权限）
        user_role = db.query(Role).filter(Role.code == "report_user").first()
        if not user_role:
            user_role = Role(
                code="report_user", 
                name="报表用户"
            )
            db.add(user_role)
            db.flush()
        
        # 为报表用户角色分配基础权限
        basic_permissions = [
            "report:view_datasources",
            "report:view_calculated_fields", 
            "report:view_templates",
            "report:execute_report",
            "report:use_designer",
            "report:preview_report",
            "report:export_report",
        ]
        
        for permission_code in basic_permissions:
            permission = db.query(Permission).filter(Permission.code == permission_code).first()
            if permission:
                existing = db.query(role_permissions).filter(
                    role_permissions.c.role_id == user_role.id,
                    role_permissions.c.permission_id == permission.id
                ).first()
                if not existing:
                    db.execute(role_permissions.insert().values(
                        role_id=user_role.id,
                        permission_id=permission.id
                    ))
        
        db.commit()
        print("报表管理权限初始化完成！")
        print(f"创建角色: report_admin (报表管理员)")
        print(f"创建角色: report_user (报表用户)")
        
    except Exception as e:
        db.rollback()
        print(f"权限初始化失败: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    init_report_permissions() 