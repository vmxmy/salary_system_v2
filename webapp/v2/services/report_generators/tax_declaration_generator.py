"""
个税申报表生成器
专门负责生成个人所得税申报相关报表
"""

import os
from typing import List, Dict, Any, Optional
from sqlalchemy import text
from decimal import Decimal
from datetime import datetime

from .base_generator import BaseReportGenerator


class TaxDeclarationGenerator(BaseReportGenerator):
    """个税申报表生成器"""
    
    def generate_report(
        self,
        config: Dict[str, Any],
        output_dir: str,
        export_format: str = "xlsx"
    ) -> str:
        """
        生成个税申报表
        
        Args:
            config: 报表配置，包含period_id, department_ids, employee_ids等
            output_dir: 输出目录
            export_format: 导出格式
            
        Returns:
            生成的文件路径
        """
        try:
            self.log_generation_start(config)
            
            # 验证配置
            if not self.validate_config(config):
                raise ValueError("配置验证失败")
            
            # 获取报表数据
            data = self.get_report_data(config)
            
            # 生成文件名和路径
            filename = self.generate_filename(config, export_format)
            file_path = os.path.join(output_dir, filename)
            
            # 确保输出目录存在
            os.makedirs(output_dir, exist_ok=True)
            
            # 根据格式生成文件
            if export_format.lower() == 'xlsx':
                result_path = self.create_excel_file(data, file_path, config)
            elif export_format.lower() == 'csv':
                result_path = self.create_csv_file(data, file_path, config)
            else:
                raise ValueError(f"不支持的导出格式: {export_format}")
            
            self.log_generation_end(result_path, len(data))
            return result_path
            
        except Exception as e:
            self.handle_generation_error(e, config)
            raise
    
    def get_report_data(self, config: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        获取个税申报数据
        
        Args:
            config: 报表配置
            
        Returns:
            个税申报数据列表
        """
        try:
            period_id = config.get('period_id')
            department_ids = config.get('department_ids', [])
            employee_ids = config.get('employee_ids', [])
            
            # 构建查询条件
            where_conditions = ["pe.payroll_run_id IN (SELECT id FROM payroll.payroll_runs WHERE period_id = :period_id)"]
            params = {'period_id': period_id}
            
            if department_ids:
                where_conditions.append("e.department_id = ANY(:department_ids)")
                params['department_ids'] = department_ids
                
            if employee_ids:
                where_conditions.append("e.id = ANY(:employee_ids)")
                params['employee_ids'] = employee_ids
            
            where_clause = " AND ".join(where_conditions)
            
            # 个税申报查询SQL
            query = f"""
            SELECT 
                e.employee_code,
                e.last_name || e.first_name as employee_name,
                e.id_card_number,
                d.name as department_name,
                pe.gross_pay as taxable_income,
                COALESCE((pe.deductions_details->>'personal_income_tax')::numeric, 0) as income_tax,
                COALESCE((pe.deductions_details->>'pension_personal')::numeric, 0) as pension_deduction,
                COALESCE((pe.deductions_details->>'medical_personal')::numeric, 0) as medical_deduction,
                COALESCE((pe.deductions_details->>'unemployment_personal')::numeric, 0) as unemployment_deduction,
                COALESCE((pe.deductions_details->>'housing_fund_personal')::numeric, 0) as housing_fund_deduction,
                COALESCE((pe.earnings_details->>'special_deduction')::numeric, 0) as special_deduction,
                COALESCE((pe.earnings_details->>'additional_deduction')::numeric, 0) as additional_deduction,
                pe.gross_pay - COALESCE((pe.deductions_details->>'personal_income_tax')::numeric, 0) - 
                COALESCE((pe.deductions_details->>'pension_personal')::numeric, 0) - 
                COALESCE((pe.deductions_details->>'medical_personal')::numeric, 0) - 
                COALESCE((pe.deductions_details->>'unemployment_personal')::numeric, 0) - 
                COALESCE((pe.deductions_details->>'housing_fund_personal')::numeric, 0) as net_taxable_income,
                pp.name as period_name,
                pp.start_date,
                pp.end_date
            FROM payroll.payroll_entries pe
            JOIN hr.employees e ON pe.employee_id = e.id
            LEFT JOIN hr.departments d ON e.department_id = d.id
            JOIN payroll.payroll_runs pr ON pe.payroll_run_id = pr.id
            JOIN payroll.payroll_periods pp ON pr.period_id = pp.id
            WHERE {where_clause}
            AND COALESCE((pe.deductions_details->>'personal_income_tax')::numeric, 0) > 0
            ORDER BY d.name, e.employee_code
            """
            
            result = self.db.execute(text(query), params)
            rows = result.fetchall()
            
            # 转换为字典格式
            data = []
            for row in rows:
                data.append({
                    'employee_code': row.employee_code or '',
                    'employee_name': row.employee_name or '',
                    'id_card_number': row.id_card_number or '',
                    'department_name': row.department_name or '未分配部门',
                    'period_name': row.period_name or '',
                    'taxable_income': f"{row.taxable_income or 0:.2f}",
                    'pension_deduction': f"{row.pension_deduction or 0:.2f}",
                    'medical_deduction': f"{row.medical_deduction or 0:.2f}",
                    'unemployment_deduction': f"{row.unemployment_deduction or 0:.2f}",
                    'housing_fund_deduction': f"{row.housing_fund_deduction or 0:.2f}",
                    'special_deduction': f"{row.special_deduction or 0:.2f}",
                    'additional_deduction': f"{row.additional_deduction or 0:.2f}",
                    'net_taxable_income': f"{row.net_taxable_income or 0:.2f}",
                    'income_tax': f"{row.income_tax or 0:.2f}",
                    'start_date': row.start_date.strftime('%Y-%m-%d') if row.start_date else '',
                    'end_date': row.end_date.strftime('%Y-%m-%d') if row.end_date else ''
                })
            
            self.logger.info(f"获取个税申报数据成功，共 {len(data)} 条记录")
            return data
            
        except Exception as e:
            self.logger.error(f"获取个税申报数据失败: {str(e)}")
            raise
    
    def get_columns_config(self) -> List[Dict[str, Any]]:
        """
        获取个税申报表列配置
        
        Returns:
            列配置列表
        """
        return [
            {'key': 'employee_code', 'title': '员工编号', 'type': 'string', 'width': 15},
            {'key': 'employee_name', 'title': '姓名', 'type': 'string', 'width': 12},
            {'key': 'id_card_number', 'title': '身份证号', 'type': 'string', 'width': 20},
            {'key': 'department_name', 'title': '部门', 'type': 'string', 'width': 15},
            {'key': 'period_name', 'title': '所属期间', 'type': 'string', 'width': 15},
            {'key': 'taxable_income', 'title': '应税收入', 'type': 'currency', 'width': 12},
            {'key': 'pension_deduction', 'title': '养老保险', 'type': 'currency', 'width': 12},
            {'key': 'medical_deduction', 'title': '医疗保险', 'type': 'currency', 'width': 12},
            {'key': 'unemployment_deduction', 'title': '失业保险', 'type': 'currency', 'width': 12},
            {'key': 'housing_fund_deduction', 'title': '住房公积金', 'type': 'currency', 'width': 12},
            {'key': 'special_deduction', 'title': '专项扣除', 'type': 'currency', 'width': 12},
            {'key': 'additional_deduction', 'title': '专项附加扣除', 'type': 'currency', 'width': 15},
            {'key': 'net_taxable_income', 'title': '应纳税所得额', 'type': 'currency', 'width': 15},
            {'key': 'income_tax', 'title': '个人所得税', 'type': 'currency', 'width': 12},
            {'key': 'start_date', 'title': '开始日期', 'type': 'date', 'width': 12},
            {'key': 'end_date', 'title': '结束日期', 'type': 'date', 'width': 12}
        ]
    
    def get_report_title(self, config: Dict[str, Any]) -> str:
        """获取报表标题"""
        return "个人所得税申报表"
    
    def get_summary_data(self, data: List[Dict[str, Any]], config: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        获取汇总数据
        
        Args:
            data: 报表数据
            config: 报表配置
            
        Returns:
            汇总数据字典
        """
        if not data:
            return None
        
        # 计算汇总统计
        total_taxable_income = sum(float(row['taxable_income']) for row in data)
        total_income_tax = sum(float(row['income_tax']) for row in data)
        total_deductions = sum(
            float(row['pension_deduction']) + 
            float(row['medical_deduction']) + 
            float(row['unemployment_deduction']) + 
            float(row['housing_fund_deduction'])
            for row in data
        )
        
        return {
            "申报人数": len(data),
            "应税收入合计": f"{total_taxable_income:.2f}",
            "个税合计": f"{total_income_tax:.2f}",
            "社保公积金扣除合计": f"{total_deductions:.2f}",
            "平均税额": f"{total_income_tax / len(data):.2f}" if len(data) > 0 else "0.00",
            "生成时间": datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
    
    def validate_config(self, config: Dict[str, Any]) -> bool:
        """
        验证配置参数
        
        Args:
            config: 报表配置
            
        Returns:
            验证结果
        """
        if not config.get('period_id'):
            self.logger.error("缺少必需的参数: period_id")
            return False
        
        return True 