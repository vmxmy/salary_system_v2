#!/usr/bin/env python3
"""
💰 应发明细视图生成器 - 修复版本

基于配置表动态生成应发明细视图，包含所有EARNING类型的薪资组件
修复了JSON数组比较的语法问题
"""

import psycopg2
import logging
from typing import List, Tuple

logger = logging.getLogger(__name__)

def generate_calculations_view_sql_fixed(base_components: List[Tuple], rate_components: List[Tuple], result_components: List[Tuple]) -> str:
    """基于配置动态生成计算参数视图SQL - 修复JSON比较问题"""
    
    # 生成基数字段（从employee_salary_configs表）
    base_fields = [
        # 社保缴费基数
        """COALESCE((
            SELECT esc.social_insurance_base 
            FROM payroll.employee_salary_configs esc
            WHERE esc.employee_id = pe.employee_id 
                AND (esc.is_active = true OR esc.is_active IS NULL)
                AND esc.effective_date <= COALESCE(pp.end_date, CURRENT_DATE)
                AND (esc.end_date IS NULL OR esc.end_date >= COALESCE(pp.start_date, CURRENT_DATE))
            ORDER BY esc.effective_date DESC
            LIMIT 1
        ), 0.00) AS "社保缴费基数" """,
        
        # 住房公积金缴费基数
        """COALESCE((
            SELECT esc.housing_fund_base 
            FROM payroll.employee_salary_configs esc
            WHERE esc.employee_id = pe.employee_id 
                AND (esc.is_active = true OR esc.is_active IS NULL)
                AND esc.effective_date <= COALESCE(pp.end_date, CURRENT_DATE)
                AND (esc.end_date IS NULL OR esc.end_date >= COALESCE(pp.start_date, CURRENT_DATE))
            ORDER BY esc.effective_date DESC
            LIMIT 1
        ), 0.00) AS "住房公积金缴费基数" """,
        
        # 基本工资
        """COALESCE((
            SELECT esc.basic_salary 
            FROM payroll.employee_salary_configs esc
            WHERE esc.employee_id = pe.employee_id 
                AND (esc.is_active = true OR esc.is_active IS NULL)
                AND esc.effective_date <= COALESCE(pp.end_date, CURRENT_DATE)
                AND (esc.end_date IS NULL OR esc.end_date >= COALESCE(pp.start_date, CURRENT_DATE))
            ORDER BY esc.effective_date DESC
            LIMIT 1
        ), 0.00) AS "基本工资" """
    ]
    
    # 其他基数字段（从JSONB，排除已处理的社保和公积金基数）
    for code, name, calculation_method in base_components:
        if not any(keyword in code.upper() for keyword in ['SOCIAL_INSURANCE_BASE', 'HOUSING_FUND_BASE', 'BASIC_SALARY']):
            field_sql = f"""COALESCE(((pe.calculation_inputs -> '{code}'::text) ->> 'amount'::text)::numeric, 0.00) AS "{name}" """
            base_fields.append(field_sql)
    
    # 生成社保费率字段（从配置表，根据人员类别匹配）- 修复版本
    social_rate_fields = [
        # 个人费率
        """COALESCE((
            SELECT sic.employee_rate 
            FROM payroll.social_insurance_configs sic
            JOIN reports.v_employees_basic eb ON pe.employee_id = eb.id
            WHERE sic.insurance_type = 'PENSION' 
                AND sic.is_active = true
                AND (sic.applicable_personnel_categories IS NULL 
                     OR jsonb_array_length(sic.applicable_personnel_categories::jsonb) = 0
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
                     OR jsonb_array_length(sic.applicable_personnel_categories::jsonb) = 0
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
            WHERE sic.insurance_type = 'HOUSING_FUND' 
                AND sic.is_active = true
                AND (sic.applicable_personnel_categories IS NULL 
                     OR jsonb_array_length(sic.applicable_personnel_categories::jsonb) = 0
                     OR eb.personnel_category_id::text = ANY(
                         SELECT jsonb_array_elements_text(sic.applicable_personnel_categories::jsonb)
                     ))
            ORDER BY sic.id
            LIMIT 1
        ), 0.00) AS "住房公积金个人费率" """
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
                     OR jsonb_array_length(sic.applicable_personnel_categories::jsonb) = 0
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
                     OR jsonb_array_length(sic.applicable_personnel_categories::jsonb) = 0
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
            WHERE sic.insurance_type = 'HOUSING_FUND' 
                AND sic.is_active = true
                AND (sic.applicable_personnel_categories IS NULL 
                     OR jsonb_array_length(sic.applicable_personnel_categories::jsonb) = 0
                     OR eb.personnel_category_id::text = ANY(
                         SELECT jsonb_array_elements_text(sic.applicable_personnel_categories::jsonb)
                     ))
            ORDER BY sic.id
            LIMIT 1
        ), 0.00) AS "住房公积金单位费率" """
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
        
    FROM payroll.payroll_entries pe
        LEFT JOIN payroll.payroll_periods pp ON pe.payroll_period_id = pp.id;
    """ 