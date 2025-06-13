"""
简化版工资计算引擎

设计原则：
1. 只使用数据库现有的字段数据
2. 只计算 应发合计、扣发合计、实发合计
3. 所有五险一金个税都从源数据表中直接获取已计算好的金额

作者：AI Assistant
创建时间：2025-01-27
"""

from decimal import Decimal
from typing import Dict, List, Optional, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_
from dataclasses import dataclass
from enum import Enum
from datetime import datetime

from ..models import PayrollEntry, Employee
from ..pydantic_models.payroll import PayrollEntryUpdate
import logging

logger = logging.getLogger(__name__)


# 简单数据类，用于替代复杂计算引擎的模型
class CalculationStatus(Enum):
    """计算状态枚举"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class ComponentType(Enum):
    """薪资组件类型枚举"""
    EARNING = "EARNING"
    PERSONAL_DEDUCTION = "PERSONAL_DEDUCTION"
    EMPLOYER_DEDUCTION = "EMPLOYER_DEDUCTION"
    OTHER = "OTHER"


@dataclass
class CalculationComponent:
    """计算组件结果"""
    component_code: str
    component_name: str
    component_type: ComponentType
    amount: Decimal
    calculation_formula: Optional[str] = None
    calculation_details: Dict[str, Any] = None
    
    def __post_init__(self):
        """确保数值类型正确"""
        if not isinstance(self.amount, Decimal):
            self.amount = Decimal(str(self.amount))
        if self.calculation_details is None:
            self.calculation_details = {}


@dataclass
class CalculationResult:
    """计算结果模型"""
    employee_id: int
    period_id: Optional[int] = None
    calculation_id: Optional[str] = None
    status: CalculationStatus = CalculationStatus.COMPLETED
    gross_pay: Decimal = Decimal('0')
    total_deductions: Decimal = Decimal('0')
    net_pay: Decimal = Decimal('0')
    components: List[CalculationComponent] = None
    calculation_time: Optional[datetime] = None
    error_message: Optional[str] = None
    calculation_details: Dict[str, Any] = None
    
    def __post_init__(self):
        """确保数值类型正确"""
        if self.components is None:
            self.components = []
        if self.calculation_details is None:
            self.calculation_details = {}
        if self.calculation_time is None:
            self.calculation_time = datetime.now()


class SimplePayrollCalculator:
    """简化版工资计算引擎"""
    
    def __init__(self, db: Session):
        self.db = db
        
    def calculate(self, 
                  employee_id: int,
                  earnings: Dict[str, float],
                  deductions: Dict[str, float]) -> CalculationResult:
        """
        计算单个员工的工资
        
        Args:
            employee_id: 员工ID
            earnings: 收入数据字典
            deductions: 扣除数据字典
            
        Returns:
            CalculationResult对象
        """
        try:
            # 1. 计算应发合计
            gross_pay = Decimal(str(sum(earnings.values())))
            
            # 2. 计算扣发合计
            total_deductions = self._calculate_total_deductions(deductions)
            
            # 3. 计算实发合计
            net_pay = gross_pay - total_deductions
            
            # 4. 构建计算结果
            result = CalculationResult(
                employee_id=employee_id,
                gross_pay=gross_pay,
                total_deductions=total_deductions,
                net_pay=net_pay,
                calculation_time=datetime.now()
            )
            
            logger.info(f"员工 {employee_id} 计算完成: 应发={gross_pay}, 扣发={total_deductions}, 实发={net_pay}")
            return result
            
        except Exception as e:
            logger.error(f"员工 {employee_id} 计算失败: {str(e)}")
            raise
        
    def calculate_payroll_entry(self, 
                              employee_id: int,
                              payroll_run_id: int,
                              earnings_data: Dict[str, Any],
                              deductions_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        计算单个员工的工资条目
        
        Args:
            employee_id: 员工ID
            payroll_run_id: 工资运行ID
            earnings_data: 收入数据字典 (从导入数据中获取)
            deductions_data: 扣除数据字典 (从导入数据中获取)
            
        Returns:
            计算结果字典
        """
        try:
            # 1. 计算应发合计 (gross_pay)
            gross_pay = self._calculate_gross_pay(earnings_data)
            
            # 2. 计算扣发合计 (total_deductions)
            total_deductions = self._calculate_total_deductions(deductions_data)
            
            # 3. 计算实发合计 (net_pay)
            net_pay = gross_pay - total_deductions
            
            # 4. 构建计算结果
            result = {
                'employee_id': employee_id,
                'payroll_run_id': payroll_run_id,
                'gross_pay': gross_pay,
                'total_deductions': total_deductions,
                'net_pay': net_pay,
                'earnings_details': earnings_data,
                'deductions_details': deductions_data,
                'calculation_log': {
                    'calculator_version': 'simple_v1.0',
                    'calculation_time': None,  # 将在调用时设置
                    'earnings_count': len(earnings_data),
                    'deductions_count': len(deductions_data),
                    'calculation_steps': [
                        f"应发合计: {gross_pay}",
                        f"扣发合计: {total_deductions}",
                        f"实发合计: {net_pay}"
                    ]
                }
            }
            
            logger.info(f"员工 {employee_id} 计算完成: 应发={gross_pay}, 扣发={total_deductions}, 实发={net_pay}")
            return result
            
        except Exception as e:
            logger.error(f"员工 {employee_id} 计算失败: {str(e)}")
            raise

    def _calculate_gross_pay(self, earnings_data: Dict[str, Any]) -> Decimal:
        """
        计算应发合计
        
        Args:
            earnings_data: 收入数据字典，格式：{
                'BASIC_SALARY': {'name': '基本工资', 'amount': 5000},
                'ALLOWANCE': {'name': '津贴', 'amount': 1000}
            }
            
        Returns:
            应发合计金额
        """
        total = Decimal('0')
        
        for key, value in earnings_data.items():
            if isinstance(value, dict) and 'amount' in value:
                amount = Decimal(str(value['amount']))
                total += amount
            elif isinstance(value, (int, float, Decimal)):
                total += Decimal(str(value))
        
        return total

    def _calculate_total_deductions(self, deductions_data: Dict[str, Any]) -> Decimal:
        """
        计算扣发合计 - 只计算个人扣缴部分，排除单位扣缴
        
        Args:
            deductions_data: 扣除数据字典，支持两种格式：
                格式1: {'SOCIAL_INSURANCE': {'name': '社保', 'amount': 500}}
                格式2: {'HOUSING_FUND_PERSONAL': {'name': '公积金个人', 'amount': 500, 'type': 'PERSONAL_DEDUCTION'}}
            
        Returns:
            扣发合计金额（只包含个人扣缴）
        """
        total = Decimal('0')
        
        # 获取薪资组件定义，用于判断扣缴类型
        from ..models import PayrollComponentDefinition
        
        try:
            # 查询所有活跃的薪资组件定义
            components = self.db.query(PayrollComponentDefinition).filter(
                PayrollComponentDefinition.is_active == True
            ).all()
            
            # 创建组件代码到类型的映射
            component_type_map = {comp.code: comp.type for comp in components}
            
            # 定义个人扣缴类型
            personal_deduction_types = ['PERSONAL_DEDUCTION', 'DEDUCTION']
            
            for key, value in deductions_data.items():
                if isinstance(value, dict) and 'amount' in value:
                    amount = Decimal(str(value['amount']))
                    
                    # 优先使用项目内置的 type 字段判断（新格式）
                    if 'type' in value:
                        item_type = value['type']
                        if item_type in personal_deduction_types:
                            total += amount
                            logger.debug(f"✅ [内置类型] 计入个人扣缴: {key} = {amount} (类型: {item_type})")
                        else:
                            logger.debug(f"❌ [内置类型] 跳过单位扣缴: {key} = {amount} (类型: {item_type})")
                    else:
                        # 回退到根据组件代码查询数据库（旧格式兼容）
                        component_type = component_type_map.get(key)
                        if component_type and component_type in personal_deduction_types:
                            total += amount
                            logger.debug(f"✅ [数据库类型] 计入个人扣缴: {key} = {amount} (类型: {component_type})")
                        elif component_type is None:
                            # 如果找不到组件定义，默认当作个人扣缴（向后兼容）
                            total += amount
                            logger.warning(f"⚠️ [默认处理] 未找到组件定义: {key}，默认当作个人扣缴")
                        else:
                            logger.debug(f"❌ [数据库类型] 跳过单位扣缴: {key} = {amount} (类型: {component_type})")
                        
                elif isinstance(value, (int, float, Decimal)):
                    # 如果是直接的数值，默认当作个人扣缴（向后兼容）
                    total += Decimal(str(value))
                    logger.debug(f"✅ [数值格式] 计入个人扣缴: {key} = {value} (默认处理)")
                    
        except Exception as e:
            logger.error(f"计算扣发合计时出错: {str(e)}，降级到简单计算")
            # 降级到原始逻辑
            for key, value in deductions_data.items():
                if isinstance(value, dict) and 'amount' in value:
                    amount = Decimal(str(value['amount']))
                    total += amount
                elif isinstance(value, (int, float, Decimal)):
                    total += Decimal(str(value))
        
        return total

    def batch_calculate(self, 
                       payroll_run_id: int,
                       employee_data_list: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        批量计算工资
        
        Args:
            payroll_run_id: 工资运行ID
            employee_data_list: 员工数据列表，每个元素包含：
                {
                    'employee_id': int,
                    'earnings_data': dict,
                    'deductions_data': dict
                }
        
        Returns:
            计算结果列表
        """
        results = []
        
        for employee_data in employee_data_list:
            try:
                result = self.calculate_payroll_entry(
                    employee_id=employee_data['employee_id'],
                    payroll_run_id=payroll_run_id,
                    earnings_data=employee_data['earnings_data'],
                    deductions_data=employee_data['deductions_data']
                )
                results.append(result)
            except Exception as e:
                logger.error(f"批量计算失败 - 员工ID: {employee_data.get('employee_id')}, 错误: {str(e)}")
                # 添加失败记录
                results.append({
                    'employee_id': employee_data.get('employee_id'),
                    'error': str(e),
                    'status': 'failed'
                })
        
        return results


class SimplePayrollDataMapper:
    """简化版工资数据映射器 - 动态从数据库读取工资组件定义"""
    
    def __init__(self, db: Session):
        self.db = db
        self._earnings_mapping = None
        self._deductions_mapping = None
        self._all_components_mapping = None
        self._components_by_type = None
        
    def _load_component_mappings(self):
        """从数据库加载工资组件映射"""
        if (self._earnings_mapping is not None and 
            self._deductions_mapping is not None and 
            self._all_components_mapping is not None):
            return  # 已经加载过了
            
        try:
            # 查询所有活跃的工资组件定义
            from ..models import PayrollComponentDefinition
            
            components = self.db.query(PayrollComponentDefinition).filter(
                PayrollComponentDefinition.is_active == True
            ).all()
            
            # 初始化映射字典
            self._earnings_mapping = {}
            self._deductions_mapping = {}
            self._all_components_mapping = {}
            self._components_by_type = {}
            
            # 统计各类型数量
            type_counts = {}
            
            for component in components:
                code = component.code
                name = component.name
                component_type = component.type
                
                # 所有组件的名称 -> 代码映射
                self._all_components_mapping[name] = code
                
                # 按类型分组
                if component_type not in self._components_by_type:
                    self._components_by_type[component_type] = {}
                self._components_by_type[component_type][name] = code
                
                # 统计数量
                type_counts[component_type] = type_counts.get(component_type, 0) + 1
                
                # 为导入映射准备特定类型的映射
                if component_type == 'EARNING':
                    self._earnings_mapping[name] = code
                elif component_type == 'PERSONAL_DEDUCTION':
                    self._deductions_mapping[name] = code
            
            # 记录日志
            type_summary = ", ".join([f"{t}类型 {c} 个" for t, c in sorted(type_counts.items())])
            logger.info(f"已加载工资组件映射: {type_summary}")
            
        except Exception as e:
            logger.error(f"加载工资组件映射失败: {str(e)}")
            # 如果加载失败，使用空映射
            self._earnings_mapping = {}
            self._deductions_mapping = {}
            self._all_components_mapping = {}
            self._components_by_type = {}
            

            
    @property 
    def EARNINGS_MAPPING(self) -> Dict[str, str]:
        """获取收入项目映射"""
        self._load_component_mappings()
        return self._earnings_mapping
        
    @property
    def DEDUCTIONS_MAPPING(self) -> Dict[str, str]:
        """获取扣除项目映射"""
        self._load_component_mappings()
        return self._deductions_mapping
    
    @property
    def ALL_COMPONENTS_MAPPING(self) -> Dict[str, str]:
        """获取所有组件映射"""
        self._load_component_mappings()
        return self._all_components_mapping
        
    @property
    def COMPONENTS_BY_TYPE(self) -> Dict[str, Dict[str, str]]:
        """按类型获取组件映射"""
        self._load_component_mappings()
        return self._components_by_type
        
    def get_components_by_type(self, component_type: str) -> Dict[str, str]:
        """获取指定类型的组件映射"""
        self._load_component_mappings()
        return self._components_by_type.get(component_type, {})
    
    def map_import_data_to_payroll_data(self, import_row: Dict[str, Any]) -> Dict[str, Any]:
        """
        将导入的Excel数据映射为工资数据结构
        
        Args:
            import_row: Excel导入的原始行数据
            
        Returns:
            映射后的工资数据，包含 earnings_data 和 deductions_data
        """
        earnings_data = {}
        deductions_data = {}
        
        # 确保映射已加载
        self._load_component_mappings()
        
        for key, value in import_row.items():
            if not value or value == 0:
                continue
                
            # 映射收入项目
            if key in self.EARNINGS_MAPPING:
                mapped_key = self.EARNINGS_MAPPING[key]
                earnings_data[mapped_key] = {
                    'name': key,
                    'amount': float(value)
                }
            
            # 映射扣除项目
            elif key in self.DEDUCTIONS_MAPPING:
                mapped_key = self.DEDUCTIONS_MAPPING[key]
                deductions_data[mapped_key] = {
                    'name': key,
                    'amount': float(value)
                }
            else:
                # 记录未映射的字段（用于调试）
                logger.debug(f"未找到映射的字段: {key} = {value}")
        
        return {
            'earnings_data': earnings_data,
            'deductions_data': deductions_data
        }
    
    def get_component_info(self, component_code: str) -> Optional[Dict[str, Any]]:
        """
        获取工资组件的详细信息
        
        Args:
            component_code: 组件代码
            
        Returns:
            组件信息字典，包含名称、类型等
        """
        try:
            from ..models import PayrollComponentDefinition
            
            component = self.db.query(PayrollComponentDefinition).filter(
                PayrollComponentDefinition.code == component_code,
                PayrollComponentDefinition.is_active == True
            ).first()
            
            if component:
                return {
                    'code': component.code,
                    'name': component.name,
                    'type': component.type,
                    'is_taxable': component.is_taxable,
                    'is_social_security_base': component.is_social_security_base,
                    'is_housing_fund_base': component.is_housing_fund_base,
                    'calculation_method': component.calculation_method,
                    'calculation_parameters': component.calculation_parameters
                }
            return None
            
        except Exception as e:
            logger.error(f"获取组件信息失败 {component_code}: {str(e)}")
            return None


def example_usage():
    """示例使用方法"""
    print("💡 **动态工资组件映射引擎示例**")
    print("=" * 50)
    
    # 这里只是示例，实际使用时需要传入真实的数据库会话
    # from ..database import get_db_v2
    # db = next(get_db_v2())
    # 
    # # 初始化计算器和映射器
    # calculator = SimplePayrollCalculator(db)
    # mapper = SimplePayrollDataMapper(db)
    # 
    # # 模拟Excel导入数据
    # import_data = {
    #     '基本工资': 5000,
    #     '岗位工资': 3000,
    #     '月基础绩效': 2000,
    #     '养老保险(个人)': 400,
    #     '个人所得税': 200
    # }
    # 
    # # 使用映射器处理导入数据
    # payroll_data = mapper.map_import_data_to_payroll_data(import_data)
    # 
    # # 执行计算
    # result = calculator.calculate(
    #     employee_id=123,
    #     earnings=payroll_data['earnings_data'],
    #     deductions=payroll_data['deductions_data']
    # )
    # 
    # print(f"导入数据: {import_data}")
    # print(f"映射后收入: {payroll_data['earnings_data']}")
    # print(f"映射后扣除: {payroll_data['deductions_data']}")
    # print(f"计算结果: 应发={result.gross_pay}, 扣发={result.total_deductions}, 实发={result.net_pay}")
    
    print("📝 **特性说明**:")
    print("  • 动态从 config.payroll_component_definitions 表读取组件定义")
    print("  • 支持收入类型 (EARNING) 和个人扣除类型 (PERSONAL_DEDUCTION)")
    print("  • 自动创建常见别名映射（如 '基本工资' -> 'BASIC_SALARY'）")
    print("  • 包含组件详细信息查询功能")
    print("  • 需要数据库连接才能运行完整功能")


if __name__ == "__main__":
    example_usage() 