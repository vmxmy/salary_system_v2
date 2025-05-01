{{ config(materialized='view') }}

-- This view replicates the logic previously in Alembic migration 21edb53a3f59
-- It combines salary records with employee and dimension attributes.

SELECT
    -- Identifiers
    sr.employee_id,
    sr.pay_period_identifier,
    sr.establishment_type_id, -- Note: This ID comes directly from salary_records and might be NULL if the lookup fails upstream

    -- Employee Info (from stg_employees)
    emp.employee_name,
    emp.id_card_number,

    -- Dimension Attributes (from dimension tables)
    dept.department_name,
    u.unit_name,
    et.establishment_type_name,

    -- Extracted Job Attributes (from salary_records)
    sr.job_attributes->>'personnel_identity' AS job_attr_personnel_identity,
    sr.job_attributes->>'personnel_rank' AS job_attr_personnel_rank,
    sr.job_attributes->>'post_category' AS job_attr_post_category,
    sr.job_attributes->>'ref_official_post_salary_level' AS job_attr_ref_official_post_salary_level,
    sr.job_attributes->>'ref_official_salary_step' AS job_attr_ref_official_salary_step,
    sr.job_attributes->>'salary_level' AS job_attr_salary_level,
    sr.job_attributes->>'salary_grade' AS job_attr_salary_grade,
    (sr.job_attributes->>'annual_fixed_salary_amount')::NUMERIC(18, 2) AS job_attr_annual_fixed_salary_amount,

    -- Extracted Salary Components (from salary_records)
    (sr.salary_components->>'one_time_deduction')::NUMERIC(18, 2) AS salary_one_time_deduction,
    (sr.salary_components->>'basic_performance_bonus_deduction')::NUMERIC(18, 2) AS salary_basic_performance_bonus_deduction,
    (sr.salary_components->>'basic_performance_deduction')::NUMERIC(18, 2) AS salary_basic_performance_deduction,
    (sr.salary_components->>'incentive_performance_salary')::NUMERIC(18, 2) AS salary_incentive_performance_salary,
    (sr.salary_components->>'position_or_technical_salary')::NUMERIC(18, 2) AS salary_position_or_technical_salary,
    (sr.salary_components->>'rank_or_post_grade_salary')::NUMERIC(18, 2) AS salary_rank_or_post_grade_salary,
    (sr.salary_components->>'reform_1993_reserved_subsidy')::NUMERIC(18, 2) AS salary_reform_1993_reserved_subsidy,
    (sr.salary_components->>'only_child_parents_reward')::NUMERIC(18, 2) AS salary_only_child_parents_reward,
    (sr.salary_components->>'post_position_allowance')::NUMERIC(18, 2) AS salary_post_position_allowance,
    (sr.salary_components->>'civil_servant_normative_allowance')::NUMERIC(18, 2) AS salary_civil_servant_normative_allowance,
    (sr.salary_components->>'transportation_allowance')::NUMERIC(18, 2) AS salary_transportation_allowance,
    (sr.salary_components->>'basic_performance_bonus')::NUMERIC(18, 2) AS salary_basic_performance_bonus,
    (sr.salary_components->>'probation_salary')::NUMERIC(18, 2) AS salary_probation_salary,
    (sr.salary_components->>'petition_worker_post_allowance')::NUMERIC(18, 2) AS salary_petition_worker_post_allowance,
    (sr.salary_components->>'reward_performance_deduction')::NUMERIC(18, 2) AS salary_reward_performance_deduction,
    (sr.salary_components->>'post_salary')::NUMERIC(18, 2) AS salary_post_salary,
    (sr.salary_components->>'salary_step')::NUMERIC(18, 2) AS salary_salary_step,
    (sr.salary_components->>'monthly_basic_performance')::NUMERIC(18, 2) AS salary_monthly_basic_performance,
    (sr.salary_components->>'monthly_reward_performance')::NUMERIC(18, 2) AS salary_monthly_reward_performance,
    (sr.salary_components->>'basic_salary')::NUMERIC(18, 2) AS salary_basic_salary,
    (sr.salary_components->>'basic_performance_salary')::NUMERIC(18, 2) AS salary_basic_performance_salary,
    (sr.salary_components->>'performance_salary')::NUMERIC(18, 2) AS salary_performance_salary,
    (sr.salary_components->>'other_allowance')::NUMERIC(18, 2) AS salary_other_allowance,
    (sr.salary_components->>'salary_backpay')::NUMERIC(18, 2) AS salary_salary_backpay,
    (sr.salary_components->>'allowance')::NUMERIC(18, 2) AS salary_allowance,
    (sr.salary_components->>'quarterly_performance_bonus')::NUMERIC(18, 2) AS salary_quarterly_performance_bonus,
    (sr.salary_components->>'subsidy')::NUMERIC(18, 2) AS salary_subsidy,
    (sr.salary_components->>'petition_post_allowance')::NUMERIC(18, 2) AS salary_petition_post_allowance,
    (sr.salary_components->>'total_deduction_adjustment')::NUMERIC(18, 2) AS salary_total_deduction_adjustment,
    (sr.salary_components->>'living_allowance')::NUMERIC(18, 2) AS salary_living_allowance,
    (sr.salary_components->>'salary_step_backpay_total')::NUMERIC(18, 2) AS salary_salary_step_backpay_total,
    (sr.salary_components->>'total_backpay_amount')::NUMERIC(18, 2) AS salary_total_backpay_amount,

    -- Extracted Personal Deductions (from salary_records)
    (sr.personal_deductions->>'self_pension_contribution')::NUMERIC(18, 2) AS deduct_self_pension_contribution,
    (sr.personal_deductions->>'self_medical_contribution')::NUMERIC(18, 2) AS deduct_self_medical_contribution,
    (sr.personal_deductions->>'self_annuity_contribution')::NUMERIC(18, 2) AS deduct_self_annuity_contribution,
    (sr.personal_deductions->>'self_housing_fund_contribution')::NUMERIC(18, 2) AS deduct_self_housing_fund_contribution,
    (sr.personal_deductions->>'self_unemployment_contribution')::NUMERIC(18, 2) AS deduct_self_unemployment_contribution,
    (sr.personal_deductions->>'individual_income_tax')::NUMERIC(18, 2) AS deduct_individual_income_tax,
    (sr.personal_deductions->>'other_deductions')::NUMERIC(18, 2) AS deduct_other_deductions,
    (sr.personal_deductions->>'social_insurance_adjustment')::NUMERIC(18, 2) AS deduct_social_insurance_adjustment,
    (sr.personal_deductions->>'housing_fund_adjustment')::NUMERIC(18, 2) AS deduct_housing_fund_adjustment,
    (sr.personal_deductions->>'tax_adjustment')::NUMERIC(18, 2) AS deduct_tax_adjustment,

    -- Extracted Company Contributions (from salary_records)
    (sr.company_contributions->>'employer_pension_contribution')::NUMERIC(18, 2) AS contrib_employer_pension_contribution,
    (sr.company_contributions->>'employer_medical_contribution')::NUMERIC(18, 2) AS contrib_employer_medical_contribution,
    (sr.company_contributions->>'employer_annuity_contribution')::NUMERIC(18, 2) AS contrib_employer_annuity_contribution,
    (sr.company_contributions->>'employer_housing_fund_contribution')::NUMERIC(18, 2) AS contrib_employer_housing_fund_contribution,
    (sr.company_contributions->>'employer_unemployment_contribution')::NUMERIC(18, 2) AS contrib_employer_unemployment_contribution,
    (sr.company_contributions->>'employer_critical_illness_contribution')::NUMERIC(18, 2) AS contrib_employer_critical_illness_contribution,

    -- Other fields
    sr.other_remarks,
    sr.created_at,
    sr.updated_at

FROM {{ ref('salary_records') }} sr
LEFT JOIN {{ ref('stg_employees') }} emp ON sr.employee_id = emp.employee_id
LEFT JOIN {{ ref('dim_departments') }} dept ON emp.department_id = dept.department_id
LEFT JOIN {{ ref('dim_units') }} u ON dept.unit_id = u.unit_id
LEFT JOIN {{ ref('dim_establishment_types') }} et ON sr.establishment_type_id = et.establishment_type_id 