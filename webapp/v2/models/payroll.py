"""
工资相关的ORM模型。
"""
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, UniqueConstraint, Identity, Numeric, BigInteger, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import TIMESTAMP, JSONB

from ..database import BaseV2

# Payroll Schema Models
class PayrollPeriod(BaseV2):
    __tablename__ = 'payroll_periods'
    __table_args__ = (
        UniqueConstraint('start_date', 'end_date', 'frequency_lookup_value_id', name='uq_payroll_periods_dates_frequency'),
        {'schema': 'payroll'}
    )

    id = Column(BigInteger, Identity(always=True), primary_key=True)
    name = Column(String(100), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    pay_date = Column(Date, nullable=False)
    frequency_lookup_value_id = Column(BigInteger, ForeignKey('config.lookup_values.id', ondelete='RESTRICT'), nullable=False)

    # Relationships
    frequency = relationship("LookupValue")
    payroll_runs = relationship("PayrollRun", back_populates="payroll_period")
    payroll_entries = relationship("PayrollEntry", back_populates="payroll_period")


class PayrollRun(BaseV2):
    __tablename__ = 'payroll_runs'
    __table_args__ = {'schema': 'payroll'}

    id = Column(BigInteger, Identity(always=True), primary_key=True)
    payroll_period_id = Column(BigInteger, ForeignKey('payroll.payroll_periods.id', ondelete='RESTRICT'), nullable=False)
    run_date = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    status_lookup_value_id = Column(BigInteger, ForeignKey('config.lookup_values.id', ondelete='RESTRICT'), nullable=False)
    initiated_by_user_id = Column(BigInteger, ForeignKey('security.users.id', ondelete='SET NULL'), nullable=True)
    total_employees = Column(Integer, nullable=True)
    total_net_pay = Column(Numeric(18, 4), nullable=True)

    # Relationships
    payroll_period = relationship("PayrollPeriod", back_populates="payroll_runs")
    status = relationship("LookupValue")
    initiated_by = relationship("User")
    payroll_entries = relationship("PayrollEntry", back_populates="payroll_run")


class PayrollEntry(BaseV2):
    __tablename__ = 'payroll_entries'
    __table_args__ = (
        UniqueConstraint('employee_id', 'payroll_period_id', 'payroll_run_id', name='uq_payroll_entries_employee_period_run'),
        {'schema': 'payroll'}
    )

    id = Column(BigInteger, Identity(always=True), primary_key=True)
    employee_id = Column(BigInteger, ForeignKey('hr.employees.id', ondelete='CASCADE'), nullable=False)
    payroll_period_id = Column(BigInteger, ForeignKey('payroll.payroll_periods.id', ondelete='RESTRICT'), nullable=False)
    payroll_run_id = Column(BigInteger, ForeignKey('payroll.payroll_runs.id', ondelete='CASCADE'), nullable=False)
    gross_pay = Column(Numeric(18, 4), nullable=False, server_default='0')
    total_deductions = Column(Numeric(18, 4), nullable=False, server_default='0')
    net_pay = Column(Numeric(18, 4), nullable=False, server_default='0')
    earnings_details = Column(JSONB, nullable=False, server_default='{}')
    deductions_details = Column(JSONB, nullable=False, server_default='{}')
    calculation_inputs = Column(JSONB, nullable=True)
    calculation_log = Column(JSONB, nullable=True)
    status_lookup_value_id = Column(BigInteger, ForeignKey('config.lookup_values.id', ondelete='RESTRICT'), nullable=False)
    remarks = Column(Text, nullable=True)
    calculated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    employee = relationship("Employee", back_populates="payroll_entries")
    payroll_period = relationship("PayrollPeriod", back_populates="payroll_entries")
    payroll_run = relationship("PayrollRun", back_populates="payroll_entries")
    status = relationship("LookupValue")
