WITH source AS (

    SELECT * FROM {{ source('public', 'raw_salary_data_staging') }}

)

/* -- Temporarily select only a few key columns without transformations for debugging
SELECT 
    id_card_number,
    employee_name,
    employee_unique_id,
    pay_period_identifier,
    deduct_self_medical_contribution, -- Keep one numeric column to check its raw value
    _airbyte_raw_id -- Keep airbyte id
FROM source
*/

-- Original complex transformations commented out for debugging -- NOW RE-ENABLING TEXT/ID CASTS
,renamed_recasted AS (

    SELECT
        -- Identifiers: Cast to BIGINT first to remove decimals, then to TEXT
        CAST(CAST(id_card_number AS BIGINT) AS TEXT) AS id_card_number,
        CAST(employee_name AS TEXT) AS employee_name,
        -- Assuming employee_unique_id is also numeric in source and needs cleaning
        CAST(CAST(employee_unique_id AS BIGINT) AS TEXT) AS employee_unique_id, 
        CAST(establishment_type_name AS TEXT) AS establishment_type_name,
        CAST(pay_period_identifier AS TEXT) AS pay_period_identifier,

        -- Job Attributes (keep as TEXT or cast if needed) - RE-ENABLING TEXT CASTS
        CAST(job_attr_personnel_identity AS TEXT) AS job_attr_personnel_identity,
        CAST(job_attr_personnel_rank AS TEXT) AS job_attr_personnel_rank,
        CAST(job_attr_post_category AS TEXT) AS job_attr_post_category,
        CAST(job_attr_ref_official_post_salary_level AS TEXT) AS job_attr_ref_official_post_salary_level,
        CAST(job_attr_ref_official_salary_step AS TEXT) AS job_attr_ref_official_salary_step,
        CAST(job_attr_salary_level AS TEXT) AS job_attr_salary_level,
        CAST(job_attr_salary_grade AS TEXT) AS job_attr_salary_grade,
        -- CAST(ROUND(job_attr_annual_fixed_salary_amount, 2) AS NUMERIC(12, 2)) AS job_attr_annual_fixed_salary_amount, -- KEEP NUMERIC COMMENTED -- NOW UNCOMMENTING
        CAST(ROUND(job_attr_annual_fixed_salary_amount, 2) AS NUMERIC(12, 2)) AS job_attr_annual_fixed_salary_amount,

        -- Salary Components - ROUND and CAST -- KEEP NUMERIC COMMENTED -- NOW UNCOMMENTING
        CAST(ROUND(salary_one_time_deduction, 2) AS NUMERIC(12, 2)) AS salary_one_time_deduction,
        CAST(ROUND(salary_basic_performance_bonus_deduction, 2) AS NUMERIC(12, 2)) AS salary_basic_performance_bonus_deduction,
        CAST(ROUND(salary_position_or_technical_salary, 2) AS NUMERIC(12, 2)) AS salary_position_or_technical_salary,
        CAST(ROUND(salary_rank_or_post_grade_salary, 2) AS NUMERIC(12, 2)) AS salary_rank_or_post_grade_salary,
        CAST(ROUND(salary_reform_1993_reserved_subsidy, 2) AS NUMERIC(12, 2)) AS salary_reform_1993_reserved_subsidy,
        CAST(ROUND(salary_only_child_parents_reward, 2) AS NUMERIC(12, 2)) AS salary_only_child_parents_reward,
        CAST(ROUND(salary_post_position_allowance, 2) AS NUMERIC(12, 2)) AS salary_post_position_allowance,
        CAST(ROUND(salary_civil_servant_normative_allowance, 2) AS NUMERIC(12, 2)) AS salary_civil_servant_normative_allowance,
        CAST(ROUND(salary_transportation_allowance, 2) AS NUMERIC(12, 2)) AS salary_transportation_allowance,
        CAST(ROUND(salary_basic_performance_bonus, 2) AS NUMERIC(12, 2)) AS salary_basic_performance_bonus,
        CAST(ROUND(salary_probation_salary, 2) AS NUMERIC(12, 2)) AS salary_probation_salary,
        CAST(ROUND(salary_petition_worker_post_allowance, 2) AS NUMERIC(12, 2)) AS salary_petition_worker_post_allowance, 
        CAST(ROUND(salary_reward_performance_deduction, 2) AS NUMERIC(12, 2)) AS salary_reward_performance_deduction,
        CAST(ROUND(salary_post_salary, 2) AS NUMERIC(12, 2)) AS salary_post_salary,
        CAST(ROUND(salary_salary_step, 2) AS NUMERIC(12, 2)) AS salary_salary_step,
        CAST(ROUND(salary_monthly_basic_performance, 2) AS NUMERIC(12, 2)) AS salary_monthly_basic_performance,
        CAST(ROUND(salary_monthly_reward_performance, 2) AS NUMERIC(12, 2)) AS salary_monthly_reward_performance,
        CAST(ROUND(salary_basic_salary, 2) AS NUMERIC(12, 2)) AS salary_basic_salary,
        CAST(ROUND(salary_performance_salary, 2) AS NUMERIC(12, 2)) AS salary_performance_salary,
        CAST(ROUND(salary_other_allowance, 2) AS NUMERIC(12, 2)) AS salary_other_allowance,
        CAST(ROUND(salary_salary_backpay, 2) AS NUMERIC(12, 2)) AS salary_salary_backpay,
        CAST(ROUND(salary_allowance, 2) AS NUMERIC(12, 2)) AS salary_allowance,
        CAST(ROUND(salary_quarterly_performance_bonus, 2) AS NUMERIC(12, 2)) AS salary_quarterly_performance_bonus,
        CAST(ROUND(salary_subsidy, 2) AS NUMERIC(12, 2)) AS salary_subsidy,
        CAST(ROUND(salary_petition_post_allowance, 2) AS NUMERIC(12, 2)) AS salary_petition_post_allowance, 
        CAST(ROUND(salary_total_deduction_adjustment, 2) AS NUMERIC(12, 2)) AS salary_total_deduction_adjustment,
        CAST(ROUND(salary_living_allowance, 2) AS NUMERIC(12, 2)) AS salary_living_allowance,
        CAST(ROUND(salary_salary_step_backpay_total, 2) AS NUMERIC(12, 2)) AS salary_salary_step_backpay_total,
        CAST(ROUND(salary_total_backpay_amount, 2) AS NUMERIC(12, 2)) AS salary_total_backpay_amount,

        -- Deductions - ROUND and CAST -- KEEP NUMERIC COMMENTED -- NOW UNCOMMENTING
        CAST(ROUND(deduct_self_pension_contribution, 2) AS NUMERIC(12, 2)) AS deduct_self_pension_contribution,
        CAST(ROUND(deduct_self_medical_contribution, 2) AS NUMERIC(12, 2)) AS deduct_self_medical_contribution,
        CAST(ROUND(deduct_self_annuity_contribution, 2) AS NUMERIC(12, 2)) AS deduct_self_annuity_contribution,
        CAST(ROUND(deduct_self_housing_fund_contribution, 2) AS NUMERIC(12, 2)) AS deduct_self_housing_fund_contribution,
        CAST(ROUND(deduct_self_unemployment_contribution, 2) AS NUMERIC(12, 2)) AS deduct_self_unemployment_contribution,
        CAST(ROUND(deduct_individual_income_tax, 2) AS NUMERIC(12, 2)) AS deduct_individual_income_tax,
        CAST(ROUND(deduct_other_deductions, 2) AS NUMERIC(12, 2)) AS deduct_other_deductions,
        CAST(ROUND(deduct_social_insurance_adjustment, 2) AS NUMERIC(12, 2)) AS deduct_social_insurance_adjustment,
        CAST(ROUND(deduct_housing_fund_adjustment, 2) AS NUMERIC(12, 2)) AS deduct_housing_fund_adjustment,
        CAST(ROUND(deduct_tax_adjustment, 2) AS NUMERIC(12, 2)) AS deduct_tax_adjustment,

        -- Contributions - ROUND and CAST -- KEEP NUMERIC COMMENTED -- NOW UNCOMMENTING
        CAST(ROUND(contrib_employer_pension_contribution, 2) AS NUMERIC(12, 2)) AS contrib_employer_pension_contribution,
        CAST(ROUND(contrib_employer_medical_contribution, 2) AS NUMERIC(12, 2)) AS contrib_employer_medical_contribution,
        CAST(ROUND(contrib_employer_annuity_contribution, 2) AS NUMERIC(12, 2)) AS contrib_employer_annuity_contribution,
        CAST(ROUND(contrib_employer_housing_fund_contribution, 2) AS NUMERIC(12, 2)) AS contrib_employer_housing_fund_contribution,
        CAST(ROUND(contrib_employer_unemployment_contribution, 2) AS NUMERIC(12, 2)) AS contrib_employer_unemployment_contribution,
        CAST(ROUND(contrib_employer_critical_illness_contribution, 2) AS NUMERIC(12, 2)) AS contrib_employer_critical_illness_contribution,

        -- Other - RE-ENABLING TEXT CASTS
        CAST(other_remarks AS TEXT) AS other_remarks,

        -- Airbyte metadata columns (select the ones confirmed to exist) - RE-ENABLING
        -- Verify these names from the actual table structure!
        _airbyte_raw_id, -- Changed from _airbyte_ab_id based on error HINT
        _airbyte_extracted_at,
        _airbyte_meta
        -- _airbyte_source_file, -- Commented out, verify existence if needed
        -- _airbyte_source_sheet -- Commented out, verify existence if needed

    FROM source

)

SELECT * FROM renamed_recasted 