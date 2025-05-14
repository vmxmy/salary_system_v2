"""
配置相关的ORM模型。
"""
from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, UniqueConstraint, Identity, Numeric, BigInteger, Date, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB

from ..database import BaseV2

# Config Schema Models
class LookupType(BaseV2):
    __tablename__ = 'lookup_types'
    __table_args__ = {'schema': 'config'}

    id = Column(BigInteger, Identity(always=True), primary_key=True)
    code = Column(String(50), nullable=False, unique=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)

    # Relationships
    lookup_values = relationship("LookupValue", back_populates="lookup_type")


class LookupValue(BaseV2):
    __tablename__ = 'lookup_values'
    __table_args__ = (
        UniqueConstraint('lookup_type_id', 'code', name='uq_lookup_values_type_code'),
        {'schema': 'config'}
    )

    id = Column(BigInteger, Identity(always=True), primary_key=True)
    lookup_type_id = Column(BigInteger, ForeignKey('config.lookup_types.id', ondelete='RESTRICT'), nullable=False)
    code = Column(String(50), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    sort_order = Column(Integer, nullable=False, server_default='0')
    is_active = Column(Boolean, nullable=False, server_default='TRUE')

    # Relationships
    lookup_type = relationship("LookupType", back_populates="lookup_values")


class SystemParameter(BaseV2):
    __tablename__ = 'system_parameters'
    __table_args__ = {'schema': 'config'}

    id = Column(BigInteger, Identity(always=True), primary_key=True)
    key = Column(String(100), nullable=False, unique=True)
    value = Column(Text, nullable=False)
    description = Column(Text, nullable=True)


class PayrollComponentDefinition(BaseV2):
    __tablename__ = 'payroll_component_definitions'
    __table_args__ = (
        CheckConstraint("type IN ('Earning', 'Deduction')", name='chk_payroll_component_type'),
        {'schema': 'config'}
    )

    id = Column(BigInteger, Identity(always=True), primary_key=True)
    code = Column(String(50), nullable=False, unique=True)
    name = Column(String(100), nullable=False)
    type = Column(String(20), nullable=False)  # 'Earning' or 'Deduction'
    calculation_method = Column(String(50), nullable=True)
    calculation_parameters = Column(JSONB, nullable=True)
    is_taxable = Column(Boolean, nullable=False, server_default='TRUE')
    is_social_security_base = Column(Boolean, nullable=False, server_default='FALSE')
    is_housing_fund_base = Column(Boolean, nullable=False, server_default='FALSE')
    display_order = Column(Integer, nullable=False, server_default='0')
    is_active = Column(Boolean, nullable=False, server_default='TRUE')
    effective_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)

    # Relationships
    employee_components = relationship("EmployeePayrollComponent", back_populates="component_definition")


class TaxBracket(BaseV2):
    __tablename__ = 'tax_brackets'
    __table_args__ = (
        CheckConstraint("income_range_start < income_range_end OR income_range_end IS NULL", name='chk_tax_bracket_range'),
        {'schema': 'config'}
    )

    id = Column(BigInteger, Identity(always=True), primary_key=True)
    region_code = Column(String(50), nullable=False)
    tax_type = Column(String(50), nullable=False)
    income_range_start = Column(Numeric(18, 4), nullable=False)
    income_range_end = Column(Numeric(18, 4), nullable=True)
    tax_rate = Column(Numeric(5, 4), nullable=False)
    quick_deduction = Column(Numeric(18, 4), nullable=False, server_default='0')
    effective_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)


class SocialSecurityRate(BaseV2):
    __tablename__ = 'social_security_rates'
    __table_args__ = (
        CheckConstraint("participant_type IN ('Employee', 'Employer')", name='chk_ss_rate_participant_type'),
        {'schema': 'config'}
    )

    id = Column(BigInteger, Identity(always=True), primary_key=True)
    region_code = Column(String(50), nullable=False)
    contribution_type = Column(String(50), nullable=False)
    participant_type = Column(String(20), nullable=False)  # 'Employee' or 'Employer'
    rate = Column(Numeric(5, 4), nullable=False)
    base_min = Column(Numeric(18, 4), nullable=True)
    base_max = Column(Numeric(18, 4), nullable=True)
    fixed_amount = Column(Numeric(18, 4), nullable=False, server_default='0')
    effective_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
