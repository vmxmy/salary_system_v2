"""
工资审核服务模块
提供自动校验、异常检测、修复建议等审核相关功能
"""

from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from datetime import datetime
from decimal import Decimal
import logging

from ...models import (
    PayrollRun, PayrollEntry, PayrollPeriod, Employee, SystemParameter,
    TaxBracket, SocialSecurityRate, PayrollComponentDefinition
)
from ...models.audit import AuditRuleConfiguration
from ...pydantic_models.simple_payroll import AuditSummaryResponse, AuditAnomalyResponse

logger = logging.getLogger(__name__)

class PayrollAuditService:
    """工资审核服务"""
    
    def __init__(self, db: Session):
        self.db = db
        # 缓存系统参数
        self._cached_min_wage = None
        self._cached_tax_brackets = None
        self._cached_social_security_rates = None
    
    def get_audit_summary(self, payroll_run_id: int) -> AuditSummaryResponse:
        """获取工资审核汇总信息"""
        try:
            # 验证工资运行是否存在
            payroll_run = self.db.query(PayrollRun).filter(
                PayrollRun.id == payroll_run_id
            ).first()
            
            if not payroll_run:
                raise ValueError(f"工资运行 {payroll_run_id} 不存在")
            
            # 获取所有工资条目
            entries = self.db.query(PayrollEntry).filter(
                PayrollEntry.payroll_run_id == payroll_run_id
            ).all()
            
            if not entries:
                return AuditSummaryResponse(
                    payroll_run_id=payroll_run_id,
                    total_entries=0,
                    total_anomalies=0,
                    error_count=0,
                    warning_count=0,
                    info_count=0,
                    auto_fixable_count=0,
                    manually_ignored_count=0,
                    audit_status='PASSED',
                    audit_type='BASIC',
                    anomalies_by_type={},
                    total_gross_pay=Decimal('0.00'),
                    total_net_pay=Decimal('0.00'),
                    total_deductions=Decimal('0.00')
                )
            
            # 计算基础统计
            total_entries = len(entries)
            total_gross_pay = sum(entry.gross_pay or Decimal('0.00') for entry in entries)
            total_net_pay = sum(entry.net_pay or Decimal('0.00') for entry in entries)
            total_deductions = total_gross_pay - total_net_pay
            
            # 执行审核检查
            anomalies = self._run_all_audit_checks(entries)
            
            # 统计异常
            error_count = sum(1 for a in anomalies if a.severity == 'error')
            warning_count = sum(1 for a in anomalies if a.severity == 'warning')
            info_count = sum(1 for a in anomalies if a.severity == 'info')
            auto_fixable_count = sum(1 for a in anomalies if a.can_auto_fix)
            manually_ignored_count = sum(1 for a in anomalies if a.is_ignored)
            
            # 按类型分组异常
            anomalies_by_type = {}
            for anomaly in anomalies:
                anomaly_type = anomaly.anomaly_type
                if anomaly_type not in anomalies_by_type:
                    anomalies_by_type[anomaly_type] = {
                        'count': 0,
                        'rule_name': anomaly_type.replace('_', ' ').title(),
                        'severity': anomaly.severity
                    }
                anomalies_by_type[anomaly_type]['count'] += 1
            
            # 确定审核状态
            if error_count > 0:
                audit_status = 'FAILED'
            elif warning_count > 0:
                audit_status = 'WARNING'
            else:
                audit_status = 'PASSED'
            
            # 与上期对比（如果有的话）
            comparison_with_previous = self._get_comparison_with_previous(payroll_run.payroll_period_id)
            
            return AuditSummaryResponse(
                payroll_run_id=payroll_run_id,
                total_entries=total_entries,
                total_anomalies=len(anomalies),
                error_count=error_count,
                warning_count=warning_count,
                info_count=info_count,
                auto_fixable_count=auto_fixable_count,
                manually_ignored_count=manually_ignored_count,
                audit_status=audit_status,
                audit_type='BASIC',
                anomalies_by_type=anomalies_by_type,
                total_gross_pay=total_gross_pay,
                total_net_pay=total_net_pay,
                total_deductions=total_deductions,
                comparison_with_previous=comparison_with_previous
            )
            
        except Exception as e:
            logger.error(f"获取审核汇总失败: {e}", exc_info=True)
            raise
    
    def run_audit_check(self, payroll_run_id: int) -> AuditSummaryResponse:
        """执行完整的工资审核检查"""
        logger.info(f"开始执行工资审核检查，运行ID: {payroll_run_id}")
        
        # 更新运行记录的审核时间
        payroll_run = self.db.query(PayrollRun).filter(
            PayrollRun.id == payroll_run_id
        ).first()
        
        if payroll_run:
            payroll_run.updated_at = datetime.now()
            self.db.commit()
        
        # 返回审核汇总
        return self.get_audit_summary(payroll_run_id)
    
    def get_audit_anomalies(
        self,
        payroll_run_id: int,
        anomaly_types: Optional[List[str]] = None,
        severity: Optional[List[str]] = None
    ) -> List[AuditAnomalyResponse]:
        """获取详细的审核异常列表"""
        try:
            entries = self.db.query(PayrollEntry).filter(
                PayrollEntry.payroll_run_id == payroll_run_id
            ).all()
            
            if not entries:
                return []
            
            anomalies = self._run_all_audit_checks(entries)
            
            # 应用过滤条件
            if anomaly_types:
                anomalies = [a for a in anomalies if a.anomaly_type in anomaly_types]
            
            if severity:
                anomalies = [a for a in anomalies if a.severity in severity]
            
            return anomalies
            
        except Exception as e:
            logger.error(f"获取审核异常列表失败: {e}", exc_info=True)
            return []
    
    def _run_all_audit_checks(self, entries: List[PayrollEntry]) -> List[AuditAnomalyResponse]:
        """执行所有审核检查规则"""
        anomalies = []
        
        # 获取已忽略的异常ID列表
        ignored_anomaly_ids = set()
        try:
            from webapp.v2.models.audit import PayrollAuditAnomaly
            ignored_anomalies = self.db.query(PayrollAuditAnomaly.id).filter(
                PayrollAuditAnomaly.is_ignored == True,
                PayrollAuditAnomaly.payroll_entry_id.in_([entry.id for entry in entries])
            ).all()
            ignored_anomaly_ids = {anomaly[0] for anomaly in ignored_anomalies}
        except Exception as e:
            logger.warning(f"获取已忽略异常列表失败: {e}")
        
        for entry in entries:
            try:
                # 获取员工信息
                employee = self.db.query(Employee).filter(
                    Employee.id == entry.employee_id
                ).first()
                
                if not employee:
                    anomalies.append(AuditAnomalyResponse(
                        id=f"missing_employee_{entry.id}",
                        employee_id=entry.employee_id,
                        employee_name="未知员工",
                        employee_code="N/A",
                        anomaly_type="MISSING_DATA_CHECK",
                        severity="error",
                        message="员工信息不存在",
                        details=f"工资条目中的员工ID {entry.employee_id} 在员工表中不存在",
                        can_auto_fix=False,
                        is_ignored=False,
                        fix_applied=False,
                        created_at=datetime.now()
                    ))
                    continue
                
                # 根据数据库配置执行审核检查
                enabled_rules = self._get_enabled_audit_rules()
                
                for rule_code in enabled_rules:
                    try:
                        if rule_code == 'MINIMUM_WAGE_CHECK':
                            anomalies.extend(self._check_minimum_wage(entry, employee))
                        elif rule_code == 'TAX_CALCULATION_CHECK':
                            anomalies.extend(self._check_tax_calculation(entry, employee))
                        elif rule_code == 'SOCIAL_SECURITY_CHECK':
                            anomalies.extend(self._check_social_security(entry, employee))
                        elif rule_code == 'SALARY_VARIANCE_CHECK':
                            anomalies.extend(self._check_salary_variance(entry, employee))
                        elif rule_code == 'MISSING_DATA_CHECK':
                            anomalies.extend(self._check_missing_data(entry, employee))
                        elif rule_code == 'CALCULATION_CONSISTENCY_CHECK':
                            anomalies.extend(self._check_calculation_consistency(entry, employee))
                    except Exception as rule_error:
                        logger.error(f"执行审核规则 {rule_code} 时出错: {rule_error}")
                        # 回滚事务以避免连接问题
                        try:
                            self.db.rollback()
                        except:
                            pass
                        continue
                
            except Exception as e:
                logger.error(f"检查员工 {entry.employee_id} 的工资条目时出错: {e}")
                # 回滚事务以避免连接问题
                try:
                    self.db.rollback()
                except:
                    pass
                continue
        
        # 过滤掉已忽略的异常
        filtered_anomalies = []
        for anomaly in anomalies:
            if anomaly.id not in ignored_anomaly_ids:
                filtered_anomalies.append(anomaly)
            else:
                # 标记为已忽略
                anomaly.is_ignored = True
                filtered_anomalies.append(anomaly)
        
        return filtered_anomalies
    
    def _get_enabled_audit_rules(self) -> List[str]:
        """获取启用的审核规则列表"""
        try:
            enabled_rules = self.db.query(AuditRuleConfiguration.rule_code).filter(
                AuditRuleConfiguration.is_enabled == True
            ).all()
            return [rule[0] for rule in enabled_rules]
        except Exception as e:
            logger.error(f"获取启用的审核规则失败: {e}")
            # 回滚事务以避免连接问题
            try:
                self.db.rollback()
            except:
                pass
            # 如果查询失败，返回默认的核心规则
            return ['CALCULATION_CONSISTENCY_CHECK', 'MISSING_DATA_CHECK']
    
    def _check_minimum_wage(self, entry: PayrollEntry, employee: Employee) -> List[AuditAnomalyResponse]:
        """检查最低工资标准"""
        anomalies = []
        
        try:
            # 获取最低工资标准
            min_wage = self._get_minimum_wage()
            if not min_wage:
                return anomalies
            
            # 计算应税收入（基本工资部分）
            basic_salary = Decimal('0.00')
            if entry.earnings_details:
                basic_salary += entry.earnings_details.get('basic_salary', 0)
                basic_salary += entry.earnings_details.get('position_salary', 0)
            
            if basic_salary < min_wage:
                anomalies.append(AuditAnomalyResponse(
                    id=f"min_wage_{entry.id}",
                    employee_id=employee.id,
                    employee_name=f"{employee.last_name}{employee.first_name}",
                    employee_code=employee.employee_code or "N/A",
                    anomaly_type="MINIMUM_WAGE_CHECK",
                    severity="error",
                    message=f"基本工资低于最低标准",
                    details=f"当前基本工资 {basic_salary} 元，低于最低工资标准 {min_wage} 元",
                    current_value=basic_salary,
                    expected_value=min_wage,
                    can_auto_fix=True,
                    is_ignored=False,
                    fix_applied=False,
                    suggested_action=f"建议将基本工资调整为 {min_wage} 元",
                    created_at=datetime.now()
                ))
        
        except Exception as e:
            logger.error(f"检查最低工资时出错: {e}")
        
        return anomalies
    
    def _check_tax_calculation(self, entry: PayrollEntry, employee: Employee) -> List[AuditAnomalyResponse]:
        """检查个税计算"""
        anomalies = []
        
        try:
            # 获取个税扣除额
            current_tax = Decimal('0.00')
            if entry.deductions_details:
                current_tax = Decimal(str(entry.deductions_details.get('personal_income_tax', 0)))
            
            # 简化的个税计算验证
            taxable_income = (entry.gross_pay or Decimal('0.00')) - Decimal('5000')  # 5000元起征点
            
            if taxable_income > 0:
                # 简单的税率计算（实际应该查tax_brackets表）
                expected_tax = self._calculate_expected_tax(taxable_income)
                
                # 允许一定的误差范围（1元）
                if abs(current_tax - expected_tax) > Decimal('1.00'):
                    anomalies.append(AuditAnomalyResponse(
                        id=f"tax_calc_{entry.id}",
                        employee_id=employee.id,
                        employee_name=f"{employee.last_name}{employee.first_name}",
                        employee_code=employee.employee_code or "N/A",
                        anomaly_type="TAX_CALCULATION_CHECK",
                        severity="warning",
                        message="个税计算可能有误",
                        details=f"计算个税 {expected_tax} 元，实际扣除 {current_tax} 元",
                        current_value=current_tax,
                        expected_value=expected_tax,
                        can_auto_fix=True,
                        is_ignored=False,
                        fix_applied=False,
                        suggested_action=f"建议调整个税为 {expected_tax} 元",
                        created_at=datetime.now()
                    ))
        
        except Exception as e:
            logger.error(f"检查个税计算时出错: {e}")
        
        return anomalies
    
    def _check_social_security(self, entry: PayrollEntry, employee: Employee) -> List[AuditAnomalyResponse]:
        """检查社保合规性"""
        anomalies = []
        
        try:
            if not entry.deductions_details:
                return anomalies
            
            # 检查社保各项是否合理
            social_security_items = [
                ('pension_personal', '养老保险'),
                ('medical_personal', '医疗保险'),
                ('unemployment_personal', '失业保险'),
                ('housing_fund_personal', '住房公积金')
            ]
            
            for item_key, item_name in social_security_items:
                current_amount = Decimal(str(entry.deductions_details.get(item_key, 0)))
                
                # 简化检查：社保金额不应为负数且不应过高
                if current_amount < 0:
                    anomalies.append(AuditAnomalyResponse(
                        id=f"social_security_{item_key}_{entry.id}",
                        employee_id=employee.id,
                        employee_name=f"{employee.last_name}{employee.first_name}",
                        employee_code=employee.employee_code or "N/A",
                        anomaly_type="SOCIAL_SECURITY_CHECK",
                        severity="error",
                        message=f"{item_name}扣除金额异常",
                        details=f"{item_name}扣除金额为负数: {current_amount}",
                        current_value=current_amount,
                        expected_value=Decimal('0.00'),
                        can_auto_fix=True,
                        is_ignored=False,
                        fix_applied=False,
                        suggested_action=f"建议将{item_name}调整为0或正确金额",
                        created_at=datetime.now()
                    ))
        
        except Exception as e:
            logger.error(f"检查社保合规时出错: {e}")
        
        return anomalies
    
    def _check_salary_variance(self, entry: PayrollEntry, employee: Employee) -> List[AuditAnomalyResponse]:
        """检查工资波动异常"""
        anomalies = []
        
        try:
            # 获取该员工的历史工资数据进行对比
            # 这里简化处理，实际应该查询历史数据
            current_gross = entry.gross_pay or Decimal('0.00')
            
            # 模拟检查：如果工资为0或过低，标记为异常
            if current_gross <= 0:
                anomalies.append(AuditAnomalyResponse(
                    id=f"salary_variance_{entry.id}",
                    employee_id=employee.id,
                    employee_name=f"{employee.last_name}{employee.first_name}",
                    employee_code=employee.employee_code or "N/A",
                    anomaly_type="SALARY_VARIANCE_CHECK",
                    severity="warning",
                    message="工资金额异常",
                    details=f"应发工资为 {current_gross}，可能数据有误",
                    current_value=current_gross,
                    can_auto_fix=False,
                    is_ignored=False,
                    fix_applied=False,
                    suggested_action="请检查工资计算是否正确",
                    created_at=datetime.now()
                ))
        
        except Exception as e:
            logger.error(f"检查工资波动时出错: {e}")
        
        return anomalies
    
    def _check_missing_data(self, entry: PayrollEntry, employee: Employee) -> List[AuditAnomalyResponse]:
        """检查核心数据完整性 - 只检查应发合计、扣发合计、实发合计"""
        anomalies = []
        
        try:
            missing_fields = []
            invalid_fields = []
            min_value = Decimal('0')
            
            # 检查应发合计 (gross_pay) - 必须大于0
            if entry.gross_pay is None:
                missing_fields.append("应发合计")
            elif entry.gross_pay <= min_value:
                invalid_fields.append(f"应发合计({entry.gross_pay})")
            
            # 检查扣发合计 (total_deductions) - 必须大于0
            if entry.total_deductions is None:
                missing_fields.append("扣发合计")
            elif entry.total_deductions <= min_value:
                invalid_fields.append(f"扣发合计({entry.total_deductions})")
            
            # 检查实发合计 (net_pay) - 必须大于0
            if entry.net_pay is None:
                missing_fields.append("实发合计")
            elif entry.net_pay <= min_value:
                invalid_fields.append(f"实发合计({entry.net_pay})")
            
            # 生成异常记录
            if missing_fields or invalid_fields:
                issues = []
                if missing_fields:
                    issues.append(f"缺失字段：{', '.join(missing_fields)}")
                if invalid_fields:
                    issues.append(f"无效值：{', '.join(invalid_fields)}")
                
                anomalies.append(AuditAnomalyResponse(
                    id=f"missing_data_{entry.id}",
                    employee_id=employee.id,
                    employee_name=f"{employee.last_name}{employee.first_name}",
                    employee_code=employee.employee_code or "N/A",
                    anomaly_type="MISSING_DATA_CHECK",
                    severity="error",
                    message=f"核心数据异常：{'; '.join(issues)}",
                    details=f"应发:{entry.gross_pay}, 扣发:{entry.total_deductions}, 实发:{entry.net_pay} (要求：所有合计字段必须大于0)",
                    can_auto_fix=False,
                    is_ignored=False,
                    fix_applied=False,
                    suggested_action="请检查并修正三个核心合计字段的数值，确保都大于0",
                    created_at=datetime.now()
                ))
        
        except Exception as e:
            logger.error(f"检查核心数据完整性时出错: {e}")
        
        return anomalies
    
    def _check_calculation_consistency(self, entry: PayrollEntry, employee: Employee) -> List[AuditAnomalyResponse]:
        """检查计算一致性"""
        anomalies = []
        tolerance = Decimal('0.01')  # 1分钱的容差
        
        try:
            # 计算明细总和
            earnings_sum = Decimal('0.00')
            if entry.earnings_details:
                for key, value in entry.earnings_details.items():
                    if isinstance(value, dict) and 'amount' in value:
                        earnings_sum += Decimal(str(value['amount']))
                    elif isinstance(value, (int, float, Decimal)):
                        earnings_sum += Decimal(str(value))
            
            deductions_sum = Decimal('0.00')
            if entry.deductions_details:
                for key, value in entry.deductions_details.items():
                    if isinstance(value, dict) and 'amount' in value:
                        deductions_sum += Decimal(str(value['amount']))
                    elif isinstance(value, (int, float, Decimal)):
                        deductions_sum += Decimal(str(value))
            
            calculated_net = earnings_sum - deductions_sum
            
            # 检查总收入一致性
            if abs((entry.gross_pay or Decimal('0.00')) - earnings_sum) > tolerance:
                anomalies.append(AuditAnomalyResponse(
                    id=f"calc_gross_{entry.id}",
                    employee_id=employee.id,
                    employee_name=f"{employee.last_name}{employee.first_name}",
                    employee_code=employee.employee_code or "N/A",
                    anomaly_type="CALCULATION_CONSISTENCY_CHECK",
                    severity="error",
                    message=f"应发合计与明细不一致",
                    details=f"记录值 ¥{entry.gross_pay}，计算值 ¥{earnings_sum}，差额 ¥{abs((entry.gross_pay or Decimal('0.00')) - earnings_sum)}",
                    current_value=entry.gross_pay,
                    expected_value=earnings_sum,
                    can_auto_fix=True,
                    is_ignored=False,
                    fix_applied=False,
                    suggested_action="重新计算应发合计字段",
                    created_at=datetime.now()
                ))
            
            # 检查总扣除一致性
            if abs((entry.total_deductions or Decimal('0.00')) - deductions_sum) > tolerance:
                anomalies.append(AuditAnomalyResponse(
                    id=f"calc_deductions_{entry.id}",
                    employee_id=employee.id,
                    employee_name=f"{employee.last_name}{employee.first_name}",
                    employee_code=employee.employee_code or "N/A",
                    anomaly_type="CALCULATION_CONSISTENCY_CHECK",
                    severity="error",
                    message=f"扣发合计与明细不一致",
                    details=f"记录值 ¥{entry.total_deductions}，计算值 ¥{deductions_sum}，差额 ¥{abs((entry.total_deductions or Decimal('0.00')) - deductions_sum)}",
                    current_value=entry.total_deductions,
                    expected_value=deductions_sum,
                    can_auto_fix=True,
                    is_ignored=False,
                    fix_applied=False,
                    suggested_action="重新计算扣发合计字段",
                    created_at=datetime.now()
                ))
            
            # 检查实发工资一致性
            if abs((entry.net_pay or Decimal('0.00')) - calculated_net) > tolerance:
                anomalies.append(AuditAnomalyResponse(
                    id=f"calc_net_{entry.id}",
                    employee_id=employee.id,
                    employee_name=f"{employee.last_name}{employee.first_name}",
                    employee_code=employee.employee_code or "N/A",
                    anomaly_type="CALCULATION_CONSISTENCY_CHECK",
                    severity="error",
                    message=f"实发合计与计算不一致",
                    details=f"记录值 ¥{entry.net_pay}，计算值 ¥{calculated_net}，差额 ¥{abs((entry.net_pay or Decimal('0.00')) - calculated_net)}",
                    current_value=entry.net_pay,
                    expected_value=calculated_net,
                    can_auto_fix=True,
                    is_ignored=False,
                    fix_applied=False,
                    suggested_action="重新计算实发合计字段",
                    created_at=datetime.now()
                ))
        
        except Exception as e:
            logger.error(f"检查计算一致性时出错: {e}")
        
        return anomalies
    
    def _get_minimum_wage(self) -> Optional[Decimal]:
        """获取最低工资标准"""
        if self._cached_min_wage is not None:
            return self._cached_min_wage
        
        try:
            # 从system_parameters表查询最低工资
            param = self.db.query(SystemParameter).filter(
                SystemParameter.key == 'minimum_wage'
            ).first()
            
            if param:
                self._cached_min_wage = Decimal(param.value)
            else:
                # 默认最低工资（实际应该从配置获取）
                self._cached_min_wage = Decimal('2000.00')
                logger.warning("未找到最低工资配置，使用默认值2000元")
            
            return self._cached_min_wage
        
        except Exception as e:
            logger.error(f"获取最低工资标准失败: {e}")
            # 回滚事务以避免连接问题
            try:
                self.db.rollback()
            except:
                pass
            return Decimal('2000.00')  # 默认值
    
    def _calculate_expected_tax(self, taxable_income: Decimal) -> Decimal:
        """计算预期个税（简化版本）"""
        try:
            # 简化的个税计算，实际应该查tax_brackets表
            if taxable_income <= 0:
                return Decimal('0.00')
            elif taxable_income <= Decimal('3000'):
                return taxable_income * Decimal('0.03')
            elif taxable_income <= Decimal('12000'):
                return taxable_income * Decimal('0.10') - Decimal('210')
            elif taxable_income <= Decimal('25000'):
                return taxable_income * Decimal('0.20') - Decimal('1410')
            else:
                return taxable_income * Decimal('0.25') - Decimal('2660')
        
        except Exception as e:
            logger.error(f"计算预期个税失败: {e}")
            return Decimal('0.00')
    
    def _get_comparison_with_previous(self, current_period_id: int) -> Optional[Dict[str, Decimal]]:
        """获取与上期的对比数据"""
        try:
            # 查找上一个期间（简化处理）
            previous_period = self.db.query(PayrollPeriod).filter(
                PayrollPeriod.id < current_period_id
            ).order_by(PayrollPeriod.id.desc()).first()
            
            if not previous_period:
                return None
            
            # 获取上期最新运行的汇总数据
            previous_run = self.db.query(PayrollRun).filter(
                PayrollRun.payroll_period_id == previous_period.id
            ).order_by(PayrollRun.run_date.desc()).first()
            
            if not previous_run:
                return None
            
            # 计算上期汇总
            previous_entries = self.db.query(PayrollEntry).filter(
                PayrollEntry.payroll_run_id == previous_run.id
            ).all()
            
            if not previous_entries:
                return None
            
            prev_gross = sum(e.gross_pay or Decimal('0.00') for e in previous_entries)
            prev_net = sum(e.net_pay or Decimal('0.00') for e in previous_entries)
            prev_count = len(previous_entries)
            
            # 获取当前期间数据进行对比
            current_run = self.db.query(PayrollRun).filter(
                PayrollRun.payroll_period_id == current_period_id
            ).order_by(PayrollRun.run_date.desc()).first()
            
            if not current_run:
                return None
            
            current_entries = self.db.query(PayrollEntry).filter(
                PayrollEntry.payroll_run_id == current_run.id
            ).all()
            
            curr_gross = sum(e.gross_pay or Decimal('0.00') for e in current_entries)
            curr_net = sum(e.net_pay or Decimal('0.00') for e in current_entries)
            curr_count = len(current_entries)
            
            return {
                "gross_pay_variance": curr_gross - prev_gross,
                "net_pay_variance": curr_net - prev_net,
                "entries_count_variance": Decimal(str(curr_count - prev_count))
            }
        
        except Exception as e:
            logger.error(f"获取对比数据失败: {e}")
            return None 