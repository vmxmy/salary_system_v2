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