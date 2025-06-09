#!/usr/bin/env python3
"""
报表生成器使用示例
演示如何使用现有的6个报表生成器
"""

import os
import sys
from datetime import datetime

# 添加项目路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from webapp.v2.database import get_db_v2
from webapp.v2.services.report_generators import (
    PayrollSummaryGenerator,
    PayrollDetailGenerator,
    DepartmentSummaryGenerator,
    TaxDeclarationGenerator,
    SocialInsuranceGenerator,
    AttendanceSummaryGenerator
)

def create_output_dir():
    """创建输出目录"""
    output_dir = f"reports/examples_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    os.makedirs(output_dir, exist_ok=True)
    return output_dir

def example_payroll_summary():
    """示例：生成薪资汇总表"""
    print("📊 生成薪资汇总表...")
    
    db = next(get_db_v2())
    generator = PayrollSummaryGenerator(db)
    output_dir = create_output_dir()
    
    config = {
        'period_id': 1,  # 薪资期间ID
        'department_ids': [1, 2],  # 可选：指定部门
        'include_charts': True  # 包含图表
    }
    
    try:
        file_path = generator.generate_report(
            config=config,
            output_dir=output_dir,
            export_format="xlsx"
        )
        print(f"✅ 薪资汇总表生成成功: {file_path}")
        return file_path
    except Exception as e:
        print(f"❌ 生成失败: {str(e)}")
        return None

def example_payroll_detail():
    """示例：生成薪资明细表"""
    print("📋 生成薪资明细表...")
    
    db = next(get_db_v2())
    generator = PayrollDetailGenerator(db)
    output_dir = create_output_dir()
    
    config = {
        'period_id': 1,
        'employee_ids': [1, 2, 3, 4, 5],  # 指定员工
        'include_bank_info': True  # 包含银行信息
    }
    
    try:
        file_path = generator.generate_report(
            config=config,
            output_dir=output_dir,
            export_format="xlsx"
        )
        print(f"✅ 薪资明细表生成成功: {file_path}")
        return file_path
    except Exception as e:
        print(f"❌ 生成失败: {str(e)}")
        return None

def example_department_summary():
    """示例：生成部门汇总表"""
    print("🏢 生成部门汇总表...")
    
    db = next(get_db_v2())
    generator = DepartmentSummaryGenerator(db)
    output_dir = create_output_dir()
    
    config = {
        'period_id': 1,
        'include_charts': True,
        'show_cost_analysis': True  # 显示成本分析
    }
    
    try:
        file_path = generator.generate_report(
            config=config,
            output_dir=output_dir,
            export_format="xlsx"
        )
        print(f"✅ 部门汇总表生成成功: {file_path}")
        return file_path
    except Exception as e:
        print(f"❌ 生成失败: {str(e)}")
        return None

def example_tax_declaration():
    """示例：生成个税申报表"""
    print("📄 生成个税申报表...")
    
    db = next(get_db_v2())
    generator = TaxDeclarationGenerator(db)
    output_dir = create_output_dir()
    
    config = {
        'period_id': 1,
        'department_ids': [1, 2, 3],
        'include_deduction_details': True  # 包含扣除明细
    }
    
    try:
        file_path = generator.generate_report(
            config=config,
            output_dir=output_dir,
            export_format="xlsx"
        )
        print(f"✅ 个税申报表生成成功: {file_path}")
        return file_path
    except Exception as e:
        print(f"❌ 生成失败: {str(e)}")
        return None

def example_social_insurance():
    """示例：生成社保缴费表"""
    print("🛡️ 生成社保缴费表...")
    
    db = next(get_db_v2())
    generator = SocialInsuranceGenerator(db)
    output_dir = create_output_dir()
    
    config = {
        'period_id': 1,
        'include_employer_contributions': True,  # 包含雇主缴费
        'show_contribution_base': True  # 显示缴费基数
    }
    
    try:
        file_path = generator.generate_report(
            config=config,
            output_dir=output_dir,
            export_format="xlsx"
        )
        print(f"✅ 社保缴费表生成成功: {file_path}")
        return file_path
    except Exception as e:
        print(f"❌ 生成失败: {str(e)}")
        return None

def example_attendance_summary():
    """示例：生成考勤汇总表"""
    print("⏰ 生成考勤汇总表...")
    
    db = next(get_db_v2())
    generator = AttendanceSummaryGenerator(db)
    output_dir = create_output_dir()
    
    config = {
        'period_id': 1,
        'department_ids': [1, 2],
        'include_overtime_analysis': True,  # 包含加班分析
        'show_attendance_rate': True  # 显示出勤率
    }
    
    try:
        file_path = generator.generate_report(
            config=config,
            output_dir=output_dir,
            export_format="xlsx"
        )
        print(f"✅ 考勤汇总表生成成功: {file_path}")
        return file_path
    except Exception as e:
        print(f"❌ 生成失败: {str(e)}")
        return None

def example_batch_generation():
    """示例：批量生成多个报表"""
    print("🚀 批量生成多个报表...")
    
    db = next(get_db_v2())
    output_dir = create_output_dir()
    
    # 通用配置
    base_config = {
        'period_id': 1,
        'department_ids': [1, 2]
    }
    
    generators = [
        ('薪资汇总表', PayrollSummaryGenerator),
        ('薪资明细表', PayrollDetailGenerator),
        ('部门汇总表', DepartmentSummaryGenerator),
        ('个税申报表', TaxDeclarationGenerator),
        ('社保缴费表', SocialInsuranceGenerator),
        ('考勤汇总表', AttendanceSummaryGenerator)
    ]
    
    generated_files = []
    
    for report_name, generator_class in generators:
        try:
            generator = generator_class(db)
            file_path = generator.generate_report(
                config=base_config,
                output_dir=output_dir,
                export_format="xlsx"
            )
            generated_files.append((report_name, file_path))
            print(f"✅ {report_name} 生成成功")
        except Exception as e:
            print(f"❌ {report_name} 生成失败: {str(e)}")
    
    print(f"\n📁 所有报表保存在: {output_dir}")
    for name, path in generated_files:
        print(f"  - {name}: {os.path.basename(path)}")
    
    return generated_files

def example_csv_export():
    """示例：导出CSV格式"""
    print("📄 生成CSV格式报表...")
    
    db = next(get_db_v2())
    generator = PayrollSummaryGenerator(db)
    output_dir = create_output_dir()
    
    config = {
        'period_id': 1,
        'department_ids': [1, 2]
    }
    
    try:
        file_path = generator.generate_report(
            config=config,
            output_dir=output_dir,
            export_format="csv"  # CSV格式
        )
        print(f"✅ CSV报表生成成功: {file_path}")
        return file_path
    except Exception as e:
        print(f"❌ 生成失败: {str(e)}")
        return None

def main():
    """主函数：运行所有示例"""
    print("🎯 报表生成器使用示例")
    print("=" * 50)
    
    try:
        # 单个报表生成示例
        example_payroll_summary()
        print()
        
        example_payroll_detail()
        print()
        
        example_department_summary()
        print()
        
        example_tax_declaration()
        print()
        
        example_social_insurance()
        print()
        
        example_attendance_summary()
        print()
        
        # CSV导出示例
        example_csv_export()
        print()
        
        # 批量生成示例
        example_batch_generation()
        
    except Exception as e:
        print(f"❌ 运行示例时发生错误: {str(e)}")
    
    print("\n🎉 示例运行完成！")

if __name__ == "__main__":
    main() 