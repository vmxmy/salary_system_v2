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

from ..models import PayrollEntry, Employee
from ..pydantic_models.payroll import PayrollEntryUpdate
import logging

logger = logging.getLogger(__name__)


class SimplePayrollCalculator:
    """简化版工资计算引擎"""
    
    def __init__(self, db: Session):
        self.db = db
        
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
            earnings_data: 收入数据字典
            
        Returns:
            应发合计金额
        """
        total = Decimal('0.00')
        
        for key, value in earnings_data.items():
            if value is not None:
                try:
                    # 处理标准格式：{"name": "名称", "amount": 金额}
                    if isinstance(value, dict) and 'amount' in value:
                        amount = Decimal(str(value['amount']))
                        total += amount
                        logger.debug(f"收入项目 {key} ({value.get('name', key)}): {amount}")
                    # 处理简化格式：直接数值
                    else:
                        amount = Decimal(str(value))
                        total += amount
                        logger.debug(f"收入项目 {key}: {amount}")
                except (ValueError, TypeError) as e:
                    logger.warning(f"收入项目 {key} 金额转换失败: {value}, 错误: {e}")
                    continue
        
        return total
    
    def _calculate_total_deductions(self, deductions_data: Dict[str, Any]) -> Decimal:
        """
        计算扣发合计
        
        Args:
            deductions_data: 扣除数据字典
            
        Returns:
            扣发合计金额
        """
        total = Decimal('0.00')
        
        for key, value in deductions_data.items():
            if value is not None:
                try:
                    # 处理标准格式：{"name": "名称", "amount": 金额}
                    if isinstance(value, dict) and 'amount' in value:
                        amount = Decimal(str(value['amount']))
                        total += amount
                        logger.debug(f"扣除项目 {key} ({value.get('name', key)}): {amount}")
                    # 处理简化格式：直接数值
                    else:
                        amount = Decimal(str(value))
                        total += amount
                        logger.debug(f"扣除项目 {key}: {amount}")
                except (ValueError, TypeError) as e:
                    logger.warning(f"扣除项目 {key} 金额转换失败: {value}, 错误: {e}")
                    continue
        
        return total
    
    def batch_calculate(self, 
                       payroll_run_id: int,
                       employee_data_list: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        批量计算工资
        
        Args:
            payroll_run_id: 工资运行ID
            employee_data_list: 员工数据列表，每个元素包含员工ID和薪资数据
            
        Returns:
            计算结果列表
        """
        results = []
        
        for employee_data in employee_data_list:
            try:
                employee_id = employee_data['employee_id']
                earnings_data = employee_data.get('earnings', {})
                deductions_data = employee_data.get('deductions', {})
                
                result = self.calculate_payroll_entry(
                    employee_id=employee_id,
                    payroll_run_id=payroll_run_id,
                    earnings_data=earnings_data,
                    deductions_data=deductions_data
                )
                
                results.append(result)
                
            except Exception as e:
                logger.error(f"批量计算中员工数据处理失败: {employee_data}, 错误: {e}")
                continue
        
        logger.info(f"批量计算完成: 成功 {len(results)} 条，失败 {len(employee_data_list) - len(results)} 条")
        return results


class SimplePayrollDataMapper:
    """简化版工资数据映射器"""
    
    # 标准收入项目映射（映射到数据库现有字段）
    EARNINGS_MAPPING = {
        # 基础工资类 - 映射到数据库现有字段
        '基本工资': 'BASIC_SALARY',
        '岗位工资': 'POSITION_SALARY_GENERAL',
        '薪级工资': 'SALARY_GRADE',
        '职务工资': 'POSITION_TECH_GRADE_SALARY',
        '技术等级工资': 'POSITION_TECH_GRADE_SALARY',
        '职务/技术等级工资': 'POSITION_TECH_GRADE_SALARY',
        '级别工资': 'GRADE_POSITION_LEVEL_SALARY',
        '岗位级别工资': 'GRADE_POSITION_LEVEL_SALARY',
        '级别/岗位级别工资': 'GRADE_POSITION_LEVEL_SALARY',
        
        # 绩效类
        '基础绩效奖': 'BASIC_PERFORMANCE',
        '基础绩效': 'BASIC_PERFORMANCE',
        '月基础绩效': 'BASIC_PERFORMANCE',
        '绩效工资': 'PERFORMANCE_SALARY',
        '月奖励绩效': 'MONTHLY_PERFORMANCE_BONUS',
        '季度绩效考核薪酬': 'QUARTERLY_PERFORMANCE_ASSESSMENT',
        
        # 津贴补贴类
        '补助': 'ALLOWANCE_GENERAL',
        '津贴': 'GENERAL_ALLOWANCE',
        '公务员规范性津贴补贴': 'CIVIL_STANDARD_ALLOWANCE',
        '公务交通补贴': 'TRAFFIC_ALLOWANCE',
        '岗位职务补贴': 'POSITION_ALLOWANCE',
        '信访工作人员岗位津贴': 'PETITION_ALLOWANCE',
        '乡镇津贴': 'TOWNSHIP_ALLOWANCE',
        
        # 特殊补贴类
        '93年工改保留补贴': 'REFORM_ALLOWANCE_1993',
        '独生子女父母奖励金': 'ONLY_CHILD_PARENT_BONUS',
        '见习试用期工资': 'PROBATION_SALARY',
        
        # 补扣发类
        '绩效奖金补扣发': 'PERFORMANCE_BONUS',
    }
    
    # 标准扣除项目映射（映射到数据库现有字段）
    DEDUCTIONS_MAPPING = {
        # 社会保险类 - 映射到数据库现有字段
        '个人缴养老保险费': 'PENSION_PERSONAL_AMOUNT',
        '养老保险个人应缴金额': 'PENSION_PERSONAL_AMOUNT',
        '个人缴医疗保险费': 'MEDICAL_INS_PERSONAL_AMOUNT', 
        '医疗保险个人缴纳金额': 'MEDICAL_INS_PERSONAL_AMOUNT',
        '个人缴职业年金': 'OCCUPATIONAL_PENSION_PERSONAL_AMOUNT',
        '职业年金个人缴纳': 'OCCUPATIONAL_PENSION_PERSONAL_AMOUNT',
        '个人缴失业保险费': 'UNEMPLOYMENT_PERSONAL_AMOUNT',
        '失业个人应缴金额': 'UNEMPLOYMENT_PERSONAL_AMOUNT',
        '个人缴住房公积金': 'HOUSING_FUND_PERSONAL',
        
        # 税费类
        '个人所得税': 'PERSONAL_INCOME_TAX',
        
        # 调整类
        '补扣社保': 'SOCIAL_INSURANCE_ADJUSTMENT',
        '一次性补扣发': 'ONE_TIME_ADJUSTMENT',
        '退款扣除调整': 'REFUND_DEDUCTION_ADJUSTMENT',
        '2022年医疗扣除调整': 'MEDICAL_2022_DEDUCTION_ADJUSTMENT',
        
        # 其他扣除
        '工会费': 'union_fee',
        '其他扣除': 'other_deductions',
    }
    
    @classmethod
    def map_import_data_to_payroll_data(cls, import_row: Dict[str, Any]) -> Dict[str, Any]:
        """
        将导入的原始数据映射为工资计算数据
        
        Args:
            import_row: 导入的原始数据行
            
        Returns:
            映射后的工资数据
        """
        earnings = {}
        deductions = {}
        
        # 映射收入项目
        for original_field, standard_field in cls.EARNINGS_MAPPING.items():
            if original_field in import_row and import_row[original_field] is not None:
                try:
                    value = Decimal(str(import_row[original_field]))
                    if value > 0:  # 只记录正数收入
                        earnings[standard_field] = value
                except (ValueError, TypeError):
                    logger.warning(f"收入项目 {original_field} 数值转换失败: {import_row[original_field]}")
        
        # 映射扣除项目
        for original_field, standard_field in cls.DEDUCTIONS_MAPPING.items():
            if original_field in import_row and import_row[original_field] is not None:
                try:
                    value = Decimal(str(import_row[original_field]))
                    if value > 0:  # 只记录正数扣除
                        deductions[standard_field] = value
                except (ValueError, TypeError):
                    logger.warning(f"扣除项目 {original_field} 数值转换失败: {import_row[original_field]}")
        
        return {
            'employee_id': import_row.get('employee_id'),
            'earnings': earnings,
            'deductions': deductions,
            'original_data': import_row  # 保留原始数据用于审计
        }


# 使用示例
def example_usage():
    """使用示例"""
    
    # 模拟导入的原始数据
    import_data = {
        'employee_id': 354,
        '人员编号': '00001',
        '人员姓名': '张三',
        '基本工资': '3000.00',
        '岗位工资': '1500.00',
        '基础绩效奖': '800.00',
        '个人缴养老保险费': '240.00',
        '个人缴医疗保险费': '60.00',
        '个人所得税': '45.00',
    }
    
    # 1. 数据映射
    mapper = SimplePayrollDataMapper()
    payroll_data = mapper.map_import_data_to_payroll_data(import_data)
    
    print("映射后的数据:")
    print(f"收入: {payroll_data['earnings']}")
    print(f"扣除: {payroll_data['deductions']}")
    
    # 2. 工资计算
    # calculator = SimplePayrollCalculator(db_session)
    # result = calculator.calculate_payroll_entry(
    #     employee_id=payroll_data['employee_id'],
    #     payroll_run_id=1,
    #     earnings_data=payroll_data['earnings'],
    #     deductions_data=payroll_data['deductions']
    # )
    # 
    # print("计算结果:")
    # print(f"应发合计: {result['gross_pay']}")
    # print(f"扣发合计: {result['total_deductions']}")
    # print(f"实发合计: {result['net_pay']}")


if __name__ == "__main__":
    example_usage() 