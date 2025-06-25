"""
集成薪资计算引擎

将简单薪资计算器和社保计算器集成，提供完整的薪资计算服务。

作者：AI Assistant
创建时间：2025-01-27
"""

from decimal import Decimal
from typing import Dict, List, Optional, Any
from sqlalchemy.orm import Session
from datetime import date, datetime
from dataclasses import dataclass
import logging

from .social_insurance_calculator import SocialInsuranceCalculator, SocialInsuranceResult
from ..models import PayrollEntry
from enum import Enum
from dataclasses import dataclass

# 从simple_calculator移植过来的必要类
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
    formula: Optional[str] = None
    rate: Optional[float] = None

logger = logging.getLogger(__name__)

@dataclass
class IntegratedCalculationResult:
    """集成计算结果"""
    employee_id: int
    payroll_run_id: Optional[int] = None
    calculation_period: Optional[date] = None
    
    # 基础薪资计算结果
    gross_pay: Decimal = Decimal('0.00')
    total_deductions: Decimal = Decimal('0.00')
    net_pay: Decimal = Decimal('0.00')
    
    # 社保计算结果
    social_insurance_employee: Decimal = Decimal('0.00')
    social_insurance_employer: Decimal = Decimal('0.00')
    housing_fund_employee: Decimal = Decimal('0.00')
    housing_fund_employer: Decimal = Decimal('0.00')
    
    # 详细组件
    earnings_components: List[CalculationComponent] = None
    deduction_components: List[CalculationComponent] = None
    social_insurance_components: List[Any] = None
    
    # 计算状态和日志
    status: CalculationStatus = CalculationStatus.COMPLETED
    calculation_details: Dict[str, Any] = None
    error_message: Optional[str] = None
    
    def __post_init__(self):
        if self.earnings_components is None:
            self.earnings_components = []
        if self.deduction_components is None:
            self.deduction_components = []
        if self.social_insurance_components is None:
            self.social_insurance_components = []
        if self.calculation_details is None:
            self.calculation_details = {}

class IntegratedPayrollCalculator:
    """集成薪资计算器"""
    
    def __init__(self, db: Session):
        self.db = db
        self.social_insurance_calculator = SocialInsuranceCalculator(db)
    
    def _detect_manual_adjustments(self, existing_deductions_details: Dict[str, Any]) -> Dict[str, Any]:
        """
        检测手动调整项目
        
        Args:
            existing_deductions_details: 现有扣除详情
            
        Returns:
            Dict[str, Any]: 手动调整项目字典 {component_code: component_data}
        """
        logger.info(f"🔍 [手动调整检测] 开始检测，输入数据: {existing_deductions_details}")
        manual_adjustments = {}
        
        # 检查五险一金相关的手动调整
        social_insurance_codes = [
            'PENSION_PERSONAL_AMOUNT',
            'MEDICAL_PERSONAL_AMOUNT', 
            'UNEMPLOYMENT_PERSONAL_AMOUNT',
            'OCCUPATIONAL_PENSION_PERSONAL_AMOUNT',
            'HOUSING_FUND_PERSONAL'
        ]
        
        logger.info(f"🔍 [手动调整检测] 检查 {len(social_insurance_codes)} 个社保项目")
        
        for code in social_insurance_codes:
            if code in existing_deductions_details:
                component_data = existing_deductions_details[code]
                logger.info(f"🔍 [手动调整检测] {code} 存在，数据: {component_data}")
                logger.info(f"🔍 [手动调整检测] {code} 类型: {type(component_data)}")
                
                if isinstance(component_data, dict):
                    is_manual_value = component_data.get('is_manual')
                    logger.info(f"🔍 [手动调整检测] {code} is_manual值: {is_manual_value} (类型: {type(is_manual_value)})")
                    
                    if is_manual_value:
                        manual_adjustments[code] = component_data
                        logger.info(f"✅ [手动调整检测] {code} 确认为手动调整: amount={component_data.get('amount')}, manual_at={component_data.get('manual_at')}")
                    else:
                        logger.info(f"❌ [手动调整检测] {code} 不是手动调整 (is_manual={is_manual_value})")
                else:
                    logger.info(f"❌ [手动调整检测] {code} 不是字典格式，跳过")
            else:
                logger.info(f"❌ [手动调整检测] {code} 不存在于现有数据中")
        
        logger.info(f"🔍 [手动调整检测] 最终结果: 发现 {len(manual_adjustments)} 个手动调整项目: {list(manual_adjustments.keys())}")
        return manual_adjustments
    
    def calculate_employee_payroll(
        self,
        employee_id: int,
        payroll_run_id: int,
        earnings_data: Dict[str, Any],
        deductions_data: Dict[str, Any],
        calculation_period: Optional[date] = None,
        include_social_insurance: bool = True,
        existing_deductions_details: Optional[Dict[str, Any]] = None
    ) -> IntegratedCalculationResult:
        """
        计算员工完整薪资（正确顺序：先算五险一金，再算合计）
        
        计算顺序：
        1. 五险一金计算（个人和单位扣缴）
        2. 手动调整检测（如果is_manual=true，保留原数据）
        3. 汇总计算（应发、扣发、实发、单位成本）
        
        Args:
            employee_id: 员工ID
            payroll_run_id: 薪资运行ID
            earnings_data: 收入数据（已知输入）
            deductions_data: 其他扣除数据（已知输入，不含社保）
            calculation_period: 计算期间（可选）
            include_social_insurance: 是否包含社保计算
            existing_deductions_details: 现有扣除详情（用于检测手动调整）
            
        Returns:
            IntegratedCalculationResult: 集成计算结果
        """
        try:
            logger.info(f"🚀 [集成计算] 开始计算员工 {employee_id} 薪资")
            logger.info(f"📊 [输入数据] 收入数据: {earnings_data}")
            logger.info(f"📊 [输入数据] 扣除数据: {deductions_data}")
            logger.info(f"📊 [输入数据] 计算期间: {calculation_period}")
            logger.info(f"📊 [输入数据] 包含社保: {include_social_insurance}")
            logger.info(f"📊 [输入数据] 现有扣除详情: {existing_deductions_details is not None}")
            
            # 检测手动调整项目
            manual_adjustments = {}
            if existing_deductions_details:
                logger.info(f"📊 [手动调整检测] 准备检测，existing_deductions_details包含 {len(existing_deductions_details)} 个项目")
                manual_adjustments = self._detect_manual_adjustments(existing_deductions_details)
                if manual_adjustments:
                    logger.info(f"🔒 [手动调整检测] 发现 {len(manual_adjustments)} 个手动调整项目: {list(manual_adjustments.keys())}")
                    for key, value in manual_adjustments.items():
                        logger.info(f"🔒 [手动调整详情] {key}: is_manual={value.get('is_manual')}, amount={value.get('amount')}, manual_at={value.get('manual_at')}")
                else:
                    logger.info(f"✅ [手动调整检测] 未发现手动调整项目，可正常覆盖计算")
            else:
                logger.info(f"⚠️ [手动调整检测] existing_deductions_details为空，跳过手动调整检测")
            
            # 创建集成结果对象
            result = IntegratedCalculationResult(
                employee_id=employee_id,
                payroll_run_id=payroll_run_id,
                calculation_period=calculation_period or date.today()
            )
            
            # 第一步：五险一金计算（核心步骤）
            logger.info(f"🔄 [第一步] 开始五险一金计算...")
            if include_social_insurance and calculation_period:
                try:
                    social_insurance_result = self.social_insurance_calculator.calculate_employee_social_insurance(
                        employee_id=employee_id,
                        calculation_period=calculation_period
                    )
                    
                    logger.info(f"✅ [五险一金] 社保计算成功，组件数量: {len(social_insurance_result.components)}")
                    
                    # 提取社保和公积金金额（个人和单位）
                    for component in social_insurance_result.components:
                        logger.info(f"📋 [五险一金组件] {component.insurance_type}: 个人={component.employee_amount}, 单位={component.employer_amount}")
                        
                        if component.insurance_type == "HOUSING_FUND":
                            result.housing_fund_employee += component.employee_amount
                            result.housing_fund_employer += component.employer_amount
                        else:
                            result.social_insurance_employee += component.employee_amount
                            result.social_insurance_employer += component.employer_amount
                    
                    result.social_insurance_components = social_insurance_result.components
                    
                    logger.info(f"💰 [五险一金汇总] 个人社保: {result.social_insurance_employee}, 个人公积金: {result.housing_fund_employee}")
                    logger.info(f"💰 [五险一金汇总] 单位社保: {result.social_insurance_employer}, 单位公积金: {result.housing_fund_employer}")
                    logger.info(f"💰 [五险一金汇总] 个人合计: {result.social_insurance_employee + result.housing_fund_employee}")
                    
                except Exception as social_error:
                    logger.warning(f"❌ [五险一金] 员工 {employee_id} 五险一金计算失败: {social_error}")
                    result.calculation_details['social_insurance_error'] = str(social_error)
            else:
                logger.info(f"⏭️ [五险一金] 跳过社保计算 (include_social_insurance={include_social_insurance}, calculation_period={calculation_period})")
            
            # 第二步：汇总计算
            logger.info(f"🔄 [第二步] 开始汇总计算...")
            
            # 2.1 计算应发合计（所有收入项之和）
            logger.info(f"📊 [应发计算] 开始计算应发合计...")
            gross_pay = Decimal('0.00')
            for key, value in earnings_data.items():
                if isinstance(value, dict) and 'amount' in value:
                    amount = Decimal(str(value['amount']))
                    gross_pay += amount
                    logger.info(f"📈 [应发项目] {key}: {amount} (字典格式)")
                elif isinstance(value, (int, float, Decimal)):
                    amount = Decimal(str(value))
                    gross_pay += amount
                    logger.info(f"📈 [应发项目] {key}: {amount} (数值格式)")
                else:
                    logger.warning(f"⚠️ [应发项目] {key}: 无法识别的格式 {type(value)} = {value}")
            
            result.gross_pay = gross_pay
            logger.info(f"💚 [应发合计] 总应发: {result.gross_pay}")
            
            # 2.2 计算所有个人扣缴项目（新规则：包含所有PERSONAL_DEDUCTION类型的项目）
            logger.info(f"💰 [个人扣缴计算] 开始计算所有个人扣缴项目...")

            # 2.2.1 获取个人所得税
            personal_income_tax = Decimal('0.00')
            tax_data = deductions_data.get('PERSONAL_INCOME_TAX', {})
            if isinstance(tax_data, dict) and 'amount' in tax_data:
                personal_income_tax = Decimal(str(tax_data['amount']))
                logger.info(f"💰 [个税] 获取到个人所得税: {personal_income_tax}")
            elif isinstance(tax_data, (int, float, Decimal)):
                personal_income_tax = Decimal(str(tax_data))
                logger.info(f"💰 [个税] 获取到个人所得税: {personal_income_tax}")
            else:
                logger.info(f"💰 [个税] 未找到个人所得税数据，默认为 0")

            # 2.2.2 计算个人五险一金合计
            personal_social_insurance_total = result.social_insurance_employee + result.housing_fund_employee
            logger.info(f"🏦 [个人社保公积金] 个人社保: {result.social_insurance_employee}")
            logger.info(f"🏦 [个人社保公积金] 个人公积金: {result.housing_fund_employee}")
            logger.info(f"🏦 [个人社保公积金] 个人五险一金合计: {personal_social_insurance_total}")

            # 2.2.3 计算其他个人扣缴项目（补扣、调整等）
            other_personal_deductions = Decimal('0.00')
            other_personal_items = []

            # 遍历所有扣除数据，查找其他个人扣缴项目
            for key, value in deductions_data.items():
                # 跳过已经处理的个人所得税
                if key == 'PERSONAL_INCOME_TAX':
                    continue
                
                # 跳过五险一金相关项目（这些已经通过社保计算器处理）
                if key in ['PENSION_PERSONAL_AMOUNT', 'MEDICAL_PERSONAL_AMOUNT', 'UNEMPLOYMENT_PERSONAL_AMOUNT', 
                           'OCCUPATIONAL_PENSION_PERSONAL_AMOUNT', 'HOUSING_FUND_PERSONAL']:
                    continue
                
                # 处理其他可能的个人扣缴项目
                if isinstance(value, dict) and 'amount' in value:
                    amount = Decimal(str(value['amount']))
                    other_personal_deductions += amount
                    other_personal_items.append(f"{key}: {amount}")
                    logger.info(f"📋 [其他个人扣缴] {key}: {amount} ({value.get('name', '未知项目')})")
                elif isinstance(value, (int, float, Decimal)):
                    amount = Decimal(str(value))
                    other_personal_deductions += amount
                    other_personal_items.append(f"{key}: {amount}")
                    logger.info(f"📋 [其他个人扣缴] {key}: {amount}")

            logger.info(f"📊 [其他个人扣缴] 其他个人扣缴项目合计: {other_personal_deductions}")
            if other_personal_items:
                logger.info(f"📋 [其他个人扣缴明细] {', '.join(other_personal_items)}")

            # 2.3 计算扣发合计（新规则：个人五险一金 + 个税 + 其他个人扣缴）
            logger.info(f"📊 [扣发计算] 开始计算扣发合计（新规则）...")
            result.total_deductions = personal_income_tax + personal_social_insurance_total + other_personal_deductions
            logger.info(f"📉 [扣发合计] 个税({personal_income_tax}) + 个人五险一金({personal_social_insurance_total}) + 其他个人扣缴({other_personal_deductions}) = {result.total_deductions}")

            # 2.4 计算实发合计
            logger.info(f"📊 [实发计算] 开始计算实发合计...")
            result.net_pay = result.gross_pay - result.total_deductions
            logger.info(f"💰 [实发合计] 应发({result.gross_pay}) - 扣发({result.total_deductions}) = {result.net_pay}")

            # 检查实发是否为负数
            if result.net_pay < 0:
                logger.error(f"🚨 [异常检测] 实发为负数! 应发={result.gross_pay}, 扣发={result.total_deductions}, 实发={result.net_pay}")
                logger.error(f"🚨 [扣发明细] 个税={personal_income_tax}, 个人五险一金={personal_social_insurance_total}, 其他个人扣缴={other_personal_deductions}")
            
            # 2.5 单位成本合计在汇总信息中体现（应发 + 单位五险一金）
            employer_social_insurance_total = result.social_insurance_employer + result.housing_fund_employer
            logger.info(f"🏢 [单位成本] 单位五险一金合计: {employer_social_insurance_total}")
            logger.info(f"🏢 [单位成本] 单位总成本: {result.gross_pay + employer_social_insurance_total}")
            
            # 第三步：更新扣除详情中的社保公积金金额（应用进位规则后的金额）
            # 🎯 新规则：保存个人和单位扣缴项目到详情中，但只有个人部分计入扣发合计
            # 🔒 手动调整保护：如果项目已手动调整，保留原数据不覆盖
            updated_deductions_details = {}
            if hasattr(result, 'social_insurance_components') and result.social_insurance_components:
                for component in result.social_insurance_components:
                    if component.insurance_type == "HOUSING_FUND":
                        personal_key = "HOUSING_FUND_PERSONAL"
                        employer_key = "HOUSING_FUND_EMPLOYER"
                        
                        # 检查个人公积金是否手动调整
                        if personal_key in manual_adjustments:
                            logger.info(f"🔒 [手动调整保护] {personal_key} 已手动调整，保留原数据不覆盖")
                            # 保留手动调整的完整数据
                            updated_deductions_details[personal_key] = manual_adjustments[personal_key].copy()
                        else:
                            # 🏠 公积金使用进位处理后的金额 - 保存个人部分
                            updated_deductions_details[personal_key] = {
                                "amount": int(component.employee_amount),  # 进位后应该是整数，直接转int
                                "name": "住房公积金个人应缴费额",
                                "rate": float(component.employee_rate),
                                "type": "PERSONAL_DEDUCTION"
                            }
                            logger.info(f"💰 [自动计算] {personal_key} 使用计算引擎结果: {int(component.employee_amount)}")
                        
                        # 单位部分总是更新（不涉及手动调整）
                        updated_deductions_details["HOUSING_FUND_EMPLOYER"] = {
                            "amount": int(component.employer_amount),  # 进位后应该是整数，直接转int
                            "name": "住房公积金单位应缴费额",
                            "rate": float(component.employer_rate),
                            "type": "EMPLOYER_DEDUCTION"
                        }
                    else:
                        # 🏥 其他险种使用标准金额 - 保存个人和单位部分
                        personal_key = f"{component.insurance_type}_PERSONAL_AMOUNT"
                        employer_key = f"{component.insurance_type}_EMPLOYER_AMOUNT"
                        
                        # 检查个人险种是否手动调整
                        if personal_key in manual_adjustments:
                            logger.info(f"🔒 [手动调整保护] {personal_key} 已手动调整，保留原数据不覆盖")
                            # 保留手动调整的完整数据
                            updated_deductions_details[personal_key] = manual_adjustments[personal_key].copy()
                        else:
                            # 使用计算引擎结果
                            updated_deductions_details[personal_key] = {
                                "amount": float(component.employee_amount),
                                "name": f"{component.component_name}个人应缴费额",
                                "rate": float(component.employee_rate),
                                "type": "PERSONAL_DEDUCTION"
                            }
                            logger.info(f"💰 [自动计算] {personal_key} 使用计算引擎结果: {float(component.employee_amount)}")
                        
                        # 单位部分总是更新（不涉及手动调整）
                        updated_deductions_details[employer_key] = {
                            "amount": float(component.employer_amount),
                            "name": f"{component.component_name}单位应缴费额",
                            "rate": float(component.employer_rate),
                            "type": "EMPLOYER_DEDUCTION"
                        }
            
            # 保存更新后的扣除详情以便保存到数据库
            result.updated_deductions_details = updated_deductions_details
            
            # 🔍 调试日志：记录更新的扣除详情
            logger.info(f"🔍 [扣除详情更新] 员工 {employee_id} 保存了 {len(updated_deductions_details)} 个扣缴项目到详情中")
            
            # 统计个人和单位扣缴项目数量
            personal_items = [k for k, v in updated_deductions_details.items() if v.get('type') == 'PERSONAL_DEDUCTION']
            employer_items = [k for k, v in updated_deductions_details.items() if v.get('type') == 'EMPLOYER_DEDUCTION']
            
            logger.info(f"📋 [扣缴项目统计] 个人扣缴: {len(personal_items)} 项, 单位扣缴: {len(employer_items)} 项")
            logger.info(f"📋 [个人扣缴项目] {personal_items}")
            logger.info(f"📋 [单位扣缴项目] {employer_items}")
            
            if 'HOUSING_FUND_PERSONAL' in updated_deductions_details:
                logger.info(f"🏠 [住房公积金详情] 员工 {employee_id} 个人公积金: {updated_deductions_details['HOUSING_FUND_PERSONAL']}")
            if 'HOUSING_FUND_EMPLOYER' in updated_deductions_details:
                logger.info(f"🏢 [住房公积金详情] 员工 {employee_id} 单位公积金: {updated_deductions_details['HOUSING_FUND_EMPLOYER']}")
                
            logger.info(f"⚠️ [重要说明] 扣发合计包含所有个人扣缴项目（五险一金+个税+其他扣缴），单位扣缴项目仅保存在详情中供查看")
            
            # 第四步：构建详细计算信息
            result.calculation_details.update({
                'calculation_order': '扣发合计=个人五险一金+个税+其他个人扣缴',
                'gross_pay': float(result.gross_pay),
                'personal_income_tax': float(personal_income_tax),
                'social_insurance_employee': float(result.social_insurance_employee),
                'social_insurance_employer': float(result.social_insurance_employer),
                'housing_fund_employee': float(result.housing_fund_employee),
                'housing_fund_employer': float(result.housing_fund_employer),
                'personal_social_insurance_total': float(personal_social_insurance_total),
                'other_personal_deductions': float(other_personal_deductions),
                'other_personal_items': other_personal_items,
                'employer_social_insurance_total': float(employer_social_insurance_total),
                'total_deductions': float(result.total_deductions),
                'net_pay': float(result.net_pay),
                'total_employer_cost': float(result.gross_pay + employer_social_insurance_total),
                'calculation_time': datetime.now().isoformat(),
                'engine_version': 'integrated_v2.4_all_personal_deductions'  # 🎯 更新版本号：包含所有个人扣缴项目
            })
            
            logger.info(f"✅ [集成计算完成] 员工 {employee_id} - 应发: {result.gross_pay}, 扣发: {result.total_deductions}, 实发: {result.net_pay}")
            return result
            
        except Exception as e:
            logger.error(f"❌ [集成计算失败] 员工 {employee_id} 集成计算失败: {str(e)}")
            # 返回错误结果
            error_result = IntegratedCalculationResult(
                employee_id=employee_id,
                payroll_run_id=payroll_run_id,
                calculation_period=calculation_period or date.today(),
                status=CalculationStatus.FAILED,
                error_message=str(e)
            )
            error_result.calculation_details = {
                'error': str(e),
                'calculation_time': datetime.now().isoformat()
            }
            return error_result
    
    def batch_calculate_payroll(
        self,
        payroll_entries: List[PayrollEntry],
        calculation_period: Optional[date] = None,
        include_social_insurance: bool = True
    ) -> List[IntegratedCalculationResult]:
        """
        批量计算薪资
        
        Args:
            payroll_entries: 薪资条目列表
            calculation_period: 计算期间
            include_social_insurance: 是否包含社保计算
            
        Returns:
            List[IntegratedCalculationResult]: 计算结果列表
        """
        results = []
        
        for entry in payroll_entries:
            try:
                # 调试：检查数据库中的实际数据
                logger.info(f"🔍 [批量计算] 员工 {entry.employee_id} 数据库中的deductions_details: {entry.deductions_details}")
                logger.info(f"🔍 [批量计算] 员工 {entry.employee_id} 是否包含HOUSING_FUND_PERSONAL: {'HOUSING_FUND_PERSONAL' in (entry.deductions_details or {})}")
                
                result = self.calculate_employee_payroll(
                    employee_id=entry.employee_id,
                    payroll_run_id=entry.payroll_run_id,
                    earnings_data=entry.earnings_details or {},
                    deductions_data=entry.deductions_details or {},
                    calculation_period=calculation_period,
                    include_social_insurance=include_social_insurance,
                    existing_deductions_details=entry.deductions_details or {}
                )
                results.append(result)
                
            except Exception as e:
                logger.error(f"批量计算中员工 {entry.employee_id} 失败: {str(e)}")
                error_result = IntegratedCalculationResult(
                    employee_id=entry.employee_id,
                    payroll_run_id=entry.payroll_run_id,
                    calculation_period=calculation_period or date.today(),
                    status=CalculationStatus.FAILED,
                    error_message=str(e)
                )
                results.append(error_result)
        
        return results
    
    def update_payroll_entry_with_social_insurance(
        self,
        entry: PayrollEntry,
        calculation_period: Optional[date] = None
    ) -> Dict[str, Any]:
        """
        为现有薪资条目添加社保计算
        
        Args:
            entry: 薪资条目
            calculation_period: 计算期间
            
        Returns:
            Dict: 更新后的数据
        """
        try:
            if not calculation_period:
                calculation_period = date.today()
            
            # 计算社保
            social_insurance_result = self.social_insurance_calculator.calculate_employee_social_insurance(
                employee_id=entry.employee_id,
                calculation_period=calculation_period
            )
            
            # 提取社保和公积金金额
            social_insurance_employee = Decimal('0.00')
            social_insurance_employer = Decimal('0.00')
            housing_fund_employee = Decimal('0.00')
            housing_fund_employer = Decimal('0.00')
            
            social_insurance_details = {}
            
            for component in social_insurance_result.components:
                component_key = f"{component.insurance_type}_EMPLOYEE"
                employer_key = f"{component.insurance_type}_EMPLOYER"
                
                if component.insurance_type == "HOUSING_FUND":
                    housing_fund_employee += component.employee_amount
                    housing_fund_employer += component.employer_amount
                    
                    social_insurance_details[component_key] = {
                        "amount": float(component.employee_amount),
                        "name": f"{component.component_name}(个人)",
                        "rate": float(component.employee_rate)
                    }
                    social_insurance_details[employer_key] = {
                        "amount": float(component.employer_amount),
                        "name": f"{component.component_name}(单位)",
                        "rate": float(component.employer_rate)
                    }
                else:
                    social_insurance_employee += component.employee_amount
                    social_insurance_employer += component.employer_amount
                    
                    social_insurance_details[component_key] = {
                        "amount": float(component.employee_amount),
                        "name": f"{component.component_name}(个人)",
                        "rate": float(component.employee_rate)
                    }
                    social_insurance_details[employer_key] = {
                        "amount": float(component.employer_amount),
                        "name": f"{component.component_name}(单位)",
                        "rate": float(component.employer_rate)
                    }
            
            # 更新扣除详情（只加入个人缴费部分）
            current_deductions = entry.deductions_details or {}
            
            # 检测现有的手动调整项目
            manual_adjustments = self._detect_manual_adjustments(current_deductions)
            
            # 添加个人社保扣除
            if social_insurance_employee > 0:
                current_deductions["SOCIAL_INSURANCE_PERSONAL"] = {
                    "amount": float(social_insurance_employee),
                    "name": "社保(个人)"
                }
            
            # 检查公积金是否手动调整
            if housing_fund_employee > 0:
                if "HOUSING_FUND_PERSONAL" in manual_adjustments:
                    logger.info(f"🔒 [手动调整保护] HOUSING_FUND_PERSONAL 已手动调整，保留原数据不覆盖")
                    # 保留手动调整的数据，不覆盖
                else:
                    current_deductions["HOUSING_FUND_PERSONAL"] = {
                        "amount": float(housing_fund_employee),
                        "name": "公积金(个人)"
                    }
                    logger.info(f"💰 [自动计算] HOUSING_FUND_PERSONAL 使用计算引擎结果: {float(housing_fund_employee)}")
            
            # 重新计算总扣除和实发
            personal_social_insurance_total = social_insurance_employee + housing_fund_employee
            new_total_deductions = (entry.total_deductions or Decimal('0.00')) + personal_social_insurance_total
            new_net_pay = (entry.gross_pay or Decimal('0.00')) - new_total_deductions
            
            return {
                'deductions_details': current_deductions,
                'total_deductions': new_total_deductions,
                'net_pay': new_net_pay,
                'social_insurance_details': social_insurance_details,
                'social_insurance_employee': social_insurance_employee,
                'social_insurance_employer': social_insurance_employer,
                'housing_fund_employee': housing_fund_employee,
                'housing_fund_employer': housing_fund_employer,
                'calculation_log': {
                    'social_insurance_added': True,
                    'social_insurance_time': datetime.now().isoformat(),
                    'applied_rules': social_insurance_result.applied_rules,
                    'unapplied_rules': social_insurance_result.unapplied_rules
                }
            }
            
        except Exception as e:
            logger.error(f"为薪资条目 {entry.id} 添加社保计算失败: {str(e)}")
            return {
                'error': str(e),
                'social_insurance_added': False
            }
    
    def get_calculation_summary(
        self,
        results: List[IntegratedCalculationResult]
    ) -> Dict[str, Any]:
        """
        获取集成计算汇总信息（包含单位成本）
        
        Args:
            results: 计算结果列表
            
        Returns:
            Dict: 汇总信息
        """
        total_employees = len(results)
        successful_results = [r for r in results if r.status == CalculationStatus.COMPLETED]
        failed_results = [r for r in results if r.status == CalculationStatus.FAILED]
        
        if successful_results:
            # 基础薪资汇总
            total_gross_pay = sum(r.gross_pay for r in successful_results)
            total_deductions = sum(r.total_deductions for r in successful_results)
            total_net_pay = sum(r.net_pay for r in successful_results)
            
            # 五险一金汇总（个人和单位）
            total_social_insurance_employee = sum(r.social_insurance_employee for r in successful_results)
            total_social_insurance_employer = sum(r.social_insurance_employer for r in successful_results)
            total_housing_fund_employee = sum(r.housing_fund_employee for r in successful_results)
            total_housing_fund_employer = sum(r.housing_fund_employer for r in successful_results)
            
            # 单位总成本计算
            total_employer_cost = total_gross_pay + total_social_insurance_employer + total_housing_fund_employer
            
        else:
            total_gross_pay = total_deductions = total_net_pay = Decimal('0.00')
            total_social_insurance_employee = total_social_insurance_employer = Decimal('0.00')
            total_housing_fund_employee = total_housing_fund_employer = Decimal('0.00')
            total_employer_cost = Decimal('0.00')
        
        return {
            'calculation_summary': {
                'total_employees': total_employees,
                'successful_count': len(successful_results),
                'failed_count': len(failed_results),
            },
            'payroll_totals': {
                'total_gross_pay': float(total_gross_pay),           # 应发合计
                'total_deductions': float(total_deductions),         # 扣发合计（含个人五险一金）
                'total_net_pay': float(total_net_pay),              # 实发合计
                'total_employer_cost': float(total_employer_cost),   # 单位总成本
            },
            'social_insurance_breakdown': {
                'employee_totals': {
                    'social_insurance': float(total_social_insurance_employee),   # 个人社保合计
                    'housing_fund': float(total_housing_fund_employee),          # 个人公积金合计
                    'total': float(total_social_insurance_employee + total_housing_fund_employee)  # 个人五险一金合计
                },
                'employer_totals': {
                    'social_insurance': float(total_social_insurance_employer),   # 单位社保合计
                    'housing_fund': float(total_housing_fund_employer),          # 单位公积金合计
                    'total': float(total_social_insurance_employer + total_housing_fund_employer)  # 单位五险一金合计
                }
            },
            'cost_analysis': {
                'employee_take_home': float(total_net_pay),                      # 员工实得
                'employee_social_cost': float(total_social_insurance_employee + total_housing_fund_employee),  # 员工社保成本
                'employer_salary_cost': float(total_gross_pay),                  # 单位工资成本
                'employer_social_cost': float(total_social_insurance_employer + total_housing_fund_employer),  # 单位社保成本
                'total_cost': float(total_employer_cost),                       # 单位总成本
                'social_cost_ratio': float((total_social_insurance_employer + total_housing_fund_employer) / total_gross_pay * 100) if total_gross_pay > 0 else 0  # 社保成本比例
            },
            'calculation_metadata': {
                'calculation_date': datetime.now().isoformat(),
                'engine_version': 'integrated_v2.4_all_personal_deductions',
                'calculation_order': '扣发合计=个人五险一金+个税+其他个人扣缴，详情包含单位扣缴项目'
            }
        } 