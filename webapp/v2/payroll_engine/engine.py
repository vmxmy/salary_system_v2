"""
薪资计算引擎核心类
"""

from typing import Dict, List, Any, Optional
from decimal import Decimal
from datetime import date, datetime
from sqlalchemy.orm import Session

from .models import (
    CalculationContext, 
    CalculationResult, 
    CalculationRule, 
    AttendanceData,
    ComponentType,
    CalculationStatus
)
from .calculator import (
    BaseCalculator,
    BasicSalaryCalculator,
    AllowanceCalculator,
    OvertimeCalculator,
    SocialInsuranceCalculator,
    HousingFundCalculator,
    TaxCalculator,
    FormulaCalculator
)
from .exceptions import PayrollCalculationError, InvalidConfigurationError


class PayrollCalculationEngine:
    """薪资计算引擎"""
    
    def __init__(self, db_session: Session):
        self.db_session = db_session
        self.calculators: Dict[str, BaseCalculator] = {}
        self.calculation_order: List[str] = []
        self._initialize_default_calculators()
    
    def _initialize_default_calculators(self):
        """初始化默认计算器"""
        # 基础薪资计算器
        self.register_calculator(BasicSalaryCalculator())
        
        # 加班费计算器
        self.register_calculator(OvertimeCalculator({
            'hourly_rate_multiplier': 1.5,
            'standard_monthly_hours': 174
        }))
        
        # 住房公积金计算器
        self.register_calculator(HousingFundCalculator({
            'employee_rate': 12,
            'employer_rate': 12,
            'base_calculation_method': 'basic_salary'
        }))
        
        # 个人所得税计算器
        self.register_calculator(TaxCalculator({
            'basic_deduction': 5000,
            'tax_brackets': [
                {'min': 0, 'max': 3000, 'rate': 3, 'quick_deduction': 0},
                {'min': 3000, 'max': 12000, 'rate': 10, 'quick_deduction': 210},
                {'min': 12000, 'max': 25000, 'rate': 20, 'quick_deduction': 1410},
                {'min': 25000, 'max': 35000, 'rate': 25, 'quick_deduction': 2660},
                {'min': 35000, 'max': 55000, 'rate': 30, 'quick_deduction': 4410},
                {'min': 55000, 'max': 80000, 'rate': 35, 'quick_deduction': 7160},
                {'min': 80000, 'max': float('inf'), 'rate': 45, 'quick_deduction': 15160}
            ]
        }))
        
        # 设置默认计算顺序
        self.calculation_order = [
            'BASIC_SALARY',
            'OVERTIME_PAY', 
            'HOUSING_FUND',
            'PERSONAL_TAX'
        ]
    
    def register_calculator(self, calculator: BaseCalculator):
        """注册计算器"""
        self.calculators[calculator.component_code] = calculator
    
    def register_allowance_calculator(self, component_code: str, component_name: str, config: Dict[str, Any]):
        """注册津贴计算器"""
        calculator = AllowanceCalculator(component_code, component_name, config)
        self.register_calculator(calculator)
    
    def register_social_insurance_calculator(self, component_code: str, component_name: str, config: Dict[str, Any]):
        """注册社保计算器"""
        calculator = SocialInsuranceCalculator(component_code, component_name, config)
        self.register_calculator(calculator)
    
    def register_formula_calculator(self, component_code: str, component_name: str, component_type: ComponentType, config: Dict[str, Any]):
        """注册公式计算器"""
        calculator = FormulaCalculator(component_code, component_name, component_type, config)
        self.register_calculator(calculator)
    
    def set_calculation_order(self, order: List[str]):
        """设置计算顺序"""
        self.calculation_order = order
    
    def calculate(self, context: CalculationContext) -> CalculationResult:
        """
        根据计算上下文计算薪资
        
        Args:
            context: 计算上下文
            
        Returns:
            CalculationResult: 计算结果
        """
        # 创建计算结果
        result = CalculationResult(
            employee_id=context.employee_id,
            period_id=context.period_id,
            calculation_time=datetime.now()
        )
        
        try:
            # 按顺序执行计算
            for component_code in self.calculation_order:
                if component_code in self.calculators:
                    calculator = self.calculators[component_code]
                    
                    try:
                        # 执行计算
                        component_result = calculator.calculate(context)
                        
                        # 添加到结果中（会自动调用_update_totals()）
                        result.add_component(component_result.to_calculation_component())
                        
                        # 更新上下文中的计算结果
                        context.add_calculation_result(component_code, component_result.amount)
                        
                    except Exception as e:
                        error_msg = f"计算组件 {component_code} 失败: {str(e)}"
                        result.error_message = error_msg
                        result.status = CalculationStatus.FAILED
                        break
            
            # 如果没有错误，标记为完成
            if result.status != CalculationStatus.FAILED:
                result.status = CalculationStatus.COMPLETED
            
        except Exception as e:
            result.error_message = f"薪资计算失败: {str(e)}"
            result.status = CalculationStatus.FAILED
        
        return result
    
    def calculate_employee_payroll(
        self,
        employee_id: int,
        employee_data: Dict[str, Any],
        period_start: date,
        period_end: date,
        attendance_data: Optional[AttendanceData] = None,
        calculation_rules: Optional[List[CalculationRule]] = None
    ) -> CalculationResult:
        """
        计算单个员工的薪资
        
        Args:
            employee_id: 员工ID
            employee_data: 员工数据
            period_start: 薪资周期开始日期
            period_end: 薪资周期结束日期
            attendance_data: 考勤数据
            calculation_rules: 计算规则列表
            
        Returns:
            CalculationResult: 计算结果
        """
        # 创建计算上下文
        context = CalculationContext(
            employee_id=employee_id,
            period_id=0,  # 这里应该传入正确的period_id
            period_start=period_start,
            period_end=period_end,
            base_salary=Decimal(str(employee_data.get('base_salary', 0))),
            employee_data=employee_data,
            attendance_data=attendance_data,
            calculation_rules=calculation_rules or []
        )
        
        # 使用主要的calculate方法
        return self.calculate(context)
    
    def calculate_batch_payroll(
        self,
        employees_data: List[Dict[str, Any]],
        period_start: date,
        period_end: date,
        attendance_data_map: Optional[Dict[int, AttendanceData]] = None
    ) -> List[CalculationResult]:
        """
        批量计算员工薪资
        
        Args:
            employees_data: 员工数据列表
            period_start: 薪资周期开始日期
            period_end: 薪资周期结束日期
            attendance_data_map: 员工考勤数据映射
            
        Returns:
            List[CalculationResult]: 计算结果列表
        """
        results = []
        
        for employee_data in employees_data:
            employee_id = employee_data.get('id')
            if not employee_id:
                continue
            
            # 获取员工考勤数据
            attendance_data = None
            if attendance_data_map and employee_id in attendance_data_map:
                attendance_data = attendance_data_map[employee_id]
            
            # 计算员工薪资
            result = self.calculate_employee_payroll(
                employee_id=employee_id,
                employee_data=employee_data,
                period_start=period_start,
                period_end=period_end,
                attendance_data=attendance_data
            )
            
            results.append(result)
        
        return results
    
    def validate_calculation_setup(self) -> List[str]:
        """验证计算设置"""
        errors = []
        
        # 检查是否有注册的计算器
        if not self.calculators:
            errors.append("没有注册任何计算器")
        
        # 检查计算顺序
        if not self.calculation_order:
            errors.append("没有设置计算顺序")
        
        # 检查计算顺序中的组件是否都有对应的计算器
        for component_code in self.calculation_order:
            if component_code not in self.calculators:
                errors.append(f"计算顺序中的组件 {component_code} 没有对应的计算器")
        
        return errors
    
    def get_available_calculators(self) -> Dict[str, str]:
        """获取可用的计算器列表"""
        return {
            code: calculator.component_name 
            for code, calculator in self.calculators.items()
        } 