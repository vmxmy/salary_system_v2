"""
考勤汇总表生成器
专门负责生成考勤汇总相关报表
"""

import os
from typing import List, Dict, Any, Optional
from sqlalchemy import text
from decimal import Decimal
from datetime import datetime

from .base_generator import BaseReportGenerator


class AttendanceSummaryGenerator(BaseReportGenerator):
    """考勤汇总表生成器"""
    
    def generate_report(
        self,
        config: Dict[str, Any],
        output_dir: str,
        export_format: str = "xlsx"
    ) -> str:
        """
        生成考勤汇总表
        
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
        获取考勤汇总数据
        
        Args:
            config: 报表配置
            
        Returns:
            考勤汇总数据列表
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
            
            # 考勤汇总查询SQL
            # 注意：这里假设考勤数据存储在earnings_details中，实际项目中可能需要调整
            query = f"""
            SELECT 
                e.employee_code,
                e.last_name || e.first_name as employee_name,
                d.name as department_name,
                pos.name as position_name,
                COALESCE((pe.earnings_details->>'normal_hours')::numeric, 0) as normal_hours,
                COALESCE((pe.earnings_details->>'overtime_hours')::numeric, 0) as overtime_hours,
                COALESCE((pe.earnings_details->>'weekend_hours')::numeric, 0) as weekend_hours,
                COALESCE((pe.earnings_details->>'holiday_hours')::numeric, 0) as holiday_hours,
                COALESCE((pe.earnings_details->>'sick_leave_hours')::numeric, 0) as sick_leave_hours,
                COALESCE((pe.earnings_details->>'annual_leave_hours')::numeric, 0) as annual_leave_hours,
                COALESCE((pe.earnings_details->>'personal_leave_hours')::numeric, 0) as personal_leave_hours,
                COALESCE((pe.earnings_details->>'absent_hours')::numeric, 0) as absent_hours,
                COALESCE((pe.earnings_details->>'late_times')::numeric, 0) as late_times,
                COALESCE((pe.earnings_details->>'early_leave_times')::numeric, 0) as early_leave_times,
                COALESCE((pe.earnings_details->>'normal_pay')::numeric, 0) as normal_pay,
                COALESCE((pe.earnings_details->>'overtime_pay')::numeric, 0) as overtime_pay,
                COALESCE((pe.earnings_details->>'weekend_pay')::numeric, 0) as weekend_pay,
                COALESCE((pe.earnings_details->>'holiday_pay')::numeric, 0) as holiday_pay,
                pp.name as period_name,
                pp.start_date,
                pp.end_date
            FROM payroll.payroll_entries pe
            JOIN hr.employees e ON pe.employee_id = e.id
            LEFT JOIN hr.departments d ON e.department_id = d.id
            LEFT JOIN hr.positions pos ON e.position_id = pos.id
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
                # 计算总工时和总薪资
                total_work_hours = (
                    (row.normal_hours or 0) + 
                    (row.overtime_hours or 0) + 
                    (row.weekend_hours or 0) + 
                    (row.holiday_hours or 0)
                )
                
                total_leave_hours = (
                    (row.sick_leave_hours or 0) + 
                    (row.annual_leave_hours or 0) + 
                    (row.personal_leave_hours or 0)
                )
                
                total_pay = (
                    (row.normal_pay or 0) + 
                    (row.overtime_pay or 0) + 
                    (row.weekend_pay or 0) + 
                    (row.holiday_pay or 0)
                )
                
                # 计算出勤率
                total_scheduled_hours = total_work_hours + total_leave_hours + (row.absent_hours or 0)
                attendance_rate = (total_work_hours / total_scheduled_hours * 100) if total_scheduled_hours > 0 else 0
                
                data.append({
                    'employee_code': row.employee_code or '',
                    'employee_name': row.employee_name or '',
                    'department_name': row.department_name or '未分配部门',
                    'position_name': row.position_name or '未分配职位',
                    'period_name': row.period_name or '',
                    'normal_hours': f"{row.normal_hours or 0:.1f}",
                    'overtime_hours': f"{row.overtime_hours or 0:.1f}",
                    'weekend_hours': f"{row.weekend_hours or 0:.1f}",
                    'holiday_hours': f"{row.holiday_hours or 0:.1f}",
                    'total_work_hours': f"{total_work_hours:.1f}",
                    'sick_leave_hours': f"{row.sick_leave_hours or 0:.1f}",
                    'annual_leave_hours': f"{row.annual_leave_hours or 0:.1f}",
                    'personal_leave_hours': f"{row.personal_leave_hours or 0:.1f}",
                    'total_leave_hours': f"{total_leave_hours:.1f}",
                    'absent_hours': f"{row.absent_hours or 0:.1f}",
                    'late_times': f"{int(row.late_times or 0)}",
                    'early_leave_times': f"{int(row.early_leave_times or 0)}",
                    'attendance_rate': f"{attendance_rate:.1f}%",
                    'normal_pay': f"{row.normal_pay or 0:.2f}",
                    'overtime_pay': f"{row.overtime_pay or 0:.2f}",
                    'weekend_pay': f"{row.weekend_pay or 0:.2f}",
                    'holiday_pay': f"{row.holiday_pay or 0:.2f}",
                    'total_pay': f"{total_pay:.2f}",
                    'start_date': row.start_date.strftime('%Y-%m-%d') if row.start_date else '',
                    'end_date': row.end_date.strftime('%Y-%m-%d') if row.end_date else ''
                })
            
            self.logger.info(f"获取考勤汇总数据成功，共 {len(data)} 条记录")
            return data
            
        except Exception as e:
            self.logger.error(f"获取考勤汇总数据失败: {str(e)}")
            raise
    
    def get_columns_config(self) -> List[Dict[str, Any]]:
        """
        获取考勤汇总表列配置
        
        Returns:
            列配置列表
        """
        return [
            {'key': 'employee_code', 'title': '员工编号', 'type': 'string', 'width': 12},
            {'key': 'employee_name', 'title': '姓名', 'type': 'string', 'width': 10},
            {'key': 'department_name', 'title': '部门', 'type': 'string', 'width': 12},
            {'key': 'position_name', 'title': '职位', 'type': 'string', 'width': 12},
            {'key': 'period_name', 'title': '所属期间', 'type': 'string', 'width': 12},
            {'key': 'normal_hours', 'title': '正常工时', 'type': 'number', 'width': 10},
            {'key': 'overtime_hours', 'title': '加班工时', 'type': 'number', 'width': 10},
            {'key': 'weekend_hours', 'title': '周末工时', 'type': 'number', 'width': 10},
            {'key': 'holiday_hours', 'title': '节假日工时', 'type': 'number', 'width': 12},
            {'key': 'total_work_hours', 'title': '总工时', 'type': 'number', 'width': 10},
            {'key': 'sick_leave_hours', 'title': '病假时长', 'type': 'number', 'width': 10},
            {'key': 'annual_leave_hours', 'title': '年假时长', 'type': 'number', 'width': 10},
            {'key': 'personal_leave_hours', 'title': '事假时长', 'type': 'number', 'width': 10},
            {'key': 'total_leave_hours', 'title': '请假合计', 'type': 'number', 'width': 10},
            {'key': 'absent_hours', 'title': '缺勤时长', 'type': 'number', 'width': 10},
            {'key': 'late_times', 'title': '迟到次数', 'type': 'number', 'width': 10},
            {'key': 'early_leave_times', 'title': '早退次数', 'type': 'number', 'width': 10},
            {'key': 'attendance_rate', 'title': '出勤率', 'type': 'percentage', 'width': 10},
            {'key': 'normal_pay', 'title': '正常工资', 'type': 'currency', 'width': 12},
            {'key': 'overtime_pay', 'title': '加班费', 'type': 'currency', 'width': 10},
            {'key': 'weekend_pay', 'title': '周末加班费', 'type': 'currency', 'width': 12},
            {'key': 'holiday_pay', 'title': '节假日加班费', 'type': 'currency', 'width': 15},
            {'key': 'total_pay', 'title': '考勤工资合计', 'type': 'currency', 'width': 15},
            {'key': 'start_date', 'title': '开始日期', 'type': 'date', 'width': 12},
            {'key': 'end_date', 'title': '结束日期', 'type': 'date', 'width': 12}
        ]
    
    def get_report_title(self, config: Dict[str, Any]) -> str:
        """获取报表标题"""
        return "考勤汇总表"
    
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
        total_employees = len(data)
        total_work_hours = sum(float(row['total_work_hours']) for row in data)
        total_overtime_hours = sum(float(row['overtime_hours']) for row in data)
        total_leave_hours = sum(float(row['total_leave_hours']) for row in data)
        total_absent_hours = sum(float(row['absent_hours']) for row in data)
        total_late_times = sum(int(row['late_times']) for row in data)
        total_early_leave_times = sum(int(row['early_leave_times']) for row in data)
        total_pay = sum(float(row['total_pay']) for row in data)
        
        # 计算平均出勤率
        attendance_rates = [float(row['attendance_rate'].replace('%', '')) for row in data if row['attendance_rate'] != '0.0%']
        avg_attendance_rate = sum(attendance_rates) / len(attendance_rates) if attendance_rates else 0
        
        return {
            "统计人数": total_employees,
            "总工时": f"{total_work_hours:.1f}",
            "加班工时": f"{total_overtime_hours:.1f}",
            "请假工时": f"{total_leave_hours:.1f}",
            "缺勤工时": f"{total_absent_hours:.1f}",
            "迟到总次数": total_late_times,
            "早退总次数": total_early_leave_times,
            "平均出勤率": f"{avg_attendance_rate:.1f}%",
            "考勤工资合计": f"{total_pay:.2f}",
            "人均工时": f"{total_work_hours / total_employees:.1f}" if total_employees > 0 else "0.0",
            "人均加班工时": f"{total_overtime_hours / total_employees:.1f}" if total_employees > 0 else "0.0",
            "人均考勤工资": f"{total_pay / total_employees:.2f}" if total_employees > 0 else "0.00",
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