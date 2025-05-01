{{ config(materialized='table') }}

WITH stg_salary AS (
    SELECT *
    FROM {{ ref('stg_raw_salary_data') }}
),

stg_emp AS (
    -- Assuming stg_employees provides employee_id and id_card_number
    -- Adjust ref() and column names if needed
    SELECT 
        employee_id,
        id_card_number -- Make sure this matches the column used for joining in stg_employees
    FROM {{ ref('stg_employees') }} 
),

stg_et AS (
    SELECT 
        establishment_type_id,
        establishment_type_name
    FROM {{ ref('stg_establishment_types') }}
),

joined AS (
    SELECT
        emp.employee_id,
        sal.pay_period_identifier,
        et.establishment_type_id,
        
        -- Select all individual columns from stg_salary needed for JSONB objects
        -- Job Attributes
        sal.job_attr_personnel_identity,
        sal.job_attr_personnel_rank,
        sal.job_attr_post_category,
        sal.job_attr_ref_official_post_salary_level,
        sal.job_attr_ref_official_salary_step,
        sal.job_attr_salary_level,
        sal.job_attr_salary_grade,
        sal.job_attr_annual_fixed_salary_amount,
        
        -- Salary Components
        sal.salary_one_time_deduction,
        sal.salary_basic_performance_bonus_deduction,
        sal.salary_position_or_technical_salary,
        sal.salary_rank_or_post_grade_salary,
        sal.salary_reform_1993_reserved_subsidy,
        sal.salary_only_child_parents_reward,
        sal.salary_post_position_allowance,
        sal.salary_civil_servant_normative_allowance,
        sal.salary_transportation_allowance,
        sal.salary_basic_performance_bonus,
        sal.salary_probation_salary,
        sal.salary_petition_worker_post_allowance, 
        sal.salary_reward_performance_deduction,
        sal.salary_post_salary,
        sal.salary_salary_step,
        sal.salary_monthly_basic_performance,
        sal.salary_monthly_reward_performance,
        sal.salary_basic_salary,
        sal.salary_performance_salary,
        sal.salary_other_allowance,
        sal.salary_salary_backpay,
        sal.salary_allowance,
        -- sal.salary_q1_q3_performance_bonus, -- Ensure old field is removed/commented
        sal.salary_quarterly_performance_bonus, -- Ensure new field is added
        sal.salary_subsidy,
        sal.salary_petition_post_allowance, 
        sal.salary_total_deduction_adjustment,
        sal.salary_living_allowance,
        sal.salary_salary_step_backpay_total,
        sal.salary_total_backpay_amount, -- Add new field to select
        
        -- Deductions
        sal.deduct_self_pension_contribution,
        sal.deduct_self_medical_contribution,
        sal.deduct_self_annuity_contribution,
        sal.deduct_self_housing_fund_contribution,
        sal.deduct_self_unemployment_contribution,
        sal.deduct_individual_income_tax,
        sal.deduct_other_deductions,
        sal.deduct_social_insurance_adjustment,
        sal.deduct_housing_fund_adjustment,
        sal.deduct_tax_adjustment,
        
        -- Contributions
        sal.contrib_employer_pension_contribution,
        sal.contrib_employer_medical_contribution,
        sal.contrib_employer_annuity_contribution,
        sal.contrib_employer_housing_fund_contribution,
        sal.contrib_employer_unemployment_contribution,
        sal.contrib_employer_critical_illness_contribution,

        -- Other
        sal.other_remarks,

        -- Airbyte metadata (optional, can be used for incremental logic later)
        sal._airbyte_extracted_at

    FROM stg_salary sal
    LEFT JOIN stg_emp emp 
      -- Ensure the join key (id_card_number) is cleaned and reliable in both staging models
      ON sal.id_card_number = emp.id_card_number 
    LEFT JOIN stg_et et
      -- Join on name, ensure names are consistent and clean in both staging models
      ON sal.establishment_type_name = et.establishment_type_name 
),

final AS (
    SELECT
        employee_id,
        pay_period_identifier,
        establishment_type_id,

        -- Construct JSONB objects
        jsonb_build_object(
            'personnel_identity', job_attr_personnel_identity,
            'personnel_rank', job_attr_personnel_rank,
            'post_category', job_attr_post_category,
            'ref_official_post_salary_level', job_attr_ref_official_post_salary_level,
            'ref_official_salary_step', job_attr_ref_official_salary_step,
            'salary_level', job_attr_salary_level,
            'salary_grade', job_attr_salary_grade,
            'annual_fixed_salary_amount', job_attr_annual_fixed_salary_amount
        ) AS job_attributes,

        jsonb_build_object(
            'one_time_deduction', salary_one_time_deduction,
            'basic_performance_bonus_deduction', salary_basic_performance_bonus_deduction,
            'position_or_technical_salary', salary_position_or_technical_salary,
            'rank_or_post_grade_salary', salary_rank_or_post_grade_salary,
            'reform_1993_reserved_subsidy', salary_reform_1993_reserved_subsidy,
            'only_child_parents_reward', salary_only_child_parents_reward,
            'post_position_allowance', salary_post_position_allowance,
            'civil_servant_normative_allowance', salary_civil_servant_normative_allowance,
            'transportation_allowance', salary_transportation_allowance,
            'basic_performance_bonus', salary_basic_performance_bonus,
            'probation_salary', salary_probation_salary,
            'petition_worker_post_allowance', salary_petition_worker_post_allowance, 
            'reward_performance_deduction', salary_reward_performance_deduction,
            'post_salary', salary_post_salary,
            'salary_step', salary_salary_step,
            'monthly_basic_performance', salary_monthly_basic_performance,
            'monthly_reward_performance', salary_monthly_reward_performance,
            'basic_salary', salary_basic_salary,
            'performance_salary', salary_performance_salary,
            'other_allowance', salary_other_allowance,
            'salary_backpay', salary_salary_backpay,
            'allowance', salary_allowance,
            -- 'q1_q3_performance_bonus', salary_q1_q3_performance_bonus, -- Ensure old key is removed/commented
            'quarterly_performance_bonus', salary_quarterly_performance_bonus, -- Ensure new key and value are added
            'subsidy', salary_subsidy,
            'petition_post_allowance', salary_petition_post_allowance, 
            'total_deduction_adjustment', salary_total_deduction_adjustment,
            'living_allowance', salary_living_allowance,
            'salary_step_backpay_total', salary_salary_step_backpay_total,
            'total_backpay_amount', salary_total_backpay_amount -- Add new key-value pair
        ) AS salary_components,

        jsonb_build_object(
            'self_pension_contribution', deduct_self_pension_contribution,
            'self_medical_contribution', deduct_self_medical_contribution,
            'self_annuity_contribution', deduct_self_annuity_contribution,
            'self_housing_fund_contribution', deduct_self_housing_fund_contribution,
            'self_unemployment_contribution', deduct_self_unemployment_contribution,
            'individual_income_tax', deduct_individual_income_tax,
            'other_deductions', deduct_other_deductions,
            'social_insurance_adjustment', deduct_social_insurance_adjustment,
            'housing_fund_adjustment', deduct_housing_fund_adjustment,
            'tax_adjustment', deduct_tax_adjustment
        ) AS personal_deductions,

        jsonb_build_object(
            'employer_pension_contribution', contrib_employer_pension_contribution,
            'employer_medical_contribution', contrib_employer_medical_contribution,
            'employer_annuity_contribution', contrib_employer_annuity_contribution,
            'employer_housing_fund_contribution', contrib_employer_housing_fund_contribution,
            'employer_unemployment_contribution', contrib_employer_unemployment_contribution,
            'employer_critical_illness_contribution', contrib_employer_critical_illness_contribution
        ) AS company_contributions,

        other_remarks, -- Include other_remarks if it's a column in the final table

        -- Add audit timestamps
        -- Requires dbt_utils package: add 'dbt-utils' to packages.yml and run 'dbt deps' -- DEPRECATED for dbt >= v1.0
        -- Use dbt.current_timestamp() instead
        {{ dbt.current_timestamp() }} AS created_at,
        {{ dbt.current_timestamp() }} AS updated_at
        -- _airbyte_extracted_at -- Include if needed for incremental loads or tracking

    FROM joined

    -- Handle cases where employee might not be found in stg_employees
    -- WHERE employee_id IS NOT NULL -- Uncomment if you only want records with a matched employee
)

SELECT * FROM final 