from pydantic import BaseModel
from typing import List, Optional, Dict, Any, Sequence
from datetime import datetime


class SalaryRecord(BaseModel):
    """薪资记录模型，对应数据库view_level1_calculations视图"""
    # 标识符
    employee_id: int
    pay_period_identifier: str
    establishment_type_id: Optional[int] = None

    # 员工信息
    employee_name: Optional[str] = None
    id_card_number: Optional[str] = None

    # 维度属性
    department_name: Optional[str] = None
    unit_name: Optional[str] = None
    establishment_type_name: Optional[str] = None

    # 工作属性
    job_attr_personnel_identity: Optional[str] = None
    job_attr_personnel_rank: Optional[str] = None
    job_attr_post_category: Optional[str] = None
    job_attr_ref_official_post_salary_level: Optional[str] = None
    job_attr_ref_official_salary_step: Optional[str] = None
    job_attr_salary_level: Optional[str] = None
    job_attr_salary_grade: Optional[str] = None
    job_attr_annual_fixed_salary_amount: Optional[float] = None

    # 薪资组成部分
    salary_one_time_deduction: Optional[float] = None
    salary_basic_performance_bonus_deduction: Optional[float] = None
    salary_basic_performance_deduction: Optional[float] = None
    salary_incentive_performance_salary: Optional[float] = None
    salary_position_or_technical_salary: Optional[float] = None
    salary_rank_or_post_grade_salary: Optional[float] = None
    salary_reform_1993_reserved_subsidy: Optional[float] = None
    salary_only_child_parents_reward: Optional[float] = None
    salary_post_position_allowance: Optional[float] = None
    salary_civil_servant_normative_allowance: Optional[float] = None
    salary_transportation_allowance: Optional[float] = None
    salary_basic_performance_bonus: Optional[float] = None
    salary_probation_salary: Optional[float] = None
    salary_petition_worker_post_allowance: Optional[float] = None
    salary_reward_performance_deduction: Optional[float] = None
    salary_post_salary: Optional[float] = None
    salary_salary_step: Optional[float] = None
    salary_monthly_basic_performance: Optional[float] = None
    salary_monthly_reward_performance: Optional[float] = None
    salary_basic_salary: Optional[float] = None
    salary_basic_performance_salary: Optional[float] = None
    salary_performance_salary: Optional[float] = None
    salary_other_allowance: Optional[float] = None
    salary_salary_backpay: Optional[float] = None
    salary_allowance: Optional[float] = None
    salary_quarterly_performance_bonus: Optional[float] = None
    salary_subsidy: Optional[float] = None
    salary_petition_post_allowance: Optional[float] = None
    salary_total_deduction_adjustment: Optional[float] = None
    salary_living_allowance: Optional[float] = None
    salary_salary_step_backpay_total: Optional[float] = None
    salary_total_backpay_amount: Optional[float] = None

    # 个人扣除项
    deduct_self_pension_contribution: Optional[float] = None
    deduct_self_medical_contribution: Optional[float] = None
    deduct_self_annuity_contribution: Optional[float] = None
    deduct_self_housing_fund_contribution: Optional[float] = None
    deduct_self_unemployment_contribution: Optional[float] = None
    deduct_individual_income_tax: Optional[float] = None
    deduct_other_deductions: Optional[float] = None
    deduct_social_insurance_adjustment: Optional[float] = None
    deduct_housing_fund_adjustment: Optional[float] = None
    deduct_tax_adjustment: Optional[float] = None

    # 公司缴纳部分
    contrib_employer_pension_contribution: Optional[float] = None
    contrib_employer_medical_contribution: Optional[float] = None
    contrib_employer_annuity_contribution: Optional[float] = None
    contrib_employer_housing_fund_contribution: Optional[float] = None
    contrib_employer_unemployment_contribution: Optional[float] = None
    contrib_employer_critical_illness_contribution: Optional[float] = None
    contrib_employer_injury_contribution: Optional[float] = None

    # 其他字段
    remarks: Optional[str] = None

    # 计算总额
    calc_xiaoji: Optional[float] = None
    calc_personal_deductions: Optional[float] = None
    calc_total_payable: Optional[float] = None
    calc_net_pay: Optional[float] = None

    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PaginatedSalaryResponse(BaseModel):
    """分页薪资记录响应"""
    data: Sequence[SalaryRecord]
    total: int


class PayPeriodsResponse(BaseModel):
    """薪资周期列表响应"""
    data: List[str]


class EstablishmentTypeInfo(BaseModel):
    """简化的编制类型信息，用于下拉列表等场景"""
    id: int
    name: str


class FieldMappingBase(BaseModel):
    """字段映射基础模型"""
    target_name: str
    is_intermediate: Optional[bool] = None
    is_final: Optional[bool] = None
    description: Optional[str] = None
    data_type: Optional[str] = None


class FieldMappingCreate(FieldMappingBase):
    """用于创建新字段映射的模型"""
    source_name: str  # 创建时需指定源名称


class FieldMappingUpdate(FieldMappingBase):
    """用于更新字段映射的模型，继承FieldMappingBase中的所有可选字段"""
    pass


class FieldMappingInDB(FieldMappingCreate):
    """数据库中的字段映射模型"""
    id: int


class FieldMappingListResponse(BaseModel):
    """字段映射列表响应"""
    data: List[FieldMappingInDB] 