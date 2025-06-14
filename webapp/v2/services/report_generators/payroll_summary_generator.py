"""
薪资汇总报表生成器
生成按部门汇总的薪资统计报表
"""

import os
from typing import List, Dict, Any, Optional
from sqlalchemy import text
from decimal import Decimal
from datetime import datetime

from .base_generator import BaseReportGenerator
from .excel_utils import ExcelExportUtils

class PayrollSummaryGenerator(BaseReportGenerator):
    """薪资汇总报表生成器"""
    
    def generate_report(
        self,
        config: Dict[str, Any],
        output_dir: str,
        export_format: str = "xlsx"
    ) -> str:
        """生成薪资汇总报表"""
        try:
            self.log_generation_start(config)
            
            # 验证配置
            if not self.validate_config(config):
                raise ValueError("配置参数无效")
            
            # 获取报表数据
            data = self.get_report_data(config)
            
            # 生成文件名和路径
            filename = self.generate_filename(config, export_format)
            file_path = os.path.join(output_dir, filename)
            
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
    
    def get_report_data(self, config: Dict[str, Any]) -> List[Dict[str, Any]]:
        """获取薪资汇总数据"""
        try:
            period_id = config.get('period_id')
            department_ids = config.get('department_ids', [])
            employee_ids = config.get('employee_ids', [])
            
            # 构建查询条件
            where_conditions = []
            params = {}
            
            if period_id:
                where_conditions.append("pr.payroll_period_id = :period_id")
                params['period_id'] = period_id
            
            if department_ids:
                where_conditions.append("e.department_id = ANY(:department_ids)")
                params['department_ids'] = department_ids
            
            if employee_ids:
                where_conditions.append("e.id = ANY(:employee_ids)")
                params['employee_ids'] = employee_ids
            
            where_clause = " AND " + " AND ".join(where_conditions) if where_conditions else ""
            
            # 构建SQL查询
            query = f"""
            SELECT 
                COALESCE(d.name, '未分配部门') as department_name,
                COUNT(DISTINCT pe.employee_id) as employee_count,
                COALESCE(SUM(pe.gross_pay), 0) as total_gross_pay,
                COALESCE(SUM(pe.net_pay), 0) as total_net_pay,
                COALESCE(SUM(pe.gross_pay - pe.net_pay), 0) as total_deductions,
                COALESCE(AVG(pe.gross_pay), 0) as avg_gross_pay,
                COALESCE(AVG(pe.net_pay), 0) as avg_net_pay,
                COALESCE(SUM(
                    CASE 
                        WHEN pe.deductions_details ? 'personal_income_tax' 
                        THEN (pe.deductions_details->>'personal_income_tax')::numeric 
                        ELSE 0 
                    END
                ), 0) as total_tax,
                COALESCE(SUM(
                    CASE 
                        WHEN pe.deductions_details ? 'social_insurance_personal' 
                        THEN (pe.deductions_details->>'social_insurance_personal')::numeric 
                        ELSE 0 
                    END
                ), 0) as total_social_insurance,
                COALESCE(SUM(
                    CASE 
                        WHEN pe.deductions_details ? 'housing_fund_personal' 
                        THEN (pe.deductions_details->>'housing_fund_personal')::numeric 
                        ELSE 0 
                    END
                ), 0) as total_housing_fund
            FROM payroll.payroll_entries pe
            JOIN payroll.payroll_runs pr ON pe.payroll_run_id = pr.id
            JOIN hr.employees e ON pe.employee_id = e.id
            LEFT JOIN hr.departments d ON e.department_id = d.id
            WHERE 1=1 {where_clause}
            GROUP BY d.name
            ORDER BY total_gross_pay DESC
            """
            
            result = self.db.execute(text(query), params)
            rows = result.fetchall()
            
            # 转换为字典格式
            data = []
            for row in rows:
                data.append({
                    'department_name': row.department_name or '未分配部门',
                    'employee_count': int(row.employee_count),
                    'total_gross_pay': float(row.total_gross_pay or 0),
                    'total_net_pay': float(row.total_net_pay or 0),
                    'total_deductions': float(row.total_deductions or 0),
                    'avg_gross_pay': float(row.avg_gross_pay or 0),
                    'avg_net_pay': float(row.avg_net_pay or 0),
                    'total_tax': float(row.total_tax or 0),
                    'total_social_insurance': float(row.total_social_insurance or 0),
                    'total_housing_fund': float(row.total_housing_fund or 0)
                })
            
            self.logger.info(f"查询到薪资汇总数据 {len(data)} 条")
            return data
            
        except Exception as e:
            self.logger.error(f"获取薪资汇总数据失败: {str(e)}")
            raise
    
    def get_columns_config(self) -> List[Dict[str, Any]]:
        """获取列配置"""
        return [
            {'key': 'department_name', 'title': '部门名称', 'type': 'string'},
            {'key': 'employee_count', 'title': '人数', 'type': 'number'},
            {'key': 'total_gross_pay', 'title': '应发合计合计', 'type': 'currency'},
            {'key': 'total_net_pay', 'title': '实发合计合计', 'type': 'currency'},
            {'key': 'total_deductions', 'title': '扣除合计', 'type': 'currency'},
            {'key': 'avg_gross_pay', 'title': '平均应发合计', 'type': 'currency'},
            {'key': 'avg_net_pay', 'title': '平均实发合计', 'type': 'currency'},
            {'key': 'total_tax', 'title': '个人所得税合计', 'type': 'currency'},
            {'key': 'total_social_insurance', 'title': '社保个人合计', 'type': 'currency'},
            {'key': 'total_housing_fund', 'title': '公积金个人合计', 'type': 'currency'}
        ]
    
    def get_report_title(self, config: Dict[str, Any]) -> str:
        """获取报表标题"""
        return "薪资汇总表"
    
    def get_report_subtitle(self, config: Dict[str, Any]) -> Optional[str]:
        """获取报表副标题"""
        period_id = config.get('period_id')
        subtitle_parts = []
        
        if period_id:
            # 查询期间名称
            try:
                period_query = "SELECT name FROM payroll.payroll_periods WHERE id = :period_id"
                result = self.db.execute(text(period_query), {'period_id': period_id})
                period_row = result.fetchone()
                if period_row:
                    subtitle_parts.append(f"薪资期间: {period_row.name}")
                else:
                    subtitle_parts.append(f"薪资期间ID: {period_id}")
            except Exception:
                subtitle_parts.append(f"薪资期间ID: {period_id}")
        
        subtitle_parts.append(f"生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        return " | ".join(subtitle_parts)
    
    def get_summary_data(self, data: List[Dict[str, Any]], config: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """获取汇总数据"""
        if not data:
            return {
                "总记录数": 0,
                "生成时间": datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            }
        
        # 计算总计
        total_employees = sum(row['employee_count'] for row in data)
        total_gross_pay = sum(row['total_gross_pay'] for row in data)
        total_net_pay = sum(row['total_net_pay'] for row in data)
        total_deductions = sum(row['total_deductions'] for row in data)
        total_tax = sum(row['total_tax'] for row in data)
        total_social_insurance = sum(row['total_social_insurance'] for row in data)
        total_housing_fund = sum(row['total_housing_fund'] for row in data)
        
        return {
            "部门数量": len(data),
            "员工总数": total_employees,
            "应发合计总计": f"{total_gross_pay:.2f}",
            "实发合计总计": f"{total_net_pay:.2f}",
            "扣除总计": f"{total_deductions:.2f}",
            "个税总计": f"{total_tax:.2f}",
            "社保个人总计": f"{total_social_insurance:.2f}",
            "公积金个人总计": f"{total_housing_fund:.2f}",
            "平均应发合计": f"{total_gross_pay / total_employees:.2f}" if total_employees > 0 else "0.00",
            "平均实发合计": f"{total_net_pay / total_employees:.2f}" if total_employees > 0 else "0.00",
            "生成时间": datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
    
    def validate_config(self, config: Dict[str, Any]) -> bool:
        """验证配置参数"""
        # 薪资汇总报表可以不需要特定的期间，但如果提供了要验证
        period_id = config.get('period_id')
        if period_id and not isinstance(period_id, int):
            self.logger.error("period_id 必须是整数")
            return False
        
        department_ids = config.get('department_ids', [])
        if department_ids and not isinstance(department_ids, list):
            self.logger.error("department_ids 必须是列表")
            return False
        
        employee_ids = config.get('employee_ids', [])
        if employee_ids and not isinstance(employee_ids, list):
            self.logger.error("employee_ids 必须是列表")
            return False
        
        return True
    
    def generate_filename(self, config: Dict[str, Any], export_format: str) -> str:
        """生成文件名"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        period_id = config.get('period_id')
        
        if period_id:
            return f"薪资汇总表_期间{period_id}_{timestamp}.{export_format}"
        else:
            return f"薪资汇总表_{timestamp}.{export_format}" 