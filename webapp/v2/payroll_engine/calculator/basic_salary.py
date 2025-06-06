"""
基础薪资计算器
"""

from decimal import Decimal
from typing import Dict, Any, List
from .base import BaseCalculator, ConfigurableCalculator
from ..models import CalculationContext, ComponentCalculationResult, CalculationMethod, ComponentType
from ..exceptions import PayrollCalculationError, MissingDataError


class BasicSalaryCalculator(ConfigurableCalculator):
    """基础薪资计算器"""
    
    def __init__(self, config: Dict[str, Any] = None):
        super().__init__(
            component_code="BASIC_SALARY",
            component_name="基本工资",
            component_type=ComponentType.EARNING,
            config=config or {}
        )
    
    def get_required_config_keys(self) -> List[str]:
        return []  # 基础薪资可以从员工数据中获取
    
    def calculate(self, context: CalculationContext) -> ComponentCalculationResult:
        """计算基础薪资"""
        self.validate_context(context)
        
        # 获取基础薪资
        base_salary = self.get_base_salary(context)
        
        # 根据考勤情况计算实际薪资
        if context.attendance_data and self.get_config_value('use_attendance', True):
            actual_salary = self.calculate_attendance_based_salary(base_salary, context)
            method = CalculationMethod.ATTENDANCE_BASED
        else:
            actual_salary = base_salary
            method = CalculationMethod.FIXED_AMOUNT
        
        details = {
            'base_salary': float(base_salary),
            'attendance_applied': context.attendance_data is not None and self.get_config_value('use_attendance', True)
        }
        
        log_messages = [f"基础薪资: {base_salary}"]
        
        if context.attendance_data:
            details.update({
                'work_days': context.attendance_data.work_days,
                'standard_work_days': context.attendance_data.standard_work_days,
                'attendance_rate': float(context.attendance_data.attendance_rate)
            })
            log_messages.append(f"考勤调整后薪资: {actual_salary}")
        
        return self.create_result(
            amount=self.round_amount(actual_salary),
            method=method,
            details=details,
            log_messages=log_messages
        )
    
    def get_base_salary(self, context: CalculationContext) -> Decimal:
        """获取基础薪资"""
        # 首先从薪资配置中获取基础薪资
        if context.salary_config and 'basic_salary' in context.salary_config:
            salary = context.salary_config['basic_salary']
            if salary is not None:
                return Decimal(str(salary))
        
        # 从员工数据中获取基础薪资
        salary_fields = ['basic_salary', 'base_salary', 'monthly_salary']
        
        for field in salary_fields:
            salary = self.get_employee_field(context, field)
            if salary is not None:
                return Decimal(str(salary))
        
        # 如果员工数据中没有，尝试从配置中获取
        default_salary = self.get_config_value('default_salary')
        if default_salary is not None:
            return Decimal(str(default_salary))
        
        raise MissingDataError(
            "无法获取员工基础薪资",
            employee_id=context.employee_id,
            component=self.component_code
        )
    
    def calculate_attendance_based_salary(self, base_salary: Decimal, context: CalculationContext) -> Decimal:
        """基于考勤计算薪资"""
        attendance = context.attendance_data
        
        # 按出勤率计算
        return self.calculate_prorated_amount(
            base_salary,
            attendance.work_days,
            attendance.standard_work_days
        )


class AllowanceCalculator(ConfigurableCalculator):
    """津贴计算器"""
    
    def __init__(self, component_code: str, component_name: str, config: Dict[str, Any]):
        super().__init__(component_code, component_name, ComponentType.EARNING, config)
    
    def get_required_config_keys(self) -> List[str]:
        return ['calculation_method']
    
    def calculate(self, context: CalculationContext) -> ComponentCalculationResult:
        """计算津贴"""
        self.validate_context(context)
        self.validate_config()
        
        method_name = self.get_config_value('calculation_method')
        
        if method_name == 'fixed':
            return self.calculate_fixed_allowance(context)
        elif method_name == 'percentage':
            return self.calculate_percentage_allowance(context)
        elif method_name == 'attendance_based':
            return self.calculate_attendance_based_allowance(context)
        else:
            raise PayrollCalculationError(
                f"不支持的津贴计算方法: {method_name}",
                employee_id=context.employee_id,
                component=self.component_code
            )
    
    def calculate_fixed_allowance(self, context: CalculationContext) -> ComponentCalculationResult:
        """计算固定津贴"""
        amount = Decimal(str(self.get_config_value('amount', 0)))
        
        details = {
            'calculation_method': 'fixed',
            'configured_amount': float(amount)
        }
        
        log_messages = [f"固定津贴: {amount}"]
        
        return self.create_result(
            amount=self.round_amount(amount),
            method=CalculationMethod.FIXED_AMOUNT,
            details=details,
            log_messages=log_messages
        )
    
    def calculate_percentage_allowance(self, context: CalculationContext) -> ComponentCalculationResult:
        """计算百分比津贴"""
        percentage = Decimal(str(self.get_config_value('percentage', 0)))
        base_component = self.get_config_value('base_component', 'BASIC_SALARY')
        
        # 获取基础金额
        base_amount = context.get_calculated_amount(base_component)
        if base_amount == 0:
            # 如果还没有计算基础组件，尝试从员工数据获取
            base_amount = Decimal(str(self.get_employee_field(context, 'basic_salary', 0)))
        
        amount = self.apply_percentage(base_amount, percentage)
        
        details = {
            'calculation_method': 'percentage',
            'percentage': float(percentage),
            'base_component': base_component,
            'base_amount': float(base_amount)
        }
        
        log_messages = [
            f"基础金额: {base_amount}",
            f"津贴比例: {percentage}%",
            f"津贴金额: {amount}"
        ]
        
        return self.create_result(
            amount=self.round_amount(amount),
            method=CalculationMethod.PERCENTAGE,
            details=details,
            log_messages=log_messages
        )
    
    def calculate_attendance_based_allowance(self, context: CalculationContext) -> ComponentCalculationResult:
        """计算基于考勤的津贴"""
        if not context.attendance_data:
            raise MissingDataError(
                "计算考勤津贴需要考勤数据",
                employee_id=context.employee_id,
                component=self.component_code
            )
        
        base_amount = Decimal(str(self.get_config_value('base_amount', 0)))
        
        # 按出勤率计算
        amount = self.calculate_prorated_amount(
            base_amount,
            context.attendance_data.work_days,
            context.attendance_data.standard_work_days
        )
        
        details = {
            'calculation_method': 'attendance_based',
            'base_amount': float(base_amount),
            'work_days': context.attendance_data.work_days,
            'standard_work_days': context.attendance_data.standard_work_days,
            'attendance_rate': float(context.attendance_data.attendance_rate)
        }
        
        log_messages = [
            f"基础津贴: {base_amount}",
            f"出勤天数: {context.attendance_data.work_days}/{context.attendance_data.standard_work_days}",
            f"按比例津贴: {amount}"
        ]
        
        return self.create_result(
            amount=self.round_amount(amount),
            method=CalculationMethod.ATTENDANCE_BASED,
            details=details,
            log_messages=log_messages
        )


class OvertimeCalculator(ConfigurableCalculator):
    """加班费计算器"""
    
    def __init__(self, config: Dict[str, Any] = None):
        super().__init__(
            component_code="OVERTIME_PAY",
            component_name="加班费",
            component_type=ComponentType.EARNING,
            config=config or {}
        )
    
    def get_required_config_keys(self) -> List[str]:
        return ['hourly_rate_multiplier']
    
    def calculate(self, context: CalculationContext) -> ComponentCalculationResult:
        """计算加班费"""
        self.validate_context(context)
        
        if not context.attendance_data or context.attendance_data.overtime_hours <= 0:
            return self.create_result(
                amount=Decimal('0'),
                method=CalculationMethod.ATTENDANCE_BASED,
                details={'overtime_hours': 0},
                log_messages=["无加班时间"]
            )
        
        # 计算小时工资
        hourly_rate = self.calculate_hourly_rate(context)
        
        # 加班费倍数
        multiplier = Decimal(str(self.get_config_value('hourly_rate_multiplier', 1.5)))
        
        # 计算加班费
        overtime_amount = hourly_rate * multiplier * context.attendance_data.overtime_hours
        
        details = {
            'overtime_hours': float(context.attendance_data.overtime_hours),
            'hourly_rate': float(hourly_rate),
            'multiplier': float(multiplier),
            'calculation': f"{hourly_rate} * {multiplier} * {context.attendance_data.overtime_hours}"
        }
        
        log_messages = [
            f"加班时间: {context.attendance_data.overtime_hours}小时",
            f"小时工资: {hourly_rate}",
            f"加班倍数: {multiplier}",
            f"加班费: {overtime_amount}"
        ]
        
        return self.create_result(
            amount=self.round_amount(overtime_amount),
            method=CalculationMethod.ATTENDANCE_BASED,
            details=details,
            log_messages=log_messages
        )
    
    def calculate_hourly_rate(self, context: CalculationContext) -> Decimal:
        """计算小时工资"""
        # 获取月薪
        monthly_salary = context.get_calculated_amount('BASIC_SALARY')
        if monthly_salary == 0:
            monthly_salary = Decimal(str(self.get_employee_field(context, 'basic_salary', 0)))
        
        # 标准工作小时数（每月）
        standard_hours = Decimal(str(self.get_config_value('standard_monthly_hours', 174)))  # 21.75天 * 8小时
        
        if standard_hours <= 0:
            raise PayrollCalculationError(
                "标准工作小时数必须大于0",
                employee_id=context.employee_id,
                component=self.component_code
            )
        
        return monthly_salary / standard_hours 