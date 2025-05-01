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
        establishment_type_name,
        employee_type_key
    FROM {{ ref('stg_establishment_types') }}
),

-- Renamed 'joined' to 'final' and select all columns directly
final AS (
    SELECT
        emp.employee_id,
        sal.pay_period_identifier,
        et.establishment_type_id,
        
        -- Select all individual columns from stg_salary, ensuring correct types
        -- Job Attributes (Assuming TEXT or compatible types from staging)
        sal.personnel_identity, 
        sal.personnel_rank, 
        sal.post_category, 
        sal.ref_official_post_salary_level, 
        sal.ref_official_salary_step, 
        sal.salary_level, 
        sal.salary_grade, 
        -- Keep numeric types as they are (assuming NUMERIC(15,2) from staging)
        sal.annual_fixed_salary_amount, 
        
        -- Salary Components (Keep numeric types)
        sal.one_time_deduction, 
        sal.basic_performance_bonus_deduction, 
        sal.position_or_technical_salary, 
        sal.rank_or_post_grade_salary, 
        sal.reform_1993_reserved_subsidy, 
        sal.only_child_parents_reward, 
        sal.post_position_allowance, 
        sal.civil_servant_normative_allowance, 
        sal.transportation_allowance, 
        sal.basic_performance_bonus, 
        sal.probation_salary, 
        sal.petition_worker_post_allowance,  
        sal.reward_performance_deduction, 
        sal.post_salary, 
        sal.salary_step, 
        sal.monthly_basic_performance, 
        sal.monthly_reward_performance, 
        sal.basic_salary, 
        sal.performance_salary, 
        sal.other_allowance, 
        sal.salary_backpay, 
        sal.allowance, 
        sal.quarterly_performance_bonus, 
        sal.subsidy, 
        sal.petition_post_allowance,  
        sal.total_deduction_adjustment, 
        sal.living_allowance, 
        sal.salary_step_backpay_total, 
        sal.total_backpay_amount, 
        sal.basic_performance_salary,
        sal.incentive_performance_salary,
        
        -- Deductions (Keep numeric types)
        sal.self_pension_contribution, 
        sal.self_medical_contribution, 
        sal.self_annuity_contribution, 
        sal.self_housing_fund_contribution, 
        sal.self_unemployment_contribution, 
        sal.individual_income_tax, 
        sal.other_deductions, 
        sal.social_insurance_adjustment, 
        sal.housing_fund_adjustment, 
        sal.tax_adjustment, 
        sal.self_injury_contribution,
        
        -- Contributions (Keep numeric types)
        sal.employer_pension_contribution, 
        sal.employer_medical_contribution, 
        sal.employer_annuity_contribution, 
        sal.employer_housing_fund_contribution, 
        sal.employer_unemployment_contribution, 
        sal.employer_critical_illness_contribution, 
        sal.employer_injury_contribution,

        -- Other (Keep original types)
        sal.remarks, 
        sal.bank_account_number,
        sal.bank_branch_name,
        sal.employment_start_date, 
        sal.employment_status,
        sal.organization_name,
        sal.department_name,

        -- Metadata columns (Keep original types)
        sal.salary_staging_id, 
        sal.source_row_number,
        sal.validation_status,
        sal.validation_errors,
        sal.source_filename,
        sal.import_timestamp,
        sal.import_batch_id,

        -- Add creation/update timestamps
        {{ dbt.current_timestamp() }} AS created_at,
        {{ dbt.current_timestamp() }} AS updated_at

    FROM stg_salary sal
    LEFT JOIN stg_emp emp 
      ON sal.id_card_number = emp.id_card_number 
    LEFT JOIN stg_et et
      ON sal.employee_type_key = et.employee_type_key 
)

-- Final SELECT simply takes all columns from the prepared CTE
SELECT * FROM final 