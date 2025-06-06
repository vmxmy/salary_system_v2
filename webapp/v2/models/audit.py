"""
审核系统相关的数据模型
"""
from sqlalchemy import Column, BigInteger, String, Integer, Boolean, Text, Numeric, Date, TIMESTAMP, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from webapp.v2.database import BaseV2


class PayrollRunAuditSummary(BaseV2):
    """薪资运行审核汇总表"""
    __tablename__ = 'payroll_run_audit_summary'
    __table_args__ = {'schema': 'payroll'}

    id = Column(BigInteger, primary_key=True)
    payroll_run_id = Column(BigInteger, ForeignKey('payroll.payroll_runs.id'), nullable=False)
    total_entries = Column(Integer, nullable=False, default=0)
    total_anomalies = Column(Integer, nullable=False, default=0)
    error_count = Column(Integer, nullable=False, default=0)
    warning_count = Column(Integer, nullable=False, default=0)
    info_count = Column(Integer, nullable=False, default=0)
    auto_fixable_count = Column(Integer, nullable=False, default=0)
    manually_ignored_count = Column(Integer, nullable=False, default=0)
    audit_status = Column(String(20), nullable=False, default='PENDING')
    audit_type = Column(String(20), nullable=False, default='BASIC')
    audit_details = Column(JSONB, nullable=True)
    anomalies_by_type = Column(JSONB, nullable=True)
    total_gross_pay = Column(Numeric(15, 2), nullable=False, default=0)
    total_net_pay = Column(Numeric(15, 2), nullable=False, default=0)
    total_deductions = Column(Numeric(15, 2), nullable=False, default=0)
    comparison_with_previous = Column(JSONB, nullable=True)
    auditor_id = Column(BigInteger, nullable=True)
    audit_started_at = Column(TIMESTAMP(timezone=True), nullable=True)
    audit_completed_at = Column(TIMESTAMP(timezone=True), nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    # 关系
    payroll_run = relationship("PayrollRun", back_populates="audit_summary")
    # 通过 payroll_run_id 关联到异常记录，使用 primaryjoin 指定连接条件
    anomalies = relationship("PayrollAuditAnomaly",
                           primaryjoin="PayrollRunAuditSummary.payroll_run_id == PayrollAuditAnomaly.payroll_run_id",
                           foreign_keys="[PayrollAuditAnomaly.payroll_run_id]")


class PayrollAuditAnomaly(BaseV2):
    """薪资审核异常表"""
    __tablename__ = 'payroll_audit_anomalies'
    __table_args__ = {'schema': 'payroll'}

    id = Column(String(50), primary_key=True)
    payroll_entry_id = Column(BigInteger, ForeignKey('payroll.payroll_entries.id'), nullable=False)
    payroll_run_id = Column(BigInteger, ForeignKey('payroll.payroll_runs.id'), nullable=False)
    employee_id = Column(BigInteger, ForeignKey('hr.employees.id'), nullable=False)
    employee_code = Column(String(50), nullable=True)
    employee_name = Column(String(100), nullable=True)
    anomaly_type = Column(String(50), nullable=False)
    severity = Column(String(20), nullable=False)
    message = Column(Text, nullable=False)
    details = Column(Text, nullable=True)
    current_value = Column(Numeric(15, 2), nullable=True)
    expected_value = Column(Numeric(15, 2), nullable=True)
    can_auto_fix = Column(Boolean, nullable=False, default=False)
    is_ignored = Column(Boolean, nullable=False, default=False)
    ignore_reason = Column(Text, nullable=True)
    ignored_by_user_id = Column(BigInteger, nullable=True)
    ignored_at = Column(TIMESTAMP(timezone=True), nullable=True)
    suggested_action = Column(Text, nullable=True)
    fix_applied = Column(Boolean, nullable=False, default=False)
    fix_applied_at = Column(TIMESTAMP(timezone=True), nullable=True)
    fix_applied_by_user_id = Column(BigInteger, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    # 关系
    payroll_entry = relationship("PayrollEntry", back_populates="audit_anomalies")
    payroll_run = relationship("PayrollRun", overlaps="anomalies")
    employee = relationship("Employee")
    # 通过 payroll_run_id 关联到审核汇总，而不是直接的外键关系
    # audit_summary = relationship("PayrollRunAuditSummary", back_populates="anomalies")


class PayrollAuditHistory(BaseV2):
    """薪资审核历史表"""
    __tablename__ = 'payroll_audit_history'
    __table_args__ = {'schema': 'payroll'}

    id = Column(BigInteger, primary_key=True)
    payroll_entry_id = Column(BigInteger, ForeignKey('payroll.payroll_entries.id'), nullable=False)
    payroll_run_id = Column(BigInteger, ForeignKey('payroll.payroll_runs.id'), nullable=False)
    audit_type = Column(String(50), nullable=False)
    audit_result = Column(JSONB, nullable=True)
    anomalies_found = Column(JSONB, nullable=True)
    audit_status = Column(String(20), nullable=False)
    before_data = Column(JSONB, nullable=True)
    after_data = Column(JSONB, nullable=True)
    changes_applied = Column(JSONB, nullable=True)
    auditor_id = Column(BigInteger, nullable=False)
    audit_timestamp = Column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now())
    audit_duration_ms = Column(Integer, nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)

    # 关系
    payroll_entry = relationship("PayrollEntry")
    payroll_run = relationship("PayrollRun")


class MonthlyPayrollSnapshot(BaseV2):
    """月度薪资快照表"""
    __tablename__ = 'monthly_payroll_snapshots'
    __table_args__ = {'schema': 'payroll'}

    id = Column(BigInteger, primary_key=True)
    period_id = Column(BigInteger, ForeignKey('payroll.payroll_periods.id'), nullable=False)
    employee_id = Column(BigInteger, ForeignKey('hr.employees.id'), nullable=False)
    payroll_run_id = Column(BigInteger, ForeignKey('payroll.payroll_runs.id'), nullable=False)
    employee_code = Column(String(50), nullable=True)
    employee_name = Column(String(100), nullable=True)
    department_name = Column(String(100), nullable=True)
    position_name = Column(String(100), nullable=True)
    gross_pay = Column(Numeric(15, 2), nullable=False, default=0)
    total_deductions = Column(Numeric(15, 2), nullable=False, default=0)
    net_pay = Column(Numeric(15, 2), nullable=False, default=0)
    earnings_details = Column(JSONB, nullable=False, default={})
    deductions_details = Column(JSONB, nullable=False, default={})
    audit_status = Column(String(20), nullable=False)
    audit_summary = Column(JSONB, nullable=True)
    snapshot_date = Column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now())
    created_by_user_id = Column(BigInteger, nullable=True)

    # 关系
    period = relationship("PayrollPeriod")
    employee = relationship("Employee")
    payroll_run = relationship("PayrollRun")


class AuditRuleConfiguration(BaseV2):
    """审核规则配置表"""
    __tablename__ = 'audit_rule_configurations'
    __table_args__ = {'schema': 'payroll'}

    id = Column(BigInteger, primary_key=True)
    rule_code = Column(String(50), nullable=False, unique=True)
    rule_name = Column(String(200), nullable=False)
    rule_description = Column(Text, nullable=True)
    rule_category = Column(String(50), nullable=False)
    severity_level = Column(String(20), nullable=False, default='warning')
    is_enabled = Column(Boolean, nullable=False, default=True)
    can_auto_fix = Column(Boolean, nullable=False, default=False)
    rule_parameters = Column(JSONB, nullable=True)
    threshold_value = Column(Numeric(15, 2), nullable=True)
    error_message_template = Column(Text, nullable=True)
    suggested_action_template = Column(Text, nullable=True)
    effective_date = Column(Date, nullable=False, server_default=func.current_date())
    end_date = Column(Date, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()) 