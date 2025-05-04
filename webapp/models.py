from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import TIMESTAMP

# Import the Base class from database.py
from .database import Base

class Role(Base):
    __tablename__ = 'roles'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)

    # Define the relationship to the User model (one Role to many Users)
    # The back_populates argument ensures bidirectional relationship management
    users = relationship("User", back_populates="role")


class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    role_id = Column(Integer, ForeignKey('roles.id'), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Define the relationship to the Role model (many Users to one Role)
    role = relationship("Role", back_populates="users")


# --- Define Unit Model --- START ---
class Unit(Base):
    __tablename__ = 'units'

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

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    unit_id = Column(Integer, ForeignKey('units.id'), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationship to Unit (Many Departments to one Unit)
    unit = relationship("Unit", back_populates="departments")
    # Relationship to Employees (One Department to many Employees)
    employees = relationship("Employee", back_populates="department")

    # Optional: Unique constraint for name within a unit
    __table_args__ = (UniqueConstraint('name', 'unit_id', name='uq_department_name_unit_id'),)
# --- Define Department Model --- END ---

# --- Define EstablishmentType Model --- START ---
class EstablishmentType(Base):
    __tablename__ = 'establishment_types'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationship to Employees (One Type to many Employees)
    employees = relationship("Employee", back_populates="establishment_type")
# --- Define EstablishmentType Model --- END ---

# --- Define Employee Model --- START ---
class Employee(Base):
    __tablename__ = 'employees'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    id_card_number = Column(String(18), unique=True, index=True, nullable=False)
    employee_unique_id = Column(String(100), unique=True, index=True, nullable=True)
    bank_account_number = Column(String(255), nullable=True)
    bank_name = Column(String(255), nullable=True)
    
    department_id = Column(Integer, ForeignKey('departments.id'), nullable=True)
    establishment_type_id = Column(Integer, ForeignKey('establishment_types.id'), nullable=True)
    
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationship to Department (Many Employees to one Department)
    department = relationship("Department", back_populates="employees")
    # Relationship to EstablishmentType (Many Employees to one Type)
    establishment_type = relationship("EstablishmentType", back_populates="employees")

    # Optional: Add other constraints if needed via __table_args__
    # __table_args__ = (UniqueConstraint('id_card_number', name='uq_employees_id_card_number'),
    #                   UniqueConstraint('employee_unique_id', name='uq_employees_employee_unique_id'))
    # Note: unique=True on columns is generally sufficient unless you need multi-column constraints.
# --- Define Employee Model --- END ---

# --- Add other ORM models below (e.g., ReportLink) --- 
class ReportLink(Base):
    __tablename__ = "report_links"
    
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

    rule_id = Column(Integer, primary_key=True, index=True)
    employee_type_key = Column(String(50), nullable=False, index=True)
    field_db_name = Column(String(255), nullable=False, index=True)
    is_required = Column(Boolean, nullable=False, default=False)

    __table_args__ = (
        UniqueConstraint('employee_type_key', 'field_db_name', name='uq_type_field'),
    ) 