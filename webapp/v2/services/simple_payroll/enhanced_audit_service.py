"""
增强的薪资审核服务
实现完整的审核流程，包括数据预处理、审核检查、结果处理、自动修复和快照生成
"""
import uuid
import time
from datetime import datetime
from decimal import Decimal
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func

from webapp.v2.models.audit import (
    PayrollRunAuditSummary, 
    PayrollAuditAnomaly, 
    PayrollAuditHistory,
    MonthlyPayrollSnapshot,
    AuditRuleConfiguration
)
from webapp.v2.models.payroll import PayrollEntry, PayrollRun, PayrollPeriod
from webapp.v2.models.hr import Employee, Department, Position
from webapp.v2.pydantic_models.simple_payroll import AuditSummaryResponse, AuditAnomalyResponse


class EnhancedAuditService:
    """增强的审核服务"""
    
    def __init__(self, db: Session):
        self.db = db
        
    def run_comprehensive_audit(
        self, 
        payroll_run_id: int, 
        audit_type: str = "BASIC",
        auditor_id: int = 1,
        user_agent: str = None,
        ip_address: str = None
    ) -> Dict[str, Any]:
        """
        执行完整的审核流程
        
        Args:
            payroll_run_id: 薪资运行ID
            audit_type: 审核类型 (BASIC, ADVANCED, MANUAL)
            auditor_id: 审核员ID
            user_agent: 用户代理
            ip_address: IP地址
            
        Returns:
            审核结果汇总
        """
        start_time = time.time()
        
        try:
            # 第一阶段：数据预处理
            self._prepare_audit_data(payroll_run_id, auditor_id)
            
            # 第二阶段：执行审核检查
            audit_summary = self._execute_audit_checks(
                payroll_run_id, audit_type, auditor_id
            )
            
            # 第三阶段：结果处理
            self._process_audit_results(
                payroll_run_id, audit_summary, auditor_id, 
                user_agent, ip_address, start_time
            )
            
            # 第四阶段：自动修复（如果有可修复的异常）
            if audit_summary.get('auto_fixable_count', 0) > 0:
                self._auto_fix_anomalies(payroll_run_id, auditor_id)
            
            # 第五阶段：如果审核通过，生成快照
            if audit_summary.get('audit_status') == 'PASSED':
                self._create_monthly_snapshot(payroll_run_id, auditor_id)
            
            return audit_summary
            
        except Exception as e:
            # 记录审核失败
            self._record_audit_failure(payroll_run_id, str(e), auditor_id)
            raise
    
    def _prepare_audit_data(self, payroll_run_id: int, auditor_id: int):
        """第一阶段：数据预处理"""
        
        # 1. 验证薪资运行状态
        payroll_run = self.db.query(PayrollRun).filter(
            PayrollRun.id == payroll_run_id
        ).first()
        
        if not payroll_run:
            raise ValueError(f"薪资运行 {payroll_run_id} 不存在")
        
        # 2. 重新计算所有合计字段
        entries = self.db.query(PayrollEntry).filter(
            PayrollEntry.payroll_run_id == payroll_run_id
        ).all()
        
        for entry in entries:
            # 重新计算合计字段
            calculated_gross = sum(
                Decimal(str(v)) for v in entry.earnings_details.values() 
                if isinstance(v, (int, float, Decimal))
            )
            calculated_deductions = sum(
                Decimal(str(v)) for v in entry.deductions_details.values() 
                if isinstance(v, (int, float, Decimal))
            )
            calculated_net = calculated_gross - calculated_deductions
            
            # 更新计算结果
            entry.gross_pay = calculated_gross
            entry.total_deductions = calculated_deductions
            entry.net_pay = calculated_net
            entry.version += 1  # 增加版本号
        
        # 3. 创建审核前数据快照
        self._create_audit_snapshot(payroll_run_id, "BEFORE", auditor_id)
        
        self.db.commit()
    
    def _execute_audit_checks(
        self, 
        payroll_run_id: int, 
        audit_type: str, 
        auditor_id: int
    ) -> Dict[str, Any]:
        """第二阶段：执行审核检查"""
        
        # 1. 加载审核规则配置
        rules = self.db.query(AuditRuleConfiguration).filter(
            AuditRuleConfiguration.is_enabled == True
        ).all()
        
        # 2. 获取薪资条目
        entries = self.db.query(PayrollEntry).filter(
            PayrollEntry.payroll_run_id == payroll_run_id
        ).all()
        
        # 3. 初始化审核汇总
        audit_summary = {
            'payroll_run_id': payroll_run_id,
            'total_entries': len(entries),
            'total_anomalies': 0,
            'error_count': 0,
            'warning_count': 0,
            'info_count': 0,
            'auto_fixable_count': 0,
            'manually_ignored_count': 0,
            'audit_status': 'PENDING',
            'audit_type': audit_type,
            'anomalies_by_type': {},
            'total_gross_pay': Decimal('0'),
            'total_net_pay': Decimal('0'),
            'total_deductions': Decimal('0')
        }
        
        # 4. 执行各类审核检查
        all_anomalies = []
        
        for rule in rules:
            anomalies = self._execute_rule_check(rule, entries, payroll_run_id)
            all_anomalies.extend(anomalies)
            
            # 统计异常类型
            rule_anomalies = [a for a in anomalies if a['anomaly_type'] == rule.rule_code]
            if rule_anomalies:
                audit_summary['anomalies_by_type'][rule.rule_code] = {
                    'count': len(rule_anomalies),
                    'rule_name': rule.rule_name,
                    'severity': rule.severity_level
                }
        
        # 5. 统计汇总信息
        for anomaly in all_anomalies:
            audit_summary['total_anomalies'] += 1
            
            if anomaly['severity'] == 'error':
                audit_summary['error_count'] += 1
            elif anomaly['severity'] == 'warning':
                audit_summary['warning_count'] += 1
            else:
                audit_summary['info_count'] += 1
                
            if anomaly['can_auto_fix']:
                audit_summary['auto_fixable_count'] += 1
                
            if anomaly.get('is_ignored', False):
                audit_summary['manually_ignored_count'] += 1
        
        # 6. 计算总金额
        for entry in entries:
            audit_summary['total_gross_pay'] += entry.gross_pay
            audit_summary['total_net_pay'] += entry.net_pay
            audit_summary['total_deductions'] += entry.total_deductions
        
        # 7. 确定审核状态
        if audit_summary['error_count'] > 0:
            audit_summary['audit_status'] = 'FAILED'
        elif audit_summary['warning_count'] > 0:
            audit_summary['audit_status'] = 'WARNING'
        else:
            audit_summary['audit_status'] = 'PASSED'
        
        # 8. 保存异常记录
        self._save_anomalies(all_anomalies)
        
        return audit_summary
    
    def _execute_rule_check(
        self, 
        rule: AuditRuleConfiguration, 
        entries: List[PayrollEntry],
        payroll_run_id: int
    ) -> List[Dict[str, Any]]:
        """执行单个审核规则检查"""
        
        anomalies = []
        
        if rule.rule_code == 'CALCULATION_CONSISTENCY_CHECK':
            anomalies.extend(self._check_calculation_consistency(rule, entries))
        elif rule.rule_code == 'MINIMUM_WAGE_CHECK':
            anomalies.extend(self._check_minimum_wage(rule, entries))
        elif rule.rule_code == 'TAX_CALCULATION_CHECK':
            anomalies.extend(self._check_tax_calculation(rule, entries))
        elif rule.rule_code == 'SOCIAL_SECURITY_CHECK':
            anomalies.extend(self._check_social_security(rule, entries))
        elif rule.rule_code == 'SALARY_VARIANCE_CHECK':
            anomalies.extend(self._check_salary_variance(rule, entries))
        elif rule.rule_code == 'MISSING_DATA_CHECK':
            anomalies.extend(self._check_missing_data(rule, entries))
        
        # 为所有异常添加通用信息
        for anomaly in anomalies:
            anomaly['payroll_run_id'] = payroll_run_id
            anomaly['anomaly_type'] = rule.rule_code
            anomaly['severity'] = rule.severity_level
            anomaly['can_auto_fix'] = rule.can_auto_fix
            anomaly['is_ignored'] = False
            anomaly['fix_applied'] = False
            anomaly['created_at'] = datetime.now()
            
        return anomalies
    
    def _check_calculation_consistency(
        self, 
        rule: AuditRuleConfiguration, 
        entries: List[PayrollEntry]
    ) -> List[Dict[str, Any]]:
        """检查计算一致性"""
        
        anomalies = []
        tolerance = Decimal(str(rule.rule_parameters.get('tolerance', 0.01)))
        
        for entry in entries:
            # 计算明细总和
            earnings_sum = sum(
                Decimal(str(v)) for v in entry.earnings_details.values() 
                if isinstance(v, (int, float, Decimal))
            )
            deductions_sum = sum(
                Decimal(str(v)) for v in entry.deductions_details.values() 
                if isinstance(v, (int, float, Decimal))
            )
            calculated_net = earnings_sum - deductions_sum
            
            # 检查总收入一致性
            if abs(entry.gross_pay - earnings_sum) > tolerance:
                anomalies.append({
                    'id': str(uuid.uuid4()),
                    'payroll_entry_id': entry.id,
                    'employee_id': entry.employee_id,
                    'employee_code': entry.employee.employee_code if entry.employee else None,
                    'employee_name': f"{entry.employee.last_name}{entry.employee.first_name}" if entry.employee else None,
                    'message': f"总收入与明细不一致：记录值 ¥{entry.gross_pay}，计算值 ¥{earnings_sum}",
                    'details': f"差额：¥{abs(entry.gross_pay - earnings_sum)}",
                    'current_value': entry.gross_pay,
                    'expected_value': earnings_sum,
                    'suggested_action': "重新计算总收入字段"
                })
            
            # 检查总扣除一致性
            if abs(entry.total_deductions - deductions_sum) > tolerance:
                anomalies.append({
                    'id': str(uuid.uuid4()),
                    'payroll_entry_id': entry.id,
                    'employee_id': entry.employee_id,
                    'employee_code': entry.employee.employee_code if entry.employee else None,
                    'employee_name': f"{entry.employee.last_name}{entry.employee.first_name}" if entry.employee else None,
                    'message': f"总扣除与明细不一致：记录值 ¥{entry.total_deductions}，计算值 ¥{deductions_sum}",
                    'details': f"差额：¥{abs(entry.total_deductions - deductions_sum)}",
                    'current_value': entry.total_deductions,
                    'expected_value': deductions_sum,
                    'suggested_action': "重新计算总扣除字段"
                })
            
            # 检查实发工资一致性
            if abs(entry.net_pay - calculated_net) > tolerance:
                anomalies.append({
                    'id': str(uuid.uuid4()),
                    'payroll_entry_id': entry.id,
                    'employee_id': entry.employee_id,
                    'employee_code': entry.employee.employee_code if entry.employee else None,
                    'employee_name': f"{entry.employee.last_name}{entry.employee.first_name}" if entry.employee else None,
                    'message': f"实发工资与计算不一致：记录值 ¥{entry.net_pay}，计算值 ¥{calculated_net}",
                    'details': f"差额：¥{abs(entry.net_pay - calculated_net)}",
                    'current_value': entry.net_pay,
                    'expected_value': calculated_net,
                    'suggested_action': "重新计算实发工资字段"
                })
        
        return anomalies
    
    def _check_minimum_wage(
        self, 
        rule: AuditRuleConfiguration, 
        entries: List[PayrollEntry]
    ) -> List[Dict[str, Any]]:
        """检查最低工资标准"""
        
        anomalies = []
        minimum_wage = Decimal(str(rule.rule_parameters.get('minimum_wage', 2320)))
        
        for entry in entries:
            if entry.net_pay < minimum_wage:
                anomalies.append({
                    'id': str(uuid.uuid4()),
                    'payroll_entry_id': entry.id,
                    'employee_id': entry.employee_id,
                    'employee_code': entry.employee.employee_code if entry.employee else None,
                    'employee_name': f"{entry.employee.last_name}{entry.employee.first_name}" if entry.employee else None,
                    'message': f"实发工资 ¥{entry.net_pay} 低于最低工资标准 ¥{minimum_wage}",
                    'details': f"差额：¥{minimum_wage - entry.net_pay}",
                    'current_value': entry.net_pay,
                    'expected_value': minimum_wage,
                    'suggested_action': "调整基本工资或减少扣除项"
                })
        
        return anomalies
    
    def _check_tax_calculation(
        self, 
        rule: AuditRuleConfiguration, 
        entries: List[PayrollEntry]
    ) -> List[Dict[str, Any]]:
        """检查个税计算"""
        
        anomalies = []
        tolerance = Decimal(str(rule.rule_parameters.get('tolerance', 1.0)))
        basic_deduction = Decimal(str(rule.rule_parameters.get('basic_deduction', 5000)))
        
        for entry in entries:
            # 简化的个税计算逻辑
            taxable_income = max(entry.gross_pay - basic_deduction, Decimal('0'))
            
            # 获取个税扣除
            tax_deduction = Decimal(str(entry.deductions_details.get('个人所得税', 0)))
            
            # 简单的个税计算（实际应该使用税率表）
            if taxable_income > 0:
                expected_tax = taxable_income * Decimal('0.03')  # 简化为3%
                
                if abs(tax_deduction - expected_tax) > tolerance:
                    anomalies.append({
                        'id': str(uuid.uuid4()),
                        'payroll_entry_id': entry.id,
                        'employee_id': entry.employee_id,
                        'employee_code': entry.employee.employee_code if entry.employee else None,
                        'employee_name': f"{entry.employee.last_name}{entry.employee.first_name}" if entry.employee else None,
                        'message': f"个税计算可能有误：计算值 ¥{expected_tax}，实际值 ¥{tax_deduction}",
                        'details': f"应税收入：¥{taxable_income}，差额：¥{abs(tax_deduction - expected_tax)}",
                        'current_value': tax_deduction,
                        'expected_value': expected_tax,
                        'suggested_action': "检查个税计算公式和专项扣除"
                    })
        
        return anomalies
    
    def _check_social_security(
        self, 
        rule: AuditRuleConfiguration, 
        entries: List[PayrollEntry]
    ) -> List[Dict[str, Any]]:
        """检查社保合规"""
        
        anomalies = []
        min_base = Decimal(str(rule.rule_parameters.get('min_base', 3500)))
        max_base = Decimal(str(rule.rule_parameters.get('max_base', 28000)))
        personal_rate = Decimal(str(rule.rule_parameters.get('personal_rate', 0.105)))
        
        for entry in entries:
            # 获取社保扣除
            social_security = Decimal(str(entry.deductions_details.get('社会保险费', 0)))
            
            # 计算社保基数（简化为总收入）
            social_security_base = min(max(entry.gross_pay, min_base), max_base)
            expected_social_security = social_security_base * personal_rate
            
            tolerance = expected_social_security * Decimal('0.1')  # 10%容差
            
            if abs(social_security - expected_social_security) > tolerance:
                anomalies.append({
                    'id': str(uuid.uuid4()),
                    'payroll_entry_id': entry.id,
                    'employee_id': entry.employee_id,
                    'employee_code': entry.employee.employee_code if entry.employee else None,
                    'employee_name': f"{entry.employee.last_name}{entry.employee.first_name}" if entry.employee else None,
                    'message': f"社保扣除金额异常：计算值 ¥{expected_social_security}，实际值 ¥{social_security}",
                    'details': f"社保基数：¥{social_security_base}，个人比例：{personal_rate*100}%",
                    'current_value': social_security,
                    'expected_value': expected_social_security,
                    'suggested_action': "检查社保缴费基数和比例设置"
                })
        
        return anomalies
    
    def _check_salary_variance(
        self, 
        rule: AuditRuleConfiguration, 
        entries: List[PayrollEntry]
    ) -> List[Dict[str, Any]]:
        """检查工资波动"""
        
        anomalies = []
        variance_threshold = Decimal(str(rule.rule_parameters.get('variance_threshold', 0.3)))
        
        # 这里简化处理，实际应该查询历史数据
        for entry in entries:
            # 假设平均工资为5000（实际应该从历史数据计算）
            avg_salary = Decimal('5000')
            variance = abs(entry.net_pay - avg_salary) / avg_salary
            
            if variance > variance_threshold:
                anomalies.append({
                    'id': str(uuid.uuid4()),
                    'payroll_entry_id': entry.id,
                    'employee_id': entry.employee_id,
                    'employee_code': entry.employee.employee_code if entry.employee else None,
                    'employee_name': f"{entry.employee.last_name}{entry.employee.first_name}" if entry.employee else None,
                    'message': f"工资波动异常：当前 ¥{entry.net_pay}，平均 ¥{avg_salary}，波动 {variance*100:.1f}%",
                    'details': f"超出阈值 {variance_threshold*100}%",
                    'current_value': entry.net_pay,
                    'expected_value': avg_salary,
                    'suggested_action': "请检查工资计算是否正确"
                })
        
        return anomalies
    
    def _check_missing_data(
        self, 
        rule: AuditRuleConfiguration, 
        entries: List[PayrollEntry]
    ) -> List[Dict[str, Any]]:
        """检查核心数据完整性 - 只检查应发合计、扣发合计、实发合计"""
        
        anomalies = []
        min_value = Decimal(str(rule.rule_parameters.get('min_value', 0)))
        
        for entry in entries:
            missing_fields = []
            invalid_fields = []
            
            # 检查应发合计 (gross_pay)
            if entry.gross_pay is None:
                missing_fields.append("应发合计")
            elif entry.gross_pay < min_value:
                invalid_fields.append(f"应发合计({entry.gross_pay})")
            
            # 检查扣发合计 (total_deductions) - 可以为0（表示无扣除项）
            if entry.total_deductions is None:
                missing_fields.append("扣发合计")
            elif entry.total_deductions < Decimal('0'):
                invalid_fields.append(f"扣发合计({entry.total_deductions})")
            
            # 检查实发合计 (net_pay)
            if entry.net_pay is None:
                missing_fields.append("实发合计")
            elif entry.net_pay < min_value:
                invalid_fields.append(f"实发合计({entry.net_pay})")
            
            # 生成异常记录
            if missing_fields or invalid_fields:
                issues = []
                if missing_fields:
                    issues.append(f"缺失字段：{', '.join(missing_fields)}")
                if invalid_fields:
                    issues.append(f"无效值：{', '.join(invalid_fields)}")
                
                anomalies.append({
                    'id': str(uuid.uuid4()),
                    'payroll_entry_id': entry.id,
                    'employee_id': entry.employee_id,
                    'employee_code': entry.employee.employee_code if entry.employee else None,
                    'employee_name': f"{entry.employee.last_name}{entry.employee.first_name}" if entry.employee else None,
                    'message': f"核心数据异常：{'; '.join(issues)}",
                    'details': f"应发:{entry.gross_pay}, 扣发:{entry.total_deductions}, 实发:{entry.net_pay}",
                    'current_value': None,
                    'expected_value': f"所有金额应 >= {min_value}",
                    'suggested_action': "请检查并修正三个核心合计字段的数值"
                })
        
        return anomalies
    
    def _save_anomalies(self, anomalies: List[Dict[str, Any]]):
        """保存异常记录"""
        
        for anomaly_data in anomalies:
            anomaly = PayrollAuditAnomaly(**anomaly_data)
            self.db.add(anomaly)
        
        self.db.commit()
    
    def _process_audit_results(
        self, 
        payroll_run_id: int, 
        audit_summary: Dict[str, Any],
        auditor_id: int,
        user_agent: str,
        ip_address: str,
        start_time: float
    ):
        """第三阶段：结果处理"""
        
        # 1. 更新 payroll_entries 的 audit_status
        audit_status = audit_summary['audit_status']
        
        self.db.query(PayrollEntry).filter(
            PayrollEntry.payroll_run_id == payroll_run_id
        ).update({
            'audit_status': audit_status,
            'audit_timestamp': datetime.now(),
            'auditor_id': auditor_id
        })
        
        # 2. 创建或更新审核汇总记录
        existing_summary = self.db.query(PayrollRunAuditSummary).filter(
            and_(
                PayrollRunAuditSummary.payroll_run_id == payroll_run_id,
                PayrollRunAuditSummary.audit_type == audit_summary['audit_type']
            )
        ).first()
        
        if existing_summary:
            # 更新现有记录
            for key, value in audit_summary.items():
                if hasattr(existing_summary, key):
                    setattr(existing_summary, key, value)
            existing_summary.audit_completed_at = datetime.now()
        else:
            # 创建新记录
            audit_summary['auditor_id'] = auditor_id
            audit_summary['audit_started_at'] = datetime.fromtimestamp(start_time)
            audit_summary['audit_completed_at'] = datetime.now()
            
            summary_record = PayrollRunAuditSummary(**audit_summary)
            self.db.add(summary_record)
        
        # 3. 保存审核历史记录
        duration_ms = int((time.time() - start_time) * 1000)
        
        # 获取第一个条目ID作为关联
        first_entry = self.db.query(PayrollEntry).filter(
            PayrollEntry.payroll_run_id == payroll_run_id
        ).first()
        
        if first_entry:
            # 转换 Decimal 类型为 float 以避免 JSON 序列化错误
            serializable_summary = {}
            for key, value in audit_summary.items():
                if isinstance(value, Decimal):
                    serializable_summary[key] = float(value)
                elif isinstance(value, datetime):
                    serializable_summary[key] = value.isoformat()
                else:
                    serializable_summary[key] = value
            
            history = PayrollAuditHistory(
                payroll_entry_id=first_entry.id,  # 使用第一个条目ID
                payroll_run_id=payroll_run_id,
                audit_type=audit_summary['audit_type'],
                audit_result=serializable_summary,
                audit_status=audit_status,
                auditor_id=auditor_id,
                audit_duration_ms=duration_ms,
                ip_address=ip_address,
                user_agent=user_agent
            )
            self.db.add(history)
        
        self.db.commit()
    
    def _auto_fix_anomalies(self, payroll_run_id: int, auditor_id: int):
        """第四阶段：自动修复异常"""
        
        # 获取可自动修复的异常
        fixable_anomalies = self.db.query(PayrollAuditAnomaly).filter(
            and_(
                PayrollAuditAnomaly.payroll_run_id == payroll_run_id,
                PayrollAuditAnomaly.can_auto_fix == True,
                PayrollAuditAnomaly.fix_applied == False,
                PayrollAuditAnomaly.is_ignored == False
            )
        ).all()
        
        for anomaly in fixable_anomalies:
            try:
                if anomaly.anomaly_type == 'CALCULATION_CONSISTENCY_CHECK':
                    self._fix_calculation_consistency(anomaly)
                elif anomaly.anomaly_type == 'TAX_CALCULATION_CHECK':
                    self._fix_tax_calculation(anomaly)
                elif anomaly.anomaly_type == 'SOCIAL_SECURITY_CHECK':
                    self._fix_social_security(anomaly)
                
                # 标记为已修复
                anomaly.fix_applied = True
                anomaly.fix_applied_at = datetime.now()
                anomaly.fix_applied_by_user_id = auditor_id
                
            except Exception as e:
                # 记录修复失败
                anomaly.details += f"\n自动修复失败：{str(e)}"
        
        self.db.commit()
    
    def _fix_calculation_consistency(self, anomaly: PayrollAuditAnomaly):
        """修复计算一致性问题"""
        
        entry = self.db.query(PayrollEntry).filter(
            PayrollEntry.id == anomaly.payroll_entry_id
        ).first()
        
        if entry:
            # 重新计算合计字段
            entry.gross_pay = anomaly.expected_value
            entry.version += 1
    
    def _fix_tax_calculation(self, anomaly: PayrollAuditAnomaly):
        """修复个税计算问题"""
        
        entry = self.db.query(PayrollEntry).filter(
            PayrollEntry.id == anomaly.payroll_entry_id
        ).first()
        
        if entry:
            # 更新个税扣除
            deductions = dict(entry.deductions_details)
            deductions['个人所得税'] = float(anomaly.expected_value)
            entry.deductions_details = deductions
            entry.version += 1
    
    def _fix_social_security(self, anomaly: PayrollAuditAnomaly):
        """修复社保计算问题"""
        
        entry = self.db.query(PayrollEntry).filter(
            PayrollEntry.id == anomaly.payroll_entry_id
        ).first()
        
        if entry:
            # 更新社保扣除
            deductions = dict(entry.deductions_details)
            deductions['社会保险费'] = float(anomaly.expected_value)
            entry.deductions_details = deductions
            entry.version += 1
    
    def _create_monthly_snapshot(self, payroll_run_id: int, auditor_id: int):
        """第五阶段：生成月度快照"""
        
        # 获取薪资运行信息
        payroll_run = self.db.query(PayrollRun).filter(
            PayrollRun.id == payroll_run_id
        ).first()
        
        if not payroll_run:
            return
        
        # 获取所有审核通过的条目
        entries = self.db.query(PayrollEntry).filter(
            and_(
                PayrollEntry.payroll_run_id == payroll_run_id,
                PayrollEntry.audit_status.in_(['PASSED', 'WARNING'])
            )
        ).all()
        
        for entry in entries:
            # 检查是否已存在快照
            existing_snapshot = self.db.query(MonthlyPayrollSnapshot).filter(
                and_(
                    MonthlyPayrollSnapshot.period_id == entry.payroll_period_id,
                    MonthlyPayrollSnapshot.employee_id == entry.employee_id
                )
            ).first()
            
            if existing_snapshot:
                # 更新现有快照
                existing_snapshot.payroll_run_id = payroll_run_id
                existing_snapshot.gross_pay = entry.gross_pay
                existing_snapshot.total_deductions = entry.total_deductions
                existing_snapshot.net_pay = entry.net_pay
                existing_snapshot.earnings_details = entry.earnings_details
                existing_snapshot.deductions_details = entry.deductions_details
                existing_snapshot.audit_status = entry.audit_status
                existing_snapshot.snapshot_date = datetime.now()
            else:
                # 创建新快照
                snapshot = MonthlyPayrollSnapshot(
                    period_id=entry.payroll_period_id,
                    employee_id=entry.employee_id,
                    payroll_run_id=payroll_run_id,
                    employee_code=entry.employee.employee_code if entry.employee else None,
                    employee_name=f"{entry.employee.last_name}{entry.employee.first_name}" if entry.employee else None,
                    department_name=entry.employee.department.name if entry.employee and entry.employee.department else None,
                    position_name=entry.employee.actual_position.name if entry.employee and entry.employee.actual_position else None,
                    gross_pay=entry.gross_pay,
                    total_deductions=entry.total_deductions,
                    net_pay=entry.net_pay,
                    earnings_details=entry.earnings_details,
                    deductions_details=entry.deductions_details,
                    audit_status=entry.audit_status,
                    created_by_user_id=auditor_id
                )
                self.db.add(snapshot)
        
        self.db.commit()
    
    def _create_audit_snapshot(self, payroll_run_id: int, snapshot_type: str, auditor_id: int):
        """创建审核数据快照"""
        
        entries = self.db.query(PayrollEntry).filter(
            PayrollEntry.payroll_run_id == payroll_run_id
        ).all()
        
        if not entries:
            return
        
        snapshot_data = []
        for entry in entries:
            snapshot_data.append({
                'id': entry.id,
                'gross_pay': float(entry.gross_pay),
                'total_deductions': float(entry.total_deductions),
                'net_pay': float(entry.net_pay),
                'earnings_details': entry.earnings_details,
                'deductions_details': entry.deductions_details,
                'version': entry.version
            })
        
        # 使用第一个条目的ID作为快照记录的关联ID
        # 这样可以避免外键约束错误，同时保持数据关联
        first_entry_id = entries[0].id
        
        # 保存快照到审核历史
        history = PayrollAuditHistory(
            payroll_entry_id=first_entry_id,  # 使用第一个条目ID
            payroll_run_id=payroll_run_id,
            audit_type=f"SNAPSHOT_{snapshot_type}",
            before_data=snapshot_data if snapshot_type == "BEFORE" else None,
            after_data=snapshot_data if snapshot_type == "AFTER" else None,
            audit_status="SNAPSHOT",
            auditor_id=auditor_id
        )
        self.db.add(history)
        self.db.commit()
    
    def _record_audit_failure(self, payroll_run_id: int, error_message: str, auditor_id: int):
        """记录审核失败"""
        
        # 获取第一个条目ID作为关联
        first_entry = self.db.query(PayrollEntry).filter(
            PayrollEntry.payroll_run_id == payroll_run_id
        ).first()
        
        if not first_entry:
            # 如果没有条目，跳过记录
            return
        
        history = PayrollAuditHistory(
            payroll_entry_id=first_entry.id,
            payroll_run_id=payroll_run_id,
            audit_type="FAILED",
            audit_result={'error': error_message},
            audit_status="FAILED",
            auditor_id=auditor_id
        )
        self.db.add(history)
        self.db.commit()
    
    def get_audit_summary(self, payroll_run_id: int) -> Optional[Dict[str, Any]]:
        """获取审核汇总信息"""
        
        summary = self.db.query(PayrollRunAuditSummary).filter(
            PayrollRunAuditSummary.payroll_run_id == payroll_run_id
        ).first()
        
        if summary:
            return {
                'payroll_run_id': summary.payroll_run_id,
                'total_entries': summary.total_entries,
                'total_anomalies': summary.total_anomalies,
                'error_count': summary.error_count,
                'warning_count': summary.warning_count,
                'info_count': summary.info_count,
                'auto_fixable_count': summary.auto_fixable_count,
                'audit_status': summary.audit_status,
                'audit_type': summary.audit_type,
                'anomalies_by_type': summary.anomalies_by_type,
                'total_gross_pay': float(summary.total_gross_pay),
                'total_net_pay': float(summary.total_net_pay),
                'total_deductions': float(summary.total_deductions),
                'audit_completed_at': summary.audit_completed_at.isoformat() if summary.audit_completed_at else None
            }
        
        return None
    
    def get_audit_anomalies(
        self, 
        payroll_run_id: int,
        anomaly_types: List[str] = None,
        severity: List[str] = None,
        page: int = 1,
        size: int = 50
    ) -> Dict[str, Any]:
        """获取审核异常列表"""
        
        query = self.db.query(PayrollAuditAnomaly).filter(
            PayrollAuditAnomaly.payroll_run_id == payroll_run_id
        )
        
        if anomaly_types:
            query = query.filter(PayrollAuditAnomaly.anomaly_type.in_(anomaly_types))
        
        if severity:
            query = query.filter(PayrollAuditAnomaly.severity.in_(severity))
        
        total = query.count()
        
        anomalies = query.offset((page - 1) * size).limit(size).all()
        
        return {
            'data': [
                {
                    'id': anomaly.id,
                    'employee_code': anomaly.employee_code,
                    'employee_name': anomaly.employee_name,
                    'anomaly_type': anomaly.anomaly_type,
                    'severity': anomaly.severity,
                    'message': anomaly.message,
                    'details': anomaly.details,
                    'current_value': float(anomaly.current_value) if anomaly.current_value else None,
                    'expected_value': float(anomaly.expected_value) if anomaly.expected_value else None,
                    'can_auto_fix': anomaly.can_auto_fix,
                    'is_ignored': anomaly.is_ignored,
                    'suggested_action': anomaly.suggested_action,
                    'fix_applied': anomaly.fix_applied,
                    'created_at': anomaly.created_at.isoformat()
                }
                for anomaly in anomalies
            ],
            'meta': {
                'total': total,
                'page': page,
                'size': size,
                'pages': (total + size - 1) // size
            }
        } 