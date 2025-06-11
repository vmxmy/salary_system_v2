"""
薪资配置相关数据库模型
"""

from sqlalchemy import Column, Integer, String, Text, Numeric, Boolean, DateTime, Date, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import BaseV2 as Base


class EmployeeSalaryConfig(Base):
    """员工薪资配置"""
    __tablename__ = "employee_salary_configs"
    __table_args__ = {'schema': 'payroll'}
    
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey('hr.employees.id'), nullable=False, index=True)
    
    # 基础薪资信息
    basic_salary = Column(Numeric(10, 2), nullable=False, comment="基本工资")
    salary_grade_id = Column(Integer, ForeignKey('config.lookup_values.id'), nullable=True, comment="薪资等级")
    
    # 社保公积金基数
    social_insurance_base = Column(Numeric(10, 2), nullable=True, comment="社保基数")
    housing_fund_base = Column(Numeric(10, 2), nullable=True, comment="公积金基数")
    
    # 专项附加扣除
    child_education_deduction = Column(Numeric(10, 2), default=0, comment="子女教育扣除")
    continuing_education_deduction = Column(Numeric(10, 2), default=0, comment="继续教育扣除")
    medical_deduction = Column(Numeric(10, 2), default=0, comment="大病医疗扣除")
    housing_loan_deduction = Column(Numeric(10, 2), default=0, comment="住房贷款利息扣除")
    housing_rent_deduction = Column(Numeric(10, 2), default=0, comment="住房租金扣除")
    elderly_care_deduction = Column(Numeric(10, 2), default=0, comment="赡养老人扣除")
    
    # 其他配置
    overtime_rate_multiplier = Column(Numeric(4, 2), default=1.5, comment="加班费倍数")
    is_active = Column(Boolean, default=True, comment="是否启用")
    
    # 生效日期
    effective_date = Column(Date, nullable=False, comment="生效日期")
    end_date = Column(Date, nullable=True, comment="结束日期")
    
    # 审计字段
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(Integer, nullable=True)
    updated_by = Column(Integer, nullable=True)
    
    # 关系
    employee = relationship("Employee", back_populates="salary_configs")
    salary_grade = relationship("LookupValue", foreign_keys=[salary_grade_id])


class PayrollComponentConfig(Base):
    """薪资组件配置"""
    __tablename__ = "payroll_component_configs"
    __table_args__ = {'schema': 'payroll'}
    
    id = Column(Integer, primary_key=True, index=True)
    component_definition_id = Column(Integer, ForeignKey('config.payroll_component_definitions.id'), nullable=False)
    
    # 配置信息
    config_name = Column(String(100), nullable=False, comment="配置名称")
    description = Column(Text, nullable=True, comment="配置描述")
    
    # 计算配置
    calculation_method = Column(String(50), nullable=False, comment="计算方法")
    calculation_config = Column(JSON, nullable=False, comment="计算配置参数")
    
    # 适用条件
    applicable_conditions = Column(JSON, nullable=True, comment="适用条件")
    
    # 优先级和顺序
    priority = Column(Integer, default=0, comment="优先级")
    calculation_order = Column(Integer, default=0, comment="计算顺序")
    
    # 状态
    is_active = Column(Boolean, default=True, comment="是否启用")
    effective_date = Column(Date, nullable=False, comment="生效日期")
    end_date = Column(Date, nullable=True, comment="结束日期")
    
    # 审计字段
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(Integer, nullable=True)
    updated_by = Column(Integer, nullable=True)
    
    # 关系
    component_definition = relationship("PayrollComponentDefinition")


class SocialInsuranceConfig(Base):
    """社保配置"""
    __tablename__ = "social_insurance_configs"
    __table_args__ = {'schema': 'payroll'}
    
    id = Column(Integer, primary_key=True, index=True)
    
    # 基础信息
    config_name = Column(String(100), nullable=False, comment="配置名称")
    insurance_type = Column(String(50), nullable=False, comment="保险类型")  # PENSION, MEDICAL, UNEMPLOYMENT, INJURY, MATERNITY
    
    # 缴费比例
    employee_rate = Column(Numeric(5, 4), nullable=False, comment="个人缴费比例")
    employer_rate = Column(Numeric(5, 4), nullable=False, comment="单位缴费比例")
    
    # 缴费基数配置
    base_calculation_method = Column(String(50), nullable=False, comment="基数计算方法")
    min_base = Column(Numeric(10, 2), nullable=True, comment="最低缴费基数")
    max_base = Column(Numeric(10, 2), nullable=True, comment="最高缴费基数")
    
    # 适用人员类别
    applicable_personnel_categories = Column(JSON, nullable=True, comment="适用人员类别ID列表")
    
    # 适用地区
    region_code = Column(String(20), nullable=True, comment="适用地区代码")
    
    # 状态
    is_active = Column(Boolean, default=True, comment="是否启用")
    effective_date = Column(Date, nullable=False, comment="生效日期")
    end_date = Column(Date, nullable=True, comment="结束日期")
    
    # 审计字段
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(Integer, nullable=True)
    updated_by = Column(Integer, nullable=True)


class TaxConfig(Base):
    """个人所得税配置"""
    __tablename__ = "tax_configs"
    __table_args__ = {'schema': 'payroll'}
    
    id = Column(Integer, primary_key=True, index=True)
    
    # 基础信息
    config_name = Column(String(100), nullable=False, comment="配置名称")
    tax_type = Column(String(50), nullable=False, comment="税种类型")  # PERSONAL_INCOME, YEAR_END_BONUS
    
    # 基本减除费用
    basic_deduction = Column(Numeric(10, 2), nullable=False, comment="基本减除费用")
    
    # 税率表
    tax_brackets = Column(JSON, nullable=False, comment="税率表配置")
    
    # 计算方法配置
    calculation_method = Column(String(50), nullable=True, comment="计算方法")
    additional_config = Column(JSON, nullable=True, comment="额外配置参数")
    
    # 适用地区
    region_code = Column(String(20), nullable=True, comment="适用地区代码")
    
    # 状态
    is_active = Column(Boolean, default=True, comment="是否启用")
    effective_date = Column(Date, nullable=False, comment="生效日期")
    end_date = Column(Date, nullable=True, comment="结束日期")
    
    # 审计字段
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(Integer, nullable=True)
    updated_by = Column(Integer, nullable=True) 