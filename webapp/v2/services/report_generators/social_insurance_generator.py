"""
社保缴费表生成器
专门负责生成社会保险缴费相关报表
"""

import os
from typing import List, Dict, Any, Optional
from sqlalchemy import text
from decimal import Decimal
from datetime import datetime

from .base_generator import BaseReportGenerator


class SocialInsuranceGenerator(BaseReportGenerator):
    """社保缴费表生成器"""
    
    def generate_report(
        self,
        config: Dict[str, Any],
        output_dir: str,
        export_format: str = "xlsx"
    ) -> str:
        """
        生成社保缴费表
        
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
        获取社保缴费数据
        
        Args:
            config: 报表配置
            
        Returns:
            社保缴费数据列表
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
            
            # 社保缴费查询SQL
            query = f"""
            SELECT 
                e.employee_code,
                e.last_name || e.first_name as employee_name,
                e.id_card_number,
                d.name as department_name,
                e.social_security_number,
                pe.gross_pay as salary_base,
                COALESCE((pe.deductions_details->>'pension_personal')::numeric, 0) as pension_personal,
                COALESCE((pe.deductions_details->>'pension_employer')::numeric, 0) as pension_employer,
                COALESCE((pe.deductions_details->>'medical_personal')::numeric, 0) as medical_personal,
                COALESCE((pe.deductions_details->>'medical_employer')::numeric, 0) as medical_employer,
                COALESCE((pe.deductions_details->>'unemployment_personal')::numeric, 0) as unemployment_personal,
                COALESCE((pe.deductions_details->>'unemployment_employer')::numeric, 0) as unemployment_employer,
                COALESCE((pe.deductions_details->>'injury_employer')::numeric, 0) as injury_employer,
                COALESCE((pe.deductions_details->>'maternity_employer')::numeric, 0) as maternity_employer,
                COALESCE((pe.deductions_details->>'housing_fund_personal')::numeric, 0) as housing_fund_personal,
                COALESCE((pe.deductions_details->>'housing_fund_employer')::numeric, 0) as housing_fund_employer,
                pp.name as period_name,
                pp.start_date,
                pp.end_date
            FROM payroll.payroll_entries pe
            JOIN hr.employees e ON pe.employee_id = e.id
            LEFT JOIN hr.departments d ON e.department_id = d.id
            JOIN payroll.payroll_runs pr ON pe.payroll_run_id = pr.id
            JOIN payroll.payroll_periods pp ON pr.period_id = pp.id
            WHERE {where_clause}
            ORDER BY d.name, e.employee_code
            """
            
            result = self.db.execute(text(query), params)
            rows = result.fetchall()
            
            # 转换为字典格式
            data = []
            for row in rows:
                # 计算个人和单位缴费合计
                personal_total = (
                    (row.pension_personal or 0) + 
                    (row.medical_personal or 0) + 
                    (row.unemployment_personal or 0) + 
                    (row.housing_fund_personal or 0)
                )
                
                employer_total = (
                    (row.pension_employer or 0) + 
                    (row.medical_employer or 0) + 
                    (row.unemployment_employer or 0) + 
                    (row.injury_employer or 0) + 
                    (row.maternity_employer or 0) + 
                    (row.housing_fund_employer or 0)
                )
                
                data.append({
                    'employee_code': row.employee_code or '',
                    'employee_name': row.employee_name or '',
                    'id_card_number': row.id_card_number or '',
                    'social_security_number': row.social_security_number or '',
                    'department_name': row.department_name or '未分配部门',
                    'period_name': row.period_name or '',
                    'salary_base': f"{row.salary_base or 0:.2f}",
                    'pension_personal': f"{row.pension_personal or 0:.2f}",
                    'pension_employer': f"{row.pension_employer or 0:.2f}",
                    'medical_personal': f"{row.medical_personal or 0:.2f}",
                    'medical_employer': f"{row.medical_employer or 0:.2f}",
                    'unemployment_personal': f"{row.unemployment_personal or 0:.2f}",
                    'unemployment_employer': f"{row.unemployment_employer or 0:.2f}",
                    'injury_employer': f"{row.injury_employer or 0:.2f}",
                    'maternity_employer': f"{row.maternity_employer or 0:.2f}",
                    'housing_fund_personal': f"{row.housing_fund_personal or 0:.2f}",
                    'housing_fund_employer': f"{row.housing_fund_employer or 0:.2f}",
                    'personal_total': f"{personal_total:.2f}",
                    'employer_total': f"{employer_total:.2f}",
                    'grand_total': f"{personal_total + employer_total:.2f}",
                    'start_date': row.start_date.strftime('%Y-%m-%d') if row.start_date else '',
                    'end_date': row.end_date.strftime('%Y-%m-%d') if row.end_date else ''
                })
            
            self.logger.info(f"获取社保缴费数据成功，共 {len(data)} 条记录")
            return data
            
        except Exception as e:
            self.logger.error(f"获取社保缴费数据失败: {str(e)}")
            raise
    
    def get_columns_config(self) -> List[Dict[str, Any]]:
        """
        获取社保缴费表列配置
        
        Returns:
            列配置列表
        """
        return [
            {'key': 'employee_code', 'title': '员工编号', 'type': 'string', 'width': 12},
            {'key': 'employee_name', 'title': '姓名', 'type': 'string', 'width': 10},
            {'key': 'id_card_number', 'title': '身份证号', 'type': 'string', 'width': 18},
            {'key': 'social_security_number', 'title': '社保号', 'type': 'string', 'width': 15},
            {'key': 'department_name', 'title': '部门', 'type': 'string', 'width': 12},
            {'key': 'period_name', 'title': '所属期间', 'type': 'string', 'width': 12},
            {'key': 'salary_base', 'title': '缴费基数', 'type': 'currency', 'width': 12},
            {'key': 'pension_personal', 'title': '养老保险(个人)', 'type': 'currency', 'width': 15},
            {'key': 'pension_employer', 'title': '养老保险(单位)', 'type': 'currency', 'width': 15},
            {'key': 'medical_personal', 'title': '医疗保险(个人)', 'type': 'currency', 'width': 15},
            {'key': 'medical_employer', 'title': '医疗保险(单位)', 'type': 'currency', 'width': 15},
            {'key': 'unemployment_personal', 'title': '失业保险(个人)', 'type': 'currency', 'width': 15},
            {'key': 'unemployment_employer', 'title': '失业保险(单位)', 'type': 'currency', 'width': 15},
            {'key': 'injury_employer', 'title': '工伤保险(单位)', 'type': 'currency', 'width': 15},
            {'key': 'maternity_employer', 'title': '生育保险(单位)', 'type': 'currency', 'width': 15},
            {'key': 'housing_fund_personal', 'title': '公积金(个人)', 'type': 'currency', 'width': 15},
            {'key': 'housing_fund_employer', 'title': '公积金(单位)', 'type': 'currency', 'width': 15},
            {'key': 'personal_total', 'title': '个人缴费合计', 'type': 'currency', 'width': 15},
            {'key': 'employer_total', 'title': '单位缴费合计', 'type': 'currency', 'width': 15},
            {'key': 'grand_total', 'title': '缴费总计', 'type': 'currency', 'width': 12},
            {'key': 'start_date', 'title': '开始日期', 'type': 'date', 'width': 12},
            {'key': 'end_date', 'title': '结束日期', 'type': 'date', 'width': 12}
        ]
    
    def get_report_title(self, config: Dict[str, Any]) -> str:
        """获取报表标题"""
        return "社会保险缴费表"
    
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
        total_personal = sum(float(row['personal_total']) for row in data)
        total_employer = sum(float(row['employer_total']) for row in data)
        total_pension_personal = sum(float(row['pension_personal']) for row in data)
        total_pension_employer = sum(float(row['pension_employer']) for row in data)
        total_medical_personal = sum(float(row['medical_personal']) for row in data)
        total_medical_employer = sum(float(row['medical_employer']) for row in data)
        total_housing_fund_personal = sum(float(row['housing_fund_personal']) for row in data)
        total_housing_fund_employer = sum(float(row['housing_fund_employer']) for row in data)
        
        return {
            "参保人数": len(data),
            "个人缴费合计": f"{total_personal:.2f}",
            "单位缴费合计": f"{total_employer:.2f}",
            "缴费总计": f"{total_personal + total_employer:.2f}",
            "养老保险(个人)": f"{total_pension_personal:.2f}",
            "养老保险(单位)": f"{total_pension_employer:.2f}",
            "医疗保险(个人)": f"{total_medical_personal:.2f}",
            "医疗保险(单位)": f"{total_medical_employer:.2f}",
            "住房公积金(个人)": f"{total_housing_fund_personal:.2f}",
            "住房公积金(单位)": f"{total_housing_fund_employer:.2f}",
            "人均个人缴费": f"{total_personal / len(data):.2f}" if len(data) > 0 else "0.00",
            "人均单位缴费": f"{total_employer / len(data):.2f}" if len(data) > 0 else "0.00",
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