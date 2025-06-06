"""
工资报表生成服务模块
提供各类工资报表的快速生成功能
"""

from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, text
from datetime import datetime
from decimal import Decimal
import logging

from ...models import (
    PayrollRun, PayrollEntry, Employee, PayrollPeriod,
    Department, Position, PayrollComponentDefinition
)
from ...pydantic_models.simple_payroll import (
    ReportGenerationRequest
)
from ...pydantic_models.config import (
    ReportTemplateResponse
)

logger = logging.getLogger(__name__)

class PayrollReportService:
    """工资报表生成服务"""
    
    def __init__(self, db: Session):
        self.db = db
        # 预定义的报表模板
        self._report_templates = {
            'payroll_summary': {
                'name': '工资汇总表',
                'description': '按部门统计的工资汇总信息',
                'category': 'summary'
            },
            'detailed_payroll': {
                'name': '工资明细表',
                'description': '详细的员工工资明细清单',
                'category': 'detail'
            },
            'tax_summary': {
                'name': '个税汇总表',
                'description': '个人所得税扣缴汇总',
                'category': 'tax'
            },
            'social_security_summary': {
                'name': '社保汇总表',
                'description': '社会保险费汇总统计',
                'category': 'social_security'
            },
            'bank_transfer': {
                'name': '银行代发清单',
                'description': '用于银行代发工资的清单',
                'category': 'transfer'
            },
            'cost_center_analysis': {
                'name': '成本中心分析',
                'description': '按成本中心分析的人工成本',
                'category': 'analysis'
            }
        }
    
    def get_available_report_templates(self) -> List[ReportTemplateResponse]:
        """获取可用的报表模板列表"""
        templates = []
        
        for template_id, template_info in self._report_templates.items():
            templates.append(ReportTemplateResponse(
                id=template_id,
                name=template_info['name'],
                description=template_info['description'],
                category=template_info['category'],
                parameters=[],  # 实际应该根据报表类型返回所需参数
                estimated_rows=0  # 实际应该根据数据估算行数
            ))
        
        return templates
    
    def generate_report(self, request: ReportGenerationRequest) -> Dict[str, Any]:
        """生成报表数据"""
        try:
            # 验证报表模板是否存在
            if request.template_id not in self._report_templates:
                raise ValueError(f"报表模板 {request.template_id} 不存在")
            
            # 验证工资运行是否存在
            payroll_run = self.db.query(PayrollRun).filter(
                PayrollRun.id == request.payroll_run_id
            ).first()
            
            if not payroll_run:
                raise ValueError(f"工资运行 {request.payroll_run_id} 不存在")
            
            # 根据模板类型生成不同的报表
            if request.template_id == 'payroll_summary':
                return self._generate_payroll_summary(request)
            elif request.template_id == 'detailed_payroll':
                return self._generate_detailed_payroll(request)
            elif request.template_id == 'tax_summary':
                return self._generate_tax_summary(request)
            elif request.template_id == 'social_security_summary':
                return self._generate_social_security_summary(request)
            elif request.template_id == 'bank_transfer':
                return self._generate_bank_transfer_list(request)
            elif request.template_id == 'cost_center_analysis':
                return self._generate_cost_center_analysis(request)
            else:
                raise ValueError(f"报表模板 {request.template_id} 暂未实现")
                
        except Exception as e:
            logger.error(f"生成报表失败: {e}", exc_info=True)
            raise
    
    def _generate_payroll_summary(self, request: ReportGenerationRequest) -> Dict[str, Any]:
        """生成工资汇总表"""
        try:
            # 构建查询
            query = """
            SELECT 
                d.name as department_name,
                COUNT(pe.id) as employee_count,
                COALESCE(SUM(pe.gross_pay), 0) as total_gross_pay,
                COALESCE(SUM(pe.net_pay), 0) as total_net_pay,
                COALESCE(SUM(pe.gross_pay - pe.net_pay), 0) as total_deductions,
                COALESCE(AVG(pe.gross_pay), 0) as avg_gross_pay,
                COALESCE(AVG(pe.net_pay), 0) as avg_net_pay
            FROM payroll.payroll_entries pe
            JOIN hr.employees e ON pe.employee_id = e.id
            LEFT JOIN hr.departments d ON e.department_id = d.id
            WHERE pe.payroll_run_id = :payroll_run_id
            GROUP BY d.name
            ORDER BY d.name
            """
            
            result = self.db.execute(text(query), {'payroll_run_id': request.payroll_run_id})
            rows = result.fetchall()
            
            # 转换为字典格式
            data = []
            total_employees = 0
            total_gross = Decimal('0.00')
            total_net = Decimal('0.00')
            
            for row in rows:
                department_data = {
                    'department_name': row.department_name or '未分配部门',
                    'employee_count': row.employee_count,
                    'total_gross_pay': f"{row.total_gross_pay:.2f}",
                    'total_net_pay': f"{row.total_net_pay:.2f}",
                    'total_deductions': f"{row.total_deductions:.2f}",
                    'avg_gross_pay': f"{row.avg_gross_pay:.2f}",
                    'avg_net_pay': f"{row.avg_net_pay:.2f}"
                }
                data.append(department_data)
                
                total_employees += row.employee_count
                total_gross += Decimal(str(row.total_gross_pay))
                total_net += Decimal(str(row.total_net_pay))
            
            return {
                'template_id': request.template_id,
                'template_name': '工资汇总表',
                'generated_at': datetime.now().isoformat(),
                'total_rows': len(data),
                'summary': {
                    'total_employees': total_employees,
                    'total_gross_pay': f"{total_gross:.2f}",
                    'total_net_pay': f"{total_net:.2f}",
                    'total_deductions': f"{total_gross - total_net:.2f}"
                },
                'columns': [
                    {'key': 'department_name', 'title': '部门名称', 'type': 'string'},
                    {'key': 'employee_count', 'title': '人数', 'type': 'number'},
                    {'key': 'total_gross_pay', 'title': '应发工资', 'type': 'currency'},
                    {'key': 'total_net_pay', 'title': '实发工资', 'type': 'currency'},
                    {'key': 'total_deductions', 'title': '扣除合计', 'type': 'currency'},
                    {'key': 'avg_gross_pay', 'title': '平均应发', 'type': 'currency'},
                    {'key': 'avg_net_pay', 'title': '平均实发', 'type': 'currency'}
                ],
                'data': data
            }
            
        except Exception as e:
            logger.error(f"生成工资汇总表失败: {e}")
            raise
    
    def _generate_detailed_payroll(self, request: ReportGenerationRequest) -> Dict[str, Any]:
        """生成工资明细表"""
        try:
            # 构建查询
            query = """
            SELECT 
                e.employee_code,
                e.last_name || e.first_name as employee_name,
                d.name as department_name,
                p.name as position_name,
                pe.gross_pay,
                pe.net_pay,
                pe.earnings_details,
                pe.deductions_details
            FROM payroll.payroll_entries pe
            JOIN hr.employees e ON pe.employee_id = e.id
            LEFT JOIN hr.departments d ON e.department_id = d.id
            LEFT JOIN hr.positions p ON e.actual_position_id = p.id
            WHERE pe.payroll_run_id = :payroll_run_id
            ORDER BY d.name, e.employee_code
            """
            
            result = self.db.execute(text(query), {'payroll_run_id': request.payroll_run_id})
            rows = result.fetchall()
            
            # 获取薪资组件定义用于列标题
            earnings_components = self._get_payroll_components('EARNING')
            deductions_components = self._get_payroll_components('DEDUCTION')
            
            # 构建动态列
            columns = [
                {'key': 'employee_code', 'title': '员工编号', 'type': 'string'},
                {'key': 'employee_name', 'title': '姓名', 'type': 'string'},
                {'key': 'department_name', 'title': '部门', 'type': 'string'},
                {'key': 'position_name', 'title': '岗位', 'type': 'string'}
            ]
            
            # 添加收入项列
            for component in earnings_components:
                columns.append({
                    'key': f'earning_{component["code"]}',
                    'title': component['name'],
                    'type': 'currency'
                })
            
            columns.append({'key': 'gross_pay', 'title': '应发合计', 'type': 'currency'})
            
            # 添加扣除项列
            for component in deductions_components:
                columns.append({
                    'key': f'deduction_{component["code"]}',
                    'title': component['name'],
                    'type': 'currency'
                })
            
            columns.append({'key': 'net_pay', 'title': '实发工资', 'type': 'currency'})
            
            # 转换数据
            data = []
            for row in rows:
                row_data = {
                    'employee_code': row.employee_code or '',
                    'employee_name': row.employee_name or '',
                    'department_name': row.department_name or '',
                    'position_name': row.position_name or '',
                    'gross_pay': f"{row.gross_pay or 0:.2f}",
                    'net_pay': f"{row.net_pay or 0:.2f}"
                }
                
                # 添加收入明细
                earnings_details = row.earnings_details or {}
                for component in earnings_components:
                    key = f'earning_{component["code"]}'
                    value = earnings_details.get(component['code'], 0)
                    row_data[key] = f"{value:.2f}"
                
                # 添加扣除明细
                deductions_details = row.deductions_details or {}
                for component in deductions_components:
                    key = f'deduction_{component["code"]}'
                    value = deductions_details.get(component['code'], 0)
                    row_data[key] = f"{value:.2f}"
                
                data.append(row_data)
            
            return {
                'template_id': request.template_id,
                'template_name': '工资明细表',
                'generated_at': datetime.now().isoformat(),
                'total_rows': len(data),
                'columns': columns,
                'data': data
            }
            
        except Exception as e:
            logger.error(f"生成工资明细表失败: {e}")
            raise
    
    def _generate_tax_summary(self, request: ReportGenerationRequest) -> Dict[str, Any]:
        """生成个税汇总表"""
        try:
            query = """
            SELECT 
                d.name as department_name,
                COUNT(pe.id) as employee_count,
                COALESCE(SUM((pe.deductions_details->>'personal_income_tax')::numeric), 0) as total_tax,
                COALESCE(AVG((pe.deductions_details->>'personal_income_tax')::numeric), 0) as avg_tax,
                COALESCE(SUM(pe.gross_pay), 0) as total_taxable_income
            FROM payroll.payroll_entries pe
            JOIN hr.employees e ON pe.employee_id = e.id
            LEFT JOIN hr.departments d ON e.department_id = d.id
            WHERE pe.payroll_run_id = :payroll_run_id
            AND pe.deductions_details->>'personal_income_tax' IS NOT NULL
            GROUP BY d.name
            ORDER BY total_tax DESC
            """
            
            result = self.db.execute(text(query), {'payroll_run_id': request.payroll_run_id})
            rows = result.fetchall()
            
            data = []
            total_tax = Decimal('0.00')
            
            for row in rows:
                department_data = {
                    'department_name': row.department_name or '未分配部门',
                    'employee_count': row.employee_count,
                    'total_tax': f"{row.total_tax:.2f}",
                    'avg_tax': f"{row.avg_tax:.2f}",
                    'total_taxable_income': f"{row.total_taxable_income:.2f}",
                    'tax_rate': f"{(row.total_tax / row.total_taxable_income * 100) if row.total_taxable_income > 0 else 0:.2f}%"
                }
                data.append(department_data)
                total_tax += Decimal(str(row.total_tax))
            
            return {
                'template_id': request.template_id,
                'template_name': '个税汇总表',
                'generated_at': datetime.now().isoformat(),
                'total_rows': len(data),
                'summary': {
                    'total_tax': f"{total_tax:.2f}"
                },
                'columns': [
                    {'key': 'department_name', 'title': '部门名称', 'type': 'string'},
                    {'key': 'employee_count', 'title': '纳税人数', 'type': 'number'},
                    {'key': 'total_tax', 'title': '税额合计', 'type': 'currency'},
                    {'key': 'avg_tax', 'title': '平均税额', 'type': 'currency'},
                    {'key': 'total_taxable_income', 'title': '应税收入', 'type': 'currency'},
                    {'key': 'tax_rate', 'title': '平均税率', 'type': 'percentage'}
                ],
                'data': data
            }
            
        except Exception as e:
            logger.error(f"生成个税汇总表失败: {e}")
            raise
    
    def _generate_social_security_summary(self, request: ReportGenerationRequest) -> Dict[str, Any]:
        """生成社保汇总表"""
        try:
            query = """
            SELECT 
                d.name as department_name,
                COUNT(pe.id) as employee_count,
                COALESCE(SUM((pe.deductions_details->>'pension_personal')::numeric), 0) as pension_personal,
                COALESCE(SUM((pe.deductions_details->>'medical_personal')::numeric), 0) as medical_personal,
                COALESCE(SUM((pe.deductions_details->>'unemployment_personal')::numeric), 0) as unemployment_personal,
                COALESCE(SUM((pe.deductions_details->>'housing_fund_personal')::numeric), 0) as housing_fund_personal
            FROM payroll.payroll_entries pe
            JOIN hr.employees e ON pe.employee_id = e.id
            LEFT JOIN hr.departments d ON e.department_id = d.id
            WHERE pe.payroll_run_id = :payroll_run_id
            GROUP BY d.name
            ORDER BY d.name
            """
            
            result = self.db.execute(text(query), {'payroll_run_id': request.payroll_run_id})
            rows = result.fetchall()
            
            data = []
            totals = {
                'pension_personal': Decimal('0.00'),
                'medical_personal': Decimal('0.00'),
                'unemployment_personal': Decimal('0.00'),
                'housing_fund_personal': Decimal('0.00')
            }
            
            for row in rows:
                pension = Decimal(str(row.pension_personal or 0))
                medical = Decimal(str(row.medical_personal or 0))
                unemployment = Decimal(str(row.unemployment_personal or 0))
                housing_fund = Decimal(str(row.housing_fund_personal or 0))
                total = pension + medical + unemployment + housing_fund
                
                department_data = {
                    'department_name': row.department_name or '未分配部门',
                    'employee_count': row.employee_count,
                    'pension_personal': f"{pension:.2f}",
                    'medical_personal': f"{medical:.2f}",
                    'unemployment_personal': f"{unemployment:.2f}",
                    'housing_fund_personal': f"{housing_fund:.2f}",
                    'total_social_security': f"{total:.2f}"
                }
                data.append(department_data)
                
                # 累计到总计
                totals['pension_personal'] += pension
                totals['medical_personal'] += medical
                totals['unemployment_personal'] += unemployment
                totals['housing_fund_personal'] += housing_fund
            
            return {
                'template_id': request.template_id,
                'template_name': '社保汇总表',
                'generated_at': datetime.now().isoformat(),
                'total_rows': len(data),
                'summary': {
                    'total_pension': f"{totals['pension_personal']:.2f}",
                    'total_medical': f"{totals['medical_personal']:.2f}",
                    'total_unemployment': f"{totals['unemployment_personal']:.2f}",
                    'total_housing_fund': f"{totals['housing_fund_personal']:.2f}",
                    'grand_total': f"{sum(totals.values()):.2f}"
                },
                'columns': [
                    {'key': 'department_name', 'title': '部门名称', 'type': 'string'},
                    {'key': 'employee_count', 'title': '人数', 'type': 'number'},
                    {'key': 'pension_personal', 'title': '养老保险', 'type': 'currency'},
                    {'key': 'medical_personal', 'title': '医疗保险', 'type': 'currency'},
                    {'key': 'unemployment_personal', 'title': '失业保险', 'type': 'currency'},
                    {'key': 'housing_fund_personal', 'title': '住房公积金', 'type': 'currency'},
                    {'key': 'total_social_security', 'title': '社保合计', 'type': 'currency'}
                ],
                'data': data
            }
            
        except Exception as e:
            logger.error(f"生成社保汇总表失败: {e}")
            raise
    
    def _generate_bank_transfer_list(self, request: ReportGenerationRequest) -> Dict[str, Any]:
        """生成银行代发清单"""
        try:
            query = """
            SELECT 
                e.employee_code,
                e.last_name || e.first_name as employee_name,
                e.bank_account_number,
                e.bank_name,
                pe.net_pay
            FROM payroll.payroll_entries pe
            JOIN hr.employees e ON pe.employee_id = e.id
            WHERE pe.payroll_run_id = :payroll_run_id
            AND pe.net_pay > 0
            ORDER BY e.employee_code
            """
            
            result = self.db.execute(text(query), {'payroll_run_id': request.payroll_run_id})
            rows = result.fetchall()
            
            data = []
            total_amount = Decimal('0.00')
            
            for row in rows:
                net_pay = Decimal(str(row.net_pay or 0))
                
                row_data = {
                    'employee_code': row.employee_code or '',
                    'employee_name': row.employee_name or '',
                    'bank_account_number': row.bank_account_number or '',
                    'bank_name': row.bank_name or '',
                    'net_pay': f"{net_pay:.2f}"
                }
                data.append(row_data)
                total_amount += net_pay
            
            return {
                'template_id': request.template_id,
                'template_name': '银行代发清单',
                'generated_at': datetime.now().isoformat(),
                'total_rows': len(data),
                'summary': {
                    'total_transfer_amount': f"{total_amount:.2f}",
                    'total_transfer_count': len(data)
                },
                'columns': [
                    {'key': 'employee_code', 'title': '员工编号', 'type': 'string'},
                    {'key': 'employee_name', 'title': '姓名', 'type': 'string'},
                    {'key': 'bank_account_number', 'title': '银行账号', 'type': 'string'},
                    {'key': 'bank_name', 'title': '开户银行', 'type': 'string'},
                    {'key': 'net_pay', 'title': '实发金额', 'type': 'currency'}
                ],
                'data': data
            }
            
        except Exception as e:
            logger.error(f"生成银行代发清单失败: {e}")
            raise
    
    def _generate_cost_center_analysis(self, request: ReportGenerationRequest) -> Dict[str, Any]:
        """生成成本中心分析报表"""
        try:
            # 这里简化为按部门分析，实际应该根据成本中心字段
            query = """
            SELECT 
                d.name as cost_center,
                COUNT(pe.id) as employee_count,
                COALESCE(SUM(pe.gross_pay), 0) as total_labor_cost,
                COALESCE(AVG(pe.gross_pay), 0) as avg_labor_cost,
                COALESCE(SUM((pe.deductions_details->>'pension_employer')::numeric), 0) +
                COALESCE(SUM((pe.deductions_details->>'medical_employer')::numeric), 0) +
                COALESCE(SUM((pe.deductions_details->>'unemployment_employer')::numeric), 0) +
                COALESCE(SUM((pe.deductions_details->>'housing_fund_employer')::numeric), 0) as employer_contributions
            FROM payroll.payroll_entries pe
            JOIN hr.employees e ON pe.employee_id = e.id
            LEFT JOIN hr.departments d ON e.department_id = d.id
            WHERE pe.payroll_run_id = :payroll_run_id
            GROUP BY d.name
            ORDER BY total_labor_cost DESC
            """
            
            result = self.db.execute(text(query), {'payroll_run_id': request.payroll_run_id})
            rows = result.fetchall()
            
            data = []
            total_cost = Decimal('0.00')
            
            for row in rows:
                labor_cost = Decimal(str(row.total_labor_cost or 0))
                employer_contrib = Decimal(str(row.employer_contributions or 0))
                total_center_cost = labor_cost + employer_contrib
                
                row_data = {
                    'cost_center': row.cost_center or '未分配',
                    'employee_count': row.employee_count,
                    'total_labor_cost': f"{labor_cost:.2f}",
                    'employer_contributions': f"{employer_contrib:.2f}",
                    'total_cost': f"{total_center_cost:.2f}",
                    'avg_labor_cost': f"{row.avg_labor_cost or 0:.2f}",
                    'cost_per_employee': f"{total_center_cost / row.employee_count if row.employee_count > 0 else 0:.2f}"
                }
                data.append(row_data)
                total_cost += total_center_cost
            
            return {
                'template_id': request.template_id,
                'template_name': '成本中心分析',
                'generated_at': datetime.now().isoformat(),
                'total_rows': len(data),
                'summary': {
                    'total_cost': f"{total_cost:.2f}"
                },
                'columns': [
                    {'key': 'cost_center', 'title': '成本中心', 'type': 'string'},
                    {'key': 'employee_count', 'title': '人数', 'type': 'number'},
                    {'key': 'total_labor_cost', 'title': '人工成本', 'type': 'currency'},
                    {'key': 'employer_contributions', 'title': '雇主缴费', 'type': 'currency'},
                    {'key': 'total_cost', 'title': '总成本', 'type': 'currency'},
                    {'key': 'avg_labor_cost', 'title': '平均人工成本', 'type': 'currency'},
                    {'key': 'cost_per_employee', 'title': '人均总成本', 'type': 'currency'}
                ],
                'data': data
            }
            
        except Exception as e:
            logger.error(f"生成成本中心分析失败: {e}")
            raise
    
    def _get_payroll_components(self, component_type: str) -> List[Dict[str, str]]:
        """获取薪资组件定义"""
        try:
            components = self.db.query(PayrollComponentDefinition).filter(
                PayrollComponentDefinition.component_type == component_type,
                PayrollComponentDefinition.is_active == True
            ).order_by(PayrollComponentDefinition.display_order).all()
            
            return [
                {
                    'code': comp.code,
                    'name': comp.name,
                    'type': comp.component_type
                }
                for comp in components
            ]
            
        except Exception as e:
            logger.error(f"获取薪资组件失败: {e}")
            return [] 