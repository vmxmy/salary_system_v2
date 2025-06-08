#!/usr/bin/env python3
"""
初始化报表类型定义数据
将现有硬编码的报表类型迁移到数据库配置表中
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from sqlalchemy.orm import Session
from webapp.v2.database import get_db_v2
from datetime import datetime

def init_report_type_definitions():
    """初始化报表类型定义数据"""
    
    # 获取数据库连接
    db = next(get_db_v2())
    
    try:
        # 定义初始报表类型数据
        report_types = [
            {
                'code': 'payroll_summary',
                'name': '薪资汇总表',
                'description': '员工薪资汇总信息，包含基本薪资、津贴、扣除项等',
                'category': 'payroll',
                'generator_class': 'PayrollSummaryGenerator',
                'generator_module': 'webapp.v2.services.report_generators.payroll_summary',
                'template_config': {
                    'title': '薪资汇总表',
                    'subtitle': '{{period_name}} 薪资汇总',
                    'columns': ['employee_code', 'name', 'department', 'gross_pay', 'total_deductions', 'net_pay'],
                    'summary_fields': ['gross_pay', 'total_deductions', 'net_pay'],
                    'group_by': ['department_name']
                },
                'default_config': {
                    'export_format': 'xlsx',
                    'include_summary': True,
                    'include_charts': False,
                    'decimal_places': 2
                },
                'required_permissions': ['payroll:view', 'report:generate'],
                'allowed_roles': ['ADMIN', 'HR_MANAGER', 'FINANCE_MANAGER'],
                'is_active': True,
                'is_system': True,
                'sort_order': 1
            },
            {
                'code': 'payroll_detail',
                'name': '薪资明细表',
                'description': '员工薪资详细信息，包含所有薪资组件明细',
                'category': 'payroll',
                'generator_class': 'PayrollDetailGenerator',
                'generator_module': 'webapp.v2.services.report_generators.payroll_detail',
                'template_config': {
                    'title': '薪资明细表',
                    'subtitle': '{{period_name}} 薪资明细',
                    'include_all_components': True,
                    'show_zero_values': False,
                    'group_by_department': True
                },
                'default_config': {
                    'export_format': 'xlsx',
                    'include_formulas': True,
                    'freeze_header': True,
                    'auto_filter': True
                },
                'required_permissions': ['payroll:view_detail', 'report:generate'],
                'allowed_roles': ['ADMIN', 'HR_MANAGER', 'FINANCE_MANAGER'],
                'is_active': True,
                'is_system': True,
                'sort_order': 2
            },
            {
                'code': 'department_summary',
                'name': '部门薪资汇总',
                'description': '按部门汇总的薪资信息',
                'category': 'department',
                'generator_class': 'DepartmentSummaryGenerator',
                'generator_module': 'webapp.v2.services.report_generators.department_summary',
                'template_config': {
                    'title': '部门薪资汇总表',
                    'subtitle': '{{period_name}} 部门薪资汇总',
                    'group_by': 'department',
                    'summary_fields': ['employee_count', 'total_gross_pay', 'total_deductions', 'total_net_pay'],
                    'include_charts': True
                },
                'default_config': {
                    'export_format': 'xlsx',
                    'include_charts': True,
                    'chart_type': 'column',
                    'show_percentages': True
                },
                'required_permissions': ['payroll:view', 'department:view', 'report:generate'],
                'allowed_roles': ['ADMIN', 'HR_MANAGER', 'FINANCE_MANAGER', 'DEPARTMENT_MANAGER'],
                'is_active': True,
                'is_system': True,
                'sort_order': 3
            },
            {
                'code': 'tax_declaration',
                'name': '个税申报表',
                'description': '个人所得税申报信息',
                'category': 'tax',
                'generator_class': 'TaxDeclarationGenerator',
                'generator_module': 'webapp.v2.services.report_generators.tax_declaration',
                'template_config': {
                    'title': '个人所得税申报表',
                    'subtitle': '{{period_name}} 个税申报',
                    'tax_fields': ['taxable_income', 'tax_rate', 'personal_income_tax'],
                    'format': 'government_standard'
                },
                'default_config': {
                    'export_format': 'xlsx',
                    'government_format': True,
                    'include_validation': True,
                    'decimal_places': 2
                },
                'required_permissions': ['tax:view', 'report:generate'],
                'allowed_roles': ['ADMIN', 'FINANCE_MANAGER'],
                'is_active': False,  # 暂未实现
                'is_system': True,
                'sort_order': 4
            },
            {
                'code': 'social_security',
                'name': '社保缴费表',
                'description': '社会保险缴费信息',
                'category': 'insurance',
                'generator_class': 'SocialSecurityGenerator',
                'generator_module': 'webapp.v2.services.report_generators.social_security',
                'template_config': {
                    'title': '社会保险缴费表',
                    'subtitle': '{{period_name}} 社保缴费',
                    'insurance_types': ['pension', 'medical', 'unemployment', 'injury', 'housing_fund'],
                    'split_employer_employee': True
                },
                'default_config': {
                    'export_format': 'xlsx',
                    'include_totals': True,
                    'split_by_type': True,
                    'decimal_places': 2
                },
                'required_permissions': ['insurance:view', 'report:generate'],
                'allowed_roles': ['ADMIN', 'HR_MANAGER', 'FINANCE_MANAGER'],
                'is_active': False,  # 暂未实现
                'is_system': True,
                'sort_order': 5
            },
            {
                'code': 'attendance_summary',
                'name': '考勤汇总表',
                'description': '员工考勤汇总信息',
                'category': 'attendance',
                'generator_class': 'AttendanceSummaryGenerator',
                'generator_module': 'webapp.v2.services.report_generators.attendance_summary',
                'template_config': {
                    'title': '考勤汇总表',
                    'subtitle': '{{period_name}} 考勤汇总',
                    'attendance_fields': ['work_days', 'absent_days', 'overtime_hours'],
                    'include_statistics': True
                },
                'default_config': {
                    'export_format': 'xlsx',
                    'include_charts': False,
                    'show_details': True,
                    'decimal_places': 1
                },
                'required_permissions': ['attendance:view', 'report:generate'],
                'allowed_roles': ['ADMIN', 'HR_MANAGER'],
                'is_active': True,
                'is_system': True,
                'sort_order': 6
            }
        ]
        
        # 插入报表类型定义数据
        for report_type in report_types:
            # 检查是否已存在
            existing = db.execute(
                "SELECT id FROM reports.report_type_definitions WHERE code = %s",
                (report_type['code'],)
            ).fetchone()
            
            if not existing:
                # 插入新记录
                db.execute("""
                    INSERT INTO reports.report_type_definitions (
                        code, name, description, category, generator_class, generator_module,
                        template_config, default_config, required_permissions, allowed_roles,
                        is_active, is_system, sort_order, usage_count, created_at, updated_at
                    ) VALUES (
                        %(code)s, %(name)s, %(description)s, %(category)s, %(generator_class)s, %(generator_module)s,
                        %(template_config)s, %(default_config)s, %(required_permissions)s, %(allowed_roles)s,
                        %(is_active)s, %(is_system)s, %(sort_order)s, 0, NOW(), NOW()
                    )
                """, report_type)
                print(f"✅ 已插入报表类型: {report_type['name']} ({report_type['code']})")
            else:
                print(f"⚠️ 报表类型已存在: {report_type['name']} ({report_type['code']})")
        
        # 初始化预设配置
        presets = [
            {
                'name': '完整月度报表',
                'description': '包含所有类型的月度报表',
                'category': 'monthly',
                'report_types': ['payroll_summary', 'payroll_detail', 'department_summary', 'attendance_summary'],
                'default_config': {
                    'export_format': 'xlsx',
                    'include_archive': True,
                    'auto_cleanup_hours': 24
                },
                'filter_config': {
                    'period_required': True,
                    'department_optional': True,
                    'employee_optional': True
                },
                'export_config': {
                    'formats': ['xlsx'],
                    'create_archive': True,
                    'separate_files': True
                },
                'is_active': True,
                'is_public': True,
                'sort_order': 1
            },
            {
                'name': '财务报表',
                'description': '财务相关的报表',
                'category': 'finance',
                'report_types': ['payroll_summary', 'department_summary', 'tax_declaration'],
                'default_config': {
                    'export_format': 'xlsx',
                    'include_charts': True,
                    'decimal_places': 2
                },
                'is_active': True,
                'is_public': True,
                'sort_order': 2
            },
            {
                'name': '人事报表',
                'description': '人事管理相关的报表',
                'category': 'hr',
                'report_types': ['payroll_detail', 'attendance_summary'],
                'default_config': {
                    'export_format': 'xlsx',
                    'show_details': True,
                    'include_statistics': True
                },
                'is_active': True,
                'is_public': True,
                'sort_order': 3
            }
        ]
        
        for preset in presets:
            # 检查是否已存在
            existing = db.execute(
                "SELECT id FROM reports.report_config_presets WHERE name = %s",
                (preset['name'],)
            ).fetchone()
            
            if not existing:
                db.execute("""
                    INSERT INTO reports.report_config_presets (
                        name, description, category, report_types, default_config,
                        filter_config, export_config, is_active, is_public, sort_order,
                        usage_count, created_at, updated_at
                    ) VALUES (
                        %(name)s, %(description)s, %(category)s, %(report_types)s, %(default_config)s,
                        %(filter_config)s, %(export_config)s, %(is_active)s, %(is_public)s, %(sort_order)s,
                        0, NOW(), NOW()
                    )
                """, preset)
                print(f"✅ 已插入预设配置: {preset['name']}")
            else:
                print(f"⚠️ 预设配置已存在: {preset['name']}")
        
        # 提交事务
        db.commit()
        print("\n🎉 报表类型定义数据初始化完成！")
        
    except Exception as e:
        db.rollback()
        print(f"❌ 初始化失败: {str(e)}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    init_report_type_definitions() 