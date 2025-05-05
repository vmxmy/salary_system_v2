from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, UniqueConstraint, Identity, Numeric, BigInteger, Date
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