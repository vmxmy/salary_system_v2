"""
个人所得税计算器
"""

from decimal import Decimal
from typing import Dict, Any, List, Tuple
from .base import ConfigurableCalculator
from ..models import CalculationContext, ComponentCalculationResult, CalculationMethod, ComponentType
from ..exceptions import PayrollCalculationError, InvalidConfigurationError


class TaxCalculator(ConfigurableCalculator):
    """个人所得税计算器"""
    
    def __init__(self, config: Dict[str, Any] = None):
        super().__init__(
            component_code="PERSONAL_TAX",
            component_name="个人所得税",
            component_type=ComponentType.TAX,
            config=config or {}
        )
    
    def get_required_config_keys(self) -> List[str]:
        return ['tax_brackets', 'basic_deduction']
    
    def calculate(self, context: CalculationContext) -> ComponentCalculationResult:
        """计算个人所得税"""
        self.validate_context(context)
        self.validate_config()
        
        # 计算应税收入
        taxable_income = self.calculate_taxable_income(context)
        
        # 计算税额
        tax_amount, tax_details = self.calculate_progressive_tax(taxable_income)
        
        details = {
            'taxable_income': float(taxable_income),
            'basic_deduction': float(self.get_basic_deduction()),
            'tax_brackets_used': tax_details,
            'effective_tax_rate': float(tax_amount / taxable_income * 100) if taxable_income > 0 else 0
        }
        
        log_messages = [
            f"应税收入: {taxable_income}",
            f"基本减除费用: {self.get_basic_deduction()}",
            f"计算税额: {tax_amount}"
        ]
        
        # 添加税率档次详情
        for bracket in tax_details:
            log_messages.append(
                f"税率档次 {bracket['rate']}%: 应税额 {bracket['taxable_amount']}, 税额 {bracket['tax_amount']}"
            )
        
        return self.create_result(
            amount=self.round_amount(tax_amount),
            method=CalculationMethod.TABLE_LOOKUP,
            details=details,
            log_messages=log_messages
        )
    
    def calculate_taxable_income(self, context: CalculationContext) -> Decimal:
        """计算应税收入"""
        # 获取总收入
        total_income = self.get_total_income(context)
        
        # 减去基本减除费用
        basic_deduction = self.get_basic_deduction()
        
        # 减去社保公积金
        social_insurance_deduction = self.get_social_insurance_deduction(context)
        
        # 减去专项附加扣除
        additional_deduction = self.get_additional_deduction(context)
        
        # 计算应税收入
        taxable_income = total_income - basic_deduction - social_insurance_deduction - additional_deduction
        
        # 应税收入不能为负
        return max(taxable_income, Decimal('0'))
    
    def get_total_income(self, context: CalculationContext) -> Decimal:
        """获取总收入"""
        total_income = Decimal('0')
        
        # 累加所有收入项
        for code, amount in context.existing_calculations.items():
            # 收入项包括基本工资、津贴、加班费等
            if code in ['BASIC_SALARY', 'OVERTIME_PAY'] or code.startswith('ALLOWANCE'):
                total_income += amount
        
        return total_income
    
    def get_basic_deduction(self) -> Decimal:
        """获取基本减除费用"""
        return Decimal(str(self.get_config_value('basic_deduction', 5000)))
    
    def get_social_insurance_deduction(self, context: CalculationContext) -> Decimal:
        """获取社保公积金扣除"""
        deduction = Decimal('0')
        
        # 累加所有社保公积金扣除
        for code, amount in context.existing_calculations.items():
            if code.startswith('SOCIAL_') or code == 'HOUSING_FUND':
                deduction += amount
        
        return deduction
    
    def get_additional_deduction(self, context: CalculationContext) -> Decimal:
        """获取专项附加扣除"""
        # 从员工数据或配置中获取专项附加扣除
        additional_fields = [
            'child_education_deduction',
            'continuing_education_deduction', 
            'medical_deduction',
            'housing_loan_deduction',
            'housing_rent_deduction',
            'elderly_care_deduction'
        ]
        
        total_deduction = Decimal('0')
        for field in additional_fields:
            amount = self.get_employee_field(context, field, 0)
            total_deduction += Decimal(str(amount))
        
        return total_deduction
    
    def calculate_progressive_tax(self, taxable_income: Decimal) -> Tuple[Decimal, List[Dict[str, Any]]]:
        """计算累进税额"""
        if taxable_income <= 0:
            return Decimal('0'), []
        
        tax_brackets = self.get_config_value('tax_brackets')
        if not tax_brackets:
            raise InvalidConfigurationError(
                "税率表配置不能为空",
                component=self.component_code
            )
        
        total_tax = Decimal('0')
        tax_details = []
        remaining_income = taxable_income
        
        for bracket in tax_brackets:
            bracket_min = Decimal(str(bracket.get('min', 0)))
            bracket_max = Decimal(str(bracket.get('max', float('inf'))))
            tax_rate = Decimal(str(bracket.get('rate', 0))) / Decimal('100')
            quick_deduction = Decimal(str(bracket.get('quick_deduction', 0)))
            
            if remaining_income <= 0:
                break
            
            # 计算在当前税率档次的应税金额
            if taxable_income > bracket_min:
                if taxable_income <= bracket_max:
                    # 收入在当前档次内
                    bracket_taxable = taxable_income - bracket_min
                else:
                    # 收入超过当前档次
                    bracket_taxable = bracket_max - bracket_min
                
                # 计算当前档次的税额
                bracket_tax = bracket_taxable * tax_rate
                total_tax += bracket_tax
                
                tax_details.append({
                    'bracket_min': float(bracket_min),
                    'bracket_max': float(bracket_max) if bracket_max != float('inf') else None,
                    'rate': float(tax_rate * 100),
                    'taxable_amount': float(bracket_taxable),
                    'tax_amount': float(bracket_tax)
                })
                
                remaining_income -= bracket_taxable
        
        return total_tax, tax_details


class YearEndBonusTaxCalculator(ConfigurableCalculator):
    """年终奖个人所得税计算器"""
    
    def __init__(self, config: Dict[str, Any] = None):
        super().__init__(
            component_code="YEAR_END_BONUS_TAX",
            component_name="年终奖个人所得税",
            component_type=ComponentType.TAX,
            config=config or {}
        )
    
    def get_required_config_keys(self) -> List[str]:
        return ['calculation_method', 'tax_brackets']
    
    def calculate(self, context: CalculationContext) -> ComponentCalculationResult:
        """计算年终奖个人所得税"""
        self.validate_context(context)
        self.validate_config()
        
        # 获取年终奖金额
        bonus_amount = self.get_bonus_amount(context)
        
        if bonus_amount <= 0:
            return self.create_result(
                amount=Decimal('0'),
                method=CalculationMethod.TABLE_LOOKUP,
                details={'bonus_amount': 0},
                log_messages=["无年终奖"]
            )
        
        # 根据配置选择计算方法
        method = self.get_config_value('calculation_method', 'separate')
        
        if method == 'separate':
            tax_amount = self.calculate_separate_tax(bonus_amount)
        elif method == 'combined':
            tax_amount = self.calculate_combined_tax(bonus_amount, context)
        else:
            raise InvalidConfigurationError(
                f"不支持的年终奖税收计算方法: {method}",
                component=self.component_code
            )
        
        details = {
            'bonus_amount': float(bonus_amount),
            'calculation_method': method,
            'tax_amount': float(tax_amount)
        }
        
        log_messages = [
            f"年终奖金额: {bonus_amount}",
            f"计算方法: {method}",
            f"年终奖税额: {tax_amount}"
        ]
        
        return self.create_result(
            amount=self.round_amount(tax_amount),
            method=CalculationMethod.TABLE_LOOKUP,
            details=details,
            log_messages=log_messages
        )
    
    def get_bonus_amount(self, context: CalculationContext) -> Decimal:
        """获取年终奖金额"""
        # 从已计算的组件中获取年终奖
        bonus_amount = context.get_calculated_amount('YEAR_END_BONUS')
        
        if bonus_amount == 0:
            # 从员工数据中获取
            bonus_amount = Decimal(str(self.get_employee_field(context, 'year_end_bonus', 0)))
        
        return bonus_amount
    
    def calculate_separate_tax(self, bonus_amount: Decimal) -> Decimal:
        """单独计税方法"""
        # 年终奖除以12找到适用税率
        monthly_equivalent = bonus_amount / Decimal('12')
        
        # 根据月度等价金额找到适用税率
        tax_brackets = self.get_config_value('tax_brackets')
        applicable_rate = Decimal('0')
        quick_deduction = Decimal('0')
        
        for bracket in tax_brackets:
            bracket_min = Decimal(str(bracket.get('min', 0)))
            bracket_max = Decimal(str(bracket.get('max', float('inf'))))
            
            if bracket_min <= monthly_equivalent <= bracket_max:
                applicable_rate = Decimal(str(bracket.get('rate', 0))) / Decimal('100')
                quick_deduction = Decimal(str(bracket.get('quick_deduction', 0)))
                break
        
        # 计算税额
        tax_amount = bonus_amount * applicable_rate - quick_deduction
        return max(tax_amount, Decimal('0'))
    
    def calculate_combined_tax(self, bonus_amount: Decimal, context: CalculationContext) -> Decimal:
        """并入综合所得计税方法"""
        # 这里需要重新计算整年的综合所得税
        # 简化实现：按照当月税率计算
        regular_tax_calculator = TaxCalculator(self.config)
        
        # 临时将年终奖加入收入
        context.set_calculated_amount('YEAR_END_BONUS', bonus_amount)
        
        # 重新计算税额
        result = regular_tax_calculator.calculate(context)
        
        return result.amount 