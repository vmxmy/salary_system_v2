#!/usr/bin/env python3
"""
🔄 更新 v_comprehensive_employee_payroll 视图以匹配数据库实际结构

这个脚本用于解决迁移文件中SQL过长的问题，通过动态获取数据库中的实际视图定义
来确保迁移文件与数据库结构保持一致。

使用方法:
    python update_comprehensive_view_from_db.py

功能:
1. 从数据库获取当前视图的完整定义
2. 备份当前视图定义
3. 重新创建视图确保结构一致
4. 验证视图字段数量和结构
"""

import os
import sys
import psycopg2
from datetime import datetime
import logging

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 数据库连接配置
DATABASE_URL = "postgresql+psycopg2://postgres:810705@pg.debian.ziikoo.com:25432/salary_system_v2"

def get_db_connection():
    """获取数据库连接"""
    try:
        # 解析连接字符串
        db_url = DATABASE_URL.replace("postgresql+psycopg2://", "")
        user_pass, host_port_db = db_url.split("@")
        user, password = user_pass.split(":")
        host_port, database = host_port_db.split("/")
        host, port = host_port.split(":")
        
        conn = psycopg2.connect(
            host=host,
            port=port,
            database=database,
            user=user,
            password=password
        )
        return conn
    except Exception as e:
        logger.error(f"❌ 数据库连接失败: {e}")
        return None

def backup_current_view_definition(cursor):
    """备份当前视图定义"""
    try:
        cursor.execute("""
            SELECT pg_get_viewdef('reports.v_comprehensive_employee_payroll', true) as view_definition;
        """)
        
        result = cursor.fetchone()
        if result:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_file = f"v_comprehensive_employee_payroll_backup_{timestamp}.sql"
            
            with open(backup_file, 'w', encoding='utf-8') as f:
                f.write("-- 备份时间: " + datetime.now().isoformat() + "\n")
                f.write("-- 视图: reports.v_comprehensive_employee_payroll\n\n")
                f.write("CREATE OR REPLACE VIEW reports.v_comprehensive_employee_payroll AS\n")
                f.write(result[0])
                f.write(";\n")
            
            logger.info(f"✅ 视图定义已备份到: {backup_file}")
            return backup_file
        else:
            logger.warning("⚠️ 未找到现有视图定义")
            return None
            
    except Exception as e:
        logger.error(f"❌ 备份视图定义失败: {e}")
        return None

def verify_view_structure(cursor):
    """验证视图结构"""
    try:
        # 检查视图是否存在
        cursor.execute("""
            SELECT COUNT(*) as count 
            FROM information_schema.views 
            WHERE table_schema = 'reports' 
                AND table_name = 'v_comprehensive_employee_payroll';
        """)
        
        view_exists = cursor.fetchone()[0] > 0
        
        if not view_exists:
            logger.error("❌ 视图不存在")
            return False
        
        # 检查字段数量
        cursor.execute("""
            SELECT COUNT(*) as column_count
            FROM information_schema.columns 
            WHERE table_schema = 'reports' 
                AND table_name = 'v_comprehensive_employee_payroll';
        """)
        
        column_count = cursor.fetchone()[0]
        logger.info(f"📊 视图字段数量: {column_count}")
        
        # 检查关键字段是否存在
        key_fields = ['薪资条目id', '员工编号', '姓名', '应发合计', '实发合计']
        missing_fields = []
        
        for field in key_fields:
            cursor.execute("""
                SELECT COUNT(*) 
                FROM information_schema.columns 
                WHERE table_schema = 'reports' 
                    AND table_name = 'v_comprehensive_employee_payroll'
                    AND column_name = %s;
            """, (field,))
            
            if cursor.fetchone()[0] == 0:
                missing_fields.append(field)
        
        if missing_fields:
            logger.error(f"❌ 缺少关键字段: {missing_fields}")
            return False
        
        logger.info("✅ 视图结构验证通过")
        return True
        
    except Exception as e:
        logger.error(f"❌ 验证视图结构失败: {e}")
        return False

def update_view_structure():
    """更新视图结构以匹配数据库实际定义"""
    conn = get_db_connection()
    if not conn:
        return False
    
    try:
        cursor = conn.cursor()
        
        logger.info("🚀 开始更新 v_comprehensive_employee_payroll 视图")
        
        # 1. 备份当前视图定义
        backup_file = backup_current_view_definition(cursor)
        
        # 2. 验证当前视图结构
        if verify_view_structure(cursor):
            logger.info("✅ 当前视图结构正常，无需更新")
            return True
        
        # 3. 如果视图结构有问题，尝试重新创建
        logger.info("🔄 重新创建视图...")
        
        # 获取当前视图定义并重新创建
        cursor.execute("""
            DO $$
            DECLARE
                view_definition TEXT;
                column_count INTEGER;
            BEGIN
                -- 尝试获取视图定义
                BEGIN
                    SELECT pg_get_viewdef('reports.v_comprehensive_employee_payroll', true) INTO view_definition;
                EXCEPTION WHEN OTHERS THEN
                    RAISE NOTICE '⚠️ 无法获取现有视图定义，视图可能不存在或有问题';
                    view_definition := NULL;
                END;
                
                -- 删除现有视图
                DROP VIEW IF EXISTS reports.v_comprehensive_employee_payroll CASCADE;
                
                -- 如果有定义，重新创建
                IF view_definition IS NOT NULL THEN
                    EXECUTE 'CREATE VIEW reports.v_comprehensive_employee_payroll AS ' || view_definition;
                    
                    -- 检查字段数量
                    SELECT COUNT(*) INTO column_count
                    FROM information_schema.columns 
                    WHERE table_schema = 'reports' 
                        AND table_name = 'v_comprehensive_employee_payroll';
                    
                    RAISE NOTICE '✅ 视图已重新创建，字段数: %', column_count;
                ELSE
                    RAISE NOTICE '❌ 无法重新创建视图，缺少视图定义';
                END IF;
            END $$;
        """)
        
        conn.commit()
        
        # 4. 再次验证
        if verify_view_structure(cursor):
            logger.info("✅ 视图更新成功")
            return True
        else:
            logger.error("❌ 视图更新后验证失败")
            return False
            
    except Exception as e:
        logger.error(f"❌ 更新视图失败: {e}")
        conn.rollback()
        return False
        
    finally:
        cursor.close()
        conn.close()

def main():
    """主函数"""
    logger.info("=" * 60)
    logger.info("🔄 v_comprehensive_employee_payroll 视图结构同步工具")
    logger.info("=" * 60)
    
    success = update_view_structure()
    
    if success:
        logger.info("🎉 视图结构同步完成")
        sys.exit(0)
    else:
        logger.error("💥 视图结构同步失败")
        sys.exit(1)

if __name__ == "__main__":
    main() 