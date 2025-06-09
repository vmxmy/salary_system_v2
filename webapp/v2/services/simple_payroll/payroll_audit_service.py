"""
工资审核服务模块
提供自动校验、异常检测、修复建议等审核相关功能
"""

from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func, text
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
        self._cached_audit_rules = None
        self._cache_timestamp = None
    
    def _cache_audit_summary(self, summary: AuditSummaryResponse):
        """缓存审核汇总结果"""
        try:
            from ...models.audit import PayrollRunAuditSummary
            
            # 检查是否已存在
            existing = self.db.query(PayrollRunAuditSummary).filter(
                PayrollRunAuditSummary.payroll_run_id == summary.payroll_run_id
            ).first()
            
            if existing:
                # 更新现有记录
                existing.total_entries = summary.total_entries
                existing.total_anomalies = summary.total_anomalies
                existing.error_count = summary.error_count
                existing.warning_count = summary.warning_count
                existing.info_count = summary.info_count
                existing.auto_fixable_count = summary.auto_fixable_count
                existing.manually_ignored_count = summary.manually_ignored_count
                existing.audit_status = summary.audit_status
                existing.audit_type = summary.audit_type
                existing.anomalies_by_type = summary.anomalies_by_type
                existing.total_gross_pay = summary.total_gross_pay
                existing.total_net_pay = summary.total_net_pay
                existing.total_deductions = summary.total_deductions
                existing.comparison_with_previous = self._serialize_comparison_data(summary.comparison_with_previous)
                existing.audit_completed_at = summary.audit_completed_at
                existing.updated_at = datetime.now()
            else:
                # 创建新记录
                new_summary = PayrollRunAuditSummary(
                    payroll_run_id=summary.payroll_run_id,
                    total_entries=summary.total_entries,
                    total_anomalies=summary.total_anomalies,
                    error_count=summary.error_count,
                    warning_count=summary.warning_count,
                    info_count=summary.info_count,
                    auto_fixable_count=summary.auto_fixable_count,
                    manually_ignored_count=summary.manually_ignored_count,
                    audit_status=summary.audit_status,
                    audit_type=summary.audit_type,
                    anomalies_by_type=summary.anomalies_by_type,
                    total_gross_pay=summary.total_gross_pay,
                    total_net_pay=summary.total_net_pay,
                    total_deductions=summary.total_deductions,
                    comparison_with_previous=self._serialize_comparison_data(summary.comparison_with_previous),
                    audit_completed_at=summary.audit_completed_at
                )
                self.db.add(new_summary)
            
            self.db.commit()
            logger.info(f"审核汇总已缓存: {summary.payroll_run_id}")
            
        except Exception as e:
            logger.error(f"缓存审核汇总失败: {e}")
            self.db.rollback()
    
    def _serialize_comparison_data(self, comparison_data):
        """序列化对比数据，将Decimal转换为float"""
        if not comparison_data:
            return None
        
        return {
            key: float(value) if isinstance(value, Decimal) else value
            for key, value in comparison_data.items()
        }
    
    def _cache_audit_anomalies(self, payroll_run_id: int, anomalies: List[AuditAnomalyResponse]):
        """缓存审核异常到数据库"""
        try:
            from ...models.audit import PayrollAuditAnomaly
            
            # 删除现有的异常记录
            self.db.query(PayrollAuditAnomaly).filter(
                PayrollAuditAnomaly.payroll_run_id == payroll_run_id
            ).delete()
            
            # 批量插入新的异常记录
            anomaly_records = []
            for anomaly in anomalies:
                # 获取payroll_entry_id
                payroll_entry_id = None
                if anomaly.id and '_' in anomaly.id:
                    try:
                        # 从ID中提取entry_id，格式如: missing_employee_123
                        parts = anomaly.id.split('_')
                        if len(parts) >= 2:
                            payroll_entry_id = int(parts[-1])
                    except (ValueError, IndexError):
                        logger.warning(f"无法从异常ID {anomaly.id} 中提取entry_id")
                
                anomaly_record = PayrollAuditAnomaly(
                    id=anomaly.id,
                    payroll_entry_id=payroll_entry_id,
                    payroll_run_id=payroll_run_id,
                    employee_id=anomaly.employee_id,
                    employee_code=anomaly.employee_code,
                    employee_name=anomaly.employee_name,
                    anomaly_type=anomaly.anomaly_type,
                    severity=anomaly.severity,
                    message=anomaly.message,
                    details=anomaly.details,
                    current_value=float(anomaly.current_value) if anomaly.current_value else None,
                    expected_value=float(anomaly.expected_value) if anomaly.expected_value else None,
                    can_auto_fix=anomaly.can_auto_fix,
                    is_ignored=anomaly.is_ignored,
                    fix_applied=anomaly.fix_applied,
                    suggested_action=anomaly.suggested_action
                )
                anomaly_records.append(anomaly_record)
            
            if anomaly_records:
                self.db.add_all(anomaly_records)
                self.db.commit()
                logger.info(f"已缓存 {len(anomaly_records)} 个审核异常到数据库")
            
        except Exception as e:
            logger.error(f"缓存审核异常失败: {e}")
            self.db.rollback()
    
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
    
    def _run_all_audit_checks_optimized(self, entries_with_employees: List[PayrollEntry]) -> List[AuditAnomalyResponse]:
        """优化版本：执行所有审核检查规则，避免N+1查询"""
        anomalies = []
        
        # 缓存启用的审核规则
        enabled_rules = self._get_enabled_audit_rules_cached()
        
        # 批量获取已忽略的异常ID列表
        ignored_anomaly_ids = set()
        try:
            from webapp.v2.models.audit import PayrollAuditAnomaly
            entry_ids = [entry.id for entry in entries_with_employees]
            if entry_ids:
                ignored_anomalies = self.db.query(PayrollAuditAnomaly.id).filter(
                    PayrollAuditAnomaly.is_ignored == True,
                    PayrollAuditAnomaly.payroll_entry_id.in_(entry_ids)
                ).all()
                ignored_anomaly_ids = {anomaly[0] for anomaly in ignored_anomalies}
        except Exception as e:
            logger.warning(f"获取已忽略异常列表失败: {e}")
        
        # 批量处理条目，员工信息已经通过joinedload加载
        for entry in entries_with_employees:
            try:
                employee = entry.employee  # 使用已加载的员工信息
                
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
                
                # 执行启用的审核规则
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
                        continue
                
            except Exception as e:
                logger.error(f"检查员工 {entry.employee_id} 的工资条目时出错: {e}")
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
    
    def _get_enabled_audit_rules_cached(self) -> List[str]:
        """获取启用的审核规则列表（带缓存）"""
        # 检查缓存是否有效（5分钟有效期）
        if (self._cached_audit_rules is not None and 
            self._cache_timestamp is not None and 
            (datetime.now() - self._cache_timestamp).total_seconds() < 300):
            return self._cached_audit_rules
        
        try:
            enabled_rules = self.db.query(AuditRuleConfiguration.rule_code).filter(
                AuditRuleConfiguration.is_enabled == True
            ).all()
            self._cached_audit_rules = [rule[0] for rule in enabled_rules]
            self._cache_timestamp = datetime.now()
            return self._cached_audit_rules
        except Exception as e:
            logger.error(f"获取启用的审核规则失败: {e}")
            # 如果查询失败，返回默认的核心规则
            return ['CALCULATION_CONSISTENCY_CHECK', 'MISSING_DATA_CHECK']
    
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
            
            # 检查扣发合计 (total_deductions) - 可以为0（表示无扣除项）
            if entry.total_deductions is None:
                missing_fields.append("扣发合计")
            elif entry.total_deductions < min_value:
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
    
    def _get_comparison_with_previous_optimized(self, current_period_id: int) -> Optional[Dict[str, Decimal]]:
        """优化版本：获取与上期的对比数据，使用聚合查询"""
        try:
            # 使用聚合查询一次性获取当前期间和上期的汇总数据
            from sqlalchemy import text
            
            query = text("""
                WITH period_stats AS (
                    SELECT 
                        pp.id as period_id,
                        pp.name as period_name,
                        COUNT(pe.id) as entry_count,
                        COALESCE(SUM(pe.gross_pay), 0) as total_gross_pay,
                        COALESCE(SUM(pe.net_pay), 0) as total_net_pay
                    FROM payroll.payroll_periods pp
                    LEFT JOIN payroll.payroll_runs pr ON pr.payroll_period_id = pp.id
                    LEFT JOIN payroll.payroll_entries pe ON pe.payroll_run_id = pr.id
                    WHERE pp.id IN (
                        :current_period_id,
                        (SELECT id FROM payroll.payroll_periods 
                         WHERE id < :current_period_id 
                         ORDER BY id DESC LIMIT 1)
                    )
                    GROUP BY pp.id, pp.name
                    ORDER BY pp.id DESC
                )
                SELECT * FROM period_stats
            """)
            
            result = self.db.execute(query, {"current_period_id": current_period_id}).fetchall()
            
            if len(result) < 2:
                return None
            
            # 第一行是当前期间，第二行是上期
            current_stats = result[0]
            previous_stats = result[1]
            
            return {
                "gross_pay_variance": Decimal(str(current_stats.total_gross_pay)) - Decimal(str(previous_stats.total_gross_pay)),
                "net_pay_variance": Decimal(str(current_stats.total_net_pay)) - Decimal(str(previous_stats.total_net_pay)),
                "entries_count_variance": Decimal(str(current_stats.entry_count - previous_stats.entry_count))
            }
        
        except Exception as e:
            logger.error(f"获取优化对比数据失败: {e}")
            return None
    
    def get_audit_summary(self, payroll_run_id: int) -> AuditSummaryResponse:
        """获取审核汇总，优先返回缓存数据"""
        try:
            # 回滚任何挂起的事务
            self.db.rollback()
            
            # 首先检查是否已有缓存的审核汇总
            logger.info(f"查询缓存的审核汇总: {payroll_run_id}")
            from ...models.audit import PayrollRunAuditSummary
            cached_summary = self.db.query(PayrollRunAuditSummary).filter(
                PayrollRunAuditSummary.payroll_run_id == payroll_run_id
            ).first()
            
            if cached_summary and cached_summary.audit_completed_at:
                logger.info(f"使用缓存的审核汇总数据: {payroll_run_id}")
                return AuditSummaryResponse(
                    payroll_run_id=cached_summary.payroll_run_id,
                    total_entries=cached_summary.total_entries,
                    total_anomalies=cached_summary.total_anomalies,
                    error_count=cached_summary.error_count,
                    warning_count=cached_summary.warning_count,
                    info_count=cached_summary.info_count,
                    auto_fixable_count=cached_summary.auto_fixable_count,
                    manually_ignored_count=cached_summary.manually_ignored_count,
                    audit_status=cached_summary.audit_status,
                    audit_type=cached_summary.audit_type,
                    anomalies_by_type=cached_summary.anomalies_by_type or {},
                    total_gross_pay=cached_summary.total_gross_pay,
                    total_net_pay=cached_summary.total_net_pay,
                    total_deductions=cached_summary.total_deductions,
                    comparison_with_previous=cached_summary.comparison_with_previous,
                    audit_completed_at=cached_summary.audit_completed_at
                )
            
            # 如果没有缓存数据，返回基础统计信息（不执行审核检查）
            logger.info(f"没有缓存数据，返回基础统计: {payroll_run_id}")
            
            # 获取工资条目基础统计
            entries = self.db.query(PayrollEntry).filter(
                PayrollEntry.payroll_run_id == payroll_run_id
            ).all()
            
            if not entries:
                logger.warning(f"未找到工资条目: {payroll_run_id}")
                return AuditSummaryResponse(
                    payroll_run_id=payroll_run_id,
                    total_entries=0,
                    total_anomalies=0,
                    error_count=0,
                    warning_count=0,
                    info_count=0,
                    auto_fixable_count=0,
                    manually_ignored_count=0,
                    audit_status='PENDING',
                    audit_type='BASIC',
                    anomalies_by_type={},
                    total_gross_pay=Decimal('0.00'),
                    total_net_pay=Decimal('0.00'),
                    total_deductions=Decimal('0.00'),
                    comparison_with_previous=None,
                    audit_completed_at=None
                )
            
            # 计算基础统计信息（不执行审核检查）
            total_entries = len(entries)
            total_gross_pay = sum(entry.gross_pay or Decimal('0.00') for entry in entries)
            total_net_pay = sum(entry.net_pay or Decimal('0.00') for entry in entries)
            total_deductions = sum(entry.total_deductions or Decimal('0.00') for entry in entries)
            
            # 返回基础统计信息，提示需要执行审核检查
            return AuditSummaryResponse(
                payroll_run_id=payroll_run_id,
                total_entries=total_entries,
                total_anomalies=0,
                error_count=0,
                warning_count=0,
                info_count=0,
                auto_fixable_count=0,
                manually_ignored_count=0,
                audit_status='PENDING',
                audit_type='BASIC',
                anomalies_by_type={},
                total_gross_pay=total_gross_pay,
                total_net_pay=total_net_pay,
                total_deductions=total_deductions,
                comparison_with_previous=None,
                audit_completed_at=None
            )
            
        except Exception as e:
            logger.error(f"获取审核汇总失败: {e}")
            # 回滚事务
            self.db.rollback()
            # 返回默认响应
            return AuditSummaryResponse(
                payroll_run_id=payroll_run_id,
                total_entries=0,
                total_anomalies=0,
                error_count=0,
                warning_count=0,
                info_count=0,
                auto_fixable_count=0,
                manually_ignored_count=0,
                audit_status='FAILED',
                audit_type='BASIC',
                anomalies_by_type={},
                total_gross_pay=Decimal('0.00'),
                total_net_pay=Decimal('0.00'),
                total_deductions=Decimal('0.00'),
                comparison_with_previous=None,
                audit_completed_at=None
            )
    
    def get_audit_anomalies(
        self,
        payroll_run_id: int,
        anomaly_types: Optional[List[str]] = None,
        severity: Optional[List[str]] = None,
        page: int = 1,
        size: int = 100
    ) -> List[AuditAnomalyResponse]:
        """使用视图优化的异常查询方法"""
        try:
            logger.info(f"使用异常详情视图获取异常列表: {payroll_run_id}")
            
            # 构建查询条件
            conditions = ['payroll_run_id = :run_id']
            params = {'run_id': payroll_run_id}
            
            if anomaly_types:
                conditions.append('anomaly_type = ANY(:anomaly_types)')
                params['anomaly_types'] = anomaly_types
            
            if severity:
                conditions.append('severity = ANY(:severity_list)')
                params['severity_list'] = severity
            
            # 计算分页参数
            offset = (page - 1) * size
            params['limit'] = size
            params['offset'] = offset
            
            where_clause = ' AND '.join(conditions)
            
            # 使用异常详情视图查询
            anomalies_result = self.db.execute(text(f"""
                SELECT 
                    id as anomaly_id,
                    payroll_run_id,
                    employee_name,
                    employee_code,
                    department_name,
                    position_name,
                    anomaly_type,
                    severity,
                    message,
                    details,
                    current_value,
                    expected_value,
                    can_auto_fix,
                    is_ignored,
                    fix_applied,
                    suggested_action,
                    created_at
                FROM payroll.audit_anomalies_detail
                WHERE {where_clause}
                ORDER BY severity DESC, created_at DESC
                LIMIT :limit OFFSET :offset
            """), params).fetchall()
            
            # 转换为响应格式
            anomalies = []
            for row in anomalies_result:
                # 从anomaly_id中提取employee_id（格式：missing_data_1174）
                employee_id = 0  # 默认值
                try:
                    if '_' in row.anomaly_id:
                        parts = row.anomaly_id.split('_')
                        if len(parts) >= 2:
                            employee_id = int(parts[-1])
                except (ValueError, IndexError):
                    logger.warning(f"无法从异常ID {row.anomaly_id} 中提取employee_id，使用默认值0")
                
                # 确保必填字段不为None
                employee_name = row.employee_name or "未知员工"
                employee_code = row.employee_code or "N/A"
                
                anomaly = AuditAnomalyResponse(
                    id=row.anomaly_id,
                    employee_id=employee_id,
                    employee_name=employee_name,
                    employee_code=employee_code,
                    anomaly_type=row.anomaly_type,
                    severity=row.severity,
                    message=row.message,
                    details=row.details or "",
                    current_value=row.current_value,
                    expected_value=row.expected_value,
                    can_auto_fix=row.can_auto_fix or False,
                    is_ignored=row.is_ignored or False,
                    fix_applied=row.fix_applied or False,
                    suggested_action=row.suggested_action,
                    created_at=row.created_at
                )
                anomalies.append(anomaly)
            
            logger.info(f"从异常详情视图获取到 {len(anomalies)} 条异常记录")
            return anomalies
            
        except Exception as e:
            logger.error(f"获取异常列表失败: {e}")
            # 回滚事务
            self.db.rollback()
            # 返回空列表
            return [] 