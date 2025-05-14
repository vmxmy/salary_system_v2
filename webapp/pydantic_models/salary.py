from pydantic import BaseModel
from typing import List, Optional, Dict, Any, Sequence
from datetime import datetime


class SalaryRecord(BaseModel):
    """薪资记录模型，对应数据库consolidated_data表的原始字段"""
    # 标识符
    _consolidated_data_id: int
    employee_name: Optional[str] = None
    pay_period_identifier: Optional[str] = None
    id_card_number: Optional[str] = None

    # 年金相关字段
    ann_annuity_contribution_base_salary: Optional[float] = None
    ann_annuity_contribution_base: Optional[float] = None
    ann_annuity_employer_rate: Optional[float] = None
    ann_annuity_employer_contribution: Optional[float] = None
    ann_annuity_employee_rate: Optional[float] = None
    ann_annuity_employee_contribution: Optional[float] = None
    ann_employee_type_key: Optional[str] = None

    # 住房公积金相关字段
    hf_housingfund_contribution_base_salary: Optional[float] = None
    hf_housingfund_contribution_base: Optional[float] = None
    hf_housingfund_employer_rate: Optional[float] = None
    hf_housingfund_employer_contribution: Optional[float] = None
    hf_housingfund_employee_rate: Optional[float] = None
    hf_housingfund_employee_contribution: Optional[float] = None
    hf_employee_type_key: Optional[str] = None

    # 医疗保险相关字段
    med_contribution_base_salary: Optional[float] = None
    med_contribution_base: Optional[float] = None
    med_employer_medical_rate: Optional[float] = None
    med_employer_medical_contribution: Optional[float] = None
    med_employee_medical_rate: Optional[float] = None
    med_employee_medical_contribution: Optional[float] = None
    med_employer_critical_illness_rate: Optional[float] = None
    med_employer_critical_illness_contribution: Optional[float] = None
    med_medical_total_employer_contribution: Optional[float] = None
    med_medical_total_employee_contribution: Optional[float] = None
    med_employee_type_key: Optional[str] = None

    # 养老保险相关字段
    pen_pension_contribution_base: Optional[float] = None
    pen_pension_total_amount: Optional[float] = None
    pen_pension_employer_rate: Optional[float] = None
    pen_pension_employer_contribution: Optional[float] = None
    pen_pension_employee_rate: Optional[float] = None
    pen_pension_employee_contribution: Optional[float] = None
    pen_unemployment_contribution_base: Optional[float] = None
    pen_unemployment_total_amount: Optional[float] = None
    pen_unemployment_employer_rate: Optional[float] = None
    pen_unemployment_employer_contribution: Optional[float] = None
    pen_unemployment_employee_rate: Optional[float] = None
    pen_unemployment_employee_contribution: Optional[float] = None
    pen_injury_contribution_base: Optional[float] = None
    pen_injury_total_amount: Optional[float] = None
    pen_injury_employer_rate: Optional[float] = None
    pen_injury_employer_contribution: Optional[float] = None
    pen_ss_total_employer_contribution: Optional[float] = None
    pen_ss_total_employee_contribution: Optional[float] = None
    pen_employee_type_key: Optional[str] = None

    # 薪资相关字段
    sal_remarks: Optional[str] = None
    sal_subsidy: Optional[float] = None
    sal_allowance: Optional[float] = None
    sal_post_salary: Optional[float] = None
    sal_salary_step: Optional[float] = None
    sal_basic_salary: Optional[float] = None
    sal_tax_adjustment: Optional[float] = None
    sal_salary_grade: Optional[str] = None
    sal_salary_level: Optional[str] = None
    sal_salary_backpay: Optional[float] = None
    sal_post_category: Optional[str] = None
    sal_other_allowance: Optional[float] = None
    sal_other_deductions: Optional[float] = None
    sal_employee_type_key: Optional[str] = None
    sal_personnel_rank: Optional[str] = None
    sal_living_allowance: Optional[float] = None
    sal_probation_salary: Optional[float] = None
    sal_one_time_deduction: Optional[float] = None
    sal_performance_salary: Optional[float] = None
    sal_personnel_identity: Optional[str] = None
    sal_total_backpay_amount: Optional[float] = None
    sal_individual_income_tax: Optional[float] = None
    sal_housing_fund_adjustment: Optional[float] = None
    sal_basic_performance_bonus: Optional[float] = None
    sal_petition_post_allowance: Optional[float] = None
    sal_post_position_allowance: Optional[float] = None
    sal_salary_transportation_allowance: Optional[float] = None
    sal_self_annuity_contribution: Optional[float] = None
    sal_self_medical_contribution: Optional[float] = None
    sal_self_pension_contribution: Optional[float] = None
    sal_monthly_basic_performance: Optional[float] = None
    sal_only_child_parents_reward: Optional[float] = None
    sal_rank_or_post_grade_salary: Optional[float] = None
    sal_salary_step_backpay_total: Optional[float] = None
    sal_ref_official_salary_step: Optional[str] = None
    sal_monthly_reward_performance: Optional[float] = None
    sal_total_deduction_adjustment: Optional[float] = None
    sal_social_insurance_adjustment: Optional[float] = None
    sal_quarterly_performance_bonus: Optional[float] = None
    sal_annual_fixed_salary_amount: Optional[float] = None
    sal_position_or_technical_salary: Optional[float] = None
    sal_reform_1993_reserved_subsidy: Optional[float] = None
    sal_reward_performance_deduction: Optional[float] = None
    sal_employer_annuity_contribution: Optional[float] = None
    sal_employer_medical_contribution: Optional[float] = None
    sal_employer_pension_contribution: Optional[float] = None
    sal_self_housing_fund_contribution: Optional[float] = None
    sal_self_unemployment_contribution: Optional[float] = None
    sal_petition_worker_post_allowance: Optional[float] = None
    sal_ref_official_post_salary_level: Optional[str] = None
    sal_basic_performance_bonus_deduction: Optional[float] = None
    sal_salary_civil_servant_normative_allowance: Optional[float] = None
    sal_employer_housing_fund_contribution: Optional[float] = None
    sal_employer_unemployment_contribution: Optional[float] = None
    sal_employer_critical_illness_contribution: Optional[float] = None
    sal_bank_account_number: Optional[str] = None
    sal_bank_branch_name: Optional[str] = None
    sal_employment_start_date: Optional[datetime] = None
    sal_employment_status: Optional[str] = None
    sal_organization_name: Optional[str] = None
    sal_department_name: Optional[str] = None
    sal_basic_performance_salary: Optional[float] = None
    sal_incentive_performance_salary: Optional[float] = None
    sal_self_injury_contribution: Optional[float] = None
    sal_employer_injury_contribution: Optional[float] = None
    sal_position_or_post_wage: Optional[float] = None
    sal_rank_or_step_wage: Optional[float] = None
    sal_is_leader: Optional[bool] = None
    sal_pay_period: Optional[str] = None
    sal_employee_unique_id: Optional[str] = None
    sal_establishment_type_name: Optional[str] = None
    sal_position_rank: Optional[str] = None
    sal_gender: Optional[str] = None
    sal_ethnicity: Optional[str] = None
    sal_date_of_birth: Optional[datetime] = None
    sal_education_level: Optional[str] = None
    sal_service_interruption_years: Optional[float] = None
    sal_continuous_service_years: Optional[float] = None
    sal_actual_position: Optional[str] = None
    sal_actual_position_start_date: Optional[datetime] = None
    sal_position_level_start_date: Optional[datetime] = None

    # 税务相关字段
    tax_period_identifier: Optional[str] = None
    tax_income_period_start: Optional[datetime] = None
    tax_income_period_end: Optional[datetime] = None
    tax_current_period_income: Optional[float] = None
    tax_current_period_tax_exempt_income: Optional[float] = None
    tax_deduction_basic_pension: Optional[float] = None
    tax_deduction_basic_medical: Optional[float] = None
    tax_deduction_unemployment: Optional[float] = None
    tax_deduction_housing_fund: Optional[float] = None
    tax_deduction_child_edu_cumulative: Optional[float] = None
    tax_deduction_cont_edu_cumulative: Optional[float] = None
    tax_deduction_housing_loan_interest_cumulative: Optional[float] = None
    tax_deduction_housing_rent_cumulative: Optional[float] = None
    tax_deduction_support_elderly_cumulative: Optional[float] = None
    tax_deduction_infant_care_cumulative: Optional[float] = None
    tax_deduction_private_pension_cumulative: Optional[float] = None
    tax_deduction_annuity: Optional[float] = None
    tax_deduction_commercial_health_insurance: Optional[float] = None
    tax_deduction_deferred_pension_insurance: Optional[float] = None
    tax_deduction_other: Optional[float] = None
    tax_deduction_donations: Optional[float] = None
    tax_total_deductions_pre_tax: Optional[float] = None
    tax_reduction_amount: Optional[float] = None
    tax_standard_deduction: Optional[float] = None
    tax_calculated_income_tax: Optional[float] = None
    tax_remarks: Optional[str] = None
    tax_employee_type_key: Optional[str] = None

    # 其他字段
    _import_batch_id: Optional[int] = None
    _consolidation_timestamp: Optional[datetime] = None


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


class SalaryRecordUpdate(BaseModel):
    """用于更新薪资记录的模型，只包含可编辑字段"""
    # 薪资相关字段（可编辑）
    sal_remarks: Optional[str] = None
    sal_subsidy: Optional[float] = None
    sal_allowance: Optional[float] = None
    sal_post_salary: Optional[float] = None
    sal_salary_step: Optional[float] = None
    sal_basic_salary: Optional[float] = None
    sal_tax_adjustment: Optional[float] = None
    sal_salary_grade: Optional[str] = None
    sal_salary_level: Optional[str] = None
    sal_salary_backpay: Optional[float] = None
    sal_post_category: Optional[str] = None
    sal_other_allowance: Optional[float] = None
    sal_other_deductions: Optional[float] = None
    sal_living_allowance: Optional[float] = None
    sal_probation_salary: Optional[float] = None
    sal_one_time_deduction: Optional[float] = None
    sal_performance_salary: Optional[float] = None
    sal_basic_performance_bonus: Optional[float] = None
    sal_petition_post_allowance: Optional[float] = None
    sal_post_position_allowance: Optional[float] = None
    sal_salary_transportation_allowance: Optional[float] = None
    sal_monthly_basic_performance: Optional[float] = None
    sal_only_child_parents_reward: Optional[float] = None
    sal_rank_or_post_grade_salary: Optional[float] = None
    sal_salary_step_backpay_total: Optional[float] = None
    sal_monthly_reward_performance: Optional[float] = None
    sal_total_deduction_adjustment: Optional[float] = None
    sal_social_insurance_adjustment: Optional[float] = None
    sal_quarterly_performance_bonus: Optional[float] = None
    sal_annual_fixed_salary_amount: Optional[float] = None
    sal_position_or_technical_salary: Optional[float] = None
    sal_reform_1993_reserved_subsidy: Optional[float] = None
    sal_reward_performance_deduction: Optional[float] = None
    sal_basic_performance_salary: Optional[float] = None
    sal_incentive_performance_salary: Optional[float] = None
    sal_position_or_post_wage: Optional[float] = None
    sal_rank_or_step_wage: Optional[float] = None

    # 备注字段
    tax_remarks: Optional[str] = None

    class Config:
        from_attributes = True