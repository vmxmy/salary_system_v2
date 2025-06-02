"""
薪资计算引擎模块

这个模块提供了完整的自动化薪资计算功能，包括：
- 基础薪资组件计算
- 社保公积金计算
- 个人所得税计算
- 考勤数据集成
- 计算结果汇总和验证
"""

from .engine import PayrollCalculationEngine
from .calculator import (
    BaseCalculator,
    BasicSalaryCalculator,
    AllowanceCalculator,
    OvertimeCalculator,
    SocialInsuranceCalculator,
    HousingFundCalculator,
    TaxCalculator,
    YearEndBonusTaxCalculator
)
from .models import (
    CalculationContext,
    CalculationResult,
    CalculationRule,
    AttendanceData
)
from .exceptions import (
    PayrollCalculationError,
    InvalidConfigurationError,
    MissingDataError
)

__all__ = [
    'PayrollCalculationEngine',
    'BaseCalculator',
    'BasicSalaryCalculator',
    'AllowanceCalculator',
    'OvertimeCalculator',
    'SocialInsuranceCalculator',
    'HousingFundCalculator',
    'TaxCalculator',
    'YearEndBonusTaxCalculator',
    'CalculationContext',
    'CalculationResult',
    'CalculationRule',
    'AttendanceData',
    'PayrollCalculationError',
    'InvalidConfigurationError',
    'MissingDataError'
] 