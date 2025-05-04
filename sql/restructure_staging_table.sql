-- WARNING: This script will TRUNCATE (delete all data from) the table
--          and significantly alter its structure.
--          Ensure you have backups if needed, although data is stated as clearable.
--          Execute this within a transaction to ensure atomicity.

BEGIN;

-- 1. Clear existing data
TRUNCATE TABLE public.raw_salary_data_staging;

-- 2. Drop existing primary key constraint if it exists (assuming it was on _airbyte_raw_id)
--    You might need to find the exact constraint name first.
ALTER TABLE public.raw_salary_data_staging DROP CONSTRAINT IF EXISTS raw_salary_data_staging_pkey;

-- Drop associated index if it exists
DROP INDEX IF EXISTS public.raw_salary_data_staging_airbyte_tmp__airbyte_raw_id_idx;
DROP INDEX IF EXISTS public.raw_salary_data_staging_airbyte_tmp__airbyte_extracted_at_idx;

-- 3. Drop unnecessary columns
ALTER TABLE public.raw_salary_data_staging
    DROP COLUMN IF EXISTS _airbyte_raw_id CASCADE,
    DROP COLUMN IF EXISTS _airbyte_extracted_at CASCADE,
    DROP COLUMN IF EXISTS _airbyte_generation_id CASCADE,
    DROP COLUMN IF EXISTS _airbyte_meta CASCADE,
    DROP COLUMN IF EXISTS _airbyte_source_file CASCADE,
    DROP COLUMN IF EXISTS _airbyte_source_sheet CASCADE,
    DROP COLUMN IF EXISTS employee_unique_id;

-- 4. Add new columns
ALTER TABLE public.raw_salary_data_staging
    ADD COLUMN _staging_id SERIAL,
    ADD COLUMN bank_account_number TEXT NULL,
    ADD COLUMN bank_branch_name TEXT NULL,
    ADD COLUMN employment_start_date DATE NULL,
    ADD COLUMN employment_status TEXT NULL,
    ADD COLUMN organization_name TEXT NULL,
    ADD COLUMN department_name TEXT NULL,
    ADD COLUMN _row_number INT NULL,
    ADD COLUMN _validation_status VARCHAR(20) DEFAULT 'pending',
    ADD COLUMN _validation_errors JSONB NULL,
    ADD COLUMN _source_filename TEXT NULL,
    ADD COLUMN _import_timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN _import_batch_id UUID NULL,
    ADD COLUMN basic_performance_salary NUMERIC(15, 2) NULL,
    ADD COLUMN incentive_performance_salary NUMERIC(15, 2) NULL,
    ADD COLUMN self_injury_contribution NUMERIC(15, 2) NULL,
    ADD COLUMN employer_injury_contribution NUMERIC(15, 2) NULL;

-- 5. Modify data types of existing columns
ALTER TABLE public.raw_salary_data_staging
    ALTER COLUMN id_card_number TYPE VARCHAR(18),
    ALTER COLUMN other_remarks TYPE TEXT,
    ALTER COLUMN salary_subsidy TYPE NUMERIC(15, 2),
    ALTER COLUMN salary_allowance TYPE NUMERIC(15, 2),
    ALTER COLUMN salary_post_salary TYPE NUMERIC(15, 2),
    ALTER COLUMN salary_salary_step TYPE NUMERIC(15, 2),
    ALTER COLUMN salary_basic_salary TYPE NUMERIC(15, 2),
    ALTER COLUMN deduct_tax_adjustment TYPE NUMERIC(15, 2),
    ALTER COLUMN salary_salary_backpay TYPE NUMERIC(15, 2),
    ALTER COLUMN salary_other_allowance TYPE NUMERIC(15, 2),
    ALTER COLUMN deduct_other_deductions TYPE NUMERIC(15, 2),
    ALTER COLUMN salary_living_allowance TYPE NUMERIC(15, 2),
    ALTER COLUMN salary_probation_salary TYPE NUMERIC(15, 2),
    ALTER COLUMN salary_one_time_deduction TYPE NUMERIC(15, 2),
    ALTER COLUMN salary_performance_salary TYPE NUMERIC(15, 2),
    ALTER COLUMN salary_total_backpay_amount TYPE NUMERIC(15, 2),
    ALTER COLUMN deduct_individual_income_tax TYPE NUMERIC(15, 2),
    ALTER COLUMN deduct_housing_fund_adjustment TYPE NUMERIC(15, 2),
    ALTER COLUMN salary_basic_performance_bonus TYPE NUMERIC(15, 2),
    ALTER COLUMN salary_petition_post_allowance TYPE NUMERIC(15, 2),
    ALTER COLUMN salary_post_position_allowance TYPE NUMERIC(15, 2),
    ALTER COLUMN salary_transportation_allowance TYPE NUMERIC(15, 2),
    ALTER COLUMN deduct_self_annuity_contribution TYPE NUMERIC(15, 2),
    ALTER COLUMN deduct_self_medical_contribution TYPE NUMERIC(15, 2),
    ALTER COLUMN deduct_self_pension_contribution TYPE NUMERIC(15, 2),
    ALTER COLUMN salary_monthly_basic_performance TYPE NUMERIC(15, 2),
    ALTER COLUMN salary_only_child_parents_reward TYPE NUMERIC(15, 2),
    ALTER COLUMN salary_rank_or_post_grade_salary TYPE NUMERIC(15, 2),
    ALTER COLUMN salary_salary_step_backpay_total TYPE NUMERIC(15, 2),
    ALTER COLUMN salary_monthly_reward_performance TYPE NUMERIC(15, 2),
    ALTER COLUMN salary_total_deduction_adjustment TYPE NUMERIC(15, 2),
    ALTER COLUMN deduct_social_insurance_adjustment TYPE NUMERIC(15, 2),
    ALTER COLUMN salary_quarterly_performance_bonus TYPE NUMERIC(15, 2),
    ALTER COLUMN job_attr_annual_fixed_salary_amount TYPE NUMERIC(15, 2),
    ALTER COLUMN salary_position_or_technical_salary TYPE NUMERIC(15, 2),
    ALTER COLUMN salary_reform_1993_reserved_subsidy TYPE NUMERIC(15, 2),
    ALTER COLUMN salary_reward_performance_deduction TYPE NUMERIC(15, 2),
    ALTER COLUMN contrib_employer_annuity_contribution TYPE NUMERIC(15, 2),
    ALTER COLUMN contrib_employer_medical_contribution TYPE NUMERIC(15, 2),
    ALTER COLUMN contrib_employer_pension_contribution TYPE NUMERIC(15, 2),
    ALTER COLUMN deduct_self_housing_fund_contribution TYPE NUMERIC(15, 2),
    ALTER COLUMN deduct_self_unemployment_contribution TYPE NUMERIC(15, 2),
    ALTER COLUMN salary_petition_worker_post_allowance TYPE NUMERIC(15, 2),
    ALTER COLUMN salary_basic_performance_bonus_deduction TYPE NUMERIC(15, 2),
    ALTER COLUMN salary_civil_servant_normative_allowance TYPE NUMERIC(15, 2),
    ALTER COLUMN contrib_employer_housing_fund_contribution TYPE NUMERIC(15, 2),
    ALTER COLUMN contrib_employer_unemployment_contribution TYPE NUMERIC(15, 2),
    ALTER COLUMN contrib_employer_critical_illness_contribution TYPE NUMERIC(15, 2);

-- 6. Rename columns
ALTER TABLE public.raw_salary_data_staging
    RENAME COLUMN other_remarks TO remarks;
ALTER TABLE public.raw_salary_data_staging
    RENAME COLUMN salary_subsidy TO subsidy;
ALTER TABLE public.raw_salary_data_staging
    RENAME COLUMN salary_allowance TO allowance;
ALTER TABLE public.raw_salary_data_staging
    RENAME COLUMN salary_post_salary TO post_salary;
ALTER TABLE public.raw_salary_data_staging
    RENAME COLUMN salary_salary_step TO salary_step;
ALTER TABLE public.raw_salary_data_staging
    RENAME COLUMN salary_basic_salary TO basic_salary;
ALTER TABLE public.raw_salary_data_staging
    RENAME COLUMN deduct_tax_adjustment TO tax_adjustment;
ALTER TABLE public.raw_salary_data_staging
    RENAME COLUMN job_attr_salary_grade TO salary_grade;
ALTER TABLE public.raw_salary_data_staging
    RENAME COLUMN job_attr_salary_level TO salary_level;
ALTER TABLE public.raw_salary_data_staging
    RENAME COLUMN salary_salary_backpay TO salary_backpay;
ALTER TABLE public.raw_salary_data_staging
    RENAME COLUMN job_attr_post_category TO post_category;
ALTER TABLE public.raw_salary_data_staging
    RENAME COLUMN salary_other_allowance TO other_allowance;
ALTER TABLE public.raw_salary_data_staging
    RENAME COLUMN deduct_other_deductions TO other_deductions;
ALTER TABLE public.raw_salary_data_staging
    RENAME COLUMN establishment_type_name TO employee_type_key;
ALTER TABLE public.raw_salary_data_staging
    RENAME COLUMN job_attr_personnel_rank TO personnel_rank;
ALTER TABLE public.raw_salary_data_staging
    RENAME COLUMN salary_living_allowance TO living_allowance;
ALTER TABLE public.raw_salary_data_staging
    RENAME COLUMN salary_probation_salary TO probation_salary;
ALTER TABLE public.raw_salary_data_staging
    RENAME COLUMN salary_one_time_deduction TO one_time_deduction;
ALTER TABLE public.raw_salary_data_staging
    RENAME COLUMN salary_performance_salary TO performance_salary;
ALTER TABLE public.raw_salary_data_staging
    RENAME COLUMN job_attr_personnel_identity TO personnel_identity;
ALTER TABLE public.raw_salary_data_staging
    RENAME COLUMN salary_total_backpay_amount TO total_backpay_amount;
ALTER TABLE public.raw_salary_data_staging
    RENAME COLUMN deduct_individual_income_tax TO individual_income_tax;
ALTER TABLE public.raw_salary_data_staging
    RENAME COLUMN deduct_housing_fund_adjustment TO housing_fund_adjustment;
ALTER TABLE public.raw_salary_data_staging
    RENAME COLUMN salary_basic_performance_bonus TO basic_performance_bonus;
ALTER TABLE public.raw_salary_data_staging
    RENAME COLUMN salary_petition_post_allowance TO petition_post_allowance;
ALTER TABLE public.raw_salary_data_staging
    RENAME COLUMN salary_post_position_allowance TO post_position_allowance;
ALTER TABLE public.raw_salary_data_staging
    RENAME COLUMN salary_transportation_allowance TO transportation_allowance;
ALTER TABLE public.raw_salary_data_staging
    RENAME COLUMN deduct_self_annuity_contribution TO self_annuity_contribution;
ALTER TABLE public.raw_salary_data_staging
    RENAME COLUMN deduct_self_medical_contribution TO self_medical_contribution;
ALTER TABLE public.raw_salary_data_staging
    RENAME COLUMN deduct_self_pension_contribution TO self_pension_contribution;
ALTER TABLE public.raw_salary_data_staging
    RENAME COLUMN salary_monthly_basic_performance TO monthly_basic_performance;
ALTER TABLE public.raw_salary_data_staging
    RENAME COLUMN salary_only_child_parents_reward TO only_child_parents_reward;
ALTER TABLE public.raw_salary_data_staging
    RENAME COLUMN salary_rank_or_post_grade_salary TO rank_or_post_grade_salary;
ALTER TABLE public.raw_salary_data_staging
    RENAME COLUMN salary_salary_step_backpay_total TO salary_step_backpay_total;
ALTER TABLE public.raw_salary_data_staging
    RENAME COLUMN job_attr_ref_official_salary_step TO ref_official_salary_step;
ALTER TABLE public.raw_salary_data_staging
    RENAME COLUMN salary_monthly_reward_performance TO monthly_reward_performance;
ALTER TABLE public.raw_salary_data_staging
    RENAME COLUMN salary_total_deduction_adjustment TO total_deduction_adjustment;
ALTER TABLE public.raw_salary_data_staging
    RENAME COLUMN deduct_social_insurance_adjustment TO social_insurance_adjustment;
ALTER TABLE public.raw_salary_data_staging
    RENAME COLUMN salary_quarterly_performance_bonus TO quarterly_performance_bonus;
ALTER TABLE public.raw_salary_data_staging
    RENAME COLUMN job_attr_annual_fixed_salary_amount TO annual_fixed_salary_amount;
ALTER TABLE public.raw_salary_data_staging
    RENAME COLUMN salary_position_or_technical_salary TO position_or_technical_salary;
ALTER TABLE public.raw_salary_data_staging
    RENAME COLUMN salary_reform_1993_reserved_subsidy TO reform_1993_reserved_subsidy;
ALTER TABLE public.raw_salary_data_staging
    RENAME COLUMN salary_reward_performance_deduction TO reward_performance_deduction;
ALTER TABLE public.raw_salary_data_staging
    RENAME COLUMN contrib_employer_annuity_contribution TO employer_annuity_contribution;
ALTER TABLE public.raw_salary_data_staging
    RENAME COLUMN contrib_employer_medical_contribution TO employer_medical_contribution;
ALTER TABLE public.raw_salary_data_staging
    RENAME COLUMN contrib_employer_pension_contribution TO employer_pension_contribution;
ALTER TABLE public.raw_salary_data_staging
    RENAME COLUMN deduct_self_housing_fund_contribution TO self_housing_fund_contribution;
ALTER TABLE public.raw_salary_data_staging
    RENAME COLUMN deduct_self_unemployment_contribution TO self_unemployment_contribution;
ALTER TABLE public.raw_salary_data_staging
    RENAME COLUMN salary_petition_worker_post_allowance TO petition_worker_post_allowance;
ALTER TABLE public.raw_salary_data_staging
    RENAME COLUMN job_attr_ref_official_post_salary_level TO ref_official_post_salary_level;
ALTER TABLE public.raw_salary_data_staging
    RENAME COLUMN salary_basic_performance_bonus_deduction TO basic_performance_bonus_deduction;
ALTER TABLE public.raw_salary_data_staging
    RENAME COLUMN salary_civil_servant_normative_allowance TO civil_servant_normative_allowance;
ALTER TABLE public.raw_salary_data_staging
    RENAME COLUMN contrib_employer_housing_fund_contribution TO employer_housing_fund_contribution;
ALTER TABLE public.raw_salary_data_staging
    RENAME COLUMN contrib_employer_unemployment_contribution TO employer_unemployment_contribution;
ALTER TABLE public.raw_salary_data_staging
    RENAME COLUMN contrib_employer_critical_illness_contribution TO employer_critical_illness_contribution;

-- 7. Add new primary key
ALTER TABLE public.raw_salary_data_staging
    ADD CONSTRAINT raw_salary_data_staging_pkey PRIMARY KEY (_staging_id);

-- 8. Add new indexes
CREATE INDEX IF NOT EXISTS idx_raw_staging_pay_period ON public.raw_salary_data_staging (pay_period_identifier);
CREATE INDEX IF NOT EXISTS idx_raw_staging_id_card ON public.raw_salary_data_staging (id_card_number);
CREATE INDEX IF NOT EXISTS idx_raw_staging_employee_type ON public.raw_salary_data_staging (employee_type_key);
CREATE INDEX IF NOT EXISTS idx_raw_staging_validation_status ON public.raw_salary_data_staging (_validation_status);
-- CREATE INDEX IF NOT EXISTS idx_raw_staging_batch_id ON public.raw_salary_data_staging (_import_batch_id); -- Optional

COMMIT; 