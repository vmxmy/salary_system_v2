#!/usr/bin/env python3
"""
💰 应发明细视图生成器

基于配置表动态生成应发明细视图，包含所有EARNING类型的薪资组件
"""

import psycopg2
import logging
from typing import List, Tuple

logger = logging.getLogger(__name__)

def generate_earnings_view_sql(components: List[Tuple]) -> str:
    """基于配置动态生成应发明细视图SQL - 优化版本"""
    
    # 生成动态字段，按计算方法分组
    earnings_fields = []
    basic_salary_fields = []
    allowance_fields = []
    bonus_fields = []
    
    for code, name, calculation_method in components:
        # 根据计算方法分类字段
        field_sql = f"""COALESCE(((pe.earnings_details -> '{code}'::text) ->> 'amount'::text)::numeric, 0.00) AS "{name}" """
        
        if calculation_method == 'BASIC_SALARY':
            basic_salary_fields.append(field_sql)
        elif 'ALLOWANCE' in code or 'SUBSIDY' in code:
            allowance_fields.append(field_sql)
        elif 'BONUS' in code or 'PERFORMANCE' in code:
            bonus_fields.append(field_sql)
        else:
            earnings_fields.append(field_sql)
    
    # 按分类组织字段顺序
    all_fields = basic_salary_fields + allowance_fields + bonus_fields + earnings_fields
    
    # 如果没有应发组件，添加默认字段
    if not all_fields:
        all_fields = ['0.00 AS "暂无应发项目"']
    
    # 组装完整SQL
    fields_sql = ',\n        '.join(all_fields)
    
    return f"""
    CREATE OR REPLACE VIEW reports.v_payroll_earnings AS
    SELECT 
        -- 关联主键
        pe.id AS "薪资条目id",
        pe.employee_id AS "员工id",
        
        -- 动态生成的应发字段
        {fields_sql},
        
        -- 应发汇总
        COALESCE(pe.gross_pay, 0.00) AS "应发合计",
        
        -- 原始JSONB数据（用于调试和扩展）
        pe.earnings_details AS "原始应发明细"
        
    FROM payroll.payroll_entries pe;
    """

def generate_deductions_view_sql(personal_components: List[Tuple], employer_components: List[Tuple]) -> str:
    """基于配置动态生成扣除明细视图SQL - 优化版本"""
    
    # 生成个人扣除字段（按类型分组）
    personal_social_fields = []  # 社保个人部分
    personal_tax_fields = []     # 税费个人部分
    personal_other_fields = []   # 其他个人扣除
    
    for code, name, calculation_method in personal_components:
        field_sql = f"""COALESCE(((pe.deductions_details -> '{code}'::text) ->> 'amount'::text)::numeric, 0.00) AS "{name}" """
        
        if any(keyword in code for keyword in ['PENSION', 'MEDICAL', 'HOUSING_FUND', 'UNEMPLOYMENT']):
            personal_social_fields.append(field_sql)
        elif 'TAX' in code:
            personal_tax_fields.append(field_sql)
        else:
            personal_other_fields.append(field_sql)
    
    # 生成单位扣除字段（按类型分组）
    employer_social_fields = []  # 社保单位部分
    employer_other_fields = []   # 其他单位扣除
    
    for code, name, calculation_method in employer_components:
        field_sql = f"""COALESCE(((pe.deductions_details -> '{code}'::text) ->> 'amount'::text)::numeric, 0.00) AS "{name}" """
        
        if any(keyword in code for keyword in ['PENSION', 'MEDICAL', 'HOUSING_FUND', 'UNEMPLOYMENT', 'INJURY']):
            employer_social_fields.append(field_sql)
        else:
            employer_other_fields.append(field_sql)
    
    # 按逻辑顺序组装字段：个人社保 -> 个人税费 -> 个人其他 -> 单位社保 -> 单位其他
    all_fields = (personal_social_fields + personal_tax_fields + personal_other_fields + 
                  employer_social_fields + employer_other_fields)
    
    if not all_fields:
        all_fields = ['0.00 AS "暂无扣除项目"']
    
    fields_sql = ',\n        '.join(all_fields)
    
    return f"""
    CREATE OR REPLACE VIEW reports.v_payroll_deductions AS
    SELECT 
        -- 关联主键
        pe.id AS "薪资条目id",
        pe.employee_id AS "员工id",
        
        -- 动态生成的扣除字段
        {fields_sql},
        
        -- 扣除汇总
        COALESCE(pe.total_deductions, 0.00) AS "扣除合计",
        
        -- 原始JSONB数据
        pe.deductions_details AS "原始扣除明细"
        
    FROM payroll.payroll_entries pe;
    """

def generate_calculations_view_sql(base_components: List[Tuple], rate_components: List[Tuple], result_components: List[Tuple]) -> str:
    """基于配置动态生成计算参数视图SQL - 集成社保配置表"""
    
    # 生成基数字段（从JSONB）
    base_fields = []
    for code, name, calculation_method in base_components:
        field_sql = f"""COALESCE(((pe.calculation_inputs -> '{code}'::text) ->> 'amount'::text)::numeric, 0.00) AS "{name}" """
        base_fields.append(field_sql)
    
    # 生成社保费率字段（从配置表，根据人员类别匹配）
    social_rate_fields = [
        # 个人费率 - 根据员工的人员类别ID匹配对应的费率配置
        """COALESCE((
            SELECT sic.employee_rate 
            FROM payroll.social_insurance_configs sic
            JOIN reports.v_employees_basic eb ON pe.employee_id = eb.id
            WHERE sic.insurance_type = 'PENSION' 
                AND sic.is_active = true
                AND (sic.applicable_personnel_categories IS NULL 
                     OR sic.applicable_personnel_categories = '[]'::json
                     OR eb.personnel_category_id::text = ANY(
                         SELECT jsonb_array_elements_text(sic.applicable_personnel_categories::jsonb)
                     ))
            ORDER BY sic.id
            LIMIT 1
        ), 0.00) AS "养老保险个人费率" """,
        
        """COALESCE((
            SELECT sic.employee_rate 
            FROM payroll.social_insurance_configs sic
            JOIN reports.v_employees_basic eb ON pe.employee_id = eb.id
            WHERE sic.insurance_type = 'MEDICAL' 
                AND sic.is_active = true
                AND (sic.applicable_personnel_categories IS NULL 
                     OR sic.applicable_personnel_categories = '[]'::json
                     OR eb.personnel_category_id::text = ANY(
                         SELECT jsonb_array_elements_text(sic.applicable_personnel_categories::jsonb)
                     ))
            ORDER BY sic.id
            LIMIT 1
        ), 0.00) AS "医疗保险个人费率" """,
        
        """COALESCE((
            SELECT sic.employee_rate 
            FROM payroll.social_insurance_configs sic
            JOIN reports.v_employees_basic eb ON pe.employee_id = eb.id
            WHERE sic.insurance_type = 'UNEMPLOYMENT' 
                AND sic.is_active = true
                AND (sic.applicable_personnel_categories IS NULL 
                     OR sic.applicable_personnel_categories = '[]'::json
                     OR eb.personnel_category_id::text = ANY(
                         SELECT jsonb_array_elements_text(sic.applicable_personnel_categories::jsonb)
                     ))
            ORDER BY sic.id
            LIMIT 1
        ), 0.00) AS "失业保险个人费率" """,
        
        """COALESCE((
            SELECT sic.employee_rate 
            FROM payroll.social_insurance_configs sic
            JOIN reports.v_employees_basic eb ON pe.employee_id = eb.id
            WHERE sic.insurance_type = 'HOUSING_FUND' 
                AND sic.is_active = true
                AND (sic.applicable_personnel_categories IS NULL 
                     OR sic.applicable_personnel_categories = '[]'::json
                     OR eb.personnel_category_id::text = ANY(
                         SELECT jsonb_array_elements_text(sic.applicable_personnel_categories::jsonb)
                     ))
            ORDER BY sic.id
            LIMIT 1
        ), 0.00) AS "住房公积金个人费率" """,
        
        """COALESCE((
            SELECT sic.employee_rate 
            FROM payroll.social_insurance_configs sic
            JOIN reports.v_employees_basic eb ON pe.employee_id = eb.id
            WHERE sic.insurance_type = 'OCCUPATIONAL_PENSION' 
                AND sic.is_active = true
                AND (sic.applicable_personnel_categories IS NULL 
                     OR sic.applicable_personnel_categories = '[]'::json
                     OR eb.personnel_category_id::text = ANY(
                         SELECT jsonb_array_elements_text(sic.applicable_personnel_categories::jsonb)
                     ))
            ORDER BY sic.id
            LIMIT 1
        ), 0.00) AS "职业年金个人费率" """
    ]
    
    # 生成单位费率字段
    employer_rate_fields = [
        """COALESCE((
            SELECT sic.employer_rate 
            FROM payroll.social_insurance_configs sic
            JOIN reports.v_employees_basic eb ON pe.employee_id = eb.id
            WHERE sic.insurance_type = 'PENSION' 
                AND sic.is_active = true
                AND (sic.applicable_personnel_categories IS NULL 
                     OR sic.applicable_personnel_categories = '[]'::json
                     OR eb.personnel_category_id::text = ANY(
                         SELECT jsonb_array_elements_text(sic.applicable_personnel_categories::jsonb)
                     ))
            ORDER BY sic.id
            LIMIT 1
        ), 0.00) AS "养老保险单位费率" """,
        
        """COALESCE((
            SELECT sic.employer_rate 
            FROM payroll.social_insurance_configs sic
            JOIN reports.v_employees_basic eb ON pe.employee_id = eb.id
            WHERE sic.insurance_type = 'MEDICAL' 
                AND sic.is_active = true
                AND (sic.applicable_personnel_categories IS NULL 
                     OR sic.applicable_personnel_categories = '[]'::json
                     OR eb.personnel_category_id::text = ANY(
                         SELECT jsonb_array_elements_text(sic.applicable_personnel_categories::jsonb)
                     ))
            ORDER BY sic.id
            LIMIT 1
        ), 0.00) AS "医疗保险单位费率" """,
        
        """COALESCE((
            SELECT sic.employer_rate 
            FROM payroll.social_insurance_configs sic
            JOIN reports.v_employees_basic eb ON pe.employee_id = eb.id
            WHERE sic.insurance_type = 'UNEMPLOYMENT' 
                AND sic.is_active = true
                AND (sic.applicable_personnel_categories IS NULL 
                     OR sic.applicable_personnel_categories = '[]'::json
                     OR eb.personnel_category_id::text = ANY(
                         SELECT jsonb_array_elements_text(sic.applicable_personnel_categories::jsonb)
                     ))
            ORDER BY sic.id
            LIMIT 1
        ), 0.00) AS "失业保险单位费率" """,
        
        """COALESCE((
            SELECT sic.employer_rate 
            FROM payroll.social_insurance_configs sic
            JOIN reports.v_employees_basic eb ON pe.employee_id = eb.id
            WHERE sic.insurance_type = 'HOUSING_FUND' 
                AND sic.is_active = true
                AND (sic.applicable_personnel_categories IS NULL 
                     OR sic.applicable_personnel_categories = '[]'::json
                     OR eb.personnel_category_id::text = ANY(
                         SELECT jsonb_array_elements_text(sic.applicable_personnel_categories::jsonb)
                     ))
            ORDER BY sic.id
            LIMIT 1
        ), 0.00) AS "住房公积金单位费率" """,
        
        """COALESCE((
            SELECT sic.employer_rate 
            FROM payroll.social_insurance_configs sic
            JOIN reports.v_employees_basic eb ON pe.employee_id = eb.id
            WHERE sic.insurance_type = 'OCCUPATIONAL_PENSION' 
                AND sic.is_active = true
                AND (sic.applicable_personnel_categories IS NULL 
                     OR sic.applicable_personnel_categories = '[]'::json
                     OR eb.personnel_category_id::text = ANY(
                         SELECT jsonb_array_elements_text(sic.applicable_personnel_categories::jsonb)
                     ))
            ORDER BY sic.id
            LIMIT 1
        ), 0.00) AS "职业年金单位费率" """,
        
        """COALESCE((
            SELECT sic.employer_rate 
            FROM payroll.social_insurance_configs sic
            JOIN reports.v_employees_basic eb ON pe.employee_id = eb.id
            WHERE sic.insurance_type = 'INJURY' 
                AND sic.is_active = true
                AND (sic.applicable_personnel_categories IS NULL 
                     OR sic.applicable_personnel_categories = '[]'::json
                     OR eb.personnel_category_id::text = ANY(
                         SELECT jsonb_array_elements_text(sic.applicable_personnel_categories::jsonb)
                     ))
            ORDER BY sic.id
            LIMIT 1
        ), 0.00) AS "工伤保险单位费率" """,
        
        """COALESCE((
            SELECT sic.employer_rate 
            FROM payroll.social_insurance_configs sic
            JOIN reports.v_employees_basic eb ON pe.employee_id = eb.id
            WHERE sic.insurance_type = 'SERIOUS_ILLNESS' 
                AND sic.is_active = true
                AND (sic.applicable_personnel_categories IS NULL 
                     OR sic.applicable_personnel_categories = '[]'::json
                     OR eb.personnel_category_id::text = ANY(
                         SELECT jsonb_array_elements_text(sic.applicable_personnel_categories::jsonb)
                     ))
            ORDER BY sic.id
            LIMIT 1
        ), 0.00) AS "大病保险单位费率" """
    ]
    
    # 生成其他费率字段（从JSONB）
    other_rate_fields = []
    for code, name, calculation_method in rate_components:
        if not any(keyword in code for keyword in ['PENSION', 'MEDICAL', 'UNEMPLOYMENT', 'HOUSING_FUND', 'INJURY', 'SERIOUS_ILLNESS']):
            field_sql = f"""COALESCE(((pe.calculation_inputs -> '{code}'::text) ->> 'amount'::text)::numeric, 0.00) AS "{name}" """
            other_rate_fields.append(field_sql)
    
    # 生成结果字段（从JSONB）
    result_fields = []
    for code, name, calculation_method in result_components:
        field_sql = f"""COALESCE(((pe.calculation_inputs -> '{code}'::text) ->> 'amount'::text)::numeric, 0.00) AS "{name}" """
        result_fields.append(field_sql)
    
    # 组装字段：基数 -> 个人社保费率 -> 单位社保费率 -> 其他费率 -> 结果
    all_fields = base_fields + social_rate_fields + employer_rate_fields + other_rate_fields + result_fields
    if not all_fields:
        all_fields = ['0.00 AS "暂无计算参数"']
    
    fields_sql = ',\n        '.join(all_fields)
    
    return f"""
    CREATE OR REPLACE VIEW reports.v_payroll_calculations AS
    SELECT 
        -- 关联主键
        pe.id AS "薪资条目id",
        pe.employee_id AS "员工id",
        
        -- 动态生成的计算字段
        {fields_sql},
        
        -- 原始JSONB数据
        pe.calculation_inputs AS "原始计算输入",
        pe.calculation_log AS "原始计算日志"
        
    FROM payroll.payroll_entries pe;
    """

def generate_comprehensive_view_sql() -> str:
    """生成综合视图SQL - JOIN所有分层视图，避免字段冲突"""
    return """
    CREATE OR REPLACE VIEW reports.v_comprehensive_employee_payroll AS
    SELECT 
        -- 从基础视图获取所有基础信息
        pb."薪资条目id",
        pb."员工id",
        pb."薪资期间id",
        pb."薪资运行id",
        pb."员工编号",
        pb."姓名",
        pb."部门名称",
        pb."职位名称",
        pb."人员类别",
        pb."薪资期间名称",
        pb."应发合计",
        pb."扣除合计",
        pb."实发合计",
        pb."更新时间",
        
        -- 从应发视图获取原始JSONB数据
        pe."原始应发明细",
        
        -- 从扣除视图获取原始JSONB数据
        pd."原始扣除明细",
        
        -- 从计算视图获取原始JSONB数据
        pc."原始计算输入",
        pc."原始计算日志"
        
    FROM reports.v_payroll_basic pb
        LEFT JOIN reports.v_payroll_earnings pe ON pb."薪资条目id" = pe."薪资条目id"
        LEFT JOIN reports.v_payroll_deductions pd ON pb."薪资条目id" = pd."薪资条目id"  
        LEFT JOIN reports.v_payroll_calculations pc ON pb."薪资条目id" = pc."薪资条目id";
    """

def create_layered_views(cursor, components):
    """创建所有分层视图"""
    try:
        # 0. 先删除现有视图（按依赖顺序）
        logger.info("🗑️ 删除现有视图...")
        drop_views_sql = """
        DROP VIEW IF EXISTS reports.v_comprehensive_employee_payroll CASCADE;
        DROP VIEW IF EXISTS reports.v_payroll_calculations CASCADE;
        DROP VIEW IF EXISTS reports.v_payroll_deductions CASCADE;
        DROP VIEW IF EXISTS reports.v_payroll_earnings CASCADE;
        """
        cursor.execute(drop_views_sql)
        logger.info("✅ 现有视图已删除")
        
        # 1. 创建应发明细视图
        logger.info("🔨 创建应发明细视图...")
        earnings_sql = generate_earnings_view_sql(components.get('EARNING', []))
        cursor.execute(earnings_sql)
        logger.info(f"✅ v_payroll_earnings 创建成功 ({len(components.get('EARNING', []))} 个字段)")
        
        # 2. 创建扣除明细视图
        logger.info("🔨 创建扣除明细视图...")
        personal_deductions = components.get('PERSONAL_DEDUCTION', []) + components.get('DEDUCTION', [])
        employer_deductions = components.get('EMPLOYER_DEDUCTION', [])
        deductions_sql = generate_deductions_view_sql(personal_deductions, employer_deductions)
        cursor.execute(deductions_sql)
        logger.info(f"✅ v_payroll_deductions 创建成功 ({len(personal_deductions + employer_deductions)} 个字段)")
        
        # 3. 创建计算参数视图
        logger.info("🔨 创建计算参数视图...")
        # 导入修复版本的函数
        from create_earnings_view_generator_fixed import generate_calculations_view_sql_fixed
        calculations_sql = generate_calculations_view_sql_fixed(
            components.get('CALCULATION_BASE', []),
            components.get('CALCULATION_RATE', []),
            components.get('CALCULATION_RESULT', [])
        )
        cursor.execute(calculations_sql)
        calc_count = len(components.get('CALCULATION_BASE', []) + 
                        components.get('CALCULATION_RATE', []) + 
                        components.get('CALCULATION_RESULT', []))
        logger.info(f"✅ v_payroll_calculations 创建成功 ({calc_count} 个字段)")
        
        # 4. 创建综合视图
        logger.info("🔨 创建综合视图...")
        comprehensive_sql = generate_comprehensive_view_sql()
        cursor.execute(comprehensive_sql)
        logger.info("✅ v_comprehensive_employee_payroll 创建成功")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ 创建分层视图失败: {e}")
        return False 