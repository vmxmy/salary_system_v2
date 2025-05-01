{{ config(materialized='view') }}

-- This view replicates the logic previously in Alembic migration 21edb53a3f59
-- It combines salary records with employee and dimension attributes.

SELECT
    -- Identifiers
    sr.employee_id,
    sr.pay_period_identifier,
    sr.establishment_type_id,

    -- Employee Info (from stg_employees)
    emp.employee_name,
    emp.id_card_number,

    -- Dimension Attributes (from dimension tables)
    dept.department_name,
    u.unit_name,
    et.establishment_type_name,

    -- Job Attributes (Directly from salary_records, no JSONB)
    sr.personnel_identity AS job_attr_personnel_identity,
    sr.personnel_rank AS job_attr_personnel_rank,
    sr.post_category AS job_attr_post_category,
    sr.ref_official_post_salary_level AS job_attr_ref_official_post_salary_level,
    sr.ref_official_salary_step AS job_attr_ref_official_salary_step,
    sr.salary_level AS job_attr_salary_level,
    sr.salary_grade AS job_attr_salary_grade,
    sr.annual_fixed_salary_amount AS job_attr_annual_fixed_salary_amount, -- Already numeric

    -- Salary Components (Directly from salary_records, no JSONB)
    sr.one_time_deduction AS salary_one_time_deduction,
    sr.basic_performance_bonus_deduction AS salary_basic_performance_bonus_deduction,
    sr.position_or_technical_salary AS salary_position_or_technical_salary,
    sr.rank_or_post_grade_salary AS salary_rank_or_post_grade_salary,
    sr.reform_1993_reserved_subsidy AS salary_reform_1993_reserved_subsidy,
    sr.only_child_parents_reward AS salary_only_child_parents_reward,
    sr.post_position_allowance AS salary_post_position_allowance,
    sr.civil_servant_normative_allowance AS salary_civil_servant_normative_allowance,
    sr.transportation_allowance AS salary_transportation_allowance,
    sr.basic_performance_bonus AS salary_basic_performance_bonus,
    sr.probation_salary AS salary_probation_salary,
    sr.petition_worker_post_allowance AS salary_petition_worker_post_allowance,
    sr.reward_performance_deduction AS salary_reward_performance_deduction,
    sr.post_salary AS salary_post_salary,
    sr.salary_step AS salary_salary_step,
    sr.monthly_basic_performance AS salary_monthly_basic_performance,
    sr.monthly_reward_performance AS salary_monthly_reward_performance,
    sr.basic_salary AS salary_basic_salary,
    sr.basic_performance_salary AS salary_basic_performance_salary,
    sr.performance_salary AS salary_performance_salary,
    sr.other_allowance AS salary_other_allowance,
    sr.salary_backpay AS salary_salary_backpay,
    sr.allowance AS salary_allowance,
    sr.quarterly_performance_bonus AS salary_quarterly_performance_bonus,
    sr.subsidy AS salary_subsidy,
    sr.petition_post_allowance AS salary_petition_post_allowance,
    sr.total_deduction_adjustment AS salary_total_deduction_adjustment,
    sr.living_allowance AS salary_living_allowance,
    sr.salary_step_backpay_total AS salary_salary_step_backpay_total,
    sr.total_backpay_amount AS salary_total_backpay_amount,
    sr.incentive_performance_salary AS salary_incentive_performance_salary,

    -- Personal Deductions (Directly from salary_records, no JSONB)
    sr.self_pension_contribution AS deduct_self_pension_contribution,
    sr.self_medical_contribution AS deduct_self_medical_contribution,
    sr.self_annuity_contribution AS deduct_self_annuity_contribution,
    sr.self_housing_fund_contribution AS deduct_self_housing_fund_contribution,
    sr.self_unemployment_contribution AS deduct_self_unemployment_contribution,
    sr.individual_income_tax AS deduct_individual_income_tax,
    sr.other_deductions AS deduct_other_deductions,
    sr.social_insurance_adjustment AS deduct_social_insurance_adjustment,
    sr.housing_fund_adjustment AS deduct_housing_fund_adjustment,
    sr.tax_adjustment AS deduct_tax_adjustment,
    sr.self_injury_contribution AS deduct_self_injury_contribution,

    -- Company Contributions (Directly from salary_records, no JSONB)
    sr.employer_pension_contribution AS contrib_employer_pension_contribution,
    sr.employer_medical_contribution AS contrib_employer_medical_contribution,
    sr.employer_annuity_contribution AS contrib_employer_annuity_contribution,
    sr.employer_housing_fund_contribution AS contrib_employer_housing_fund_contribution,
    sr.employer_unemployment_contribution AS contrib_employer_unemployment_contribution,
    sr.employer_critical_illness_contribution AS contrib_employer_critical_illness_contribution,
    sr.employer_injury_contribution AS contrib_employer_injury_contribution,

    -- Other fields
    sr.remarks,
    sr.created_at,
    sr.updated_at

FROM {{ ref('salary_records') }} sr
LEFT JOIN {{ ref('stg_employees') }} emp ON sr.employee_id = emp.employee_id
LEFT JOIN {{ ref('dim_departments') }} dept ON emp.department_id = dept.department_id
LEFT JOIN {{ ref('dim_units') }} u ON dept.unit_id = u.unit_id
LEFT JOIN {{ ref('dim_establishment_types') }} et ON sr.establishment_type_id = et.establishment_type_id 