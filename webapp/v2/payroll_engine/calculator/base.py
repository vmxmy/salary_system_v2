"""
基础计算器抽象类
"""

from abc import ABC, abstractmethod
from decimal import Decimal
from typing import Dict, Any, List
from ..models import CalculationContext, ComponentCalculationResult, CalculationMethod, ComponentType
from ..exceptions import PayrollCalculationError


class BaseCalculator(ABC):
    """薪资组件计算器基类"""
    
    def __init__(self, component_code: str, component_name: str, component_type: ComponentType):
        self.component_code = component_code
        self.component_name = component_name
        self.component_type = component_type
    
    @abstractmethod
    def calculate(self, context: CalculationContext) -> ComponentCalculationResult:
        """
        计算薪资组件
        
        Args:
            context: 计算上下文
            
        Returns:
            ComponentCalculationResult: 计算结果
        """
        pass
    
    def create_result(
        self, 
        amount: Decimal, 
        method: CalculationMethod,
        details: Dict[str, Any] = None,
        log_messages: List[str] = None
    ) -> ComponentCalculationResult:
        """创建计算结果"""
        result = ComponentCalculationResult(
            component_code=self.component_code,
            component_name=self.component_name,
            component_type=self.component_type,
            amount=amount,
            calculation_method=method,
            calculation_details=details or {},
            calculation_log=log_messages or []
        )
        return result
    
    def validate_context(self, context: CalculationContext) -> bool:
        """验证计算上下文"""
        if not context.employee_id:
            raise PayrollCalculationError("员工ID不能为空", component=self.component_code)
        
        if not context.employee_data:
            raise PayrollCalculationError("员工数据不能为空", 
                                        employee_id=context.employee_id,
                                        component=self.component_code)
        
        return True
    
    def get_employee_field(self, context: CalculationContext, field_name: str, default: Any = None) -> Any:
        """获取员工字段值"""
        return context.get_employee_field(field_name, default)
    
    def calculate_prorated_amount(
        self, 
        base_amount: Decimal, 
        actual_days: int, 
        standard_days: int
    ) -> Decimal:
        """计算按比例金额"""
        if standard_days <= 0:
            return Decimal('0')
        
        return base_amount * Decimal(actual_days) / Decimal(standard_days)
    
    def apply_percentage(self, base_amount: Decimal, percentage: Decimal) -> Decimal:
        """应用百分比计算"""
        return base_amount * percentage / Decimal('100')
    
    def round_amount(self, amount: Decimal, precision: int = 2) -> Decimal:
        """金额四舍五入"""
        return amount.quantize(Decimal('0.01'))


class ConfigurableCalculator(BaseCalculator):
    """可配置的计算器基类"""
    
    def __init__(self, component_code: str, component_name: str, component_type: ComponentType, config: Dict[str, Any]):
        super().__init__(component_code, component_name, component_type)
        self.config = config
    
    def get_config_value(self, key: str, default: Any = None) -> Any:
        """获取配置值"""
        return self.config.get(key, default)
    
    def validate_config(self) -> bool:
        """验证配置"""
        required_keys = self.get_required_config_keys()
        for key in required_keys:
            if key not in self.config:
                raise PayrollCalculationError(f"缺少必需的配置项: {key}", component=self.component_code)
        return True
    
    @abstractmethod
    def get_required_config_keys(self) -> List[str]:
        """获取必需的配置键"""
        pass


class FormulaCalculator(ConfigurableCalculator):
    """公式计算器"""
    
    def get_required_config_keys(self) -> List[str]:
        return ['formula']
    
    def calculate(self, context: CalculationContext) -> ComponentCalculationResult:
        """使用公式计算"""
        self.validate_context(context)
        self.validate_config()
        
        formula = self.get_config_value('formula')
        variables = self.prepare_formula_variables(context)
        
        try:
            # 简单的公式计算实现
            # 在实际应用中，可以使用更安全的表达式解析器
            result_amount = self.evaluate_formula(formula, variables)
            
            details = {
                'formula': formula,
                'variables': variables,
                'raw_result': float(result_amount)
            }
            
            log_messages = [
                f"使用公式计算: {formula}",
                f"变量值: {variables}",
                f"计算结果: {result_amount}"
            ]
            
            return self.create_result(
                amount=self.round_amount(result_amount),
                method=CalculationMethod.FORMULA,
                details=details,
                log_messages=log_messages
            )
            
        except Exception as e:
            raise PayrollCalculationError(
                f"公式计算失败: {str(e)}", 
                employee_id=context.employee_id,
                component=self.component_code
            )
    
    def prepare_formula_variables(self, context: CalculationContext) -> Dict[str, float]:
        """准备公式变量"""
        variables = {}
        
        # 添加员工基础信息
        for key, value in context.employee_data.items():
            if isinstance(value, (int, float, Decimal)):
                variables[key] = float(value)
        
        # 添加考勤信息
        if context.attendance_data:
            variables.update({
                'work_days': float(context.attendance_data.work_days),
                'standard_work_days': float(context.attendance_data.standard_work_days),
                'overtime_hours': float(context.attendance_data.overtime_hours),
                'attendance_rate': float(context.attendance_data.attendance_rate)
            })
        
        # 添加已计算的金额
        for code, amount in context.existing_calculations.items():
            variables[f'calc_{code}'] = float(amount)
        
        return variables
    
    def evaluate_formula(self, formula: str, variables: Dict[str, float]) -> Decimal:
        """评估公式"""
        # 简单的公式评估实现
        # 在生产环境中应该使用更安全的表达式解析器
        import re
        
        # 替换变量
        for var_name, var_value in variables.items():
            formula = re.sub(rf'\b{var_name}\b', str(var_value), formula)
        
        # 评估表达式（仅支持基本数学运算）
        try:
            result = eval(formula)
            return Decimal(str(result))
        except:
            raise ValueError(f"无法评估公式: {formula}") 