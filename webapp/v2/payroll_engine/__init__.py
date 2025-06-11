"""
简单工资计算引擎模块

只提供基础的工资计算服务，使用简单计算器。
"""

from .simple_calculator import (
    SimplePayrollCalculator,
    CalculationResult,
    CalculationStatus,
    ComponentType,
    CalculationComponent
)
from .social_insurance_calculator import (
    SocialInsuranceCalculator,
    SocialInsuranceComponent,
    SocialInsuranceResult,
    INSURANCE_TYPES,
    HOUSING_FUND_TYPE
)
from .integrated_calculator import (
    IntegratedPayrollCalculator,
    IntegratedCalculationResult
)
from .exceptions import (
    PayrollCalculationError,
    MissingDataError,
    InvalidConfigurationError,
)

# 版本信息
__version__ = '2.0.0-simple'

# 导出的主要类和函数
__all__ = [
    # 简单计算器
    'SimplePayrollCalculator',
    
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
    'CalculationResult',
    'CalculationStatus',
    'ComponentType',
    'CalculationComponent',
    
    # 异常类
    'PayrollCalculationError',
    'MissingDataError', 
    'InvalidConfigurationError',
] 