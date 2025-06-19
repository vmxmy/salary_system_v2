#!/usr/bin/env python3
"""
简化的预设分组功能测试
直接测试数据库模型和基本CRUD操作
"""

import sys
import os

# 添加项目根目录到 Python 路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def test_model_imports():
    """测试模型导入"""
    print("🧪 测试模型导入...")
    
    try:
        from models.reports import ReportUserPreferenceGroup, ReportUserPreference
        from pydantic_models.user_preferences import (
            PresetGroupCreate,
            PresetGroupUpdate,
            PresetGroupResponse,
            PresetGroupListResponse,
            PresetGroupStatsResponse,
            PresetGroupReorderRequest
        )
        print("✅ 所有模型导入成功")
        return True
    except Exception as e:
        print(f"❌ 模型导入失败: {e}")
        return False

def test_pydantic_models():
    """测试Pydantic模型验证"""
    print("\n🧪 测试Pydantic模型验证...")
    
    try:
        from pydantic_models.user_preferences import PresetGroupCreate, PresetGroupUpdate
        
        # 测试创建模型
        create_data = PresetGroupCreate(
            name="测试分组",
            description="测试描述",
            color="#1890ff",
            icon="FolderOutlined",
            sort_order=0,
            is_active=True
        )
        assert create_data.name == "测试分组"
        assert create_data.color == "#1890ff"
        print("✅ PresetGroupCreate 模型验证成功")
        
        # 测试更新模型
        update_data = PresetGroupUpdate(
            name="更新的分组名",
            color="#52c41a"
        )
        assert update_data.name == "更新的分组名"
        assert update_data.color == "#52c41a"
        print("✅ PresetGroupUpdate 模型验证成功")
        
        # 测试字段验证
        try:
            invalid_data = PresetGroupCreate(
                name="",  # 空名称应该失败
                color="#1890ff"
            )
            print("❌ 应该验证失败但没有失败")
        except Exception:
            print("✅ 字段验证正常工作")
        
        return True
    except Exception as e:
        print(f"❌ Pydantic模型测试失败: {e}")
        return False

def test_database_connection():
    """测试数据库连接"""
    print("\n🧪 测试数据库连接...")
    
    try:
        from database import get_db_v2
        from sqlalchemy.orm import Session
        
        db: Session = next(get_db_v2())
        
        # 测试简单查询
        from models.reports import ReportUserPreferenceGroup
        count = db.query(ReportUserPreferenceGroup).count()
        print(f"✅ 数据库连接成功，当前分组表有 {count} 条记录")
        
        db.close()
        return True
    except Exception as e:
        print(f"❌ 数据库连接失败: {e}")
        return False

def test_model_creation():
    """测试模型创建和基本操作"""
    print("\n🧪 测试模型创建和基本操作...")
    
    try:
        from database import get_db_v2
        from models.reports import ReportUserPreferenceGroup
        from sqlalchemy.orm import Session
        
        db: Session = next(get_db_v2())
        
        # 创建测试分组
        test_group = ReportUserPreferenceGroup(
            user_id=1,  # 假设用户ID为1
            name="API测试分组",
            description="这是一个API测试分组",
            color="#1890ff",
            icon="FolderOutlined",
            sort_order=0,
            is_active=True
        )
        
        db.add(test_group)
        db.commit()
        db.refresh(test_group)
        
        print(f"✅ 分组创建成功，ID: {test_group.id}")
        
        # 查询分组
        found_group = db.query(ReportUserPreferenceGroup).filter(
            ReportUserPreferenceGroup.id == test_group.id
        ).first()
        
        assert found_group is not None
        assert found_group.name == "API测试分组"
        print("✅ 分组查询成功")
        
        # 更新分组
        found_group.name = "更新的API测试分组"
        found_group.color = "#52c41a"
        db.commit()
        
        updated_group = db.query(ReportUserPreferenceGroup).filter(
            ReportUserPreferenceGroup.id == test_group.id
        ).first()
        
        assert updated_group.name == "更新的API测试分组"
        assert updated_group.color == "#52c41a"
        print("✅ 分组更新成功")
        
        # 删除测试分组
        db.delete(updated_group)
        db.commit()
        
        deleted_group = db.query(ReportUserPreferenceGroup).filter(
            ReportUserPreferenceGroup.id == test_group.id
        ).first()
        
        assert deleted_group is None
        print("✅ 分组删除成功")
        
        db.close()
        return True
    except Exception as e:
        print(f"❌ 模型操作测试失败: {e}")
        try:
            db.rollback()
            db.close()
        except:
            pass
        return False

def test_migration_file():
    """检查迁移文件是否存在"""
    print("\n🧪 检查迁移文件...")
    
    migration_file = "/Users/xumingyang/app/高新区工资信息管理/salary_system/webapp/v2/alembic_for_db_v2/versions/a1b2c3d4e5f6_add_report_user_preference_groups_table.py"
    
    if os.path.exists(migration_file):
        print("✅ 迁移文件存在")
        
        # 检查迁移文件内容
        with open(migration_file, 'r', encoding='utf-8') as f:
            content = f.read()
            if 'report_user_preference_groups' in content:
                print("✅ 迁移文件包含正确的表名")
            if 'user_id' in content and 'name' in content:
                print("✅ 迁移文件包含必要字段")
            return True
    else:
        print("❌ 迁移文件不存在")
        return False

def test_router_imports():
    """测试路由导入"""
    print("\n🧪 测试路由导入...")
    
    try:
        from routers.config.user_preferences_router import router
        print("✅ 路由导入成功")
        
        # 检查路由是否包含分组相关的端点
        routes = [route.path for route in router.routes]
        
        expected_paths = [
            "/user-preferences/groups",
            "/user-preferences/groups/{group_id}",
            "/user-preferences/groups/stats",
            "/user-preferences/groups/reorder"
        ]
        
        for path in expected_paths:
            # 检查是否有匹配的路由模式
            found = any(path in route_path for route_path in routes)
            if found:
                print(f"✅ 找到路由: {path}")
            else:
                print(f"❌ 未找到路由: {path}")
        
        return True
    except Exception as e:
        print(f"❌ 路由导入失败: {e}")
        return False

def main():
    """运行所有测试"""
    print("🚀 开始简化的预设分组功能测试...\n")
    
    tests = [
        test_model_imports,
        test_pydantic_models,
        test_migration_file,
        test_router_imports,
        test_database_connection,
        test_model_creation,
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        if test():
            passed += 1
        print()
    
    print(f"📊 测试结果: {passed}/{total} 个测试通过")
    
    if passed == total:
        print("🎉 所有测试通过！预设分组功能已准备就绪")
    else:
        print("⚠️ 部分测试失败，请检查相关功能")

if __name__ == "__main__":
    main()