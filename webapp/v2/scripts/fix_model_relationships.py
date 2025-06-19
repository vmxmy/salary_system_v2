#!/usr/bin/env python3
"""
修复模型关系问题的脚本
检查并验证SQLAlchemy模型关系是否正确配置
"""

import sys
import os

# 添加项目根目录到 Python 路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def test_model_imports():
    """测试模型导入"""
    print("🧪 测试模型导入...")
    
    try:
        # 导入所有模型
        from models.security import User
        from models.reports import ReportUserPreference, ReportUserPreferenceGroup
        
        print("✅ 模型导入成功")
        return True
    except Exception as e:
        print(f"❌ 模型导入失败: {e}")
        return False

def test_relationship_configuration():
    """测试关系配置"""
    print("\n🧪 测试关系配置...")
    
    try:
        from models.security import User
        from models.reports import ReportUserPreferenceGroup
        
        # 检查User模型是否有report_preference_groups关系
        if hasattr(User, 'report_preference_groups'):
            print("✅ User模型包含report_preference_groups关系")
        else:
            print("❌ User模型缺少report_preference_groups关系")
            return False
            
        # 检查ReportUserPreferenceGroup模型是否有user关系
        if hasattr(ReportUserPreferenceGroup, 'user'):
            print("✅ ReportUserPreferenceGroup模型包含user关系")
        else:
            print("❌ ReportUserPreferenceGroup模型缺少user关系")
            return False
            
        return True
    except Exception as e:
        print(f"❌ 关系配置测试失败: {e}")
        return False

def test_database_connection():
    """测试数据库连接"""
    print("\n🧪 测试数据库连接...")
    
    try:
        from database import get_db_v2
        from sqlalchemy.orm import Session
        
        db: Session = next(get_db_v2())
        
        # 测试简单查询
        from models.security import User
        user_count = db.query(User).count()
        print(f"✅ 数据库连接成功，用户表有 {user_count} 条记录")
        
        db.close()
        return True
    except Exception as e:
        print(f"❌ 数据库连接失败: {e}")
        return False

def test_table_existence():
    """测试表是否存在"""
    print("\n🧪 测试表是否存在...")
    
    try:
        from database import get_db_v2
        from sqlalchemy.orm import Session
        from sqlalchemy import text
        
        db: Session = next(get_db_v2())
        
        # 检查report_user_preference_groups表是否存在
        result = db.execute(text("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'config' 
                AND table_name = 'report_user_preference_groups'
            );
        """))
        
        table_exists = result.scalar()
        
        if table_exists:
            print("✅ report_user_preference_groups表已存在")
        else:
            print("⚠️ report_user_preference_groups表不存在，需要运行数据库迁移")
            
        db.close()
        return table_exists
    except Exception as e:
        print(f"❌ 检查表存在性失败: {e}")
        return False

def test_model_creation():
    """测试模型创建（仅在表存在时）"""
    print("\n🧪 测试模型创建...")
    
    try:
        from database import get_db_v2
        from models.reports import ReportUserPreferenceGroup
        from sqlalchemy.orm import Session
        
        db: Session = next(get_db_v2())
        
        # 只进行查询测试，不创建记录
        count = db.query(ReportUserPreferenceGroup).count()
        print(f"✅ 分组表查询成功，当前有 {count} 条记录")
        
        db.close()
        return True
    except Exception as e:
        print(f"❌ 模型查询测试失败: {e}")
        return False

def check_migration_status():
    """检查迁移状态"""
    print("\n🧪 检查迁移状态...")
    
    try:
        from database import get_db_v2
        from sqlalchemy.orm import Session
        from sqlalchemy import text
        
        db: Session = next(get_db_v2())
        
        # 检查alembic版本表
        result = db.execute(text("""
            SELECT version_num FROM alembic_version 
            ORDER BY version_num DESC LIMIT 1;
        """))
        
        current_version = result.scalar()
        print(f"✅ 当前数据库版本: {current_version}")
        
        # 检查我们的迁移是否已应用
        our_migration = "a1b2c3d4e5f6"
        if current_version and our_migration in current_version:
            print("✅ 预设分组迁移已应用")
            migration_applied = True
        else:
            print("⚠️ 预设分组迁移尚未应用")
            migration_applied = False
            
        db.close()
        return migration_applied
    except Exception as e:
        print(f"❌ 检查迁移状态失败: {e}")
        return False

def provide_fix_instructions():
    """提供修复指导"""
    print("\n🔧 修复指导:")
    print("如果遇到模型关系错误，请按以下步骤操作：")
    print("")
    print("1. 运行数据库迁移:")
    print("   cd /Users/xumingyang/app/高新区工资信息管理/salary_system/webapp/v2")
    print("   conda activate lightweight-salary-system")
    print("   alembic upgrade head")
    print("")
    print("2. 重启应用服务器以重新加载模型")
    print("")
    print("3. 如果问题持续存在，可能需要手动创建表:")
    print("   CREATE TABLE config.report_user_preference_groups (")
    print("       id BIGSERIAL PRIMARY KEY,")
    print("       user_id BIGINT NOT NULL REFERENCES security.users(id) ON DELETE CASCADE,")
    print("       name VARCHAR(50) NOT NULL,")
    print("       description VARCHAR(200),")
    print("       color VARCHAR(7),")
    print("       icon VARCHAR(50),")
    print("       sort_order INTEGER NOT NULL DEFAULT 0,")
    print("       is_active BOOLEAN NOT NULL DEFAULT TRUE,")
    print("       created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),")
    print("       updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()")
    print("   );")
    print("")
    print("4. 创建索引:")
    print("   CREATE INDEX idx_user_preference_groups_user ON config.report_user_preference_groups(user_id);")
    print("   CREATE INDEX idx_user_preference_groups_name ON config.report_user_preference_groups(user_id, name);")
    print("   CREATE UNIQUE INDEX uq_user_preference_group_name ON config.report_user_preference_groups(user_id, name);")

def main():
    """主函数"""
    print("🚀 开始检查和修复模型关系问题...\n")
    
    tests = [
        ("模型导入", test_model_imports),
        ("关系配置", test_relationship_configuration),
        ("数据库连接", test_database_connection),
        ("迁移状态", check_migration_status),
        ("表存在性", test_table_existence),
        ("模型创建", test_model_creation),
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"🧪 运行测试: {test_name}")
        try:
            result = test_func()
            results.append((test_name, result))
            print(f"{'✅' if result else '❌'} {test_name}: {'通过' if result else '失败'}")
        except Exception as e:
            print(f"❌ {test_name}: 异常 - {e}")
            results.append((test_name, False))
        print()
    
    # 总结
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    print(f"📊 测试结果: {passed}/{total} 个测试通过")
    
    if passed < total:
        provide_fix_instructions()
    else:
        print("🎉 所有测试通过！模型关系配置正确")

if __name__ == "__main__":
    main()