"""
安全相关的ORM模型。
"""
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, UniqueConstraint, Identity, Numeric, BigInteger, Date, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import TIMESTAMP
from typing import Set, List

from ..database import BaseV2

# 定义多对多关系的中间表
user_roles = Table(
    'user_roles',
    BaseV2.metadata,
    Column('user_id', BigInteger, ForeignKey('security.users.id', ondelete='CASCADE'), primary_key=True),
    Column('role_id', BigInteger, ForeignKey('security.roles.id', ondelete='CASCADE'), primary_key=True),
    schema='security'
)

role_permissions = Table(
    'role_permissions',
    BaseV2.metadata,
    Column('role_id', BigInteger, ForeignKey('security.roles.id', ondelete='CASCADE'), primary_key=True),
    Column('permission_id', BigInteger, ForeignKey('security.permissions.id', ondelete='CASCADE'), primary_key=True),
    schema='security'
)

# Security Schema Models
class User(BaseV2):
    __tablename__ = 'users'
    __table_args__ = {'schema': 'security'}

    id = Column(BigInteger, Identity(always=True), primary_key=True)
    username = Column(String(50), nullable=False, unique=True)
    password_hash = Column(String(255), nullable=False)
    employee_id = Column(BigInteger, ForeignKey('hr.employees.id', ondelete='SET NULL'), nullable=True, unique=True)
    is_active = Column(Boolean, nullable=False, server_default='TRUE')
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    employee = relationship("Employee", back_populates="user")
    roles = relationship("Role", secondary=user_roles, back_populates="users")
    payroll_runs = relationship("PayrollRun", back_populates="initiated_by")
    
    # 报表系统关系
    created_data_sources = relationship("ReportDataSource", foreign_keys="[ReportDataSource.created_by]", back_populates="creator")
    created_calculated_fields = relationship("ReportCalculatedField", foreign_keys="[ReportCalculatedField.created_by]", back_populates="creator")
    created_report_templates = relationship("ReportTemplate", foreign_keys="[ReportTemplate.created_by]", back_populates="creator")
    report_executions = relationship("ReportExecution", foreign_keys="[ReportExecution.executed_by]", back_populates="executor")
    report_preferences = relationship("ReportUserPreference", back_populates="user")
    created_report_views = relationship("ReportView", foreign_keys="[ReportView.created_by]", back_populates="creator")
    report_view_executions = relationship("ReportViewExecution", foreign_keys="[ReportViewExecution.executed_by]", back_populates="executor")
    
    # 注意：报表相关权限通过Permission系统管理，不需要直接关系

    @property
    def all_permission_codes(self) -> Set[str]:
        """Returns a set of all unique permission codes granted to the user via their roles."""
        codes = set()
        if not self.roles:
            return codes
        for role in self.roles:
            if role and hasattr(role, 'permission_codes'):
                for p_code in role.permission_codes:
                    codes.add(p_code)
        return codes


class Role(BaseV2):
    __tablename__ = 'roles'
    __table_args__ = {'schema': 'security'}

    id = Column(BigInteger, Identity(always=True), primary_key=True)
    code = Column(String(50), nullable=False, unique=True)
    name = Column(String(100), nullable=False)

    # Relationships
    users = relationship("User", secondary=user_roles, back_populates="roles")
    permissions = relationship("Permission", secondary=role_permissions, back_populates="roles")

    @property
    def permission_codes(self) -> List[str]:
        """Returns a list of permission codes associated with this role."""
        if not self.permissions:
            return []
        return [p.code for p in self.permissions if p and p.code]


class Permission(BaseV2):
    __tablename__ = 'permissions'
    __table_args__ = {'schema': 'security'}

    id = Column(BigInteger, Identity(always=True), primary_key=True)
    code = Column(String(50), nullable=False, unique=True)
    description = Column(Text, nullable=True)

    # Relationships
    roles = relationship("Role", secondary=role_permissions, back_populates="permissions")
