"""
薪资统计分析服务
提供部门成本分析、员工编制分析、工资趋势分析等功能
"""

from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import text, func, case, and_, desc, extract
from datetime import datetime, date
from decimal import Decimal
import logging

from ...pydantic_models.simple_payroll import (
    DepartmentCostAnalysisResponse,
    DepartmentCostData,
    EmployeeTypeAnalysisResponse,
    EmployeeTypeData,
    SalaryTrendAnalysisResponse,
    SalaryTrendDataPoint
)

logger = logging.getLogger(__name__)

class PayrollAnalyticsService:
    """薪资统计分析服务"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_department_cost_analysis(self, period_id: int) -> DepartmentCostAnalysisResponse:
        """
        获取部门成本分析
        基于 reports.v_payroll_basic 视图进行分析
        """
        logger.info(f"🏢 [Analytics] 开始分析期间 {period_id} 的部门成本分布")
        
        try:
            # 获取期间信息
            period_query = """
            SELECT id, name FROM payroll.payroll_periods 
            WHERE id = :period_id
            """
            period_result = self.db.execute(text(period_query), {"period_id": period_id}).first()
            
            if not period_result:
                raise ValueError(f"期间 {period_id} 不存在")
            
            period_name = period_result.name
            
            # 查询当前期间的部门成本数据
            current_query = """
            SELECT 
                部门id as department_id,
                部门名称 as department_name,
                COUNT(*) as employee_count,
                SUM(应发合计) as total_cost,
                SUM(扣除合计) as total_deductions,
                SUM(实发合计) as total_net_pay,
                AVG(应发合计) as avg_cost_per_employee,
                AVG(扣除合计) as avg_deductions_per_employee,
                AVG(实发合计) as avg_net_pay_per_employee
            FROM reports.v_payroll_basic 
            WHERE 薪资期间id = :period_id 
                AND 部门名称 IS NOT NULL
                AND 应发合计 IS NOT NULL
            GROUP BY 部门id, 部门名称
            ORDER BY total_cost DESC
            """
            
            current_results = self.db.execute(text(current_query), {"period_id": period_id}).fetchall()
            
            # 计算总成本、总扣发、总实发和总员工数
            total_cost = sum(row.total_cost or Decimal('0') for row in current_results)
            total_deductions = sum(row.total_deductions or Decimal('0') for row in current_results)
            total_net_pay = sum(row.total_net_pay or Decimal('0') for row in current_results)
            total_employees = sum(row.employee_count for row in current_results)
            
            # 查询上一期间数据用于比较
            previous_query = """
            WITH previous_period AS (
                SELECT id, name 
                FROM payroll.payroll_periods 
                WHERE start_date < (
                    SELECT start_date 
                    FROM payroll.payroll_periods 
                    WHERE id = :period_id
                )
                ORDER BY start_date DESC 
                LIMIT 1
            )
            SELECT 
                部门id as department_id,
                部门名称 as department_name,
                SUM(应发合计) as previous_cost,
                SUM(扣除合计) as previous_deductions,
                SUM(实发合计) as previous_net_pay
            FROM reports.v_payroll_basic pb
            JOIN previous_period pp ON pb.薪资期间id = pp.id
            WHERE 部门名称 IS NOT NULL
                AND 应发合计 IS NOT NULL
            GROUP BY 部门id, 部门名称
            """
            
            previous_results = self.db.execute(text(previous_query), {"period_id": period_id}).fetchall()
            previous_costs = {row.department_id: row.previous_cost for row in previous_results}
            previous_deductions = {row.department_id: row.previous_deductions for row in previous_results}
            previous_net_pays = {row.department_id: row.previous_net_pay for row in previous_results}
            
            # 构建部门成本数据
            departments = []
            for row in current_results:
                dept_cost = row.total_cost or Decimal('0')
                dept_deductions = row.total_deductions or Decimal('0')
                dept_net_pay = row.total_net_pay or Decimal('0')
                
                previous_cost = previous_costs.get(row.department_id)
                previous_deduction = previous_deductions.get(row.department_id)
                previous_net_pay = previous_net_pays.get(row.department_id)
                
                # 计算应发变化
                cost_change = None
                cost_change_rate = None
                if previous_cost:
                    cost_change = dept_cost - previous_cost
                    cost_change_rate = float(cost_change / previous_cost * 100) if previous_cost > 0 else 0
                
                # 计算实发变化
                net_pay_change = None
                net_pay_change_rate = None
                if previous_net_pay:
                    net_pay_change = dept_net_pay - previous_net_pay
                    net_pay_change_rate = float(net_pay_change / previous_net_pay * 100) if previous_net_pay > 0 else 0
                
                departments.append(DepartmentCostData(
                    department_id=row.department_id,
                    department_name=row.department_name or "未知部门",
                    current_cost=dept_cost,
                    current_deductions=dept_deductions,
                    current_net_pay=dept_net_pay,
                    previous_cost=previous_cost,
                    previous_deductions=previous_deduction,
                    previous_net_pay=previous_net_pay,
                    employee_count=row.employee_count,
                    avg_cost_per_employee=row.avg_cost_per_employee or Decimal('0'),
                    avg_deductions_per_employee=row.avg_deductions_per_employee or Decimal('0'),
                    avg_net_pay_per_employee=row.avg_net_pay_per_employee or Decimal('0'),
                    percentage=float(dept_cost / total_cost * 100) if total_cost > 0 else 0,
                    cost_change=cost_change,
                    cost_change_rate=cost_change_rate,
                    net_pay_change=net_pay_change,
                    net_pay_change_rate=net_pay_change_rate
                ))
            
            logger.info(f"✅ [Analytics] 部门成本分析完成 - 共 {len(departments)} 个部门，总成本 {total_cost}")
            
            return DepartmentCostAnalysisResponse(
                period_id=period_id,
                period_name=period_name,
                total_cost=total_cost,
                total_deductions=total_deductions,
                total_net_pay=total_net_pay,
                total_employees=total_employees,
                departments=departments
            )
            
        except Exception as e:
            logger.error(f"❌ [Analytics] 部门成本分析失败: {e}", exc_info=True)
            raise
    
    def get_employee_type_analysis(self, period_id: int) -> EmployeeTypeAnalysisResponse:
        """
        获取员工编制分析
        基于 reports.v_payroll_basic 视图进行分析
        """
        logger.info(f"👥 [Analytics] 开始分析期间 {period_id} 的员工编制分布")
        
        try:
            # 获取期间信息
            period_query = """
            SELECT id, name FROM payroll.payroll_periods 
            WHERE id = :period_id
            """
            period_result = self.db.execute(text(period_query), {"period_id": period_id}).first()
            
            if not period_result:
                raise ValueError(f"期间 {period_id} 不存在")
            
            period_name = period_result.name
            
            # 查询当前期间的员工类型数据 - 增强调试
            current_query = """
            SELECT 
                人员类别id as personnel_category_id,
                人员类别 as type_name,
                COUNT(*) as employee_count,
                SUM(COALESCE(应发合计, 0)) as total_cost,
                AVG(COALESCE(应发合计, 0)) as avg_salary,
                MIN(应发合计) as min_salary,
                MAX(应发合计) as max_salary,
                COUNT(CASE WHEN 应发合计 > 0 THEN 1 END) as non_zero_salary_count
            FROM reports.v_payroll_basic 
            WHERE 薪资期间id = :period_id 
                AND 人员类别 IS NOT NULL
            GROUP BY 人员类别id, 人员类别
            ORDER BY employee_count DESC
            """
            
            current_results = self.db.execute(text(current_query), {"period_id": period_id}).fetchall()
            
            # 调试：检查查询结果
            logger.info(f"👥 [Analytics] 查询到 {len(current_results)} 个编制类型")
            for i, row in enumerate(current_results):
                logger.info(f"👥 [Analytics] 编制类型 {i}: {row.type_name}, 人数: {row.employee_count}, "
                          f"总成本: {row.total_cost}, 平均工资: {row.avg_salary}, "
                          f"工资范围: {row.min_salary}-{row.max_salary}, 有工资人数: {row.non_zero_salary_count}")
            
            # 计算总成本和总员工数
            total_cost = sum(row.total_cost or Decimal('0') for row in current_results)
            total_employees = sum(row.employee_count for row in current_results)
            
            # 查询上一期间数据用于比较
            previous_query = """
            WITH previous_period AS (
                SELECT id, name 
                FROM payroll.payroll_periods 
                WHERE start_date < (
                    SELECT start_date 
                    FROM payroll.payroll_periods 
                    WHERE id = :period_id
                )
                ORDER BY start_date DESC 
                LIMIT 1
            )
            SELECT 
                人员类别id as personnel_category_id,
                COUNT(*) as previous_count
            FROM reports.v_payroll_basic pb
            JOIN previous_period pp ON pb.薪资期间id = pp.id
            WHERE 人员类别 IS NOT NULL
            GROUP BY 人员类别id
            """
            
            previous_results = self.db.execute(text(previous_query), {"period_id": period_id}).fetchall()
            previous_counts = {row.personnel_category_id: row.previous_count for row in previous_results}
            
            # 构建员工类型数据
            employee_types = []
            for row in current_results:
                type_cost = row.total_cost or Decimal('0')
                previous_count = previous_counts.get(row.personnel_category_id)
                
                # 计算人数变化（简化处理，实际中可能需要更复杂的逻辑）
                count_change = None
                if previous_count:
                    count_change = row.employee_count - previous_count
                
                employee_types.append(EmployeeTypeData(
                    personnel_category_id=row.personnel_category_id,
                    type_name=row.type_name or "未知类型",
                    employee_count=row.employee_count,
                    percentage=float(row.employee_count / total_employees * 100) if total_employees > 0 else 0,
                    avg_salary=row.avg_salary or Decimal('0'),
                    total_cost=type_cost,
                    previous_count=previous_count,
                    count_change=count_change,
                    # 新入职和离职数据暂时设为 None，需要更复杂的查询
                    new_hires=None,
                    departures=None
                ))
            
            logger.info(f"✅ [Analytics] 员工编制分析完成 - 共 {len(employee_types)} 种类型，总员工 {total_employees}")
            
            return EmployeeTypeAnalysisResponse(
                period_id=period_id,
                period_name=period_name,
                total_employees=total_employees,
                total_cost=total_cost,
                employee_types=employee_types
            )
            
        except Exception as e:
            logger.error(f"❌ [Analytics] 员工编制分析失败: {e}", exc_info=True)
            raise
    
    def get_salary_trend_analysis(self, months: int = 12) -> SalaryTrendAnalysisResponse:
        """
        获取工资趋势分析
        基于 reports.v_payroll_summary_analysis 视图进行分析
        """
        logger.info(f"📈 [Analytics] 开始分析最近 {months} 个月的工资趋势")
        
        try:
            # 查询趋势数据
            trend_query = """
            SELECT 
                period_id,
                period_name,
                start_date,
                total_employees as employee_count,
                total_gross_pay as gross_salary,
                total_deductions as deductions,
                total_net_pay as net_salary,
                avg_gross_pay as avg_gross_salary,
                avg_net_pay as avg_net_salary
            FROM reports.v_payroll_summary_analysis
            WHERE start_date >= CURRENT_DATE - INTERVAL '%s months'
            ORDER BY start_date DESC
            LIMIT %s
            """ % (months, months)
            
            results = self.db.execute(text(trend_query)).fetchall()
            
            # 构建趋势数据点
            data_points = []
            for row in results:
                # 提取年月
                if row.start_date:
                    year_month = row.start_date.strftime('%Y-%m')
                else:
                    year_month = "未知"
                
                data_points.append(SalaryTrendDataPoint(
                    period_id=row.period_id,
                    period_name=row.period_name or "未知期间",
                    year_month=year_month,
                    employee_count=row.employee_count or 0,
                    gross_salary=row.gross_salary or Decimal('0'),
                    deductions=row.deductions or Decimal('0'),
                    net_salary=row.net_salary or Decimal('0'),
                    avg_gross_salary=row.avg_gross_salary or Decimal('0'),
                    avg_net_salary=row.avg_net_salary or Decimal('0')
                ))
            
            # 计算趋势摘要
            trend_summary = self._calculate_trend_summary(data_points)
            
            logger.info(f"✅ [Analytics] 工资趋势分析完成 - 共 {len(data_points)} 个数据点")
            
            return SalaryTrendAnalysisResponse(
                time_range=f"{months}months",
                data_points=data_points,
                trend_summary=trend_summary
            )
            
        except Exception as e:
            logger.error(f"❌ [Analytics] 工资趋势分析失败: {e}", exc_info=True)
            raise
    
    def _calculate_trend_summary(self, data_points: List[SalaryTrendDataPoint]) -> Dict[str, Any]:
        """计算趋势摘要统计"""
        if not data_points:
            return {}
        
        try:
            # 排序数据点（按时间）
            sorted_points = sorted(data_points, key=lambda x: x.year_month)
            
            if len(sorted_points) < 2:
                return {"message": "数据点不足，无法计算趋势"}
            
            # 计算总体趋势
            first_point = sorted_points[0]
            last_point = sorted_points[-1]
            
            # 应发工资趋势
            gross_change = last_point.gross_salary - first_point.gross_salary
            gross_change_rate = float(gross_change / first_point.gross_salary * 100) if first_point.gross_salary > 0 else 0
            
            # 实发工资趋势
            net_change = last_point.net_salary - first_point.net_salary
            net_change_rate = float(net_change / first_point.net_salary * 100) if first_point.net_salary > 0 else 0
            
            # 员工数量趋势
            employee_change = last_point.employee_count - first_point.employee_count
            employee_change_rate = float(employee_change / first_point.employee_count * 100) if first_point.employee_count > 0 else 0
            
            return {
                "period_count": len(sorted_points),
                "start_period": first_point.period_name,
                "end_period": last_point.period_name,
                "gross_salary_trend": {
                    "start_value": float(first_point.gross_salary),
                    "end_value": float(last_point.gross_salary),
                    "change": float(gross_change),
                    "change_rate": round(gross_change_rate, 2)
                },
                "net_salary_trend": {
                    "start_value": float(first_point.net_salary),
                    "end_value": float(last_point.net_salary),
                    "change": float(net_change),
                    "change_rate": round(net_change_rate, 2)
                },
                "employee_count_trend": {
                    "start_value": first_point.employee_count,
                    "end_value": last_point.employee_count,
                    "change": employee_change,
                    "change_rate": round(employee_change_rate, 2)
                }
            }
            
        except Exception as e:
            logger.warning(f"⚠️ [Analytics] 计算趋势摘要失败: {e}")
            return {"error": "计算趋势摘要失败"}