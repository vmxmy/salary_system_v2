WITH source AS (

    SELECT * FROM {{ source('public', 'raw_salary_data_staging') }}

)

SELECT 
    -- Identifiers (already correct types in source)
    id_card_number,
    employee_name,
    -- employee_unique_id was dropped, select if added back
    employee_type_key, -- Renamed from establishment_type_name
    pay_period_identifier,

    -- Job Attributes (already correct types in source)
    personnel_identity, -- Renamed from job_attr_personnel_identity
    personnel_rank, -- Renamed from job_attr_personnel_rank
    post_category, -- Renamed from job_attr_post_category
    ref_official_post_salary_level, -- Renamed from job_attr_ref_official_post_salary_level
    ref_official_salary_step, -- Renamed from job_attr_ref_official_salary_step
    salary_level, -- Renamed from job_attr_salary_level
    salary_grade, -- Renamed from job_attr_salary_grade
    annual_fixed_salary_amount, -- Renamed from job_attr_annual_fixed_salary_amount

    -- Salary Components (already NUMERIC(15,2) in source)
    one_time_deduction, -- Renamed from salary_one_time_deduction
    basic_performance_bonus_deduction, -- Renamed from salary_basic_performance_bonus_deduction
    position_or_technical_salary, -- Renamed from salary_position_or_technical_salary
    rank_or_post_grade_salary, -- Renamed from salary_rank_or_post_grade_salary
    reform_1993_reserved_subsidy, -- Renamed from salary_reform_1993_reserved_subsidy
    only_child_parents_reward, -- Renamed from salary_only_child_parents_reward
    post_position_allowance, -- Renamed from salary_post_position_allowance
    civil_servant_normative_allowance, -- Renamed from salary_civil_servant_normative_allowance
    transportation_allowance, -- Renamed from salary_transportation_allowance
    basic_performance_bonus, -- Renamed from salary_basic_performance_bonus
    probation_salary, -- Renamed from salary_probation_salary
    petition_worker_post_allowance, -- Renamed from salary_petition_worker_post_allowance 
    reward_performance_deduction, -- Renamed from salary_reward_performance_deduction
    post_salary, -- Renamed from salary_post_salary
    salary_step, -- Renamed from salary_salary_step
    monthly_basic_performance, -- Renamed from salary_monthly_basic_performance
    monthly_reward_performance, -- Renamed from salary_monthly_reward_performance
    basic_salary, -- Renamed from salary_basic_salary
    performance_salary, -- Renamed from salary_performance_salary
    other_allowance, -- Renamed from salary_other_allowance
    salary_backpay, -- Renamed from salary_salary_backpay
    allowance, -- Renamed from salary_allowance
    quarterly_performance_bonus, -- Renamed from salary_quarterly_performance_bonus
    subsidy, -- Renamed from salary_subsidy
    petition_post_allowance, -- Renamed from salary_petition_post_allowance 
    total_deduction_adjustment, -- Renamed from salary_total_deduction_adjustment
    living_allowance, -- Renamed from salary_living_allowance
    salary_step_backpay_total, -- Renamed from salary_salary_step_backpay_total
    total_backpay_amount, -- Renamed from salary_total_backpay_amount
    basic_performance_salary, -- Newly added
    incentive_performance_salary, -- Newly added

    -- Deductions (already NUMERIC(15,2) in source)
    self_pension_contribution, -- Renamed from deduct_self_pension_contribution
    self_medical_contribution, -- Renamed from deduct_self_medical_contribution
    self_annuity_contribution, -- Renamed from deduct_self_annuity_contribution
    self_housing_fund_contribution, -- Renamed from deduct_self_housing_fund_contribution
    self_unemployment_contribution, -- Renamed from deduct_self_unemployment_contribution
    individual_income_tax, -- Renamed from deduct_individual_income_tax
    other_deductions, -- Renamed from deduct_other_deductions
    social_insurance_adjustment, -- Renamed from deduct_social_insurance_adjustment
    housing_fund_adjustment, -- Renamed from deduct_housing_fund_adjustment
    tax_adjustment, -- Renamed from deduct_tax_adjustment
    self_injury_contribution, -- Newly added

    -- Contributions (already NUMERIC(15,2) in source)
    employer_pension_contribution, -- Renamed from contrib_employer_pension_contribution
    employer_medical_contribution, -- Renamed from contrib_employer_medical_contribution
    employer_annuity_contribution, -- Renamed from contrib_employer_annuity_contribution
    employer_housing_fund_contribution, -- Renamed from contrib_employer_housing_fund_contribution
    employer_unemployment_contribution, -- Renamed from contrib_employer_unemployment_contribution
    employer_critical_illness_contribution, -- Renamed from contrib_employer_critical_illness_contribution
    employer_injury_contribution, -- Newly added

    -- Other fields
    remarks, -- Renamed from other_remarks
    bank_account_number, -- Newly added
    bank_branch_name, -- Newly added
    employment_start_date, -- Newly added
    employment_status, -- Newly added
    organization_name, -- Newly added
    department_name, -- Newly added

    -- Metadata columns (Selecting new columns, aliasing internal ones)
    _staging_id AS salary_staging_id, -- Added and aliased
    _row_number AS source_row_number, -- Added and aliased
    _validation_status AS validation_status, -- Added and aliased
    _validation_errors AS validation_errors, -- Added and aliased
    _source_filename AS source_filename, -- Added and aliased
    _import_timestamp AS import_timestamp, -- Added and aliased
    _import_batch_id AS import_batch_id -- Added and aliased
    
    -- Removed SELECT for _airbyte_* columns as they no longer exist

    FROM source