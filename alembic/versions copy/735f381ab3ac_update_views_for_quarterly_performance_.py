"""Update views for quarterly performance bonus field rename

Revision ID: 735f381ab3ac
Revises: d074a0c1b382
Create Date: 2024-08-05 16:00:00.000000 # Placeholder date

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '735f381ab3ac'
down_revision: Union[str, None] = 'd074a0c1b382' # Previous revision created view_final_report
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# --- View Definitions (Helper constants to avoid repetition) ---

# Base data view definition - UPDATED FOR THIS MIGRATION
view_base_data_up_sql = """
CREATE OR REPLACE VIEW view_base_data AS
SELECT
    -- Identifiers
    sr.employee_id,
    sr.pay_period_identifier,
    sr.establishment_type_id,

    -- Employee Info
    emp.employee_name,
    emp.id_card_number,

    -- Dimension Attributes
    dept.department_name,
    u.unit_name,
    et.establishment_type_name,

    -- Extracted Job Attributes
    sr.job_attributes->>'personnel_identity' AS job_attr_personnel_identity,
    sr.job_attributes->>'personnel_rank' AS job_attr_personnel_rank,
    sr.job_attributes->>'post_category' AS job_attr_post_category,
    sr.job_attributes->>'ref_official_post_salary_level' AS job_attr_ref_official_post_salary_level,
    sr.job_attributes->>'ref_official_salary_step' AS job_attr_ref_official_salary_step,
    sr.job_attributes->>'salary_level' AS job_attr_salary_level,
    sr.job_attributes->>'salary_grade' AS job_attr_salary_grade,
    (sr.job_attributes->>'annual_fixed_salary_amount')::NUMERIC(18, 2) AS job_attr_annual_fixed_salary_amount,

    -- Extracted Salary Components (UPDATED: quarterly_performance_bonus replaces q1_q3_performance_bonus)
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
    (sr.salary_components->>'quarterly_performance_bonus')::NUMERIC(18, 2) AS salary_quarterly_performance_bonus, -- UPDATED
    (sr.salary_components->>'subsidy')::NUMERIC(18, 2) AS salary_subsidy,
    (sr.salary_components->>'petition_post_allowance')::NUMERIC(18, 2) AS salary_petition_post_allowance,
    (sr.salary_components->>'total_deduction_adjustment')::NUMERIC(18, 2) AS salary_total_deduction_adjustment,
    (sr.salary_components->>'living_allowance')::NUMERIC(18, 2) AS salary_living_allowance,
    -- (sr.salary_components->>'q1_q3_performance_bonus')::NUMERIC(18, 2) AS salary_q1_q3_performance_bonus, -- REMOVED
    (sr.salary_components->>'salary_step_backpay_total')::NUMERIC(18, 2) AS salary_salary_step_backpay_total,

    -- Extracted Personal Deductions
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

    -- Extracted Company Contributions
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

FROM salary_records sr
LEFT JOIN stg_employees emp ON sr.employee_id = emp.employee_id
LEFT JOIN dim_departments dept ON emp.department_id = dept.department_id
LEFT JOIN dim_units u ON dept.unit_id = u.unit_id
LEFT JOIN dim_establishment_types et ON sr.establishment_type_id = et.establishment_type_id;
"""

# Base data view definition - REVERTED FOR DOWNGRADE
view_base_data_down_sql = """
CREATE OR REPLACE VIEW view_base_data AS
SELECT
    -- Identifiers
    sr.employee_id,
    sr.pay_period_identifier,
    sr.establishment_type_id,

    -- Employee Info
    emp.employee_name,
    emp.id_card_number,

    -- Dimension Attributes
    dept.department_name,
    u.unit_name,
    et.establishment_type_name,

    -- Extracted Job Attributes
    sr.job_attributes->>'personnel_identity' AS job_attr_personnel_identity,
    sr.job_attributes->>'personnel_rank' AS job_attr_personnel_rank,
    sr.job_attributes->>'post_category' AS job_attr_post_category,
    sr.job_attributes->>'ref_official_post_salary_level' AS job_attr_ref_official_post_salary_level,
    sr.job_attributes->>'ref_official_salary_step' AS job_attr_ref_official_salary_step,
    sr.job_attributes->>'salary_level' AS job_attr_salary_level,
    sr.job_attributes->>'salary_grade' AS job_attr_salary_grade,
    (sr.job_attributes->>'annual_fixed_salary_amount')::NUMERIC(18, 2) AS job_attr_annual_fixed_salary_amount,

    -- Extracted Salary Components (REVERTED: q1_q3_performance_bonus replaces quarterly_performance_bonus)
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
    -- (sr.salary_components->>'quarterly_performance_bonus')::NUMERIC(18, 2) AS salary_quarterly_performance_bonus, -- REMOVED
    (sr.salary_components->>'subsidy')::NUMERIC(18, 2) AS salary_subsidy,
    (sr.salary_components->>'petition_post_allowance')::NUMERIC(18, 2) AS salary_petition_post_allowance,
    (sr.salary_components->>'total_deduction_adjustment')::NUMERIC(18, 2) AS salary_total_deduction_adjustment,
    (sr.salary_components->>'living_allowance')::NUMERIC(18, 2) AS salary_living_allowance,
    (sr.salary_components->>'q1_q3_performance_bonus')::NUMERIC(18, 2) AS salary_q1_q3_performance_bonus, -- REVERTED
    (sr.salary_components->>'salary_step_backpay_total')::NUMERIC(18, 2) AS salary_salary_step_backpay_total,

    -- Extracted Personal Deductions
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

    -- Extracted Company Contributions
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

FROM salary_records sr
LEFT JOIN stg_employees emp ON sr.employee_id = emp.employee_id
LEFT JOIN dim_departments dept ON emp.department_id = dept.department_id
LEFT JOIN dim_units u ON dept.unit_id = u.unit_id
LEFT JOIN dim_establishment_types et ON sr.establishment_type_id = et.establishment_type_id;
"""

# Level 1 Calculations view definition - UPDATED FOR THIS MIGRATION
view_level1_calculations_up_sql = """
CREATE OR REPLACE VIEW view_level1_calculations AS
WITH base_data AS (
    SELECT * FROM view_base_data -- This will use the updated view_base_data definition
),
calculations AS (
    SELECT
        *,

        -- Calculate calc_xiaoji based on establishment_type_name (Logic remains unchanged)
        CASE establishment_type_name
            WHEN '公务员' THEN
                COALESCE(salary_position_or_technical_salary, 0) +
                COALESCE(salary_rank_or_post_grade_salary, 0) +
                COALESCE(salary_reform_1993_reserved_subsidy, 0) +
                COALESCE(salary_only_child_parents_reward, 0) +
                COALESCE(salary_post_position_allowance, 0) +
                COALESCE(salary_civil_servant_normative_allowance, 0) +
                COALESCE(salary_transportation_allowance, 0) +
                COALESCE(salary_basic_performance_bonus, 0)
            WHEN '参公' THEN
                 COALESCE(salary_position_or_technical_salary, 0) +
                 COALESCE(salary_rank_or_post_grade_salary, 0) +
                 COALESCE(salary_probation_salary, 0) +
                 COALESCE(salary_reform_1993_reserved_subsidy, 0) +
                 COALESCE(salary_only_child_parents_reward, 0) +
                 COALESCE(salary_petition_worker_post_allowance, 0) +
                 COALESCE(salary_civil_servant_normative_allowance, 0) +
                 COALESCE(salary_transportation_allowance, 0) +
                 COALESCE(salary_basic_performance_bonus, 0)
            WHEN '事业' THEN
                 COALESCE(salary_basic_performance_deduction, 0) +
                 COALESCE(salary_reward_performance_deduction, 0) +
                 COALESCE(salary_post_salary, 0) +
                 COALESCE(salary_salary_step, 0) +
                 COALESCE(salary_probation_salary, 0) +
                 COALESCE(salary_reform_1993_reserved_subsidy, 0) +
                 COALESCE(salary_only_child_parents_reward, 0) +
                 COALESCE(salary_monthly_basic_performance, 0) +
                 COALESCE(salary_basic_performance_bonus, 0) +
                 COALESCE(salary_monthly_reward_performance, 0)
            ELSE 0
        END AS calc_xiaoji,

        -- Define source fields for yingfa based on the provided (identical) formula (Logic remains unchanged)
        (
            COALESCE(salary_position_or_technical_salary, 0) +
            COALESCE(salary_only_child_parents_reward, 0) +
            COALESCE(salary_transportation_allowance, 0) +
            COALESCE(salary_incentive_performance_salary, 0) +
            COALESCE(salary_basic_performance_bonus, 0) +
            COALESCE(salary_basic_performance_salary, 0) +
            COALESCE(salary_salary_backpay, 0) +
            COALESCE(salary_post_position_allowance, 0) +
            COALESCE(salary_post_salary, 0) +
            COALESCE(salary_petition_worker_post_allowance, 0) +
            COALESCE(salary_rank_or_post_grade_salary, 0) +
            COALESCE(salary_reform_1993_reserved_subsidy, 0) +
            COALESCE(salary_civil_servant_normative_allowance, 0) +
            COALESCE(salary_probation_salary, 0) +
            COALESCE(salary_salary_step, 0)
        ) AS calc_yingfa,

        -- Calculate calc_koufa based on formula (Logic remains unchanged)
        (
            COALESCE(deduct_self_pension_contribution, 0) +
            COALESCE(deduct_self_medical_contribution, 0) +
            COALESCE(deduct_self_annuity_contribution, 0) +
            COALESCE(deduct_self_housing_fund_contribution, 0) +
            COALESCE(deduct_individual_income_tax, 0)
        ) AS calc_koufa

    FROM base_data
)
SELECT
    -- Explicitly list columns from calculations CTE (derived from view_base_data), excluding the original civil servant allowance
    -- UPDATED: salary_quarterly_performance_bonus replaces salary_q1_q3_performance_bonus
    c.employee_id, c.pay_period_identifier, c.establishment_type_id, c.employee_name, c.id_card_number,
    c.department_name, c.unit_name, c.establishment_type_name,
    c.job_attr_personnel_identity, c.job_attr_personnel_rank, c.job_attr_post_category,
    c.job_attr_ref_official_post_salary_level, c.job_attr_ref_official_salary_step, c.job_attr_salary_level,
    c.job_attr_salary_grade, c.job_attr_annual_fixed_salary_amount,
    c.salary_one_time_deduction, c.salary_basic_performance_bonus_deduction, c.salary_basic_performance_deduction,
    c.salary_incentive_performance_salary, c.salary_position_or_technical_salary, c.salary_rank_or_post_grade_salary,
    c.salary_reform_1993_reserved_subsidy, c.salary_only_child_parents_reward, c.salary_post_position_allowance,
    -- c.salary_civil_servant_normative_allowance, -- Excluded here
    c.salary_transportation_allowance, c.salary_basic_performance_bonus, c.salary_probation_salary,
    c.salary_petition_worker_post_allowance, c.salary_reward_performance_deduction, c.salary_post_salary,
    c.salary_salary_step, c.salary_monthly_basic_performance, c.salary_monthly_reward_performance,
    c.salary_basic_salary, c.salary_basic_performance_salary, c.salary_performance_salary,
    c.salary_other_allowance, c.salary_salary_backpay, c.salary_allowance, c.salary_quarterly_performance_bonus, -- UPDATED
    c.salary_subsidy, c.salary_petition_post_allowance, c.salary_total_deduction_adjustment,
    c.salary_living_allowance, -- c.salary_q1_q3_performance_bonus, -- REMOVED
    c.salary_salary_step_backpay_total,
    c.deduct_self_pension_contribution, c.deduct_self_medical_contribution, c.deduct_self_annuity_contribution,
    c.deduct_self_housing_fund_contribution, c.deduct_self_unemployment_contribution, c.deduct_individual_income_tax,
    c.deduct_other_deductions, c.deduct_social_insurance_adjustment, c.deduct_housing_fund_adjustment,
    c.deduct_tax_adjustment, c.contrib_employer_pension_contribution, c.contrib_employer_medical_contribution,
    c.contrib_employer_annuity_contribution, c.contrib_employer_housing_fund_contribution,
    c.contrib_employer_unemployment_contribution, c.contrib_employer_critical_illness_contribution,
    c.other_remarks, c.created_at, c.updated_at,

    -- Include calculated fields from CTE
    c.calc_xiaoji, c.calc_yingfa, c.calc_koufa,

    -- Calculate final columns
    (c.calc_xiaoji + COALESCE(c.salary_one_time_deduction, 0)) AS calc_heji,
    (c.calc_yingfa - c.calc_koufa - COALESCE(c.deduct_other_deductions, 0)) AS calc_shifa,

    -- Define the final civil servant allowance using CASE (Logic remains unchanged)
    CASE
        WHEN c.establishment_type_name = '事业'
        THEN COALESCE(c.salary_monthly_basic_performance, 0) + COALESCE(c.salary_monthly_reward_performance, 0)
        ELSE c.salary_civil_servant_normative_allowance -- Use original value from base_data for non-'事业' types
    END AS salary_civil_servant_normative_allowance

FROM calculations c;
"""

# Level 1 Calculations view definition - REVERTED FOR DOWNGRADE
view_level1_calculations_down_sql = """
CREATE OR REPLACE VIEW view_level1_calculations AS
WITH base_data AS (
    SELECT * FROM view_base_data -- This will use the reverted view_base_data definition
),
calculations AS (
    SELECT
        *,

        -- Calculate calc_xiaoji based on establishment_type_name (Logic remains unchanged)
        CASE establishment_type_name
            WHEN '公务员' THEN
                COALESCE(salary_position_or_technical_salary, 0) +
                COALESCE(salary_rank_or_post_grade_salary, 0) +
                COALESCE(salary_reform_1993_reserved_subsidy, 0) +
                COALESCE(salary_only_child_parents_reward, 0) +
                COALESCE(salary_post_position_allowance, 0) +
                COALESCE(salary_civil_servant_normative_allowance, 0) +
                COALESCE(salary_transportation_allowance, 0) +
                COALESCE(salary_basic_performance_bonus, 0)
            WHEN '参公' THEN
                 COALESCE(salary_position_or_technical_salary, 0) +
                 COALESCE(salary_rank_or_post_grade_salary, 0) +
                 COALESCE(salary_probation_salary, 0) +
                 COALESCE(salary_reform_1993_reserved_subsidy, 0) +
                 COALESCE(salary_only_child_parents_reward, 0) +
                 COALESCE(salary_petition_worker_post_allowance, 0) +
                 COALESCE(salary_civil_servant_normative_allowance, 0) +
                 COALESCE(salary_transportation_allowance, 0) +
                 COALESCE(salary_basic_performance_bonus, 0)
            WHEN '事业' THEN
                 COALESCE(salary_basic_performance_deduction, 0) +
                 COALESCE(salary_reward_performance_deduction, 0) +
                 COALESCE(salary_post_salary, 0) +
                 COALESCE(salary_salary_step, 0) +
                 COALESCE(salary_probation_salary, 0) +
                 COALESCE(salary_reform_1993_reserved_subsidy, 0) +
                 COALESCE(salary_only_child_parents_reward, 0) +
                 COALESCE(salary_monthly_basic_performance, 0) +
                 COALESCE(salary_basic_performance_bonus, 0) +
                 COALESCE(salary_monthly_reward_performance, 0)
            ELSE 0
        END AS calc_xiaoji,

        -- Define source fields for yingfa based on the provided (identical) formula (Logic remains unchanged)
        (
            COALESCE(salary_position_or_technical_salary, 0) +
            COALESCE(salary_only_child_parents_reward, 0) +
            COALESCE(salary_transportation_allowance, 0) +
            COALESCE(salary_incentive_performance_salary, 0) +
            COALESCE(salary_basic_performance_bonus, 0) +
            COALESCE(salary_basic_performance_salary, 0) +
            COALESCE(salary_salary_backpay, 0) +
            COALESCE(salary_post_position_allowance, 0) +
            COALESCE(salary_post_salary, 0) +
            COALESCE(salary_petition_worker_post_allowance, 0) +
            COALESCE(salary_rank_or_post_grade_salary, 0) +
            COALESCE(salary_reform_1993_reserved_subsidy, 0) +
            COALESCE(salary_civil_servant_normative_allowance, 0) +
            COALESCE(salary_probation_salary, 0) +
            COALESCE(salary_salary_step, 0)
        ) AS calc_yingfa,

        -- Calculate calc_koufa based on formula (Logic remains unchanged)
        (
            COALESCE(deduct_self_pension_contribution, 0) +
            COALESCE(deduct_self_medical_contribution, 0) +
            COALESCE(deduct_self_annuity_contribution, 0) +
            COALESCE(deduct_self_housing_fund_contribution, 0) +
            COALESCE(deduct_individual_income_tax, 0)
        ) AS calc_koufa

    FROM base_data
)
SELECT
    -- Explicitly list columns from calculations CTE (derived from view_base_data), excluding the original civil servant allowance
    -- REVERTED: salary_q1_q3_performance_bonus replaces salary_quarterly_performance_bonus
    c.employee_id, c.pay_period_identifier, c.establishment_type_id, c.employee_name, c.id_card_number,
    c.department_name, c.unit_name, c.establishment_type_name,
    c.job_attr_personnel_identity, c.job_attr_personnel_rank, c.job_attr_post_category,
    c.job_attr_ref_official_post_salary_level, c.job_attr_ref_official_salary_step, c.job_attr_salary_level,
    c.job_attr_salary_grade, c.job_attr_annual_fixed_salary_amount,
    c.salary_one_time_deduction, c.salary_basic_performance_bonus_deduction, c.salary_basic_performance_deduction,
    c.salary_incentive_performance_salary, c.salary_position_or_technical_salary, c.salary_rank_or_post_grade_salary,
    c.salary_reform_1993_reserved_subsidy, c.salary_only_child_parents_reward, c.salary_post_position_allowance,
    -- c.salary_civil_servant_normative_allowance, -- Excluded here
    c.salary_transportation_allowance, c.salary_basic_performance_bonus, c.salary_probation_salary,
    c.salary_petition_worker_post_allowance, c.salary_reward_performance_deduction, c.salary_post_salary,
    c.salary_salary_step, c.salary_monthly_basic_performance, c.salary_monthly_reward_performance,
    c.salary_basic_salary, c.salary_basic_performance_salary, c.salary_performance_salary,
    c.salary_other_allowance, c.salary_salary_backpay, c.salary_allowance, -- c.salary_quarterly_performance_bonus, -- REMOVED
    c.salary_subsidy, c.salary_petition_post_allowance, c.salary_total_deduction_adjustment,
    c.salary_living_allowance, c.salary_q1_q3_performance_bonus, -- REVERTED
    c.salary_salary_step_backpay_total,
    c.deduct_self_pension_contribution, c.deduct_self_medical_contribution, c.deduct_self_annuity_contribution,
    c.deduct_self_housing_fund_contribution, c.deduct_self_unemployment_contribution, c.deduct_individual_income_tax,
    c.deduct_other_deductions, c.deduct_social_insurance_adjustment, c.deduct_housing_fund_adjustment,
    c.deduct_tax_adjustment, c.contrib_employer_pension_contribution, c.contrib_employer_medical_contribution,
    c.contrib_employer_annuity_contribution, c.contrib_employer_housing_fund_contribution,
    c.contrib_employer_unemployment_contribution, c.contrib_employer_critical_illness_contribution,
    c.other_remarks, c.created_at, c.updated_at,

    -- Include calculated fields from CTE
    c.calc_xiaoji, c.calc_yingfa, c.calc_koufa,

    -- Calculate final columns
    (c.calc_xiaoji + COALESCE(c.salary_one_time_deduction, 0)) AS calc_heji,
    (c.calc_yingfa - c.calc_koufa - COALESCE(c.deduct_other_deductions, 0)) AS calc_shifa,

    -- Define the final civil servant allowance using CASE (Logic remains unchanged)
    CASE
        WHEN c.establishment_type_name = '事业'
        THEN COALESCE(c.salary_monthly_basic_performance, 0) + COALESCE(c.salary_monthly_reward_performance, 0)
        ELSE c.salary_civil_servant_normative_allowance -- Use original value from base_data for non-'事业' types
    END AS salary_civil_servant_normative_allowance

FROM calculations c;
"""

def upgrade() -> None:
    """Runs the upgrade."""
    # Apply changes in dependency order: base -> level1
    # Note: view_final_report doesn't need explicit update as it uses SELECT *

    print("Dropping dependent views before updating view_base_data...")
    op.execute("DROP VIEW IF EXISTS view_level1_calculations CASCADE;") # Drop dependent view first
    op.execute("DROP VIEW IF EXISTS view_base_data CASCADE;") # Drop base view

    print("Updating view_base_data...")
    op.execute(view_base_data_up_sql) # Recreate base view

    print("Dropping dependent view before updating view_level1_calculations...") # Not strictly necessary if already dropped, but safe
    op.execute("DROP VIEW IF EXISTS view_level1_calculations CASCADE;")

    print("Updating view_level1_calculations...")
    op.execute(view_level1_calculations_up_sql) # Recreate level1 view
    print("View updates complete.")


def downgrade() -> None:
    """Runs the downgrade."""
    # Apply changes in reverse dependency order: level1 -> base

    print("Dropping dependent views before reverting view_level1_calculations...")
    op.execute("DROP VIEW IF EXISTS view_level1_calculations CASCADE;")

    print("Reverting view_level1_calculations...")
    op.execute(view_level1_calculations_down_sql) # Recreate level1 with old definition

    print("Dropping dependent views before reverting view_base_data...")
    op.execute("DROP VIEW IF EXISTS view_level1_calculations CASCADE;") # Drop dependent view first
    op.execute("DROP VIEW IF EXISTS view_base_data CASCADE;") # Drop base view

    print("Reverting view_base_data...")
    op.execute(view_base_data_down_sql) # Recreate base view with old definition

    # Need to recreate level1 view again because it depends on the reverted base view
    print("Recreating level1 view based on reverted base view...")
    op.execute("DROP VIEW IF EXISTS view_level1_calculations CASCADE;") # Drop again just in case
    op.execute(view_level1_calculations_down_sql) # Recreate level1 based on reverted base

    print("View reverts complete.")
