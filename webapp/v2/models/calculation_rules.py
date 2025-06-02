"""
计算规则配置模型
"""

from sqlalchemy import Column, Integer, String, Text, Numeric, Boolean, DateTime, Date, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import BaseV2 as Base


class CalculationRuleSet(Base):
    """计算规则集"""
    __tablename__ = "calculation_rule_sets"
    __table_args__ = {'schema': 'payroll'}
    
    id = Column(Integer, primary_key=True, index=True)
    
    # 基础信息
    rule_set_name = Column(String(100), nullable=False, comment="规则集名称")
    description = Column(Text, nullable=True, comment="规则集描述")
    version = Column(String(20), nullable=False, comment="版本号")
    
    # 适用范围
    applicable_departments = Column(JSON, nullable=True, comment="适用部门")
    applicable_positions = Column(JSON, nullable=True, comment="适用职位")
    applicable_employee_types = Column(JSON, nullable=True, comment="适用员工类型")
    
    # 计算配置
    calculation_order = Column(JSON, nullable=False, comment="计算顺序配置")
    default_configs = Column(JSON, nullable=True, comment="默认配置参数")
    
    # 状态
    is_active = Column(Boolean, default=True, comment="是否启用")
    is_default = Column(Boolean, default=False, comment="是否为默认规则集")
    effective_date = Column(Date, nullable=False, comment="生效日期")
    end_date = Column(Date, nullable=True, comment="结束日期")
    
    # 审计字段
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(Integer, nullable=True)
    updated_by = Column(Integer, nullable=True)
    
    # 关系
    calculation_rules = relationship("CalculationRule", back_populates="rule_set")


class CalculationRule(Base):
    """计算规则"""
    __tablename__ = "calculation_rules"
    __table_args__ = {'schema': 'payroll'}
    
    id = Column(Integer, primary_key=True, index=True)
    rule_set_id = Column(Integer, ForeignKey('payroll.calculation_rule_sets.id'), nullable=False, index=True)
    component_definition_id = Column(Integer, ForeignKey('config.payroll_component_definitions.id'), nullable=False)
    
    # 规则信息
    rule_name = Column(String(100), nullable=False, comment="规则名称")
    rule_type = Column(String(50), nullable=False, comment="规则类型")  # BASIC, ALLOWANCE, DEDUCTION, TAX, FORMULA
    
    # 计算配置
    calculation_method = Column(String(50), nullable=False, comment="计算方法")
    calculation_config = Column(JSON, nullable=False, comment="计算配置参数")
    
    # 条件配置
    condition_expression = Column(Text, nullable=True, comment="适用条件表达式")
    condition_config = Column(JSON, nullable=True, comment="条件配置参数")
    
    # 优先级和顺序
    priority = Column(Integer, default=0, comment="优先级")
    execution_order = Column(Integer, default=0, comment="执行顺序")
    
    # 依赖关系
    depends_on_components = Column(JSON, nullable=True, comment="依赖的组件")
    
    # 状态
    is_active = Column(Boolean, default=True, comment="是否启用")
    is_mandatory = Column(Boolean, default=False, comment="是否必须执行")
    
    # 审计字段
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(Integer, nullable=True)
    updated_by = Column(Integer, nullable=True)
    
    # 关系
    rule_set = relationship("CalculationRuleSet", back_populates="calculation_rules")
    component_definition = relationship("PayrollComponentDefinition")


class CalculationLog(Base):
    """计算日志"""
    __tablename__ = "calculation_logs"
    __table_args__ = {'schema': 'payroll'}
    
    id = Column(Integer, primary_key=True, index=True)
    
    # 关联信息
    payroll_run_id = Column(Integer, ForeignKey('payroll.payroll_runs.id'), nullable=True, index=True)
    employee_id = Column(Integer, ForeignKey('hr.employees.id'), nullable=False, index=True)
    component_code = Column(String(50), nullable=False, comment="组件代码")
    
    # 计算信息
    rule_set_id = Column(Integer, ForeignKey('payroll.calculation_rule_sets.id'), nullable=True)
    calculation_rule_id = Column(Integer, ForeignKey('payroll.calculation_rules.id'), nullable=True)
    
    # 计算过程
    calculation_method = Column(String(50), nullable=False, comment="计算方法")
    input_data = Column(JSON, nullable=True, comment="输入数据")
    calculation_details = Column(JSON, nullable=True, comment="计算详情")
    result_amount = Column(Numeric(15, 2), nullable=False, comment="计算结果")
    
    # 执行信息
    execution_time_ms = Column(Integer, nullable=True, comment="执行时间(毫秒)")
    status = Column(String(20), nullable=False, comment="执行状态")  # SUCCESS, ERROR, WARNING
    error_message = Column(Text, nullable=True, comment="错误信息")
    
    # 审计字段
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 关系
    payroll_run = relationship("PayrollRun")
    employee = relationship("Employee")
    rule_set = relationship("CalculationRuleSet")
    calculation_rule = relationship("CalculationRule")


class CalculationTemplate(Base):
    """计算模板"""
    __tablename__ = "calculation_templates"
    __table_args__ = {'schema': 'payroll'}
    
    id = Column(Integer, primary_key=True, index=True)
    
    # 模板信息
    template_name = Column(String(100), nullable=False, comment="模板名称")
    template_type = Column(String(50), nullable=False, comment="模板类型")  # DEPARTMENT, POSITION, EMPLOYEE_TYPE
    description = Column(Text, nullable=True, comment="模板描述")
    
    # 模板配置
    rule_set_id = Column(Integer, ForeignKey('payroll.calculation_rule_sets.id'), nullable=False)
    template_config = Column(JSON, nullable=False, comment="模板配置")
    
    # 适用条件
    applicable_conditions = Column(JSON, nullable=True, comment="适用条件")
    
    # 状态
    is_active = Column(Boolean, default=True, comment="是否启用")
    is_default = Column(Boolean, default=False, comment="是否为默认模板")
    
    # 审计字段
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(Integer, nullable=True)
    updated_by = Column(Integer, nullable=True)
    
    # 关系
    rule_set = relationship("CalculationRuleSet")


class CalculationAuditLog(Base):
    """计算审计日志"""
    __tablename__ = "calculation_audit_logs"
    __table_args__ = {'schema': 'payroll'}
    
    id = Column(Integer, primary_key=True, index=True)
    
    # 审计信息
    operation_type = Column(String(50), nullable=False, comment="操作类型")  # CALCULATE, RECALCULATE, APPROVE, REJECT
    operation_description = Column(Text, nullable=True, comment="操作描述")
    
    # 关联信息
    payroll_run_id = Column(Integer, ForeignKey('payroll.payroll_runs.id'), nullable=True, index=True)
    employee_id = Column(Integer, ForeignKey('hr.employees.id'), nullable=True, index=True)
    
    # 变更信息
    before_data = Column(JSON, nullable=True, comment="变更前数据")
    after_data = Column(JSON, nullable=True, comment="变更后数据")
    change_summary = Column(JSON, nullable=True, comment="变更摘要")
    
    # 操作人信息
    operator_id = Column(Integer, nullable=False, comment="操作人ID")
    operator_name = Column(String(100), nullable=False, comment="操作人姓名")
    operation_time = Column(DateTime(timezone=True), server_default=func.now(), comment="操作时间")
    
    # 系统信息
    ip_address = Column(String(45), nullable=True, comment="IP地址")
    user_agent = Column(String(500), nullable=True, comment="用户代理")
    
    # 关系
    payroll_run = relationship("PayrollRun")
    employee = relationship("Employee") 