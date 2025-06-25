"""
集成工资计算引擎模块

提供完整的工资计算服务，包括社保和集成计算器。
"""

from .social_insurance_calculator import (
    SocialInsuranceCalculator,
    SocialInsuranceComponent,
    SocialInsuranceResult,
    INSURANCE_TYPES,
    HOUSING_FUND_TYPE
)
from .integrated_calculator import (
    IntegratedPayrollCalculator,
    IntegratedCalculationResult,
    CalculationStatus,
    ComponentType,
    CalculationComponent
)
from .exceptions import (
    PayrollCalculationError,
    MissingDataError,
    InvalidConfigurationError,
)

# 版本信息
__version__ = '2.0.0-integrated'

# 导出的主要类和函数
__all__ = [
    # 社保计算器
    'SocialInsuranceCalculator',
    'SocialInsuranceComponent',
    'SocialInsuranceResult',
    'INSURANCE_TYPES',
    'HOUSING_FUND_TYPE',
    
    # 集成计算器
    'IntegratedPayrollCalculator',
    'IntegratedCalculationResult',
    
    # 数据模型
    'CalculationStatus',
    'ComponentType',
    'CalculationComponent',
    
    # 异常类
    'PayrollCalculationError',
    'MissingDataError', 
    'InvalidConfigurationError',
] 