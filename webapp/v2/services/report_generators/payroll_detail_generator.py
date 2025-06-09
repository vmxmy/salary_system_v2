"""
薪资明细报表生成器
生成详细的员工薪资明细表，包含所有薪资组件
"""

import os
from typing import List, Dict, Any, Optional
from sqlalchemy import text
from datetime import datetime

from .base_generator import BaseReportGenerator

class PayrollDetailGenerator(BaseReportGenerator):
    """薪资明细报表生成器"""
    
    def generate_report(
        self,
        config: Dict[str, Any],
        output_dir: str,
        export_format: str = "xlsx"
    ) -> str:
        """生成薪资明细报表"""
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
        """获取薪资明细数据"""
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
                e.employee_code,
                COALESCE(e.last_name || e.first_name, e.first_name, e.last_name, '') as employee_name,
                COALESCE(d.name, '未分配部门') as department_name,
                COALESCE(p.name, '未分配岗位') as position_name,
                pe.gross_pay,
                pe.net_pay,
                pe.earnings_details,
                pe.deductions_details,
                pr.run_date,
                pp.name as period_name,
                e.id_number,
                e.bank_account_number,
                e.bank_name
            FROM payroll.payroll_entries pe
            JOIN payroll.payroll_runs pr ON pe.payroll_run_id = pr.id
            JOIN payroll.payroll_periods pp ON pr.payroll_period_id = pp.id
            JOIN hr.employees e ON pe.employee_id = e.id
            LEFT JOIN hr.departments d ON e.department_id = d.id
            LEFT JOIN hr.positions p ON e.actual_position_id = p.id
            WHERE 1=1 {where_clause}
            ORDER BY d.name, e.employee_code
            """
            
            result = self.db.execute(text(query), params)
            rows = result.fetchall()
            
            # 获取薪资组件定义
            earnings_components = self._get_payroll_components('EARNING')
            deductions_components = self._get_payroll_components('DEDUCTION')
            
            # 转换为字典格式
            data = []
            for row in rows:
                # 基础信息
                row_data = {
                    'employee_code': row.employee_code or '',
                    'employee_name': row.employee_name or '',
                    'id_number': row.id_number or '',
                    'department_name': row.department_name or '未分配部门',
                    'position_name': row.position_name or '未分配岗位',
                    'period_name': row.period_name or '',
                    'run_date': row.run_date.strftime('%Y-%m-%d') if row.run_date else '',
                    'bank_account_number': row.bank_account_number or '',
                    'bank_name': row.bank_name or ''
                }
                
                # 收入明细
                earnings_details = row.earnings_details or {}
                earnings_total = 0
                for component in earnings_components:
                    key = f'earning_{component["code"]}'
                    value = float(earnings_details.get(component['code'], 0))
                    row_data[key] = value
                    earnings_total += value
                
                row_data['gross_pay'] = float(row.gross_pay or 0)
                
                # 扣除明细
                deductions_details = row.deductions_details or {}
                deductions_total = 0
                for component in deductions_components:
                    key = f'deduction_{component["code"]}'
                    value = float(deductions_details.get(component['code'], 0))
                    row_data[key] = value
                    deductions_total += value
                
                row_data['total_deductions'] = deductions_total
                row_data['net_pay'] = float(row.net_pay or 0)
                
                data.append(row_data)
            
            self.logger.info(f"查询到薪资明细数据 {len(data)} 条")
            return data
            
        except Exception as e:
            self.logger.error(f"获取薪资明细数据失败: {str(e)}")
            raise
    
    def get_columns_config(self) -> List[Dict[str, Any]]:
        """获取列配置"""
        try:
            # 基础列
            columns = [
                {'key': 'employee_code', 'title': '员工编号', 'type': 'string'},
                {'key': 'employee_name', 'title': '姓名', 'type': 'string'},
                {'key': 'id_number', 'title': '身份证号', 'type': 'string'},
                {'key': 'department_name', 'title': '部门', 'type': 'string'},
                {'key': 'position_name', 'title': '岗位', 'type': 'string'},
                {'key': 'period_name', 'title': '薪资期间', 'type': 'string'},
                {'key': 'run_date', 'title': '发放日期', 'type': 'string'}
            ]
            
            # 收入项列
            earnings_components = self._get_payroll_components('EARNING')
            for component in earnings_components:
                columns.append({
                    'key': f'earning_{component["code"]}',
                    'title': component['name'],
                    'type': 'currency'
                })
            
            columns.append({'key': 'gross_pay', 'title': '应发合计', 'type': 'currency'})
            
            # 扣除项列
            deductions_components = self._get_payroll_components('DEDUCTION')
            for component in deductions_components:
                columns.append({
                    'key': f'deduction_{component["code"]}',
                    'title': component['name'],
                    'type': 'currency'
                })
            
            columns.extend([
                {'key': 'total_deductions', 'title': '扣除合计', 'type': 'currency'},
                {'key': 'net_pay', 'title': '实发工资', 'type': 'currency'},
                {'key': 'bank_account_number', 'title': '银行账号', 'type': 'string'},
                {'key': 'bank_name', 'title': '开户银行', 'type': 'string'}
            ])
            
            return columns
            
        except Exception as e:
            self.logger.error(f"获取列配置失败: {str(e)}")
            # 返回基础列配置
            return [
                {'key': 'employee_code', 'title': '员工编号', 'type': 'string'},
                {'key': 'employee_name', 'title': '姓名', 'type': 'string'},
                {'key': 'department_name', 'title': '部门', 'type': 'string'},
                {'key': 'gross_pay', 'title': '应发工资', 'type': 'currency'},
                {'key': 'net_pay', 'title': '实发工资', 'type': 'currency'}
            ]
    
    def _get_payroll_components(self, component_type: str) -> List[Dict[str, Any]]:
        """获取薪资组件定义"""
        try:
            query = """
            SELECT code, name, sort_order
            FROM config.payroll_component_definitions
            WHERE component_type = :component_type AND is_active = true
            ORDER BY sort_order, name
            """
            
            result = self.db.execute(text(query), {'component_type': component_type})
            rows = result.fetchall()
            
            components = []
            for row in rows:
                components.append({
                    'code': row.code,
                    'name': row.name,
                    'sort_order': row.sort_order or 0
                })
            
            return components
            
        except Exception as e:
            self.logger.warning(f"获取薪资组件定义失败: {str(e)}")
            # 返回默认组件
            if component_type == 'EARNING':
                return [
                    {'code': 'basic_salary', 'name': '基本工资', 'sort_order': 1},
                    {'code': 'position_salary', 'name': '岗位工资', 'sort_order': 2},
                    {'code': 'overtime_pay', 'name': '加班费', 'sort_order': 3},
                    {'code': 'bonus', 'name': '奖金', 'sort_order': 4},
                    {'code': 'allowances', 'name': '津贴补贴', 'sort_order': 5}
                ]
            else:  # DEDUCTION
                return [
                    {'code': 'social_insurance_personal', 'name': '社保个人', 'sort_order': 1},
                    {'code': 'housing_fund_personal', 'name': '公积金个人', 'sort_order': 2},
                    {'code': 'personal_income_tax', 'name': '个人所得税', 'sort_order': 3},
                    {'code': 'other_deductions', 'name': '其他扣除', 'sort_order': 4}
                ]
    
    def get_report_title(self, config: Dict[str, Any]) -> str:
        """获取报表标题"""
        return "薪资明细表"
    
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
        total_gross_pay = sum(row.get('gross_pay', 0) for row in data)
        total_net_pay = sum(row.get('net_pay', 0) for row in data)
        total_deductions = sum(row.get('total_deductions', 0) for row in data)
        
        # 统计部门数量
        departments = set(row.get('department_name', '') for row in data)
        
        return {
            "员工总数": len(data),
            "部门数量": len(departments),
            "应发工资总计": f"{total_gross_pay:.2f}",
            "实发工资总计": f"{total_net_pay:.2f}",
            "扣除总计": f"{total_deductions:.2f}",
            "平均应发工资": f"{total_gross_pay / len(data):.2f}" if len(data) > 0 else "0.00",
            "平均实发工资": f"{total_net_pay / len(data):.2f}" if len(data) > 0 else "0.00",
            "生成时间": datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
    
    def validate_config(self, config: Dict[str, Any]) -> bool:
        """验证配置参数"""
        # 薪资明细报表通常需要指定期间
        period_id = config.get('period_id')
        if not period_id:
            self.logger.warning("建议指定 period_id 以获取特定期间的薪资明细")
        
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
            return f"薪资明细表_期间{period_id}_{timestamp}.{export_format}"
        else:
            return f"薪资明细表_{timestamp}.{export_format}" 