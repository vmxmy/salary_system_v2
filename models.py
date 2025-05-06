import datetime
from sqlalchemy import (
    create_engine, Column, Integer, String, Text, Date, ForeignKey, DateTime, UniqueConstraint, Index, Boolean, Numeric
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship, declarative_base, foreign
from sqlalchemy.sql import func

Base = declarative_base()

class Unit(Base):
    __tablename__ = 'units'
    id = Column(Integer, primary_key=True)
    name = Column(Text, unique=True, nullable=False, index=True)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    departments = relationship("Department", back_populates="unit")
    employees = relationship("Employee", back_populates="unit")

    def __repr__(self):
        return f"<Unit(id={self.id}, name='{self.name}')>"

class Department(Base):
    __tablename__ = 'departments'
    id = Column(Integer, primary_key=True)
    name = Column(Text, nullable=False)
    unit_id = Column(Integer, ForeignKey('units.id', ondelete='RESTRICT', onupdate='CASCADE'), nullable=False, index=True)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    unit = relationship("Unit", back_populates="departments")
    employees = relationship("Employee", back_populates="department")

    __table_args__ = (UniqueConstraint('unit_id', 'name', name='uq_department_unit_name'),)

    def __repr__(self):
        return f"<Department(id={self.id}, name='{self.name}', unit_id={self.unit_id})>"

class EstablishmentType(Base):
    __tablename__ = 'establishment_types'
    id = Column(Integer, primary_key=True)
    name = Column(Text, unique=True, nullable=False, index=True)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    salary_records = relationship("SalaryRecord", back_populates="establishment_type")

    def __repr__(self):
        return f"<EstablishmentType(id={self.id}, name='{self.name}')>"

class Employee(Base):
    __tablename__ = 'employees'
    id = Column(Integer, primary_key=True)
    employee_unique_id = Column(Text, unique=True, index=True)
    name = Column(Text, nullable=False)
    id_card_number = Column(Text, unique=True, index=True) #身份证号
    bank_account_number = Column(Text)
    bank_name = Column(Text)
    hire_date = Column(Date)
    employment_status = Column(Text, default='在职', index=True) #状态
    unit_id = Column(Integer, ForeignKey('units.id', ondelete='SET NULL', onupdate='CASCADE'), index=True)
    department_id = Column(Integer, ForeignKey('departments.id', ondelete='SET NULL', onupdate='CASCADE'), index=True)
    remarks = Column(Text) #备注
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    unit = relationship("Unit", back_populates="employees")
    department = relationship("Department", back_populates="employees")
    salary_records = relationship("SalaryRecord", back_populates="employee", foreign_keys="SalaryRecord.employee_id")

    def __repr__(self):
        return f"<Employee(id={self.id}, employee_unique_id='{self.employee_unique_id}', name='{self.name}')>"


class FieldMapping(Base):
    __tablename__ = 'field_mappings'
    field_code = Column(Text, primary_key=True)
    chinese_name = Column(Text, nullable=False)
    category = Column(Text, index=True)
    description = Column(Text)
    data_type = Column(Text)
    display_order = Column(Integer)

    def __repr__(self):
        return f"<FieldMapping(field_code='{self.field_code}', chinese_name='{self.chinese_name}')>"


class SalaryRecord(Base):
    __tablename__ = 'salary_records'
    id = Column(Integer, primary_key=True)
    employee_id = Column(Integer, ForeignKey('employees.id', ondelete='RESTRICT', onupdate='CASCADE'), nullable=False, index=True)
    establishment_type_id = Column(Integer, ForeignKey('establishment_types.id', ondelete='RESTRICT', onupdate='CASCADE'), nullable=False, index=True)
    unit_id = Column(Integer, ForeignKey('units.id', name='fk_salary_record_unit', ondelete='SET NULL', onupdate='CASCADE'), nullable=True, index=True)
    department_id = Column(Integer, ForeignKey('departments.id', name='fk_salary_record_department', ondelete='SET NULL', onupdate='CASCADE'), nullable=True, index=True)

    pay_period_start_date = Column(Date, nullable=False, index=True)
    pay_period_end_date = Column(Date, nullable=False, index=True)

    job_attributes = Column(JSONB)          # 职务属性
    salary_components = Column(JSONB)       # 工资明细
    personal_deductions = Column(JSONB)     # 个人扣缴
    company_contributions = Column(JSONB)   # 单位扣缴
    other_info = Column(JSONB)              # 其他

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    employee = relationship("Employee", back_populates="salary_records", foreign_keys=[employee_id])
    establishment_type = relationship("EstablishmentType", back_populates="salary_records")

    # Add indexes for JSONB columns if specific keys are frequently queried
    # __table_args__ = (
    #     Index('idx_salary_records_job_attributes_gin', job_attributes, postgresql_using='gin'),
    #     Index('idx_salary_records_salary_components_gin', salary_components, postgresql_using='gin'),
    #     Index('idx_salary_records_personal_deductions_gin', personal_deductions, postgresql_using='gin'),
    #     Index('idx_salary_records_company_contributions_gin', company_contributions, postgresql_using='gin'),
    # )
    # Note: Alembic autogenerate might need help with GIN indexes on JSONB. May need manual addition in migration script.

    def __repr__(self):
        return f"<SalaryRecord(id={self.id}, employee_id={self.employee_id}, unit={self.unit_id}, dept={self.department_id}, period='{self.pay_period_start_date}-{self.pay_period_end_date}')>"

# class RawSalaryDataStaging(Base): # Definition moved to webapp/models.py
#     __tablename__ = 'raw_salary_data_staging'
#
#     _staging_id = Column(Integer, primary_key=True, autoincrement=True)
#
#     id_card_number = Column(String(18), index=True, nullable=True)
#     employee_name = Column(Text, nullable=True)
#     employee_unique_id = Column(Text, index=True, nullable=True)
#     establishment_type_name = Column(Text, nullable=True)
#     pay_period_identifier = Column(String(7), nullable=False, index=True) # Assuming 'YYYY-MM' format
#
#     # Job Attributes (assuming Text, adjust if numeric needed)
#     job_attr_人员身份 = Column(Text, nullable=True)
#     job_attr_人员职级 = Column(Text, nullable=True)
#     job_attr_岗位类别 = Column(Text, nullable=True)
#     job_attr_参照正编岗位工资级别 = Column(Text, nullable=True) # Might be Numeric?
#     job_attr_参照正编薪级工资级次 = Column(Text, nullable=True) # Might be Numeric?
#     job_attr_工资级别 = Column(Text, nullable=True) # Might be Numeric?
#     job_attr_工资档次 = Column(Text, nullable=True) # Might be Numeric?
#     job_attr_固定薪酬全年应发数 = Column(Numeric(12, 2), nullable=True)
#
#     # Salary Components
#     salary_一次性补扣发 = Column(Numeric(12, 2), nullable=True)
#     salary_基础绩效奖补扣发 = Column(Numeric(12, 2), nullable=True)
#     salary_职务技术等级工资 = Column(Numeric(12, 2), nullable=True)
#     salary_级别岗位级别工资 = Column(Numeric(12, 2), nullable=True)
#     salary_93年工改保留补贴 = Column(Numeric(12, 2), nullable=True)
#     salary_独生子女父母奖励金 = Column(Numeric(12, 2), nullable=True)
#     salary_岗位职务补贴 = Column(Numeric(12, 2), nullable=True)
#     salary_公务员规范性津贴补贴 = Column(Numeric(12, 2), nullable=True)
#     salary_公务交通补贴 = Column(Numeric(12, 2), nullable=True)
#     salary_基础绩效奖 = Column(Numeric(12, 2), nullable=True)
#     salary_见习试用期工资 = Column(Numeric(12, 2), nullable=True)
#     salary_信访工作人员岗位津贴 = Column(Numeric(12, 2), nullable=True)
#     salary_奖励绩效补扣发 = Column(Numeric(12, 2), nullable=True)
#     salary_岗位工资 = Column(Numeric(12, 2), nullable=True)
#     salary_薪级工资 = Column(Numeric(12, 2), nullable=True)
#     salary_月基础绩效 = Column(Numeric(12, 2), nullable=True)
#     salary_月奖励绩效 = Column(Numeric(12, 2), nullable=True)
#     salary_基本工资 = Column(Numeric(12, 2), nullable=True)
#     salary_绩效工资 = Column(Numeric(12, 2), nullable=True)
#     salary_其他补助 = Column(Numeric(12, 2), nullable=True)
#     salary_补发工资 = Column(Numeric(12, 2), nullable=True)
#     salary_津贴 = Column(Numeric(12, 2), nullable=True)
#     salary_季度绩效考核薪酬 = Column(Numeric(12, 2), nullable=True)
#     salary_补助 = Column(Numeric(12, 2), nullable=True)
#     salary_信访岗位津贴 = Column(Numeric(12, 2), nullable=True)
#     salary_补扣发合计 = Column(Numeric(12, 2), nullable=True)
#     salary_生活津贴 = Column(Numeric(12, 2), nullable=True)
#     salary_1季度3季度考核绩效奖 = Column(Numeric(12, 2), nullable=True)
#     salary_补发薪级合计 = Column(Numeric(12, 2), nullable=True)
#
#     # Deductions
#     deduct_个人缴养老保险费 = Column(Numeric(12, 2), nullable=True)
#     deduct_个人缴医疗保险费 = Column(Numeric(12, 2), nullable=True)
#     deduct_个人缴职业年金 = Column(Numeric(12, 2), nullable=True)
#     deduct_个人缴住房公积金 = Column(Numeric(12, 2), nullable=True)
#     deduct_个人缴失业保险费 = Column(Numeric(12, 2), nullable=True)
#     deduct_个人所得税 = Column(Numeric(12, 2), nullable=True)
#     deduct_其他扣款 = Column(Numeric(12, 2), nullable=True)
#     deduct_补扣退社保缴费 = Column(Numeric(12, 2), nullable=True)
#     deduct_补扣退公积金 = Column(Numeric(12, 2), nullable=True)
#     deduct_补扣个税 = Column(Numeric(12, 2), nullable=True)
#
#     # Contributions
#     contrib_单位缴养老保险费 = Column(Numeric(12, 2), nullable=True)
#     contrib_单位缴医疗保险费 = Column(Numeric(12, 2), nullable=True)
#     contrib_单位缴职业年金 = Column(Numeric(12, 2), nullable=True)
#     contrib_单位缴住房公积金 = Column(Numeric(12, 2), nullable=True)
#     contrib_单位缴失业保险费 = Column(Numeric(12, 2), nullable=True)
#     contrib_大病医疗单位缴纳 = Column(Numeric(12, 2), nullable=True)
#
#     # Other
#     other_备注 = Column(Text, nullable=True)
#
#     # Airbyte Metadata (assuming these are added by Airbyte or similar process)
#     _airbyte_source_file = Column(Text, nullable=True)
#     _airbyte_source_sheet = Column(Text, nullable=True)
#
#     # Optional: Add import timestamp
#     _import_timestamp = Column(DateTime(timezone=True), server_default=func.now())
#
#     def __repr__(self):
#        return f"<RawSalaryDataStaging(period='{self.pay_period_identifier}', name='{self.employee_name}')>" 