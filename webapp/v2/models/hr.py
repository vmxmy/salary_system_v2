"""
人事相关的ORM模型。
"""
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, UniqueConstraint, Identity, Numeric, BigInteger, Date, func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import TIMESTAMP, JSONB

from ..database import BaseV2

# HR Schema Models

# --- BEGIN Position MODEL (NEW) ---
class Position(BaseV2):
    __tablename__ = 'positions'
    __table_args__ = {'schema': 'hr'}

    id = Column(BigInteger, Identity(always=True), primary_key=True)
    code = Column(String(50), nullable=True, unique=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    parent_position_id = Column(BigInteger, ForeignKey('hr.positions.id', name='fk_position_parent_id', ondelete='SET NULL'), nullable=True)
    effective_date = Column(Date, nullable=False, server_default=func.current_date())
    end_date = Column(Date, nullable=True)
    is_active = Column(Boolean, nullable=False, server_default='TRUE')

    # Relationships
    parent_position = relationship("Position", remote_side=[id], back_populates="child_positions", foreign_keys=[parent_position_id])
    child_positions = relationship("Position", back_populates="parent_position", foreign_keys=[parent_position_id])
    job_history_entries = relationship("EmployeeJobHistory", back_populates="position_detail")
    employees_in_position = relationship("Employee", back_populates="actual_position", foreign_keys="[Employee.actual_position_id]")
# --- END Position MODEL ---


# --- BEGIN PersonnelCategory MODEL (Renamed from JobTitle) ---
class PersonnelCategory(BaseV2):
    __tablename__ = 'personnel_categories' # Renamed table
    __table_args__ = {'schema': 'hr'}

    id = Column(BigInteger, Identity(always=True), primary_key=True)
    code = Column(String(50), nullable=False, unique=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    parent_category_id = Column(BigInteger, ForeignKey('hr.personnel_categories.id', name='fk_personnel_category_parent_id', ondelete='SET NULL'), nullable=True) # Renamed FK column and FK name
    effective_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    is_active = Column(Boolean, nullable=False, server_default='TRUE')

    # Relationships
    parent_category = relationship("PersonnelCategory", remote_side=[id], back_populates="child_categories", foreign_keys=[parent_category_id]) # Renamed relationships
    child_categories = relationship("PersonnelCategory", back_populates="parent_category", foreign_keys=[parent_category_id]) # Renamed relationships
    employees_in_category = relationship("Employee", back_populates="personnel_category", foreign_keys="[Employee.personnel_category_id]")
    job_history_with_this_category = relationship("EmployeeJobHistory", back_populates="personnel_category_detail")
# --- END PersonnelCategory MODEL ---


class Employee(BaseV2):
    __tablename__ = 'employees'
    __table_args__ = {'schema': 'hr'}

    id = Column(BigInteger, Identity(always=True), primary_key=True)
    employee_code = Column(String(50), nullable=False, unique=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    date_of_birth = Column(Date, nullable=True)
    gender_lookup_value_id = Column(BigInteger, ForeignKey('config.lookup_values.id', name='fk_employee_gender_id', ondelete='SET NULL'), nullable=True)
    id_number = Column(String(50), nullable=True, unique=True)
    nationality = Column(String(100), nullable=True)
    
    # --- BEGIN NEW FIELDS for Employee ---
    ethnicity = Column(String(100), nullable=True)
    first_work_date = Column(Date, nullable=True)
    interrupted_service_years = Column(Numeric(4, 2), nullable=True)
    personnel_category_id = Column(BigInteger, ForeignKey('hr.personnel_categories.id', name='fk_employee_personnel_category_id', ondelete='SET NULL'), nullable=True)
    actual_position_id = Column(BigInteger, ForeignKey('hr.positions.id', name='fk_employee_actual_position_id', ondelete='SET NULL'), nullable=True)
    career_position_level_date = Column(Date, nullable=True, comment="The date when employee first reached this position level in their entire career")
    current_position_start_date = Column(Date, nullable=True, comment="The date when employee started this position in current organization")
    
    # --- 新增字段 - 工资级别、工资档次、参照正编薪级 ---
    salary_level_lookup_value_id = Column(BigInteger, ForeignKey('config.lookup_values.id', name='fk_employee_salary_level_id', ondelete='SET NULL'), nullable=True, comment="员工工资级别")
    salary_grade_lookup_value_id = Column(BigInteger, ForeignKey('config.lookup_values.id', name='fk_employee_salary_grade_id', ondelete='SET NULL'), nullable=True, comment="员工工资档次")
    ref_salary_level_lookup_value_id = Column(BigInteger, ForeignKey('config.lookup_values.id', name='fk_employee_ref_salary_level_id', ondelete='SET NULL'), nullable=True, comment="员工参照正编薪级")
    # --- END NEW FIELDS for Employee ---
    
    hire_date = Column(Date, nullable=False)
    status_lookup_value_id = Column(BigInteger, ForeignKey('config.lookup_values.id', name='fk_employee_status_id', ondelete='RESTRICT'), nullable=False)
    employment_type_lookup_value_id = Column(BigInteger, ForeignKey('config.lookup_values.id', name='fk_employee_employment_type_id', ondelete='SET NULL'), nullable=True)
    education_level_lookup_value_id = Column(BigInteger, ForeignKey('config.lookup_values.id', name='fk_employee_education_level_id', ondelete='SET NULL'), nullable=True)
    marital_status_lookup_value_id = Column(BigInteger, ForeignKey('config.lookup_values.id', name='fk_employee_marital_status_id', ondelete='SET NULL'), nullable=True)
    political_status_lookup_value_id = Column(BigInteger, ForeignKey('config.lookup_values.id', name='fk_employee_political_status_id', ondelete='SET NULL'), nullable=True)
    contract_type_lookup_value_id = Column(BigInteger, ForeignKey('config.lookup_values.id', name='fk_employee_contract_type_id', ondelete='SET NULL'), nullable=True)
    email = Column(String(100), nullable=True, unique=True)
    phone_number = Column(String(50), nullable=True)
    home_address = Column(Text, nullable=True)
    emergency_contact_name = Column(String(255), nullable=True)
    emergency_contact_phone = Column(String(50), nullable=True)
    department_id = Column(BigInteger, ForeignKey('hr.departments.id', name='fk_employee_department_id', ondelete='SET NULL'), nullable=True)

    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    gender = relationship("LookupValue", foreign_keys=[gender_lookup_value_id], lazy='selectin', primaryjoin='Employee.gender_lookup_value_id == LookupValue.id')
    status = relationship("LookupValue", foreign_keys=[status_lookup_value_id], lazy='selectin', primaryjoin='Employee.status_lookup_value_id == LookupValue.id')
    employment_type = relationship("LookupValue", foreign_keys=[employment_type_lookup_value_id], lazy='selectin', primaryjoin='Employee.employment_type_lookup_value_id == LookupValue.id')
    education_level = relationship("LookupValue", foreign_keys=[education_level_lookup_value_id], lazy='selectin', primaryjoin='Employee.education_level_lookup_value_id == LookupValue.id')
    marital_status = relationship("LookupValue", foreign_keys=[marital_status_lookup_value_id], lazy='selectin', primaryjoin='Employee.marital_status_lookup_value_id == LookupValue.id')
    political_status = relationship("LookupValue", foreign_keys=[political_status_lookup_value_id], lazy='selectin', primaryjoin='Employee.political_status_lookup_value_id == LookupValue.id')
    contract_type = relationship("LookupValue", foreign_keys=[contract_type_lookup_value_id], lazy='selectin', primaryjoin='Employee.contract_type_lookup_value_id == LookupValue.id')
    current_department = relationship("Department", foreign_keys=[department_id], lazy='selectin')
    
    # --- BEGIN NEW/UPDATED RELATIONSHIPS for Employee ---
    personnel_category = relationship("PersonnelCategory", foreign_keys=[personnel_category_id], lazy='selectin', back_populates="employees_in_category")
    actual_position = relationship("Position", foreign_keys=[actual_position_id], lazy='selectin', back_populates="employees_in_position")
    appraisals = relationship("EmployeeAppraisal", back_populates="employee", cascade="all, delete-orphan")
    # --- END NEW/UPDATED RELATIONSHIPS for Employee ---
    
    job_history = relationship("EmployeeJobHistory", back_populates="employee", foreign_keys="[EmployeeJobHistory.employee_id]")
    contracts = relationship("EmployeeContract", back_populates="employee")
    compensation_history = relationship("EmployeeCompensationHistory", back_populates="employee")
    payroll_components = relationship("EmployeePayrollComponent", back_populates="employee")
    leave_balances = relationship("EmployeeLeaveBalance", back_populates="employee")
    leave_requests = relationship("EmployeeLeaveRequest", back_populates="employee", foreign_keys="[EmployeeLeaveRequest.employee_id]")
    payroll_entries = relationship("PayrollEntry", back_populates="employee")
    user = relationship("User", back_populates="employee", uselist=False)
    bank_accounts = relationship("EmployeeBankAccount", back_populates="employee", cascade="all, delete-orphan")


class EmployeeBankAccount(BaseV2):
    __tablename__ = 'employee_bank_accounts'
    __table_args__ = (
        UniqueConstraint('employee_id', 'account_number', name='uq_employee_bank_account_number'),
        {'schema': 'hr'}
    )

    id = Column(BigInteger, Identity(always=True), primary_key=True)
    employee_id = Column(BigInteger, ForeignKey('hr.employees.id', ondelete='CASCADE'), nullable=False)
    bank_name = Column(String(255), nullable=False)
    account_number = Column(String(100), nullable=False)
    account_holder_name = Column(String(255), nullable=False)
    branch_name = Column(String(255), nullable=True)
    bank_code = Column(String(50), nullable=True)
    account_type_lookup_value_id = Column(BigInteger, ForeignKey('config.lookup_values.id', ondelete='SET NULL'), nullable=True)
    is_primary = Column(Boolean, nullable=False, default=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    employee = relationship("Employee", back_populates="bank_accounts")
    account_type = relationship("LookupValue", foreign_keys=[account_type_lookup_value_id])


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


class EmployeeJobHistory(BaseV2):
    __tablename__ = 'employee_job_history'
    __table_args__ = (
        UniqueConstraint('employee_id', 'effective_date', name='uq_employee_job_history_effective'),
        {'schema': 'hr'}
    )

    id = Column(BigInteger, Identity(always=True), primary_key=True)
    employee_id = Column(BigInteger, ForeignKey('hr.employees.id', name='fk_job_history_employee_id', ondelete='CASCADE'), nullable=False)
    department_id = Column(BigInteger, ForeignKey('hr.departments.id', name='fk_job_history_department_id', ondelete='RESTRICT'), nullable=False)
    position_id = Column(BigInteger, ForeignKey('hr.positions.id', name='fk_job_history_position_id', ondelete='RESTRICT'), nullable=False)
    personnel_category_id = Column(BigInteger, ForeignKey('hr.personnel_categories.id', name='fk_job_history_personnel_category_id', ondelete='RESTRICT'), nullable=True)
    manager_id = Column(BigInteger, ForeignKey('hr.employees.id', name='fk_job_history_manager_id', ondelete='SET NULL'), nullable=True)
    location = Column(String(100), nullable=True)
    effective_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)

    # BEGIN: Added timestamp fields
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    # END: Added timestamp fields

    # Relationships
    employee = relationship("Employee", foreign_keys=[employee_id], back_populates="job_history")
    department = relationship("Department", back_populates="job_history", lazy='selectin')
    position_detail = relationship("Position", foreign_keys=[position_id], lazy='selectin', back_populates="job_history_entries")
    personnel_category_detail = relationship("PersonnelCategory", foreign_keys=[personnel_category_id], lazy='selectin', back_populates="job_history_with_this_category")
    manager = relationship("Employee", foreign_keys=[manager_id], back_populates=None, lazy='selectin')


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


# --- BEGIN EmployeeAppraisal MODEL (NEW) ---
class EmployeeAppraisal(BaseV2):
    __tablename__ = 'employee_appraisals'
    __table_args__ = (
        UniqueConstraint('employee_id', 'appraisal_year', name='uq_employee_appraisal_year'), 
        {'schema': 'hr'}
    )

    id = Column(BigInteger, Identity(always=True), primary_key=True)
    employee_id = Column(BigInteger, ForeignKey('hr.employees.id', name='fk_appraisal_employee_id', ondelete='CASCADE'), nullable=False)
    appraisal_year = Column(Integer, nullable=False)
    appraisal_result_lookup_id = Column(BigInteger, ForeignKey('config.lookup_values.id', name='fk_appraisal_result_id', ondelete='RESTRICT'), nullable=False)
    appraisal_date = Column(Date, nullable=True)
    remarks = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    employee = relationship("Employee", back_populates="appraisals")
    appraisal_result = relationship("LookupValue", foreign_keys=[appraisal_result_lookup_id], lazy='selectin', primaryjoin='EmployeeAppraisal.appraisal_result_lookup_id == LookupValue.id')
# --- END EmployeeAppraisal MODEL ---
