"""
社保五险一金计算器

基于之前的脚本逻辑，集成到当前薪资计算引擎中。
支持按人员类别和配置名称进行社保费率匹配计算。

作者：AI Assistant
创建时间：2025-01-27
"""

from decimal import Decimal, getcontext, ROUND_HALF_UP
from typing import Dict, List, Optional, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import date, datetime
from dataclasses import dataclass
import json
import logging

from ..models import Employee
from ..models.payroll_config import SocialInsuranceConfig, EmployeeSalaryConfig

logger = logging.getLogger(__name__)

# 设置 Decimal 的精度
getcontext().prec = 10
getcontext().rounding = ROUND_HALF_UP

# 定义五险一金类型
INSURANCE_TYPES = ["PENSION", "MEDICAL", "UNEMPLOYMENT", "INJURY", "MATERNITY", "OCCUPATIONAL_PENSION", "SERIOUS_ILLNESS"]
HOUSING_FUND_TYPE = "HOUSING_FUND"

@dataclass
class SocialInsuranceComponent:
    """社保组件计算结果"""
    component_code: str
    component_name: str
    insurance_type: str
    employee_amount: Decimal = Decimal('0.00')
    employer_amount: Decimal = Decimal('0.00')
    employee_rate: Decimal = Decimal('0.00')
    employer_rate: Decimal = Decimal('0.00')
    base_amount: Decimal = Decimal('0.00')
    rule_id: Optional[int] = None
    config_name: Optional[str] = None

@dataclass
class SocialInsuranceResult:
    """社保计算结果"""
    employee_id: int
    calculation_period: date
    total_employee_amount: Decimal = Decimal('0.00')
    total_employer_amount: Decimal = Decimal('0.00')
    components: List[SocialInsuranceComponent] = None
    applied_rules: List[str] = None
    unapplied_rules: List[str] = None
    calculation_details: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.components is None:
            self.components = []
        if self.applied_rules is None:
            self.applied_rules = []
        if self.unapplied_rules is None:
            self.unapplied_rules = []
        if self.calculation_details is None:
            self.calculation_details = {}

class SocialInsuranceCalculator:
    """社保五险一金计算器"""
    
    def __init__(self, db: Session):
        self.db = db
        
    def calculate_employee_social_insurance(
        self,
        employee_id: int,
        calculation_period: date,
        social_insurance_base: Optional[Decimal] = None,
        housing_fund_base: Optional[Decimal] = None
    ) -> SocialInsuranceResult:
        """
        计算单个员工的五险一金
        
        Args:
            employee_id: 员工ID
            calculation_period: 计算期间
            social_insurance_base: 社保基数（可选，如果不提供则从员工配置获取）
            housing_fund_base: 公积金基数（可选，如果不提供则从员工配置获取）
        
        Returns:
            SocialInsuranceResult: 计算结果
        """
        try:
            # 1. 获取员工信息
            employee_info = self._get_employee_info(employee_id, calculation_period)
            if not employee_info:
                raise ValueError(f"员工 {employee_id} 信息获取失败")
            
            # 2. 获取缴费基数
            if social_insurance_base is None or housing_fund_base is None:
                bases = self._get_employee_base_amounts(employee_id, calculation_period)
                social_insurance_base = social_insurance_base or bases.get('social_insurance_base', Decimal('0'))
                housing_fund_base = housing_fund_base or bases.get('housing_fund_base', Decimal('0'))
            
            # 3. 获取适用的社保配置
            rates_list = self._get_applicable_rates(calculation_period)
            
            # 4. 计算各项社保
            result = SocialInsuranceResult(
                employee_id=employee_id,
                calculation_period=calculation_period
            )
            
            # 计算五险
            for insurance_type in INSURANCE_TYPES:
                component = self._calculate_insurance_component(
                    insurance_type,
                    employee_info,
                    social_insurance_base,
                    rates_list
                )
                if component:
                    result.components.append(component)
                    result.total_employee_amount += component.employee_amount
                    result.total_employer_amount += component.employer_amount
                    if component.rule_id:
                        result.applied_rules.append(f"{insurance_type} (规则ID:{component.rule_id}, 配置:{component.config_name})")
                else:
                    result.unapplied_rules.append(f"{insurance_type} (无匹配规则)")
            
            # 计算公积金
            housing_fund_component = self._calculate_insurance_component(
                HOUSING_FUND_TYPE,
                employee_info,
                housing_fund_base,
                rates_list
            )
            if housing_fund_component:
                result.components.append(housing_fund_component)
                result.total_employee_amount += housing_fund_component.employee_amount
                result.total_employer_amount += housing_fund_component.employer_amount
                result.applied_rules.append(f"公积金 (规则ID:{housing_fund_component.rule_id}, 配置:{housing_fund_component.config_name})")
            else:
                result.unapplied_rules.append("公积金 (无匹配规则)")
            
            # 设置计算详情
            result.calculation_details = {
                'employee_name': employee_info.get('full_name'),
                'personnel_category': employee_info.get('personnel_category_name'),
                'social_insurance_base': float(social_insurance_base),
                'housing_fund_base': float(housing_fund_base),
                'calculation_time': datetime.now().isoformat(),
                'engine_version': 'social_insurance_v1.0'
            }
            
            logger.info(f"员工 {employee_id} 社保计算完成: 个人合计={result.total_employee_amount}, 单位合计={result.total_employer_amount}")
            return result
            
        except Exception as e:
            logger.error(f"员工 {employee_id} 社保计算失败: {str(e)}")
            raise
    
    def _get_employee_info(self, employee_id: int, calculation_period: date) -> Optional[Dict[str, Any]]:
        """获取员工基本信息"""
        # 🔍 使用与正确脚本完全相同的查询逻辑，从 reports.v_employees_basic 获取员工信息
        query = text("""
            SELECT 
                veb.id,
                veb.first_name,
                veb.last_name,
                veb.root_personnel_category_name,
                veb.personnel_category_id,
                veb.housing_fund_client_number
            FROM reports.v_employees_basic veb
            WHERE veb.id = :employee_id
        """)
        
        result = self.db.execute(query, {"employee_id": employee_id}).fetchone()
        if result:
            logger.info(f"📋 [员工信息] ID={result[0]}, 姓名={result[2]}{result[1]}, 人员身份={result[3]}, 身份ID={result[4]}")
            return {
                'id': result[0],
                'first_name': result[1],
                'last_name': result[2],
                'full_name': f"{result[2]}{result[1]}",
                'personnel_category_name': result[3],  # 🎯 关键字段：用于第一阶段匹配
                'personnel_category_id': result[4],    # 🎯 关键字段：用于第二阶段匹配
                'housing_fund_client_number': result[5]
            }
        else:
            logger.warning(f"❌ [员工信息] 未找到员工 {employee_id} 的信息")
        return None
    
    def _get_employee_base_amounts(self, employee_id: int, calculation_period: date) -> Dict[str, Decimal]:
        """获取员工的缴费基数"""
        # 查询员工薪资配置中的缴费基数
        config = self.db.query(EmployeeSalaryConfig).filter(
            EmployeeSalaryConfig.employee_id == employee_id,
            EmployeeSalaryConfig.effective_date <= calculation_period,
            (EmployeeSalaryConfig.end_date.is_(None)) | (EmployeeSalaryConfig.end_date >= calculation_period)
        ).order_by(EmployeeSalaryConfig.effective_date.desc()).first()
        
        if config:
            return {
                'social_insurance_base': Decimal(str(config.social_insurance_base or 0)),
                'housing_fund_base': Decimal(str(config.housing_fund_base or 0))
            }
        
        return {
            'social_insurance_base': Decimal('0'),
            'housing_fund_base': Decimal('0')
        }
    
    def _get_applicable_rates(self, calculation_period: date) -> List[Dict[str, Any]]:
        """获取适用的社保费率配置 - 🎯 完全按照正确脚本的逻辑"""
        configs = self.db.query(SocialInsuranceConfig).filter(
            SocialInsuranceConfig.is_active == True,
            SocialInsuranceConfig.effective_date <= calculation_period,
            (SocialInsuranceConfig.end_date.is_(None)) | (SocialInsuranceConfig.end_date >= calculation_period)
        ).all()
        
        logger.info(f"📋 [费率配置] 查询到 {len(configs)} 个有效的社保配置")
        
        rates_list = []
        for config in configs:
            # 🎯 完全按照正确脚本的JSON处理逻辑
            applicable_categories = config.applicable_personnel_categories
            
            # 检查 applicable_personnel_categories 是否为字符串，如果是则尝试解析为列表
            if isinstance(applicable_categories, str):
                try:
                    applicable_categories = json.loads(applicable_categories)
                except json.JSONDecodeError:
                    logger.warning(f"⚠️ 警告: 无法解析 applicable_personnel_categories 字段为JSON列表: {applicable_categories}")
                    applicable_categories = None  # 解析失败则设为 None
            
            # 确保 applicable_categories 是列表或 None
            if not isinstance(applicable_categories, list):
                if applicable_categories is not None:  # 如果不是列表也不是None，说明不是预期的JSON数组
                    logger.warning(f"⚠️ 警告: applicable_personnel_categories 字段类型非预期，期望列表或None，实际为 {type(applicable_categories)}: {applicable_categories}")
                applicable_categories = None
            
            rate_info = {
                "id": config.id,
                "insurance_type": config.insurance_type,
                "employee_rate": Decimal(str(config.employee_rate)),
                "employer_rate": Decimal(str(config.employer_rate)),
                "min_base": Decimal(str(config.min_base or 0)),
                "max_base": Decimal(str(config.max_base or 999999999)),
                "applicable_personnel_categories": applicable_categories,  # 使用处理后的数据
                "config_name": config.config_name
            }
            
            logger.info(f"💡 [费率配置] 类型={rate_info['insurance_type']}, ID={rate_info['id']}, 个人费率={rate_info['employee_rate']:.4f}, 单位费率={rate_info['employer_rate']:.4f}, 配置名称={rate_info['config_name']}, 适用人员类别={rate_info['applicable_personnel_categories']}")
            
            rates_list.append(rate_info)
        
        return rates_list
    
    def _calculate_insurance_component(
        self,
        insurance_type: str,
        employee_info: Dict[str, Any],
        base_amount: Decimal,
        rates_list: List[Dict[str, Any]]
    ) -> Optional[SocialInsuranceComponent]:
        """计算单个保险组件 - 🎯 完全按照正确脚本的双重匹配逻辑"""
        personnel_category_name = employee_info.get('personnel_category_name')
        personnel_category_id = employee_info.get('personnel_category_id')
        
        logger.info(f"🔍 [匹配{insurance_type}] 员工信息: 人员身份='{personnel_category_name}', 身份ID={personnel_category_id}")
        
        applicable_rate = None
        temp_unapplied_rules = []
        
        # 🎯 完全按照正确脚本的匹配逻辑
        for rate_config in rates_list:
            if rate_config["insurance_type"] != insurance_type:
                continue
                
            logger.info(f"🔎 [检查规则] {insurance_type} 规则ID={rate_config['id']}, 配置名='{rate_config['config_name']}'")
            
            # 🎯 第一阶段：检查 config_name 是否与员工的 root_personnel_category_name 匹配
            config_name_matches = (rate_config["config_name"] == personnel_category_name)
            logger.info(f"   📋 [第一阶段] 配置名匹配: {rate_config['config_name']} == {personnel_category_name} → {config_name_matches}")
            
            # 🎯 第二阶段：检查人员身份ID是否包含在适用人员类别数组中
            personnel_category_matches = (
                rate_config["applicable_personnel_categories"] is None or
                (personnel_category_id is not None and 
                 personnel_category_id in rate_config["applicable_personnel_categories"])
            )
            logger.info(f"   📋 [第二阶段] 身份ID匹配: {personnel_category_id} in {rate_config['applicable_personnel_categories']} → {personnel_category_matches}")
            
            if config_name_matches and personnel_category_matches:
                applicable_rate = rate_config
                logger.info(f"✅ [匹配成功] {insurance_type} 找到适用规则: ID={rate_config['id']}, 配置={rate_config['config_name']}")
                break
            else:
                # 收集不适用的原因
                reasons = []
                if not config_name_matches:
                    reasons.append(f"配置名称({rate_config['config_name']})与人员身份({personnel_category_name})不匹配")
                if not personnel_category_matches:
                    reasons.append(f"人员身份ID({personnel_category_id})不在适用类别({rate_config['applicable_personnel_categories']})中")
                
                temp_unapplied_rules.append(f"规则ID:{rate_config['id']}, 原因:{', '.join(reasons)}")
        
        if not applicable_rate:
            logger.warning(f"❌ [匹配失败] {insurance_type} 未找到适用规则")
            if temp_unapplied_rules:
                logger.warning(f"   📋 [不适用规则] {'; '.join(temp_unapplied_rules)}")
            return None
        
        # 🎯 计算缴费金额 - 完全按照正确脚本的逻辑
        # 确定实际缴费基数（在最低和最高基数之间），并进行四舍五入取整
        actual_base = max(
            applicable_rate["min_base"], 
            min(applicable_rate["max_base"], base_amount)
        ).quantize(Decimal('1'), rounding=ROUND_HALF_UP)
        
        logger.info(f"💰 [缴费基数] {insurance_type}: 原始基数={base_amount}, 最低={applicable_rate['min_base']}, 最高={applicable_rate['max_base']}, 实际基数={actual_base}")
        
        # 🎯 计算缴费金额 - 根据不同险种使用不同的舍入规则
        raw_employee_amount = actual_base * applicable_rate["employee_rate"]
        raw_employer_amount = actual_base * applicable_rate["employer_rate"]
        
        if insurance_type == "HOUSING_FUND":
            # 🏠 公积金特殊进位处理：小数部分 >= 0.1 进一位，否则舍去小数
            employee_amount = self._apply_housing_fund_rounding(raw_employee_amount)
            employer_amount = self._apply_housing_fund_rounding(raw_employer_amount)
        else:
            # 其他险种使用标准的两位小数舍入
            employee_amount = raw_employee_amount.quantize(Decimal('0.01'))
            employer_amount = raw_employer_amount.quantize(Decimal('0.01'))
        
        logger.info(f"💰 [缴费计算] {insurance_type}: 个人缴费={employee_amount} (费率={applicable_rate['employee_rate']:.4f}), 单位缴费={employer_amount} (费率={applicable_rate['employer_rate']:.4f})")
        
        # 生成组件代码和名称
        component_code = f"{insurance_type}_EMPLOYEE" if employee_amount > 0 else f"{insurance_type}_EMPLOYER"
        component_name = self._get_component_name(insurance_type)
        
        return SocialInsuranceComponent(
            component_code=component_code,
            component_name=component_name,
            insurance_type=insurance_type,
            employee_amount=employee_amount,
            employer_amount=employer_amount,
            employee_rate=applicable_rate["employee_rate"],
            employer_rate=applicable_rate["employer_rate"],
            base_amount=actual_base,
            rule_id=applicable_rate["id"],
            config_name=applicable_rate["config_name"]
        )
    
    def _apply_housing_fund_rounding(self, amount: Decimal) -> Decimal:
        """
        公积金特殊进位处理：
        如果小数部分大于等于 0.1，就进一位取整
        否则就舍掉小数部分
        
        例如：
        100.1 -> 101
        100.09 -> 100
        100.5 -> 101
        100.0 -> 100
        
        Args:
            amount: 原始计算金额
            
        Returns:
            Decimal: 处理后的金额
        """
        # 获取整数部分和小数部分
        integer_part = amount.to_integral_value(rounding='ROUND_DOWN')
        decimal_part = amount - integer_part
        
        # 如果小数部分 >= 0.1，进一位
        if decimal_part >= Decimal('0.1'):
            result = integer_part + Decimal('1')
        else:
            # 否则舍去小数部分
            result = integer_part
        
        logger.info(f"🏠 [公积金进位] 原始金额: {amount}, 整数部分: {integer_part}, 小数部分: {decimal_part}, 处理后: {result}")
        return result

    def _get_component_name(self, insurance_type: str) -> str:
        """获取组件中文名称"""
        name_mapping = {
            "PENSION": "养老保险",
            "MEDICAL": "医疗保险", 
            "UNEMPLOYMENT": "失业保险",
            "INJURY": "工伤保险",
            "MATERNITY": "生育保险",
            "OCCUPATIONAL_PENSION": "职业年金",
            "SERIOUS_ILLNESS": "大病医疗",
            "HOUSING_FUND": "住房公积金"
        }
        return name_mapping.get(insurance_type, insurance_type)
    
    def batch_calculate_social_insurance(
        self,
        employee_ids: List[int],
        calculation_period: date
    ) -> List[SocialInsuranceResult]:
        """
        批量计算员工社保
        
        Args:
            employee_ids: 员工ID列表
            calculation_period: 计算期间
            
        Returns:
            List[SocialInsuranceResult]: 计算结果列表
        """
        results = []
        
        for employee_id in employee_ids:
            try:
                result = self.calculate_employee_social_insurance(employee_id, calculation_period)
                results.append(result)
            except Exception as e:
                logger.error(f"员工 {employee_id} 社保计算失败: {str(e)}")
                # 创建错误结果
                error_result = SocialInsuranceResult(
                    employee_id=employee_id,
                    calculation_period=calculation_period
                )
                error_result.calculation_details = {
                    'error': str(e),
                    'calculation_time': datetime.now().isoformat()
                }
                results.append(error_result)
        
        return results
    
    def get_social_insurance_summary(
        self,
        results: List[SocialInsuranceResult]
    ) -> Dict[str, Any]:
        """
        获取社保计算汇总信息
        
        Args:
            results: 计算结果列表
            
        Returns:
            Dict: 汇总信息
        """
        total_employee_amount = sum(r.total_employee_amount for r in results)
        total_employer_amount = sum(r.total_employer_amount for r in results)
        
        # 按险种统计
        insurance_summary = {}
        for result in results:
            for component in result.components:
                if component.insurance_type not in insurance_summary:
                    insurance_summary[component.insurance_type] = {
                        'employee_total': Decimal('0.00'),
                        'employer_total': Decimal('0.00'),
                        'count': 0
                    }
                insurance_summary[component.insurance_type]['employee_total'] += component.employee_amount
                insurance_summary[component.insurance_type]['employer_total'] += component.employer_amount
                insurance_summary[component.insurance_type]['count'] += 1
        
        return {
            'total_employees': len(results),
            'total_employee_amount': float(total_employee_amount),
            'total_employer_amount': float(total_employer_amount),
            'total_amount': float(total_employee_amount + total_employer_amount),
            'insurance_breakdown': {
                k: {
                    'employee_total': float(v['employee_total']),
                    'employer_total': float(v['employer_total']),
                    'total': float(v['employee_total'] + v['employer_total']),
                    'count': v['count']
                }
                for k, v in insurance_summary.items()
            },
            'calculation_date': datetime.now().isoformat()
        } 