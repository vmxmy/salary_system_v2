"""
配置相关的ORM模型。
"""
from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, UniqueConstraint, Identity, Numeric, BigInteger, Date, CheckConstraint, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func

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
    parent_lookup_value_id = Column(BigInteger, ForeignKey('config.lookup_values.id', name='fk_lookup_value_parent_id', ondelete='SET NULL'), nullable=True)

    # Relationships
    lookup_type = relationship("LookupType", back_populates="lookup_values")
    parent = relationship("LookupValue", remote_side=[id], back_populates="children", foreign_keys=[parent_lookup_value_id])
    children = relationship("LookupValue", back_populates="parent", foreign_keys=[parent_lookup_value_id])


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
        CheckConstraint("type IN ('EARNING', 'DEDUCTION', 'PERSONAL_DEDUCTION', 'EMPLOYER_DEDUCTION', 'BENEFIT', 'STATUTORY', 'STAT', 'OTHER', 'CALCULATION_BASE', 'CALCULATION_RATE', 'CALCULATION_RESULT', 'TAX')", name='chk_payroll_component_type'),
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


class ColumnFilterConfiguration(BaseV2):
    """列筛选配置表 - 存储用户自定义的列筛选模板"""
    __tablename__ = "column_filter_configurations"
    __table_args__ = (
        UniqueConstraint('user_id', 'name', name='uq_column_filter_user_name'),
        {'schema': 'config', 'comment': '列筛选配置表'}
    )

    id = Column(BigInteger, Identity(always=True), primary_key=True, comment="主键")
    user_id = Column(BigInteger, ForeignKey('security.users.id'), nullable=False, comment="用户ID")
    name = Column(String(100), nullable=False, comment="配置名称")
    description = Column(Text, nullable=True, comment="配置描述")
    
    # 筛选配置 JSON 字段
    filter_config = Column(JSONB, nullable=False, comment="筛选配置JSON")
    
    # 应用范围
    scope = Column(String(50), nullable=False, default='payroll_data', comment="应用范围: payroll_data, employee_data 等")
    
    # 是否为默认配置
    is_default = Column(Boolean, nullable=False, default=False, comment="是否为用户默认配置")
    
    # 是否公开（其他用户可见）
    is_public = Column(Boolean, nullable=False, default=False, comment="是否公开配置")
    
    # 使用统计
    usage_count = Column(Integer, nullable=False, default=0, comment="使用次数")
    last_used_at = Column(DateTime(timezone=True), nullable=True, comment="最后使用时间")
    
    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, comment="创建时间")
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True, comment="更新时间")

    # 关系
    user = relationship("User", back_populates="column_filter_configurations")

    def __repr__(self):
        return f"<ColumnFilterConfiguration(id={self.id}, name='{self.name}', user_id={self.user_id})>"
