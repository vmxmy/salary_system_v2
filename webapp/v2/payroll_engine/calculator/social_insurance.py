"""
社保公积金计算器
"""

from decimal import Decimal
from typing import Dict, Any, List
from .base import ConfigurableCalculator
from ..models import CalculationContext, ComponentCalculationResult, CalculationMethod, ComponentType
from ..exceptions import PayrollCalculationError, InvalidConfigurationError


class SocialInsuranceCalculator(ConfigurableCalculator):
    """社保计算器"""
    
    def __init__(self, component_code: str, component_name: str, config: Dict[str, Any]):
        super().__init__(component_code, component_name, ComponentType.SOCIAL_INSURANCE, config)
    
    def get_required_config_keys(self) -> List[str]:
        return ['employee_rate', 'employer_rate', 'base_calculation_method']
    
    def calculate(self, context: CalculationContext) -> ComponentCalculationResult:
        """计算社保"""
        self.validate_context(context)
        self.validate_config()
        
        # 获取社保基数
        insurance_base = self.get_insurance_base(context)
        
        # 获取个人缴费比例
        employee_rate = Decimal(str(self.get_config_value('employee_rate', 0))) / Decimal('100')
        
        # 计算个人缴费金额
        employee_amount = insurance_base * employee_rate
        
        # 获取单位缴费比例（用于记录）
        employer_rate = Decimal(str(self.get_config_value('employer_rate', 0))) / Decimal('100')
        employer_amount = insurance_base * employer_rate
        
        details = {
            'insurance_base': float(insurance_base),
            'employee_rate': float(employee_rate * 100),
            'employer_rate': float(employer_rate * 100),
            'employee_amount': float(employee_amount),
            'employer_amount': float(employer_amount),
            'base_calculation_method': self.get_config_value('base_calculation_method')
        }
        
        log_messages = [
            f"社保基数: {insurance_base}",
            f"个人缴费比例: {employee_rate * 100}%",
            f"个人缴费金额: {employee_amount}",
            f"单位缴费比例: {employer_rate * 100}%",
            f"单位缴费金额: {employer_amount}"
        ]
        
        return self.create_result(
            amount=self.round_amount(employee_amount),
            method=CalculationMethod.PERCENTAGE,
            details=details,
            log_messages=log_messages
        )
    
    def get_insurance_base(self, context: CalculationContext) -> Decimal:
        """获取社保基数"""
        method = self.get_config_value('base_calculation_method')
        
        if method == 'basic_salary':
            return self.get_basic_salary_base(context)
        elif method == 'total_salary':
            return self.get_total_salary_base(context)
        elif method == 'fixed':
            return self.get_fixed_base(context)
        elif method == 'employee_field':
            return self.get_employee_field_base(context)
        else:
            raise InvalidConfigurationError(
                f"不支持的社保基数计算方法: {method}",
                employee_id=context.employee_id,
                component=self.component_code
            )
    
    def get_basic_salary_base(self, context: CalculationContext) -> Decimal:
        """使用基本工资作为社保基数"""
        basic_salary = context.get_calculated_amount('BASIC_SALARY')
        if basic_salary == 0:
            basic_salary = Decimal(str(self.get_employee_field(context, 'basic_salary', 0)))
        
        return self.apply_base_limits(basic_salary)
    
    def get_total_salary_base(self, context: CalculationContext) -> Decimal:
        """使用总工资作为社保基数"""
        # 计算所有收入项的总和
        total_earnings = Decimal('0')
        for code, amount in context.existing_calculations.items():
            # 假设以EARNING开头的是收入项
            if code.startswith('EARNING') or code in ['BASIC_SALARY', 'OVERTIME_PAY']:
                total_earnings += amount
        
        return self.apply_base_limits(total_earnings)
    
    def get_fixed_base(self, context: CalculationContext) -> Decimal:
        """使用固定金额作为社保基数"""
        fixed_amount = self.get_config_value('fixed_base_amount')
        if fixed_amount is None:
            raise InvalidConfigurationError(
                "使用固定基数时必须配置fixed_base_amount",
                employee_id=context.employee_id,
                component=self.component_code
            )
        
        return Decimal(str(fixed_amount))
    
    def get_employee_field_base(self, context: CalculationContext) -> Decimal:
        """从员工字段获取社保基数"""
        field_name = self.get_config_value('base_field_name', 'social_insurance_base')
        base_amount = self.get_employee_field(context, field_name)
        
        if base_amount is None:
            raise PayrollCalculationError(
                f"员工数据中缺少社保基数字段: {field_name}",
                employee_id=context.employee_id,
                component=self.component_code
            )
        
        return self.apply_base_limits(Decimal(str(base_amount)))
    
    def apply_base_limits(self, base_amount: Decimal) -> Decimal:
        """应用社保基数上下限"""
        min_base = self.get_config_value('min_base')
        max_base = self.get_config_value('max_base')
        
        if min_base is not None:
            min_base = Decimal(str(min_base))
            if base_amount < min_base:
                base_amount = min_base
        
        if max_base is not None:
            max_base = Decimal(str(max_base))
            if base_amount > max_base:
                base_amount = max_base
        
        return base_amount


class HousingFundCalculator(ConfigurableCalculator):
    """住房公积金计算器"""
    
    def __init__(self, config: Dict[str, Any] = None):
        super().__init__(
            component_code="HOUSING_FUND",
            component_name="住房公积金",
            component_type=ComponentType.SOCIAL_INSURANCE,
            config=config or {}
        )
    
    def get_required_config_keys(self) -> List[str]:
        return ['employee_rate', 'employer_rate']
    
    def calculate(self, context: CalculationContext) -> ComponentCalculationResult:
        """计算住房公积金"""
        self.validate_context(context)
        self.validate_config()
        
        # 获取公积金基数
        fund_base = self.get_fund_base(context)
        
        # 获取个人缴费比例
        employee_rate = Decimal(str(self.get_config_value('employee_rate', 0))) / Decimal('100')
        
        # 计算个人缴费金额
        employee_amount = fund_base * employee_rate
        
        # 获取单位缴费比例（用于记录）
        employer_rate = Decimal(str(self.get_config_value('employer_rate', 0))) / Decimal('100')
        employer_amount = fund_base * employer_rate
        
        details = {
            'fund_base': float(fund_base),
            'employee_rate': float(employee_rate * 100),
            'employer_rate': float(employer_rate * 100),
            'employee_amount': float(employee_amount),
            'employer_amount': float(employer_amount)
        }
        
        log_messages = [
            f"公积金基数: {fund_base}",
            f"个人缴费比例: {employee_rate * 100}%",
            f"个人缴费金额: {employee_amount}",
            f"单位缴费比例: {employer_rate * 100}%",
            f"单位缴费金额: {employer_amount}"
        ]
        
        return self.create_result(
            amount=self.round_amount(employee_amount),
            method=CalculationMethod.PERCENTAGE,
            details=details,
            log_messages=log_messages
        )
    
    def get_fund_base(self, context: CalculationContext) -> Decimal:
        """获取公积金基数"""
        # 默认使用基本工资作为公积金基数
        base_method = self.get_config_value('base_calculation_method', 'basic_salary')
        
        if base_method == 'basic_salary':
            base_amount = context.get_calculated_amount('BASIC_SALARY')
            if base_amount == 0:
                base_amount = Decimal(str(self.get_employee_field(context, 'basic_salary', 0)))
        elif base_method == 'employee_field':
            field_name = self.get_config_value('base_field_name', 'housing_fund_base')
            base_amount = Decimal(str(self.get_employee_field(context, field_name, 0)))
        else:
            base_amount = Decimal(str(self.get_config_value('fixed_base_amount', 0)))
        
        return self.apply_fund_base_limits(base_amount)
    
    def apply_fund_base_limits(self, base_amount: Decimal) -> Decimal:
        """应用公积金基数上下限"""
        min_base = self.get_config_value('min_base')
        max_base = self.get_config_value('max_base')
        
        if min_base is not None:
            min_base = Decimal(str(min_base))
            if base_amount < min_base:
                base_amount = min_base
        
        if max_base is not None:
            max_base = Decimal(str(max_base))
            if base_amount > max_base:
                base_amount = max_base
        
        return base_amount 