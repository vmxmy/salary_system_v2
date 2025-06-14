#!/usr/bin/env python3
"""
🏗️ 动态分层薪资视图生成器

基于配置表动态生成分层薪资视图，解决157字段过多的问题

分层策略：
1. v_payroll_basic - 基础信息视图 (员工信息 + 汇总数据)
2. v_payroll_earnings - 应发明细视图 (基于EARNING类型组件)
3. v_payroll_deductions - 扣除明细视图 (基于DEDUCTION类型组件)
4. v_payroll_calculations - 计算参数视图 (基于计算输入)
5. v_comprehensive_employee_payroll - 综合视图 (JOIN所有分层)

使用方法:
    python create_dynamic_layered_payroll_views.py
"""

import os
import sys
import psycopg2
from datetime import datetime
import logging
from typing import Dict, List, Tuple

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 数据库连接配置
DATABASE_URL = "postgresql://postgres:810705@localhost:5432/salary_system_v2"

def get_db_connection():
    """获取数据库连接"""
    try:
        db_url = DATABASE_URL.replace("postgresql://", "")
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

def get_payroll_components(cursor) -> Dict[str, List[Tuple]]:
    """从配置表获取薪资组件信息"""
    try:
        # 获取所有活跃的薪资组件
        cursor.execute("""
            SELECT 
                code,
                name,
                type,
                calculation_method,
                display_order
            FROM config.payroll_component_definitions 
            WHERE is_active = true
            ORDER BY type, calculation_method, display_order, code;
        """)
        
        components = cursor.fetchall()
        
        # 按类型和计算方法分组，更精细的分类
        grouped = {
            'EARNING': [],
            'PERSONAL_DEDUCTION': [],
            'EMPLOYER_DEDUCTION': [],
            'CALCULATION_BASE': [],
            'CALCULATION_RATE': [],
            'CALCULATION_RESULT': [],
            'OTHER': []
        }
        
        for comp in components:
            code, name, comp_type, calculation_method, display_order = comp
            comp_type = comp_type or 'OTHER'
            
            # 统一DEDUCTION类型到PERSONAL_DEDUCTION
            if comp_type == 'DEDUCTION':
                comp_type = 'PERSONAL_DEDUCTION'
            
            if comp_type not in grouped:
                grouped[comp_type] = []
            grouped[comp_type].append((code, name, calculation_method))
        
        logger.info(f"📊 获取薪资组件: {sum(len(v) for v in grouped.values())} 个")
        for comp_type, items in grouped.items():
            if items:
                logger.info(f"  - {comp_type}: {len(items)} 个")
        
        return grouped
        
    except Exception as e:
        logger.error(f"❌ 获取薪资组件失败: {e}")
        return {}

def generate_basic_view_sql() -> str:
    """生成基础信息视图SQL"""
    return """
    CREATE OR REPLACE VIEW reports.v_payroll_basic AS
    SELECT 
        -- 主键标识
        pe.id AS "薪资条目id",
        pe.employee_id AS "员工id",
        pe.payroll_period_id AS "薪资期间id",
        pe.payroll_run_id AS "薪资运行id",
        
        -- 员工基本信息
        eb.employee_code AS "员工编号",
        eb.first_name AS "名",
        eb.last_name AS "姓",
        eb.full_name AS "姓名",
        eb.id_number AS "身份证号",
        eb.phone_number AS "电话",
        eb.email AS "邮箱",
        eb.hire_date AS "入职日期",
        eb.employee_status AS "员工状态",
        eb.department_name AS "部门名称",
        eb.position_name AS "职位名称",
        eb.personnel_category_name AS "人员类别",
        eb.root_personnel_category_name AS "根人员类别",
        eb.department_id AS "部门id",
        eb.actual_position_id AS "实际职位id",
        eb.personnel_category_id AS "人员类别id",
        eb.social_security_client_number AS "社保客户号",
        eb.housing_fund_client_number AS "住房公积金客户号",
        
        -- 薪资期间信息
        COALESCE(pp.name, '未知期间'::character varying) AS "薪资期间名称",
        pp.start_date AS "薪资期间开始日期",
        pp.end_date AS "薪资期间结束日期",
        pp.pay_date AS "薪资发放日期",
        pr.run_date AS "薪资运行日期",
        
        -- 薪资汇总信息
        COALESCE(pe.gross_pay, 0.00) AS "应发合计",
        COALESCE(pe.total_deductions, 0.00) AS "扣除合计",
        COALESCE(pe.net_pay, 0.00) AS "实发合计",
        
        -- 状态和时间信息
        COALESCE(pe.status_lookup_value_id, 1::bigint) AS "状态id",
        COALESCE(pe.remarks, ''::text) AS "备注",
        pe.audit_status AS "审计状态",
        pe.audit_timestamp AS "审计时间",
        pe.auditor_id AS "审计员id",
        pe.audit_notes AS "审计备注",
        pe.version AS "版本号",
        COALESCE(pe.calculated_at, pe.updated_at, now()) AS "计算时间",
        pe.updated_at AS "更新时间"
        
    FROM payroll.payroll_entries pe
        LEFT JOIN reports.v_employees_basic eb ON pe.employee_id = eb.id
        LEFT JOIN payroll.payroll_periods pp ON pe.payroll_period_id = pp.id
        LEFT JOIN payroll.payroll_runs pr ON pe.payroll_run_id = pr.id;
    """

def main():
    """主函数"""
    logger.info("=" * 60)
    logger.info("🏗️ 动态分层薪资视图生成器")
    logger.info("=" * 60)
    
    conn = get_db_connection()
    if not conn:
        logger.error("💥 无法连接数据库")
        sys.exit(1)
    
    # 验证数据库连接
    logger.info("🔍 验证数据库连接...")
    cursor_test = conn.cursor()
    cursor_test.execute("SELECT current_database(), current_user, version();")
    db_info = cursor_test.fetchone()
    logger.info(f"📊 连接信息: 数据库={db_info[0]}, 用户={db_info[1]}")
    cursor_test.close()
    
    try:
        cursor = conn.cursor()
        
        # 1. 获取薪资组件配置
        logger.info("📊 获取薪资组件配置...")
        components = get_payroll_components(cursor)
        if not components:
            logger.error("💥 无法获取薪资组件配置")
            sys.exit(1)
        
        # 2. 创建基础视图
        logger.info("🔨 创建基础信息视图...")
        cursor.execute(generate_basic_view_sql())
        logger.info("✅ v_payroll_basic 创建成功 (38个基础字段)")
        
        # 3. 导入分层视图生成器
        from create_earnings_view_generator import create_layered_views
        from create_earnings_view_generator_fixed import generate_calculations_view_sql_fixed
        
        # 4. 创建所有分层视图
        logger.info("🔨 创建分层明细视图...")
        if create_layered_views(cursor, components):
            logger.info("✅ 所有分层视图创建成功")
        else:
            logger.error("💥 分层视图创建失败")
            conn.rollback()
            sys.exit(1)
        
        # 5. 验证视图结构
        logger.info("🔍 验证视图结构...")
        verify_views(cursor)
        
        conn.commit()
        logger.info("🎉 动态分层薪资视图生成完成！")
        
        # 6. 输出使用建议
        print_usage_recommendations()
        
    except Exception as e:
        logger.error(f"💥 创建视图失败: {e}")
        conn.rollback()
        sys.exit(1)
        
    finally:
        cursor.close()
        conn.close()

def verify_views(cursor):
    """验证创建的视图"""
    views_to_check = [
        'v_payroll_basic',
        'v_payroll_earnings', 
        'v_payroll_deductions',
        'v_payroll_calculations',
        'v_comprehensive_employee_payroll'
    ]
    
    for view_name in views_to_check:
        cursor.execute(f"""
            SELECT COUNT(*) as column_count
            FROM information_schema.columns 
            WHERE table_schema = 'reports' 
                AND table_name = '{view_name}';
        """)
        
        column_count = cursor.fetchone()[0]
        if column_count > 0:
            logger.info(f"  ✅ {view_name}: {column_count} 个字段")
        else:
            logger.error(f"  ❌ {view_name}: 视图不存在或无字段")

def print_usage_recommendations():
    """输出使用建议"""
    logger.info("\n" + "=" * 60)
    logger.info("📖 使用建议")
    logger.info("=" * 60)
    logger.info("1. 列表页面查询 → 使用 v_payroll_basic (38字段，性能最佳)")
    logger.info("2. 应发明细查询 → 使用 v_payroll_earnings (动态字段)")
    logger.info("3. 扣除明细查询 → 使用 v_payroll_deductions (动态字段)")
    logger.info("4. 计算参数查询 → 使用 v_payroll_calculations (动态字段)")
    logger.info("5. 完整数据查询 → 使用 v_comprehensive_employee_payroll (所有字段)")
    logger.info("6. 前端可根据页面需求选择合适的视图，提高查询性能")
    logger.info("=" * 60)

if __name__ == "__main__":
    main() 