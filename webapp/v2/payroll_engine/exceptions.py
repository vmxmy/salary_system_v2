"""
简单薪资计算引擎异常类定义
"""


class PayrollCalculationError(Exception):
    """薪资计算基础异常类"""
    
    def __init__(self, message: str, employee_id: int = None, component: str = None):
        self.message = message
        self.employee_id = employee_id
        self.component = component
        super().__init__(self.message)
    
    def __str__(self):
        parts = [self.message]
        if self.employee_id:
            parts.append(f"员工ID: {self.employee_id}")
        if self.component:
            parts.append(f"组件: {self.component}")
        return " | ".join(parts)


class InvalidConfigurationError(PayrollCalculationError):
    """无效配置异常"""
    pass


class MissingDataError(PayrollCalculationError):
    """缺失数据异常"""
    pass


class CalculationRuleError(PayrollCalculationError):
    """计算规则异常"""
    pass


class AttendanceDataError(PayrollCalculationError):
    """考勤数据异常"""
    pass


class TaxCalculationError(PayrollCalculationError):
    """税务计算异常"""
    pass


class SocialInsuranceError(PayrollCalculationError):
    """社保计算异常"""
    pass 