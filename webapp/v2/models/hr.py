"""
人事相关的ORM模型。
"""
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, UniqueConstraint, Identity, Numeric, BigInteger, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import TIMESTAMP, JSONB

from ..database import BaseV2

# HR Schema Models
class Employee(BaseV2):
    __tablename__ = 'employees'
    __table_args__ = {'schema': 'hr'}

    id = Column(BigInteger, Identity(always=True), primary_key=True)
    employee_code = Column(String(50), nullable=False, unique=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    date_of_birth = Column(Date, nullable=True)
    gender_lookup_value_id = Column(BigInteger, ForeignKey('config.lookup_values.id', ondelete='SET NULL'), nullable=True)
    id_number = Column(String(50), nullable=True, unique=True)
    nationality = Column(String(100), nullable=True)
    hire_date = Column(Date, nullable=False)
    status_lookup_value_id = Column(BigInteger, ForeignKey('config.lookup_values.id', ondelete='RESTRICT'), nullable=False)
    employment_type_lookup_value_id = Column(BigInteger, ForeignKey('config.lookup_values.id', ondelete='SET NULL'), nullable=True)
    education_level_lookup_value_id = Column(BigInteger, ForeignKey('config.lookup_values.id', ondelete='SET NULL'), nullable=True)
    marital_status_lookup_value_id = Column(BigInteger, ForeignKey('config.lookup_values.id', ondelete='SET NULL'), nullable=True)
    political_status_lookup_value_id = Column(BigInteger, ForeignKey('config.lookup_values.id', ondelete='SET NULL'), nullable=True)
    contract_type_lookup_value_id = Column(BigInteger, ForeignKey('config.lookup_values.id', ondelete='SET NULL'), nullable=True)
    email = Column(String(100), nullable=True)
    phone_number = Column(String(50), nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    gender = relationship("LookupValue", foreign_keys=[gender_lookup_value_id])
    status = relationship("LookupValue", foreign_keys=[status_lookup_value_id])
    employment_type = relationship("LookupValue", foreign_keys=[employment_type_lookup_value_id])
    education_level = relationship("LookupValue", foreign_keys=[education_level_lookup_value_id])
    marital_status = relationship("LookupValue", foreign_keys=[marital_status_lookup_value_id])
    political_status = relationship("LookupValue", foreign_keys=[political_status_lookup_value_id])
    contract_type = relationship("LookupValue", foreign_keys=[contract_type_lookup_value_id])
    job_history = relationship("EmployeeJobHistory", back_populates="employee", foreign_keys="[EmployeeJobHistory.employee_id]")
    contracts = relationship("EmployeeContract", back_populates="employee")
    compensation_history = relationship("EmployeeCompensationHistory", back_populates="employee")
    payroll_components = relationship("EmployeePayrollComponent", back_populates="employee")
    leave_balances = relationship("EmployeeLeaveBalance", back_populates="employee")
    leave_requests = relationship("EmployeeLeaveRequest", back_populates="employee", foreign_keys="[EmployeeLeaveRequest.employee_id]")
    payroll_entries = relationship("PayrollEntry", back_populates="employee")
    user = relationship("User", back_populates="employee", uselist=False)


class Department(BaseV2):
    __tablename__ = 'departments'
    __table_args__ = {'schema': 'hr'}

    id = Column(BigInteger, Identity(always=True), primary_key=True)
    code = Column(String(50), nullable=False, unique=True)
    name = Column(String(100), nullable=False)
    parent_department_id = Column(BigInteger, ForeignKey('hr.departments.id', ondelete='SET NULL'), nullable=True)
    effective_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    is_active = Column(Boolean, nullable=False, server_default='TRUE')

    # Relationships
    parent_department = relationship("Department", remote_side=[id], back_populates="child_departments")
    child_departments = relationship("Department", back_populates="parent_department")
    job_history = relationship("EmployeeJobHistory", back_populates="department")


class JobTitle(BaseV2):
    __tablename__ = 'job_titles'
    __table_args__ = {'schema': 'hr'}

    id = Column(BigInteger, Identity(always=True), primary_key=True)
    code = Column(String(50), nullable=False, unique=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    parent_job_title_id = Column(BigInteger, ForeignKey('hr.job_titles.id', ondelete='SET NULL'), nullable=True)
    effective_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    is_active = Column(Boolean, nullable=False, server_default='TRUE')

    # Relationships
    parent_job_title = relationship("JobTitle", remote_side=[id], back_populates="child_job_titles")
    child_job_titles = relationship("JobTitle", back_populates="parent_job_title")
    job_history = relationship("EmployeeJobHistory", back_populates="job_title")


class EmployeeJobHistory(BaseV2):
    __tablename__ = 'employee_job_history'
    __table_args__ = (
        UniqueConstraint('employee_id', 'effective_date', name='uq_employee_job_history_effective'),
        {'schema': 'hr'}
    )

    id = Column(BigInteger, Identity(always=True), primary_key=True)
    employee_id = Column(BigInteger, ForeignKey('hr.employees.id', ondelete='CASCADE'), nullable=False)
    department_id = Column(BigInteger, ForeignKey('hr.departments.id', ondelete='RESTRICT'), nullable=False)
    job_title_id = Column(BigInteger, ForeignKey('hr.job_titles.id', ondelete='RESTRICT'), nullable=False)
    manager_id = Column(BigInteger, ForeignKey('hr.employees.id', ondelete='SET NULL'), nullable=True)
    location = Column(String(100), nullable=True)
    effective_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)

    # Relationships
    employee = relationship("Employee", foreign_keys=[employee_id], back_populates="job_history")
    department = relationship("Department", back_populates="job_history")
    job_title = relationship("JobTitle", back_populates="job_history")
    manager = relationship("Employee", foreign_keys=[manager_id], back_populates=None)


class EmployeeContract(BaseV2):
    __tablename__ = 'employee_contracts'
    __table_args__ = {'schema': 'hr'}

    id = Column(BigInteger, Identity(always=True), primary_key=True)
    employee_id = Column(BigInteger, ForeignKey('hr.employees.id', ondelete='CASCADE'), nullable=False)
    contract_type_lookup_value_id = Column(BigInteger, ForeignKey('config.lookup_values.id', ondelete='RESTRICT'), nullable=False)
    contract_start_date = Column(Date, nullable=False)
    contract_end_date = Column(Date, nullable=True)
    signing_date = Column(Date, nullable=True)
    effective_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)

    # Relationships
    employee = relationship("Employee", back_populates="contracts")
    contract_type = relationship("LookupValue")


class EmployeeCompensationHistory(BaseV2):
    __tablename__ = 'employee_compensation_history'
    __table_args__ = {'schema': 'hr'}

    id = Column(BigInteger, Identity(always=True), primary_key=True)
    employee_id = Column(BigInteger, ForeignKey('hr.employees.id', ondelete='CASCADE'), nullable=False)
    salary_amount = Column(Numeric(18, 4), nullable=False)
    currency = Column(String(10), nullable=False)
    pay_frequency_lookup_value_id = Column(BigInteger, ForeignKey('config.lookup_values.id', ondelete='RESTRICT'), nullable=False)
    effective_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)

    # Relationships
    employee = relationship("Employee", back_populates="compensation_history")
    pay_frequency = relationship("LookupValue")


class EmployeePayrollComponent(BaseV2):
    __tablename__ = 'employee_payroll_components'
    __table_args__ = {'schema': 'hr'}

    id = Column(BigInteger, Identity(always=True), primary_key=True)
    employee_id = Column(BigInteger, ForeignKey('hr.employees.id', ondelete='CASCADE'), nullable=False)
    component_definition_id = Column(BigInteger, ForeignKey('config.payroll_component_definitions.id', ondelete='RESTRICT'), nullable=False)
    fixed_amount = Column(Numeric(18, 4), nullable=True)
    percentage = Column(Numeric(5, 4), nullable=True)
    parameters = Column(JSONB, nullable=True)
    effective_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)

    # Relationships
    employee = relationship("Employee", back_populates="payroll_components")
    component_definition = relationship("PayrollComponentDefinition", back_populates="employee_components")


class LeaveType(BaseV2):
    __tablename__ = 'leave_types'
    __table_args__ = {'schema': 'hr'}

    id = Column(BigInteger, Identity(always=True), primary_key=True)
    code = Column(String(50), nullable=False, unique=True)
    name = Column(String(100), nullable=False)
    accrual_rule_definition = Column(JSONB, nullable=True)
    is_paid = Column(Boolean, nullable=False, server_default='TRUE')
    is_active = Column(Boolean, nullable=False, server_default='TRUE')

    # Relationships
    leave_balances = relationship("EmployeeLeaveBalance", back_populates="leave_type")
    leave_requests = relationship("EmployeeLeaveRequest", back_populates="leave_type")


class EmployeeLeaveBalance(BaseV2):
    __tablename__ = 'employee_leave_balances'
    __table_args__ = {'schema': 'hr'}

    id = Column(BigInteger, Identity(always=True), primary_key=True)
    employee_id = Column(BigInteger, ForeignKey('hr.employees.id', ondelete='CASCADE'), nullable=False)
    leave_type_id = Column(BigInteger, ForeignKey('hr.leave_types.id', ondelete='RESTRICT'), nullable=False)
    balance_date = Column(Date, nullable=False)
    hours_accrued = Column(Numeric(8, 4), nullable=False, server_default='0')
    hours_taken = Column(Numeric(8, 4), nullable=False, server_default='0')
    hours_adjusted = Column(Numeric(8, 4), nullable=False, server_default='0')
    current_balance = Column(Numeric(8, 4), nullable=False, server_default='0')
    effective_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)

    # Relationships
    employee = relationship("Employee", back_populates="leave_balances")
    leave_type = relationship("LeaveType", back_populates="leave_balances")


class EmployeeLeaveRequest(BaseV2):
    __tablename__ = 'employee_leave_requests'
    __table_args__ = {'schema': 'hr'}

    id = Column(BigInteger, Identity(always=True), primary_key=True)
    employee_id = Column(BigInteger, ForeignKey('hr.employees.id', ondelete='CASCADE'), nullable=False)
    leave_type_id = Column(BigInteger, ForeignKey('hr.leave_types.id', ondelete='RESTRICT'), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    requested_hours = Column(Numeric(8, 4), nullable=True)
    status_lookup_value_id = Column(BigInteger, ForeignKey('config.lookup_values.id', ondelete='RESTRICT'), nullable=False)
    requested_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    approved_by_employee_id = Column(BigInteger, ForeignKey('hr.employees.id', ondelete='SET NULL'), nullable=True)
    approved_at = Column(TIMESTAMP(timezone=True), nullable=True)
    rejection_reason = Column(Text, nullable=True)

    # Relationships
    employee = relationship("Employee", foreign_keys=[employee_id], back_populates="leave_requests")
    leave_type = relationship("LeaveType", back_populates="leave_requests")
    status = relationship("LookupValue")
    approved_by = relationship("Employee", foreign_keys=[approved_by_employee_id], back_populates=None)
