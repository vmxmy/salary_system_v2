"""
薪资计算引擎数据模型

定义薪资计算过程中使用的核心数据结构
"""

from typing import Dict, List, Optional, Any, Union
from decimal import Decimal
from datetime import datetime, date
from dataclasses import dataclass, field
from enum import Enum


class CalculationStatus(Enum):
    """计算状态枚举"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class ComponentType(Enum):
    """薪资组件类型枚举"""
    EARNING = "earning"
    DEDUCTION = "deduction"
    PERSONAL_DEDUCTION = "personal_deduction"
    EMPLOYER_DEDUCTION = "employer_deduction"
    SOCIAL_INSURANCE = "social_insurance"
    TAX = "tax"


class CalculationMethod(Enum):
    """计算方法枚举"""
    FIXED = "fixed"
    PERCENTAGE = "percentage"
    FORMULA = "formula"
    TIERED = "tiered"
    PRORATED = "prorated"
    ATTENDANCE_BASED = "attendance_based"
    TABLE_LOOKUP = "table_lookup"


@dataclass
class AttendanceData:
    """考勤数据模型"""
    employee_id: int
    period_start: date
    period_end: date
    work_days: int = 0
    actual_work_days: int = 0
    standard_work_days: int = 22  # 标准工作日
    overtime_hours: Decimal = field(default_factory=lambda: Decimal('0'))
    late_minutes: int = 0
    early_leave_minutes: int = 0
    absence_days: int = 0
    sick_leave_days: int = 0
    annual_leave_days: int = 0
    other_leave_days: int = 0
    
    def __post_init__(self):
        """确保数值类型正确"""
        if not isinstance(self.overtime_hours, Decimal):
            self.overtime_hours = Decimal(str(self.overtime_hours))
    
    @property
    def attendance_rate(self) -> Decimal:
        """出勤率"""
        if self.standard_work_days <= 0:
            return Decimal('0')
        return Decimal(self.actual_work_days) / Decimal(self.standard_work_days)


@dataclass
class CalculationRule:
    """计算规则模型"""
    rule_id: str
    rule_name: str
    component_code: str
    component_type: ComponentType
    calculation_formula: str
    is_active: bool = True
    priority: int = 0
    conditions: Dict[str, Any] = field(default_factory=dict)
    parameters: Dict[str, Any] = field(default_factory=dict)
    
    def evaluate_conditions(self, context: 'CalculationContext') -> bool:
        """评估规则条件是否满足"""
        if not self.conditions:
            return True
        
        # 简单的条件评估逻辑
        for key, expected_value in self.conditions.items():
            if hasattr(context, key):
                actual_value = getattr(context, key)
                if actual_value != expected_value:
                    return False
        
        return True


@dataclass
class CalculationContext:
    """计算上下文模型"""
    employee_id: int
    period_id: int
    period_start: date
    period_end: date
    base_salary: Decimal
    position_level: Optional[str] = None
    department_id: Optional[int] = None
    attendance_data: Optional[AttendanceData] = None
    employee_data: Dict[str, Any] = field(default_factory=dict)
    salary_config: Dict[str, Any] = field(default_factory=dict)
    social_insurance_config: Dict[str, Any] = field(default_factory=dict)
    tax_config: Dict[str, Any] = field(default_factory=dict)
    calculation_rules: List[CalculationRule] = field(default_factory=list)
    existing_calculations: Dict[str, Decimal] = field(default_factory=dict)
    custom_parameters: Dict[str, Any] = field(default_factory=dict)
    
    def __post_init__(self):
        """确保数值类型正确"""
        if not isinstance(self.base_salary, Decimal):
            self.base_salary = Decimal(str(self.base_salary))
        
        # 确保 employee_data 包含基础薪资
        if 'base_salary' not in self.employee_data:
            self.employee_data['base_salary'] = self.base_salary
    
    def get_parameter(self, key: str, default: Any = None) -> Any:
        """获取参数值"""
        return self.custom_parameters.get(key, default)
    
    def set_parameter(self, key: str, value: Any) -> None:
        """设置参数值"""
        self.custom_parameters[key] = value
    
    def get_employee_field(self, field_name: str, default: Any = None) -> Any:
        """获取员工字段值"""
        return self.employee_data.get(field_name, default)
    
    def add_calculation_result(self, component_code: str, amount: Decimal) -> None:
        """添加计算结果"""
        self.existing_calculations[component_code] = amount
    
    def get_calculated_amount(self, component_code: str) -> Decimal:
        """获取已计算的金额"""
        return self.existing_calculations.get(component_code, Decimal('0'))

    def to_dict(self) -> Dict[str, Any]:
        """将 CalculationContext 转换为可序列化的字典。"""
        data = {
            "employee_id": self.employee_id,
            "period_id": self.period_id,
            "period_start": self.period_start.isoformat() if self.period_start else None,
            "period_end": self.period_end.isoformat() if self.period_end else None,
            "base_salary": str(self.base_salary) if self.base_salary is not None else None,
            "position_level": self.position_level,
            "department_id": self.department_id,
            "employee_data": self.employee_data, # 已经是字典
            "salary_config": self.salary_config, # 已经是字典
            "social_insurance_config": self.social_insurance_config, # 已经是字典
            "tax_config": self.tax_config, # 已经是字典
            "existing_calculations": {k: str(v) for k, v in self.existing_calculations.items()}, # Decimal to str
            "custom_parameters": self.custom_parameters, # 已经是字典
        }
        if self.attendance_data:
            # 如果 AttendanceData 也有 to_dict() 或使用 dataclasses.asdict
            if hasattr(self.attendance_data, 'to_dict') and callable(getattr(self.attendance_data, 'to_dict')):
                data['attendance_data'] = self.attendance_data.to_dict()
            else:
                # Fallback: convert known fields, assuming basic types or add specific handling
                data['attendance_data'] = {
                    "employee_id": self.attendance_data.employee_id,
                    "period_start": self.attendance_data.period_start.isoformat() if self.attendance_data.period_start else None,
                    "period_end": self.attendance_data.period_end.isoformat() if self.attendance_data.period_end else None,
                    "work_days": self.attendance_data.work_days,
                    "actual_work_days": self.attendance_data.actual_work_days,
                    "standard_work_days": self.attendance_data.standard_work_days,
                    "overtime_hours": str(self.attendance_data.overtime_hours),
                    "late_minutes": self.attendance_data.late_minutes,
                    "early_leave_minutes": self.attendance_data.early_leave_minutes,
                    "absence_days": self.attendance_data.absence_days,
                    "sick_leave_days": self.attendance_data.sick_leave_days,
                    "annual_leave_days": self.attendance_data.annual_leave_days,
                    "other_leave_days": self.attendance_data.other_leave_days,
                    "attendance_rate": str(self.attendance_data.attendance_rate) # Property
                }
        else:
            data['attendance_data'] = None
        
        # calculation_rules 包含 CalculationRule 对象，需要序列化
        # 简单的序列化，可以根据需要扩展
        data['calculation_rules'] = [
            {
                "rule_id": rule.rule_id,
                "rule_name": rule.rule_name,
                "component_code": rule.component_code,
                "component_type": rule.component_type.value, # Enum to value
                "calculation_formula": rule.calculation_formula,
                "is_active": rule.is_active,
                "priority": rule.priority,
                "conditions": rule.conditions, # 已经是字典
                "parameters": rule.parameters  # 已经是字典
            }
            for rule in self.calculation_rules
        ]
        return data


@dataclass
class CalculationComponent:
    """计算组件结果"""
    component_code: str
    component_name: str
    component_type: ComponentType
    amount: Decimal
    calculation_formula: Optional[str] = None
    calculation_details: Dict[str, Any] = field(default_factory=dict)
    
    def __post_init__(self):
        """确保数值类型正确"""
        if not isinstance(self.amount, Decimal):
            self.amount = Decimal(str(self.amount))


@dataclass
class ComponentCalculationResult:
    """组件计算结果（用于计算器）"""
    component_code: str
    component_name: str
    component_type: ComponentType
    amount: Decimal
    calculation_method: CalculationMethod
    calculation_details: Dict[str, Any] = field(default_factory=dict)
    calculation_log: List[str] = field(default_factory=list)
    
    def __post_init__(self):
        """确保数值类型正确"""
        if not isinstance(self.amount, Decimal):
            self.amount = Decimal(str(self.amount))
    
    def to_calculation_component(self) -> CalculationComponent:
        """转换为 CalculationComponent"""
        return CalculationComponent(
            component_code=self.component_code,
            component_name=self.component_name,
            component_type=self.component_type,
            amount=self.amount,
            calculation_formula=self.calculation_method.value,
            calculation_details=self.calculation_details
        )


@dataclass
class CalculationResult:
    """计算结果模型"""
    employee_id: int
    period_id: int
    calculation_id: Optional[str] = None
    status: CalculationStatus = CalculationStatus.PENDING
    total_earnings: Decimal = field(default_factory=lambda: Decimal('0'))
    total_deductions: Decimal = field(default_factory=lambda: Decimal('0'))
    net_pay: Decimal = field(default_factory=lambda: Decimal('0'))
    components: List[CalculationComponent] = field(default_factory=list)
    calculation_time: Optional[datetime] = None
    error_message: Optional[str] = None
    calculation_details: Dict[str, Any] = field(default_factory=dict)
    
    def __post_init__(self):
        """确保数值类型正确并计算汇总"""
        # 确保数值类型
        for attr in ['total_earnings', 'total_deductions', 'net_pay']:
            value = getattr(self, attr)
            if not isinstance(value, Decimal):
                setattr(self, attr, Decimal(str(value)))
        
        # 如果没有设置计算时间，使用当前时间
        if self.calculation_time is None:
            self.calculation_time = datetime.now()
    
    def add_component(self, component: CalculationComponent) -> None:
        """添加计算组件"""
        self.components.append(component)
        self._update_totals()
    
    def _update_totals(self) -> None:
        """更新汇总金额"""
        self.total_earnings = Decimal('0')
        self.total_deductions = Decimal('0')
        
        for component in self.components:
            if component.component_type == ComponentType.EARNING:
                self.total_earnings += component.amount
            elif component.component_type in [
                ComponentType.DEDUCTION,
                ComponentType.PERSONAL_DEDUCTION
            ]:
                self.total_deductions += component.amount
        
        self.net_pay = self.total_earnings - self.total_deductions
    
    def get_component_by_code(self, component_code: str) -> Optional[CalculationComponent]:
        """根据组件代码获取组件"""
        for component in self.components:
            if component.component_code == component_code:
                return component
        return None
    
    def get_components_by_type(self, component_type: ComponentType) -> List[CalculationComponent]:
        """根据组件类型获取组件列表"""
        return [c for c in self.components if c.component_type == component_type]
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典格式"""
        return {
            'employee_id': self.employee_id,
            'period_id': self.period_id,
            'calculation_id': self.calculation_id,
            'status': self.status.value,
            'total_earnings': float(self.total_earnings),
            'total_deductions': float(self.total_deductions),
            'net_pay': float(self.net_pay),
            'components': [
                {
                    'component_code': c.component_code,
                    'component_name': c.component_name,
                    'component_type': c.component_type.value,
                    'amount': float(c.amount),
                    'calculation_formula': c.calculation_formula,
                    'calculation_details': c.calculation_details
                }
                for c in self.components
            ],
            'calculation_time': self.calculation_time.isoformat() if self.calculation_time else None,
            'error_message': self.error_message,
            'calculation_details': self.calculation_details
        }


@dataclass
class BatchCalculationRequest:
    """批量计算请求模型"""
    period_id: int
    employee_ids: List[int]
    calculation_mode: str = "sync"  # sync 或 async
    force_recalculate: bool = False
    custom_parameters: Dict[str, Any] = field(default_factory=dict)


@dataclass
class BatchCalculationResult:
    """批量计算结果模型"""
    request_id: str
    period_id: int
    total_employees: int
    successful_count: int = 0
    failed_count: int = 0
    status: CalculationStatus = CalculationStatus.PENDING
    results: List[CalculationResult] = field(default_factory=list)
    errors: List[Dict[str, Any]] = field(default_factory=list)
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    
    def __post_init__(self):
        """初始化时间"""
        if self.start_time is None:
            self.start_time = datetime.now()
    
    def add_result(self, result: CalculationResult) -> None:
        """添加计算结果"""
        self.results.append(result)
        if result.status == CalculationStatus.COMPLETED:
            self.successful_count += 1
        elif result.status == CalculationStatus.FAILED:
            self.failed_count += 1
    
    def add_error(self, employee_id: int, error_message: str) -> None:
        """添加错误信息"""
        self.errors.append({
            'employee_id': employee_id,
            'error_message': error_message,
            'timestamp': datetime.now().isoformat()
        })
        self.failed_count += 1
    
    def complete(self) -> None:
        """标记批量计算完成"""
        self.end_time = datetime.now()
        if self.failed_count == 0:
            self.status = CalculationStatus.COMPLETED
        elif self.successful_count == 0:
            self.status = CalculationStatus.FAILED
        else:
            self.status = CalculationStatus.COMPLETED  # 部分成功也算完成 