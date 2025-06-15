#!/usr/bin/env python3
"""
🏗️ 动态分层薪资视图生成器 + 员工信息视图扩充器

基于配置表动态生成分层薪资视图，解决157字段过多的问题
同时扩充v_employees_basic视图，包含所有员工信息字段和银行账号信息

分层策略：
1. v_employees_basic - 扩充的员工基础信息视图 (包含银行账号等完整信息)
2. v_payroll_basic - 基础信息视图 (员工信息 + 汇总数据)
3. v_payroll_earnings - 应发明细视图 (基于EARNING类型组件)
4. v_payroll_deductions - 扣除明细视图 (基于DEDUCTION类型组件)
5. v_payroll_calculations - 计算参数视图 (基于计算输入)
6. v_comprehensive_employee_payroll - 综合视图 (JOIN所有分层)

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

def generate_enhanced_employees_basic_view_sql() -> str:
    """生成扩充的员工基础信息视图SQL - 包含所有字段和银行账号信息"""
    return """
    CREATE OR REPLACE VIEW reports.v_employees_basic AS
    WITH personnel_hierarchy AS (
        -- 递归CTE获取人员身份的顶级分类
        WITH RECURSIVE category_tree AS (
            -- 基础查询：顶级分类
            SELECT 
                id,
                name,
                parent_category_id,
                0 as level,
                id as root_id,
                name as root_name
            FROM hr.personnel_categories 
            WHERE parent_category_id IS NULL
            
            UNION ALL
            
            -- 递归查询：子分类
            SELECT 
                pc.id,
                pc.name,
                pc.parent_category_id,
                ct.level + 1,
                ct.root_id,
                ct.root_name
            FROM hr.personnel_categories pc
            JOIN category_tree ct ON pc.parent_category_id = ct.id
        )
        SELECT 
            id,
            name,
            root_id,
            root_name
        FROM category_tree
    ),
    primary_bank_account AS (
        -- 获取每个员工的主要银行账号
        SELECT DISTINCT ON (employee_id)
            employee_id,
            bank_name,
            account_holder_name,
            account_number,
            branch_name,
            bank_code,
            lv_account_type.name as account_type_name
        FROM hr.employee_bank_accounts eba
            LEFT JOIN config.lookup_values lv_account_type ON eba.account_type_lookup_value_id = lv_account_type.id
        WHERE eba.is_primary = true
        ORDER BY employee_id, eba.created_at DESC
    )
    SELECT 
        -- 🆔 基础标识信息
        e.id,
        e.employee_code,
        e.first_name,
        e.last_name,
        COALESCE(e.last_name, '')::text || COALESCE(e.first_name, '')::text AS full_name,
        
        -- 📱 联系信息
        e.phone_number,
        e.email,
        e.home_address,
        e.emergency_contact_name,
        e.emergency_contact_phone,
        
        -- 🏢 组织架构信息
        d.name AS department_name,
        p.name AS position_name,
        pc.name AS personnel_category_name,
        ph.root_name AS root_personnel_category_name,
        e.department_id,
        e.actual_position_id,
        e.personnel_category_id,
        
        -- 👤 个人基本信息
        e.date_of_birth,
        lv_gender.name AS gender,
        e.id_number,
        e.nationality,
        e.ethnicity,
        lv_marital.name AS marital_status,
        lv_education.name AS education_level,
        lv_political.name AS political_status,
        
        -- 💼 就业信息
        e.hire_date,
        e.first_work_date,
        e.current_position_start_date,
        e.career_position_level_date,
        e.interrupted_service_years,
        lv_status.name AS employee_status,
        lv_employment.name AS employment_type,
        lv_contract.name AS contract_type,
        
        -- 💰 薪资等级信息
        lv_salary_level.name AS salary_level,
        lv_salary_grade.name AS salary_grade,
        lv_ref_salary_level.name AS ref_salary_level,
        lv_job_level.name AS job_position_level,
        
        -- 🏦 社保公积金信息
        e.social_security_client_number,
        e.housing_fund_client_number,
        
        -- 🏧 银行账号信息
        pba.bank_name AS primary_bank_name,
        pba.account_holder_name AS primary_account_holder_name,
        pba.account_number AS primary_account_number,
        pba.branch_name AS primary_branch_name,
        pba.bank_code AS primary_bank_code,
        pba.account_type_name AS primary_account_type,
        
        -- ⏰ 系统信息
        e.is_active,
        e.created_at,
        e.updated_at,
        
        -- 🔗 外键ID字段（用于关联查询）
        e.gender_lookup_value_id,
        e.status_lookup_value_id,
        e.employment_type_lookup_value_id,
        e.education_level_lookup_value_id,
        e.marital_status_lookup_value_id,
        e.political_status_lookup_value_id,
        e.contract_type_lookup_value_id,
        e.salary_level_lookup_value_id,
        e.salary_grade_lookup_value_id,
        e.ref_salary_level_lookup_value_id,
        e.job_position_level_lookup_value_id
        
    FROM hr.employees e
        -- 组织架构关联
        LEFT JOIN hr.departments d ON e.department_id = d.id
        LEFT JOIN hr.positions p ON e.actual_position_id = p.id
        LEFT JOIN hr.personnel_categories pc ON e.personnel_category_id = pc.id
        LEFT JOIN personnel_hierarchy ph ON pc.id = ph.id
        
        -- 查找值关联
        LEFT JOIN config.lookup_values lv_gender ON e.gender_lookup_value_id = lv_gender.id
        LEFT JOIN config.lookup_values lv_status ON e.status_lookup_value_id = lv_status.id
        LEFT JOIN config.lookup_values lv_employment ON e.employment_type_lookup_value_id = lv_employment.id
        LEFT JOIN config.lookup_values lv_education ON e.education_level_lookup_value_id = lv_education.id
        LEFT JOIN config.lookup_values lv_marital ON e.marital_status_lookup_value_id = lv_marital.id
        LEFT JOIN config.lookup_values lv_political ON e.political_status_lookup_value_id = lv_political.id
        LEFT JOIN config.lookup_values lv_contract ON e.contract_type_lookup_value_id = lv_contract.id
        LEFT JOIN config.lookup_values lv_salary_level ON e.salary_level_lookup_value_id = lv_salary_level.id
        LEFT JOIN config.lookup_values lv_salary_grade ON e.salary_grade_lookup_value_id = lv_salary_grade.id
        LEFT JOIN config.lookup_values lv_ref_salary_level ON e.ref_salary_level_lookup_value_id = lv_ref_salary_level.id
        LEFT JOIN config.lookup_values lv_job_level ON e.job_position_level_lookup_value_id = lv_job_level.id
        
        -- 银行账号关联
        LEFT JOIN primary_bank_account pba ON e.id = pba.employee_id;
    """

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
        
        # 2. 创建扩充的员工基础信息视图（必须先创建，因为其他视图依赖它）
        logger.info("🔨 创建扩充的员工基础信息视图...")
        # 先删除现有视图以避免列名冲突
        cursor.execute("DROP VIEW IF EXISTS reports.v_employees_basic CASCADE;")
        logger.info("🗑️ 已删除现有的 v_employees_basic 视图")
        cursor.execute(generate_enhanced_employees_basic_view_sql())
        logger.info("✅ v_employees_basic 创建成功 (包含所有字段和银行账号信息)")
        
        # 3. 创建基础薪资视图（依赖于 v_employees_basic）
        logger.info("🔨 创建基础薪资信息视图...")
        cursor.execute(generate_basic_view_sql())
        logger.info("✅ v_payroll_basic 创建成功 (38个基础字段)")
        
        # 4. 尝试创建分层视图（如果模块存在）
        try:
            logger.info("🔨 尝试创建分层明细视图...")
            from create_earnings_view_generator import create_layered_views
            if create_layered_views(cursor, components):
                logger.info("✅ 所有分层视图创建成功")
            else:
                logger.warning("⚠️ 分层视图创建失败，但核心视图已创建成功")
        except ImportError:
            logger.warning("⚠️ 分层视图生成器模块不存在，跳过分层视图创建")
        except Exception as e:
            logger.warning(f"⚠️ 分层视图创建失败: {e}，但核心视图已创建成功")
        
        # 6. 验证视图结构
        logger.info("🔍 验证视图结构...")
        verify_views(cursor)
        
        conn.commit()
        logger.info("🎉 动态分层薪资视图生成完成！")
        
        # 7. 输出使用建议
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
    # 核心视图（必须存在）
    core_views = [
        'v_employees_basic',
        'v_payroll_basic'
    ]
    
    # 可选视图（可能不存在）
    optional_views = [
        'v_payroll_earnings', 
        'v_payroll_deductions',
        'v_payroll_calculations',
        'v_comprehensive_employee_payroll'
    ]
    
    logger.info("📊 核心视图验证:")
    for view_name in core_views:
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
    
    logger.info("📊 可选视图验证:")
    for view_name in optional_views:
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
            logger.info(f"  ⚪ {view_name}: 视图不存在（可选）")

def print_usage_recommendations():
    """输出使用image.png建 是 thescreenshot
    e"""
    logger.info("\n" + "=" * 60)
    logger.info("📖 使用建议")
    logger.info("=" * 60)
    logger.info("1. 员工信息查询 → 使用 v_employees_basic (包含所有员工字段+银行账号)")
    logger.info("2. 列表页面查询 → 使用 v_payroll_basic (38字段，性能最佳)")
    logger.info("3. 应发明细查询 → 使用 v_payroll_earnings (动态字段)")
    logger.info("4. 扣除明细查询 → 使用 v_payroll_deductions (动态字段)")
    logger.info("5. 计算参数查询 → 使用 v_payroll_calculations (动态字段)")
    logger.info("6. 完整数据查询 → 使用 v_comprehensive_employee_payroll (所有字段)")
    logger.info("7. 前端可根据页面需求选择合适的视图，提高查询性能")
    logger.info("=" * 60)

if __name__ == "__main__":
    main() 