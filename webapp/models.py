from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, UniqueConstraint, Identity, Numeric, BigInteger, Date, UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import TIMESTAMP, JSONB

# Import the Base class from database.py
from .database import Base

class Role(Base):
    __tablename__ = 'roles'
    __table_args__ = {'schema': 'core'}

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)

    # Define the relationship to the User model (one Role to many Users)
    # The back_populates argument ensures bidirectional relationship management
    users = relationship("User", back_populates="role")


class User(Base):
    __tablename__ = 'users'
    __table_args__ = {'schema': 'core'}

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    role_id = Column(Integer, ForeignKey('core.roles.id'), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Define the relationship to the Role model (many Users to one Role)
    role = relationship("Role", back_populates="users")


# --- Define Unit Model --- START ---
class Unit(Base):
    __tablename__ = 'units'
    __table_args__ = {'schema': 'core'}

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationship to Departments (One Unit to many Departments)
    departments = relationship("Department", back_populates="unit")
# --- Define Unit Model --- END ---

# --- Define Department Model --- START ---
class Department(Base):
    __tablename__ = 'departments'
    __table_args__ = (UniqueConstraint('name', 'unit_id', name='uq_department_name_unit_id'),
                      {'schema': 'core'})

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    unit_id = Column(Integer, ForeignKey('core.units.id'), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationship to Unit (Many Departments to one Unit)
    unit = relationship("Unit", back_populates="departments")
    # Relationship to Employees (One Department to many Employees)
    employees = relationship("Employee", back_populates="department")

    # Optional: Unique constraint for name within a unit
    # __table_args__ = (UniqueConstraint('name', 'unit_id', name='uq_department_name_unit_id'),)
# --- Define Department Model --- END ---

# --- Define EstablishmentType Model --- START ---
class EstablishmentType(Base):
    __tablename__ = 'establishment_types'
    __table_args__ = {'schema': 'core'}

    id = Column(Integer, primary_key=True, index=True)
    employee_type_key = Column(String(50), nullable=False, index=True, unique=True)
    name = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationship to Employees (One Type to many Employees)
    employees = relationship("Employee", back_populates="establishment_type")
# --- Define EstablishmentType Model --- END ---

# --- Define Employee Model --- START ---
class Employee(Base):
    __tablename__ = 'employees'
    __table_args__ = (
        UniqueConstraint('id_card_number', name='uq_employee_id_card'),
        UniqueConstraint('employee_unique_id', name='uq_employee_unique_id'),
        {'schema': 'core'}
    )

    id = Column(Integer, Identity(always=False), primary_key=True)
    name = Column(Text, nullable=False, index=True)
    id_card_number = Column(Text, nullable=False, index=True)
    employee_unique_id = Column(Text, nullable=True, index=True)
    department_id = Column(Integer, ForeignKey('core.departments.id'), nullable=False)
    establishment_type_id = Column(Integer, ForeignKey('core.establishment_types.id'), nullable=False)
    bank_account_number = Column(Text, nullable=True)
    bank_name = Column(Text, nullable=True)
    work_start_date = Column(Date, nullable=True)
    employment_status = Column(Text, nullable=True, default='在职')
    remarks = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Added new fields
    gender = Column(String(10), nullable=True)
    ethnicity = Column(String(50), nullable=True)
    date_of_birth = Column(Date, nullable=True)
    education_level = Column(Text, nullable=True)
    service_interruption_years = Column(Numeric(precision=4, scale=2), nullable=True)
    continuous_service_years = Column(Numeric(precision=4, scale=2), nullable=True)
    actual_position = Column(String(255), nullable=True)
    actual_position_start_date = Column(Date, nullable=True)
    position_level_start_date = Column(Date, nullable=True)

    # Relationships
    department = relationship("Department", back_populates="employees")
    establishment_type = relationship("EstablishmentType", back_populates="employees")
    calculated_salaries = relationship("CalculatedSalaryRecord", back_populates="employee")

# --- Pydantic Model for Employee --- END ---

# --- Add other ORM models below (e.g., ReportLink) ---
class ReportLink(Base):
    __tablename__ = "report_links"
    __table_args__ = {'schema': 'core'}

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    url = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True)
    display_order = Column(Integer, default=0)
    require_role = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<ReportLink(id={self.id}, name='{self.name}')>"

# --- Define EmployeeTypeFieldRule Model ---
class EmployeeTypeFieldRule(Base):
    __tablename__ = 'employee_type_field_rules'
    __table_args__ = (UniqueConstraint('employee_type_key', 'field_db_name', name='uq_type_field'),
                      {'schema': 'core'})

    rule_id = Column(Integer, primary_key=True, index=True)
    employee_type_key = Column(String(50), nullable=False, index=True)
    field_db_name = Column(String(255), nullable=False, index=True)
    is_required = Column(Boolean, nullable=False, default=False)

    # __table_args__ = (
    #     UniqueConstraint('employee_type_key', 'field_db_name', name='uq_type_field'),
    # )

# --- Define SheetNameMapping Model --- START ---
class SheetNameMapping(Base):
    __tablename__ = 'sheet_name_mappings'
    __table_args__ = {'schema': 'core'}

    # Assuming primary key is needed, using sheet_name as it should be unique?
    # If not, add an auto-incrementing id column
    # id = Column(Integer, primary_key=True, index=True)
    sheet_name = Column(String, primary_key=True, index=True, nullable=False)
    employee_type_key = Column(String(50), nullable=False)
    # Added corresponding SQLAlchemy Column
    target_staging_table = Column(String(255), nullable=True)
    # Add other columns if they exist in the table

# --- Define SheetNameMapping Model --- END ---

# --- Define SalaryFieldMapping Model --- START ---
class SalaryFieldMapping(Base):
    __tablename__ = 'salary_field_mappings'
    __table_args__ = {'schema': 'core'}

    id = Column(Integer, Identity(always=False), primary_key=True) # Assuming ID is identity now
    source_name = Column(String(255), nullable=False, unique=True) # Assuming source_name is unique
    target_name = Column(String(255), nullable=False, unique=True) # Assuming target_name is unique
    is_intermediate = Column(Boolean, nullable=True)
    is_final = Column(Boolean, nullable=True)
    description = Column(Text, nullable=True)
    data_type = Column(String(50), nullable=True)
    # Add other columns if they exist in the table

# --- Define SalaryFieldMapping Model --- END ---

# --- Calculation Rule Engine Models --- START ---
class CalculationFormula(Base):
    __tablename__ = 'calculation_formulas'
    __table_args__ = {'schema': 'payroll'}

    formula_id = Column(Integer, Identity(always=False), primary_key=True)
    name = Column(String, nullable=False, unique=True)
    expression = Column(Text, nullable=False)
    description = Column(Text)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationship back to rules that use this formula
    rules = relationship("CalculationRule", back_populates="formula")

class CalculationRule(Base):
    __tablename__ = 'calculation_rules'
    __table_args__ = {'schema': 'payroll'}

    rule_id = Column(Integer, Identity(always=False), primary_key=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    target_field_db_name = Column(String, nullable=False)
    action_type = Column(String, nullable=False) # e.g., 'APPLY_FORMULA', 'SET_FIXED_VALUE'
    formula_id = Column(Integer, ForeignKey('payroll.calculation_formulas.formula_id'))
    fixed_value = Column(Numeric(15, 2))
    priority = Column(Integer, nullable=False, server_default='0')
    is_active = Column(Boolean, nullable=False, server_default='true')
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationship to the formula used (if action_type is APPLY_FORMULA)
    formula = relationship("CalculationFormula", back_populates="rules")

    # Relationship to the conditions for this rule
    conditions = relationship("CalculationRuleCondition", back_populates="rule", cascade="all, delete-orphan")

class CalculationRuleCondition(Base):
    __tablename__ = 'calculation_rule_conditions'
    __table_args__ = {'schema': 'payroll'}

    condition_id = Column(Integer, Identity(always=False), primary_key=True)
    rule_id = Column(Integer, ForeignKey('payroll.calculation_rules.rule_id', ondelete='CASCADE'), nullable=False)
    source_field_db_name = Column(String, nullable=False) # Field to check the condition against
    operator = Column(String, nullable=False) # e.g., '==', '>', 'in'
    comparison_value = Column(Text, nullable=False) # Value to compare against (as text)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationship back to the rule this condition belongs to
    rule = relationship("CalculationRule", back_populates="conditions")
# --- Calculation Rule Engine Models --- END ---

# --- Calculated Salary Record Model --- START ---
class CalculatedSalaryRecord(Base):
    __tablename__ = 'calculated_salary_records'
    __table_args__ = (UniqueConstraint('employee_id', 'pay_period_identifier', name='uq_employee_pay_period_calc'),
                      {'schema': 'payroll'})

    calculated_record_id = Column(Integer, Identity(always=False), primary_key=True)
    employee_id = Column(BigInteger, ForeignKey('core.employees.id'), nullable=False, index=True)
    pay_period_identifier = Column(String, nullable=False, index=True)
    calculated_data = Column(JSONB, nullable=False) # Stores the dictionary of calculated results
    calculation_timestamp = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    calculation_engine_version = Column(String, nullable=True)
    rules_applied_ids = Column(JSONB, nullable=True) # Store list of rule IDs applied
    source_data_snapshot = Column(JSONB, nullable=True) # Store context snapshot used for calculation

    # Relationship back to the employee (optional, but potentially useful)
    employee = relationship("Employee")
# --- Calculated Salary Record Model --- END ---

# 新增：合并后的数据表模型 (Refactored with English Columns)
class ConsolidatedDataTable(Base):
    __tablename__ = 'consolidated_data'
    __table_args__ = (
        UniqueConstraint('employee_name', 'pay_period_identifier', name='uq_consolidated_employee_period'),
        {'schema': 'staging'}
    )

    _consolidated_data_id = Column(Integer, Identity(start=1), primary_key=True)
    employee_name = Column(String, nullable=False, index=True)
    pay_period_identifier = Column(String, nullable=False, index=True)
    id_card_number = Column(String, nullable=True, index=True)

    # --- Columns from RawAnnuityStaging (prefix ann_) ---
    ann_annuity_contribution_base_salary = Column(Numeric(15, 2), nullable=True)
    ann_annuity_contribution_base = Column(Numeric(15, 2), nullable=True)
    ann_annuity_employer_rate = Column(Numeric(5, 4), nullable=True)
    ann_annuity_employer_contribution = Column(Numeric(15, 2), nullable=True)
    ann_annuity_employee_rate = Column(Numeric(5, 4), nullable=True)
    ann_annuity_employee_contribution = Column(Numeric(15, 2), nullable=True)
    ann_employee_type_key = Column(String(50), nullable=True)

    # --- Columns from RawHousingFundStaging (prefix hf_) ---
    hf_housingfund_contribution_base_salary = Column(Numeric(15, 2), nullable=True)
    hf_housingfund_contribution_base = Column(Numeric(15, 2), nullable=True)
    hf_housingfund_employer_rate = Column(Numeric(5, 4), nullable=True)
    hf_housingfund_employer_contribution = Column(Numeric(15, 2), nullable=True)
    hf_housingfund_employee_rate = Column(Numeric(5, 4), nullable=True)
    hf_housingfund_employee_contribution = Column(Numeric(15, 2), nullable=True)
    hf_employee_type_key = Column(String(50), nullable=True)

    # --- Columns from RawMedicalStaging (prefix med_) ---
    med_contribution_base_salary = Column(Numeric(15, 2), nullable=True)
    med_contribution_base = Column(Numeric(15, 2), nullable=True)
    med_employer_medical_rate = Column(Numeric(5, 4), nullable=True)
    med_employer_medical_contribution = Column(Numeric(15, 2), nullable=True)
    med_employee_medical_rate = Column(Numeric(5, 4), nullable=True)
    med_employee_medical_contribution = Column(Numeric(15, 2), nullable=True)
    med_employer_critical_illness_rate = Column(Numeric(5, 4), nullable=True)
    med_employer_critical_illness_contribution = Column(Numeric(15, 2), nullable=True)
    med_medical_total_employer_contribution = Column(Numeric(15, 2), nullable=True) # Renamed from med_medic_total_employer_contribution
    med_medical_total_employee_contribution = Column(Numeric(15, 2), nullable=True) # Renamed from med_medic_total_employee_contribution
    med_employee_type_key = Column(String(50), nullable=True)

    # --- Columns from RawPensionStaging (prefix pen_) ---
    pen_pension_contribution_base = Column(Numeric(15, 2), nullable=True)
    pen_pension_total_amount = Column(Numeric(15, 2), nullable=True)
    pen_pension_employer_rate = Column(Numeric(5, 4), nullable=True)
    pen_pension_employer_contribution = Column(Numeric(15, 2), nullable=True)
    pen_pension_employee_rate = Column(Numeric(5, 4), nullable=True)
    pen_pension_employee_contribution = Column(Numeric(15, 2), nullable=True)
    pen_unemployment_contribution_base = Column(Numeric(15, 2), nullable=True)
    pen_unemployment_total_amount = Column(Numeric(15, 2), nullable=True)
    pen_unemployment_employer_rate = Column(Numeric(5, 4), nullable=True)
    pen_unemployment_employer_contribution = Column(Numeric(15, 2), nullable=True)
    pen_unemployment_employee_rate = Column(Numeric(5, 4), nullable=True)
    pen_unemployment_employee_contribution = Column(Numeric(15, 2), nullable=True)
    pen_injury_contribution_base = Column(Numeric(15, 2), nullable=True)
    pen_injury_total_amount = Column(Numeric(15, 2), nullable=True)
    pen_injury_employer_rate = Column(Numeric(5, 4), nullable=True)
    pen_injury_employer_contribution = Column(Numeric(15, 2), nullable=True)
    pen_ss_total_employer_contribution = Column(Numeric(15, 2), nullable=True)
    pen_ss_total_employee_contribution = Column(Numeric(15, 2), nullable=True)
    pen_employee_type_key = Column(String(50), nullable=True)

    # --- Columns from RawSalaryDataStaging (prefix sal_) ---
    sal_employee_unique_id = Column(Text, nullable=True)
    sal_establishment_type_name = Column(Text, nullable=True)
    sal_bank_account_number = Column(Text, nullable=True)
    sal_ref_official_post_salary_level = Column(Text, nullable=True)
    sal_employment_status = Column(Text, nullable=True)
    sal_remarks = Column(Text, nullable=True)
    sal_organization_name = Column(Text, nullable=True)
    sal_department_name = Column(Text, nullable=True)
    sal_personnel_rank = Column(Text, nullable=True)
    sal_salary_level = Column(Text, nullable=True)
    sal_salary_grade = Column(Text, nullable=True)
    sal_social_insurance_adjustment = Column(Numeric(15, 2), nullable=True)
    sal_housing_fund_adjustment = Column(Numeric(15, 2), nullable=True)
    sal_employment_start_date = Column(Date, nullable=True)
    sal_post_category = Column(Text, nullable=True)
    sal_bank_branch_name = Column(Text, nullable=True)
    sal_position_rank = Column(Text, nullable=True)
    sal_is_leader = Column(Boolean, nullable=True)
    sal_only_child_parents_reward = Column(Numeric(15, 2), nullable=True)
    sal_ref_official_salary_step = Column(Text, nullable=True)
    sal_annual_fixed_salary_amount = Column(Numeric(15, 2), nullable=True)
    sal_one_time_deduction = Column(Numeric(15, 2), nullable=True)
    sal_basic_performance_bonus_deduction = Column(Numeric(15, 2), nullable=True)
    sal_reward_performance_deduction = Column(Numeric(15, 2), nullable=True)
    sal_petition_post_allowance = Column(Numeric(15, 2), nullable=True)
    sal_post_position_allowance = Column(Numeric(15, 2), nullable=True)
    sal_rank_or_post_grade_salary = Column(Numeric(15, 2), nullable=True)
    sal_individual_income_tax = Column(Numeric(15, 2), nullable=True)
    sal_other_deductions = Column(Numeric(15, 2), nullable=True)
    sal_quarterly_performance_bonus = Column(Numeric(15, 2), nullable=True)
    sal_position_or_technical_salary = Column(Numeric(15, 2), nullable=True)
    sal_salary_civil_servant_normative_allowance = Column(Numeric(15, 2), nullable=True)
    sal_salary_transportation_allowance = Column(Numeric(15, 2), nullable=True)
    sal_probation_salary = Column(Numeric(15, 2), nullable=True)
    sal_reform_1993_reserved_subsidy = Column(Numeric(15, 2), nullable=True)
    sal_monthly_basic_performance = Column(Numeric(15, 2), nullable=True)
    sal_basic_performance_bonus = Column(Numeric(15, 2), nullable=True)
    sal_position_or_post_wage = Column(Numeric(15, 2), nullable=True)
    sal_rank_or_step_wage = Column(Numeric(15, 2), nullable=True)
    sal_monthly_reward_performance = Column(Numeric(15, 2), nullable=True)
    sal_gender = Column(Text, nullable=True)
    sal_ethnicity = Column(Text, nullable=True)
    sal_date_of_birth = Column(Date, nullable=True)
    sal_education_level = Column(Text, nullable=True)
    sal_service_interruption_years = Column(Numeric(15,2), nullable=True)
    sal_continuous_service_years = Column(Numeric(15,2), nullable=True)
    sal_actual_position = Column(Text, nullable=True)
    sal_actual_position_start_date = Column(Date, nullable=True)
    sal_position_level_start_date = Column(Date, nullable=True)
    sal_basic_performance_salary = Column(Numeric(15, 2), nullable=True)
    sal_post_salary = Column(Numeric(15, 2), nullable=True)
    sal_salary_step = Column(Numeric(15, 2), nullable=True)
    sal_basic_salary = Column(Numeric(15, 2), nullable=True)
    sal_performance_salary = Column(Numeric(15, 2), nullable=True)
    sal_other_allowance = Column(Numeric(15, 2), nullable=True)
    sal_salary_backpay = Column(Numeric(15, 2), nullable=True)
    sal_allowance = Column(Numeric(15, 2), nullable=True)
    sal_subsidy = Column(Numeric(15, 2), nullable=True)
    sal_total_deduction_adjustment = Column(Numeric(15, 2), nullable=True)
    sal_living_allowance = Column(Numeric(15, 2), nullable=True)
    sal_salary_step_backpay_total = Column(Numeric(15, 2), nullable=True)
    sal_incentive_performance_salary = Column(Numeric(15, 2), nullable=True)
    sal_total_backpay_amount = Column(Numeric(15, 2), nullable=True)
    sal_tax_adjustment = Column(Numeric(15, 2), nullable=True)
    sal_personnel_identity = Column(Text, nullable=True)
    sal_employee_type_key = Column(String(50), nullable=True)

    # --- Columns from RawTaxStaging (prefix tax_) ---
    tax_income_period_start = Column(Date, nullable=True)
    tax_income_period_end = Column(Date, nullable=True)
    tax_current_period_income = Column(Numeric(15, 2), nullable=True)
    tax_current_period_tax_exempt_income = Column(Numeric(15, 2), nullable=True)
    tax_deduction_basic_pension = Column(Numeric(15, 2), nullable=True)
    tax_deduction_basic_medical = Column(Numeric(15, 2), nullable=True)
    tax_deduction_unemployment = Column(Numeric(15, 2), nullable=True)
    tax_deduction_housing_fund = Column(Numeric(15, 2), nullable=True)
    tax_deduction_child_edu_cumulative = Column(Numeric(15, 2), nullable=True)
    tax_deduction_cont_edu_cumulative = Column(Numeric(15, 2), nullable=True)
    tax_deduction_housing_loan_interest_cumulative = Column(Numeric(15, 2), nullable=True)
    tax_deduction_housing_rent_cumulative = Column(Numeric(15, 2), nullable=True)
    tax_deduction_support_elderly_cumulative = Column(Numeric(15, 2), nullable=True)
    tax_deduction_infant_care_cumulative = Column(Numeric(15, 2), nullable=True)
    tax_deduction_private_pension_cumulative = Column(Numeric(15, 2), nullable=True)
    tax_deduction_annuity = Column(Numeric(15, 2), nullable=True)
    tax_deduction_commercial_health_insurance = Column(Numeric(15, 2), nullable=True)
    tax_deduction_deferred_pension_insurance = Column(Numeric(15, 2), nullable=True)
    tax_deduction_other = Column(Numeric(15, 2), nullable=True)
    tax_deduction_donations = Column(Numeric(15, 2), nullable=True)
    tax_total_deductions_pre_tax = Column(Numeric(15, 2), nullable=True)
    tax_reduction_amount = Column(Numeric(15, 2), nullable=True)
    tax_standard_deduction = Column(Numeric(15, 2), nullable=True)
    tax_calculated_income_tax = Column(Numeric(15, 2), nullable=True)
    tax_remarks = Column(Text, nullable=True)
    tax_employee_type_key = Column(String(50), nullable=True)

    # --- Metadata Columns (already defined above, ensuring they are here) ---
    _import_batch_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    _consolidation_timestamp = Column(TIMESTAMP(timezone=True), default=func.now(), nullable=False)

# --- Staging Table for Raw Salary Data (Refactored with English Columns) ---
class RawSalaryDataStaging(Base):
    __tablename__ = 'raw_salary_data_staging'
    __table_args__ = ({'schema': 'staging'})

    # --- Core Identity and Metadata Fields (Preserved/Ensured) ---
    _staging_id = Column(Integer, Identity(start=1), primary_key=True)
    id_card_number = Column(String(18), index=True, nullable=True) # From sfm
    employee_name = Column(Text, nullable=True, index=True) # From sfm (target_name: employee_name for source_name: 姓名)
    pay_period_identifier = Column(String(7), nullable=False, index=True) # Core field

    # Fields that might be directly in RawSalaryDataStaging or mapped via sfm.csv
    employee_unique_id = Column(Text, index=True, nullable=True) # Assuming this is still desired, was in old model. Not in sfm.csv directly as a target_name for salary types.
    establishment_type_name = Column(Text, nullable=True) # Assuming this is still desired. Not in sfm.csv directly.

    employee_type_key = Column(String(50), nullable=True, index=True) # Standard metadata

    # --- English Column Names based on sfm.csv and relevant employee_type_field_rules ---
    # Fields from sfm.csv with employee_type_key in ('gwy', 'sy', 'cg', 'ytf', 'qp', 'zx', 'zj')
    # or generally applicable salary fields.

    # target_name: bank_account_number, data_type: Text
    bank_account_number = Column(Text, nullable=True)
    # target_name: ref_official_post_salary_level, data_type: TEXT
    ref_official_post_salary_level = Column(Text, nullable=True)
    # target_name: employment_status, data_type: Text
    employment_status = Column(Text, nullable=True)
    # target_name: remarks, data_type: Text
    remarks = Column(Text, nullable=True)
    # target_name: organization_name, data_type: Text
    organization_name = Column(Text, nullable=True)
    # target_name: department_name, data_type: Text
    department_name = Column(Text, nullable=True)
    # target_name: personnel_rank, data_type: Text
    personnel_rank = Column(Text, nullable=True)
    # target_name: salary_level, data_type: TEXT
    salary_level = Column(Text, nullable=True)
    # target_name: salary_grade, data_type: TEXT
    salary_grade = Column(Text, nullable=True)
    # target_name: social_insurance_adjustment, data_type: NUMERIC(15, 2)
    social_insurance_adjustment = Column(Numeric(15, 2), nullable=True)
    # target_name: housing_fund_adjustment, data_type: NUMERIC(15, 2)
    housing_fund_adjustment = Column(Numeric(15, 2), nullable=True)
    # target_name: employer_pension_contribution, data_type: NUMERIC(15, 2)
    employer_pension_contribution = Column(Numeric(15, 2), nullable=True)
    # target_name: employer_medical_contribution, data_type: NUMERIC(15, 2)
    employer_medical_contribution = Column(Numeric(15, 2), nullable=True)
    # target_name: employer_annuity_contribution, data_type: NUMERIC(15, 2)
    employer_annuity_contribution = Column(Numeric(15, 2), nullable=True)
    # target_name: employer_housing_fund_contribution, data_type: NUMERIC(15, 2)
    employer_housing_fund_contribution = Column(Numeric(15, 2), nullable=True)
    # target_name: employer_injury_contribution, data_type: NUMERIC(15, 2) # from sfm (was also employer_injury_contribution)
    employer_injury_contribution = Column(Numeric(15, 2), nullable=True)
    # target_name: employment_start_date, data_type: DATE (also work_start_date)
    employment_start_date = Column(Date, nullable=True)
    # target_name: post_category, data_type: TEXT
    post_category = Column(Text, nullable=True)
    # target_name: bank_branch_name, data_type: TEXT
    bank_branch_name = Column(Text, nullable=True)
    # target_name: position_rank, data_type: TEXT
    position_rank = Column(Text, nullable=True)
    # target_name: is_leader, data_type: BOOLEAN
    is_leader = Column(Boolean, nullable=True)
    # target_name: only_child_parents_reward, data_type: NUMERIC(15, 2)
    only_child_parents_reward = Column(Numeric(15, 2), nullable=True)
    # target_name: ref_official_salary_step, data_type: NUMERIC(15, 2)
    ref_official_salary_step = Column(Numeric(15, 2), nullable=True) # sfm says NUMERIC(15,2)
    # target_name: annual_fixed_salary_amount, data_type: NUMERIC(15, 2)
    annual_fixed_salary_amount = Column(Numeric(15, 2), nullable=True)
    # target_name: one_time_deduction, data_type: NUMERIC(15, 2)
    one_time_deduction = Column(Numeric(15, 2), nullable=True)
    # target_name: basic_performance_bonus_deduction, data_type: NUMERIC(15, 2)
    basic_performance_bonus_deduction = Column(Numeric(15, 2), nullable=True)
    # target_name: basic_performance_deduction, data_type: NUMERIC(15, 2)
    # basic_performance_deduction = Column(Numeric(15, 2), nullable=True) # Appears to be a duplicate concept with basic_performance_bonus_deduction, check sfm
    # target_name: reward_performance_deduction, data_type: NUMERIC(15, 2)
    reward_performance_deduction = Column(Numeric(15, 2), nullable=True)
    # target_name: petition_post_allowance, data_type: NUMERIC(15, 2)
    petition_post_allowance = Column(Numeric(15, 2), nullable=True)
    # target_name: post_position_allowance, data_type: NUMERIC(15, 2)
    post_position_allowance = Column(Numeric(15, 2), nullable=True)
    # target_name: rank_or_post_grade_salary, data_type: NUMERIC(15, 2)
    rank_or_post_grade_salary = Column(Numeric(15, 2), nullable=True)
    # target_name: individual_income_tax, data_type: NUMERIC(15, 2)
    individual_income_tax = Column(Numeric(15, 2), nullable=True)
    # target_name: other_deductions, data_type: NUMERIC(15, 2)
    other_deductions = Column(Numeric(15, 2), nullable=True)
    # target_name: quarterly_assessment_salary, data_type: NUMERIC(15, 2)
    quarterly_assessment_salary = Column(Numeric(15, 2), nullable=True) # from sfm (was quarterly_performance_bonus)
    # target_name: position_or_technical_salary, data_type: NUMERIC(15, 2)
    position_or_technical_salary = Column(Numeric(15, 2), nullable=True)
    # target_name: salary_post_position_allowance, data_type: NUMERIC(15, 2) (This is a duplicate of post_position_allowance, using post_position_allowance)
    # target_name: salary_petition_worker_post_allowance, data_type: NUMERIC(15, 2)
    # salary_petition_worker_post_allowance = Column(Numeric(15, 2), nullable=True) # REMOVED as duplicate/obsolete of petition_post_allowance
    # target_name: salary_civil_servant_normative_allowance, data_type: NUMERIC(15, 2)
    salary_civil_servant_normative_allowance = Column(Numeric(15, 2), nullable=True)
    # target_name: salary_transportation_allowance, data_type: NUMERIC(15, 2)
    salary_transportation_allowance = Column(Numeric(15, 2), nullable=True)
    # target_name: probation_salary, data_type: NUMERIC(15, 2)
    probation_salary = Column(Numeric(15, 2), nullable=True)
    # target_name: reform_1993_reserved_subsidy, data_type: NUMERIC(15, 2)
    reform_1993_reserved_subsidy = Column(Numeric(15, 2), nullable=True)
    # target_name: monthly_basic_performance, data_type: NUMERIC(15, 2)
    monthly_basic_performance = Column(Numeric(15, 2), nullable=True)
    # target_name: basic_performance_bonus, data_type: NUMERIC(15, 2)
    basic_performance_bonus = Column(Numeric(15, 2), nullable=True)
    # target_name: position_or_post_wage, data_type: NUMERIC(15, 2)
    position_or_post_wage = Column(Numeric(15, 2), nullable=True)
    # target_name: rank_or_step_wage, data_type: NUMERIC(15, 2)
    rank_or_step_wage = Column(Numeric(15, 2), nullable=True)
    # target_name: monthly_reward_performance, data_type: NUMERIC(15, 2)
    monthly_reward_performance = Column(Numeric(15, 2), nullable=True)
    # target_name: gender, data_type: text
    gender = Column(Text, nullable=True) # sfm gender -> TEXT
    # target_name: ethnicity, data_type: text
    ethnicity = Column(Text, nullable=True) # sfm ethnicity -> TEXT
    # target_name: date_of_birth, data_type: date
    date_of_birth = Column(Date, nullable=True)
    # target_name: education_level, data_type: text
    education_level = Column(Text, nullable=True)
    # target_name: service_interruption_years, data_type: numeric
    service_interruption_years = Column(Numeric(15,2), nullable=True) # Assuming (15,2) for generic numeric
    # target_name: continuous_service_years, data_type: numeric
    continuous_service_years = Column(Numeric(15,2), nullable=True) # Assuming (15,2)
    # target_name: actual_position, data_type: text
    actual_position = Column(Text, nullable=True)
    # target_name: actual_position_start_date, data_type: date
    actual_position_start_date = Column(Date, nullable=True)
    # target_name: position_level_start_date, data_type: date
    position_level_start_date = Column(Date, nullable=True)
    # target_name: basic_performance_salary, data_type: NUMERIC(15, 2)
    basic_performance_salary = Column(Numeric(15, 2), nullable=True)
    # target_name: post_salary, data_type: NUMERIC(15, 2)
    post_salary = Column(Numeric(15, 2), nullable=True)
    # target_name: salary_step, data_type: NUMERIC(15, 2)
    salary_step = Column(Numeric(15, 2), nullable=True)
    # target_name: basic_salary, data_type: NUMERIC(15, 2)
    basic_salary = Column(Numeric(15, 2), nullable=True)
    # target_name: performance_salary, data_type: NUMERIC(15, 2)
    performance_salary = Column(Numeric(15, 2), nullable=True)
    # target_name: other_allowance, data_type: NUMERIC(15, 2)
    other_allowance = Column(Numeric(15, 2), nullable=True)
    # target_name: salary_backpay, data_type: NUMERIC(15, 2)
    salary_backpay = Column(Numeric(15, 2), nullable=True)
    # target_name: allowance, data_type: NUMERIC(15, 2)
    allowance = Column(Numeric(15, 2), nullable=True)
    # target_name: subsidy, data_type: NUMERIC(15, 2)
    subsidy = Column(Numeric(15, 2), nullable=True)
    # target_name: total_deduction_adjustment, data_type: NUMERIC(15, 2)
    total_deduction_adjustment = Column(Numeric(15, 2), nullable=True)
    # target_name: living_allowance, data_type: NUMERIC(15, 2)
    living_allowance = Column(Numeric(15, 2), nullable=True)
    # target_name: salary_step_backpay_total, data_type: NUMERIC(15, 2)
    salary_step_backpay_total = Column(Numeric(15, 2), nullable=True)
    # target_name: incentive_performance_salary, data_type: NUMERIC(15, 2)
    incentive_performance_salary = Column(Numeric(15, 2), nullable=True)
    # target_name: total_backpay_amount, data_type: NUMERIC(15, 2)
    total_backpay_amount = Column(Numeric(15, 2), nullable=True)
    # target_name: tax_adjustment, data_type: NUMERIC(15, 2)
    tax_adjustment = Column(Numeric(15, 2), nullable=True)
    # target_name: personnel_identity, data_type: TEXT
    personnel_identity = Column(Text, nullable=True)

    # --- Standardized Metadata Columns (Preserved/Ensured) ---
    _source_filename = Column(Text, nullable=True)
    _source_sheet_name = Column(Text, nullable=True)
    _row_number = Column(Integer, nullable=True)
    _import_timestamp = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    _import_batch_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    _validation_status = Column(String(50), default='pending', nullable=False)
    _validation_errors = Column(JSONB, nullable=True)
    # employee_type_key is already defined above as standard metadata

    def __repr__(self):
        return f"<RawSalaryDataStaging(id={self._staging_id}, period='{self.pay_period_identifier}', name='{self.employee_name}')>"

# --- Staging Table for Annuity Data ---
class RawAnnuityStaging(Base):
    __tablename__ = 'raw_annuity_staging'
    __table_args__ = ({'schema': 'staging'})

    _annuity_staging_id = Column(Integer, Identity(start=1), primary_key=True)

    # --- Core Keys ---
    id_card_number = Column(String, index=True, nullable=True)
    pay_period_identifier = Column(String(7), nullable=False, index=True)
    employee_name = Column(Text, nullable=True, index=True)

    # --- Annuity Data Columns ---
    annuity_contribution_base_salary = Column(Numeric(15, 2), nullable=True)
    annuity_contribution_base = Column(Numeric(15, 2), nullable=True)
    annuity_employer_rate = Column(Numeric(5, 4), nullable=True)
    annuity_employer_contribution = Column(Numeric(15, 2), nullable=True)
    annuity_employee_rate = Column(Numeric(5, 4), nullable=True)
    annuity_employee_contribution = Column(Numeric(15, 2), nullable=True)

    # --- Standardized Metadata Columns ---
    _source_filename = Column(Text, nullable=True)
    _source_sheet_name = Column(Text, nullable=True)
    _row_number = Column(Integer, nullable=True)
    _import_timestamp = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    _import_batch_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    _validation_status = Column(String(50), default='pending', nullable=False)
    _validation_errors = Column(JSONB, nullable=True)
    employee_type_key = Column(String(50), nullable=True, index=True)

# --- Staging Table for Housing Fund Data ---
class RawHousingFundStaging(Base):
    __tablename__ = 'raw_housingfund_staging'
    __table_args__ = ({'schema': 'staging'})

    _housingfund_staging_id = Column(Integer, Identity(start=1), primary_key=True)

    # --- Core Keys ---
    id_card_number = Column(String, index=True, nullable=True)
    pay_period_identifier = Column(String(7), nullable=False, index=True)
    employee_name = Column(Text, nullable=True, index=True)

    # --- Housing Fund Data Columns ---
    housingfund_contribution_base_salary = Column(Numeric(15, 2), nullable=True)
    housingfund_contribution_base = Column(Numeric(15, 2), nullable=True)
    housingfund_employer_rate = Column(Numeric(5, 4), nullable=True)
    housingfund_employer_contribution = Column(Numeric(15, 2), nullable=True)
    housingfund_employee_rate = Column(Numeric(5, 4), nullable=True)
    housingfund_employee_contribution = Column(Numeric(15, 2), nullable=True)

    # --- Standardized Metadata Columns ---
    _source_filename = Column(Text, nullable=True)
    _source_sheet_name = Column(Text, nullable=True)
    _row_number = Column(Integer, nullable=True)
    _import_timestamp = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    _import_batch_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    _validation_status = Column(String(50), default='pending', nullable=False)
    _validation_errors = Column(JSONB, nullable=True)
    employee_type_key = Column(String(50), nullable=True, index=True)

# --- Staging Table for Medical Data ---
class RawMedicalStaging(Base):
    __tablename__ = 'raw_medical_staging'
    __table_args__ = ({'schema': 'staging'})

    _medical_staging_id = Column(Integer, Identity(start=1), primary_key=True)

    # --- Core Keys ---
    id_card_number = Column(String, index=True, nullable=True)
    pay_period_identifier = Column(String(7), nullable=False, index=True)
    employee_name = Column(Text, nullable=True, index=True)

    # --- Medical Data Columns (from initial list) ---
    contribution_base_salary = Column(Numeric(15, 2), nullable=True)
    contribution_base = Column(Numeric(15, 2), nullable=True)
    employer_medical_rate = Column(Numeric(5, 4), nullable=True)
    employer_medical_contribution = Column(Numeric(15, 2), nullable=True)
    employee_medical_rate = Column(Numeric(5, 4), nullable=True)
    employee_medical_contribution = Column(Numeric(15, 2), nullable=True)
    # Inferring additional columns based on ConsolidatedDataTable.med_ prefix
    employer_critical_illness_rate = Column(Numeric(5, 4), nullable=True)
    employer_critical_illness_contribution = Column(Numeric(15, 2), nullable=True)
    medical_total_employer_contribution = Column(Numeric(15, 2), nullable=True) # Renamed from total_employer_contribution
    medical_total_employee_contribution = Column(Numeric(15, 2), nullable=True) # Renamed from total_employee_contribution

    # --- Standardized Metadata Columns ---
    _source_filename = Column(Text, nullable=True)
    _source_sheet_name = Column(Text, nullable=True)
    _row_number = Column(Integer, nullable=True)
    _import_timestamp = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    _import_batch_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    _validation_status = Column(String(50), default='pending', nullable=False)
    _validation_errors = Column(JSONB, nullable=True)
    employee_type_key = Column(String(50), nullable=True, index=True)

# --- Staging Table for Pension/Social Security Data ---
class RawPensionStaging(Base):
    __tablename__ = 'raw_pension_staging'
    __table_args__ = ({'schema': 'staging'})

    _pension_staging_id = Column(Integer, Identity(start=1), primary_key=True)

    # --- Core Keys ---
    id_card_number = Column(String, index=True, nullable=True)
    pay_period_identifier = Column(String(7), nullable=False, index=True)
    employee_name = Column(Text, nullable=True, index=True)

    # --- Pension/SS Data Columns (inferred from ConsolidatedDataTable.pen_) ---
    pension_contribution_base = Column(Numeric(15, 2), nullable=True)
    pension_total_amount = Column(Numeric(15, 2), nullable=True)
    pension_employer_rate = Column(Numeric(5, 4), nullable=True)
    pension_employer_contribution = Column(Numeric(15, 2), nullable=True)
    pension_employee_rate = Column(Numeric(5, 4), nullable=True)
    pension_employee_contribution = Column(Numeric(15, 2), nullable=True)
    unemployment_contribution_base = Column(Numeric(15, 2), nullable=True)
    unemployment_total_amount = Column(Numeric(15, 2), nullable=True)
    unemployment_employer_rate = Column(Numeric(5, 4), nullable=True)
    unemployment_employer_contribution = Column(Numeric(15, 2), nullable=True)
    unemployment_employee_rate = Column(Numeric(5, 4), nullable=True)
    unemployment_employee_contribution = Column(Numeric(15, 2), nullable=True)
    injury_contribution_base = Column(Numeric(15, 2), nullable=True)
    injury_total_amount = Column(Numeric(15, 2), nullable=True)
    injury_employer_rate = Column(Numeric(5, 4), nullable=True)
    injury_employer_contribution = Column(Numeric(15, 2), nullable=True)
    ss_total_employer_contribution = Column(Numeric(15, 2), nullable=True)
    ss_total_employee_contribution = Column(Numeric(15, 2), nullable=True)

    # --- Standardized Metadata Columns ---
    _source_filename = Column(Text, nullable=True)
    _source_sheet_name = Column(Text, nullable=True)
    _row_number = Column(Integer, nullable=True)
    _import_timestamp = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    _import_batch_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    _validation_status = Column(String(50), default='pending', nullable=False)
    _validation_errors = Column(JSONB, nullable=True)
    employee_type_key = Column(String(50), nullable=True, index=True)

# --- Staging Table for Tax Data ---
class RawTaxStaging(Base):
    __tablename__ = 'raw_tax_staging'
    __table_args__ = ({'schema': 'staging'})

    _tax_staging_id = Column(Integer, Identity(start=1), primary_key=True)

    # --- Core Keys ---
    id_card_number = Column(String, index=True, nullable=True)
    pay_period_identifier = Column(String(7), nullable=False, index=True)
    employee_name = Column(Text, nullable=True, index=True)

    # --- Tax Data Columns (inferred from ConsolidatedDataTable.tax_) ---
    income_period_start = Column(Date, nullable=True)
    income_period_end = Column(Date, nullable=True)
    current_period_income = Column(Numeric(15, 2), nullable=True)
    current_period_tax_exempt_income = Column(Numeric(15, 2), nullable=True)
    deduction_basic_pension = Column(Numeric(15, 2), nullable=True)
    deduction_basic_medical = Column(Numeric(15, 2), nullable=True)
    deduction_unemployment = Column(Numeric(15, 2), nullable=True)
    deduction_housing_fund = Column(Numeric(15, 2), nullable=True)
    deduction_child_edu_cumulative = Column(Numeric(15, 2), nullable=True)
    deduction_cont_edu_cumulative = Column(Numeric(15, 2), nullable=True)
    deduction_housing_loan_interest_cumulative = Column(Numeric(15, 2), nullable=True)
    deduction_housing_rent_cumulative = Column(Numeric(15, 2), nullable=True)
    deduction_support_elderly_cumulative = Column(Numeric(15, 2), nullable=True)
    deduction_infant_care_cumulative = Column(Numeric(15, 2), nullable=True)
    deduction_private_pension_cumulative = Column(Numeric(15, 2), nullable=True)
    deduction_annuity = Column(Numeric(15, 2), nullable=True)
    deduction_commercial_health_insurance = Column(Numeric(15, 2), nullable=True)
    deduction_deferred_pension_insurance = Column(Numeric(15, 2), nullable=True)
    deduction_other = Column(Numeric(15, 2), nullable=True)
    deduction_donations = Column(Numeric(15, 2), nullable=True)
    total_deductions_pre_tax = Column(Numeric(15, 2), nullable=True)
    reduction_amount = Column(Numeric(15, 2), nullable=True)
    standard_deduction = Column(Numeric(15, 2), nullable=True)
    calculated_income_tax = Column(Numeric(15, 2), nullable=True)
    remarks = Column(Text, nullable=True)

    # --- Standardized Metadata Columns ---
    _source_filename = Column(Text, nullable=True)
    _source_sheet_name = Column(Text, nullable=True)
    _row_number = Column(Integer, nullable=True)
    _import_timestamp = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    _import_batch_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    _validation_status = Column(String(50), default='pending', nullable=False)
    _validation_errors = Column(JSONB, nullable=True)
    employee_type_key = Column(String(50), nullable=True, index=True)

    def __repr__(self):
        return f"<RawTaxStaging(id={self._tax_staging_id}, period='{self.pay_period_identifier}', name='{self.employee_name}')>"