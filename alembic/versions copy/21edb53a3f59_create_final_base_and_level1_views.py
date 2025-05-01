"""Create final base and level1 views

Revision ID: 21edb53a3f59
Revises: 735f381ab3ac
Create Date: 2024-08-06 10:30:00.000000 # Placeholder date

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '21edb53a3f59'
down_revision: Union[str, None] = '735f381ab3ac' # Depends on the state after quarterly performance bonus view update
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# --- Final View Definitions ---

# UP: view_base_data with total_backpay_amount
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

    -- Extracted Salary Components (Includes total_backpay_amount)
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
    (sr.salary_components->>'total_backpay_amount')::NUMERIC(18, 2) AS salary_total_backpay_amount, -- Added

    -- Extracted Personal Deductions (Includes adjustments)
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

# UP: view_level1_calculations with '专项', '专技', '区聘', '原投服' logic and no '员额', '企业', '其他'
view_level1_calculations_up_sql = """
CREATE OR REPLACE VIEW view_level1_calculations AS
WITH base_data AS (
    SELECT * FROM view_base_data -- Uses the view created above
),
calculations AS (
    SELECT
        *,

        -- Calculate calc_xiaoji based on establishment_type_name
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
            WHEN '专项' THEN
                 COALESCE(salary_basic_salary, 0) +
                 COALESCE(salary_post_salary, 0) +
                 COALESCE(salary_performance_salary, 0) +
                 COALESCE(salary_other_allowance, 0) +
                 COALESCE(salary_basic_performance_bonus, 0)
            WHEN '专技' THEN
                 COALESCE(salary_basic_salary, 0) +
                 COALESCE(salary_post_salary, 0) +
                 COALESCE(salary_allowance, 0) +
                 COALESCE(salary_quarterly_performance_bonus, 0)
            WHEN '区聘' THEN
                 COALESCE(salary_basic_salary, 0) +
                 COALESCE(salary_post_salary, 0) +
                 COALESCE(salary_performance_salary, 0) +
                 COALESCE(salary_subsidy, 0) +
                 COALESCE(salary_petition_post_allowance, 0) +
                 COALESCE(salary_basic_performance_bonus, 0)
            WHEN '原投服' THEN
                 COALESCE(salary_post_salary, 0) +
                 COALESCE(salary_salary_step, 0) +
                 COALESCE(salary_performance_salary, 0) +
                 COALESCE(salary_living_allowance, 0) +
                 COALESCE(salary_basic_performance_bonus, 0) +
                 COALESCE(salary_quarterly_performance_bonus, 0)
            ELSE 0
        END AS calc_xiaoji,

        -- Calculate calc_personal_deductions based on establishment_type_name
        CASE establishment_type_name
            WHEN '公务员' THEN
                 COALESCE(deduct_self_pension_contribution, 0) +
                 COALESCE(deduct_self_medical_contribution, 0) +
                 COALESCE(deduct_self_annuity_contribution, 0) +
                 COALESCE(deduct_self_housing_fund_contribution, 0) +
                 COALESCE(deduct_individual_income_tax, 0)
            WHEN '参公' THEN
                 COALESCE(deduct_self_pension_contribution, 0) +
                 COALESCE(deduct_self_medical_contribution, 0) +
                 COALESCE(deduct_self_annuity_contribution, 0) +
                 COALESCE(deduct_self_housing_fund_contribution, 0) +
                 COALESCE(deduct_individual_income_tax, 0)
            WHEN '事业' THEN
                 COALESCE(deduct_self_pension_contribution, 0) +
                 COALESCE(deduct_self_medical_contribution, 0) +
                 COALESCE(deduct_self_annuity_contribution, 0) +
                 COALESCE(deduct_self_housing_fund_contribution, 0) +
                 COALESCE(deduct_individual_income_tax, 0)
            WHEN '专项' THEN
                 COALESCE(deduct_self_pension_contribution, 0) +
                 COALESCE(deduct_self_medical_contribution, 0) +
                 COALESCE(deduct_self_annuity_contribution, 0) +
                 COALESCE(deduct_self_housing_fund_contribution, 0) +
                 COALESCE(deduct_individual_income_tax, 0) +
                 COALESCE(deduct_social_insurance_adjustment, 0) +
                 COALESCE(deduct_housing_fund_adjustment, 0) +
                 COALESCE(deduct_tax_adjustment, 0)
            WHEN '专技' THEN
                 COALESCE(deduct_self_pension_contribution, 0) +
                 COALESCE(deduct_self_medical_contribution, 0) +
                 COALESCE(deduct_self_annuity_contribution, 0) +
                 COALESCE(deduct_self_housing_fund_contribution, 0) +
                 COALESCE(deduct_individual_income_tax, 0) +
                 COALESCE(deduct_social_insurance_adjustment, 0) +
                 COALESCE(deduct_housing_fund_adjustment, 0) +
                 COALESCE(deduct_tax_adjustment, 0)
            WHEN '区聘' THEN
                 COALESCE(deduct_self_pension_contribution, 0) +
                 COALESCE(deduct_self_medical_contribution, 0) +
                 COALESCE(deduct_self_annuity_contribution, 0) +
                 COALESCE(deduct_self_housing_fund_contribution, 0) +
                 COALESCE(deduct_individual_income_tax, 0) +
                 COALESCE(deduct_social_insurance_adjustment, 0) +
                 COALESCE(deduct_housing_fund_adjustment, 0) +
                 COALESCE(deduct_tax_adjustment, 0)
           WHEN '原投服' THEN
                 COALESCE(deduct_self_pension_contribution, 0) +
                 COALESCE(deduct_self_medical_contribution, 0) +
                 COALESCE(deduct_self_annuity_contribution, 0) +
                 COALESCE(deduct_self_housing_fund_contribution, 0) +
                 COALESCE(deduct_individual_income_tax, 0) +
                 COALESCE(deduct_social_insurance_adjustment, 0) +
                 COALESCE(deduct_housing_fund_adjustment, 0) +
                 COALESCE(deduct_tax_adjustment, 0)
            ELSE 0
        END AS calc_personal_deductions

    FROM base_data
)
SELECT
    c.*, -- Select all columns from calculations CTE

    -- Calculate calc_total_payable (应发工资/合计) based on JSON
    CASE c.establishment_type_name
        WHEN '公务员' THEN COALESCE(c.calc_xiaoji, 0) + COALESCE(c.salary_one_time_deduction, 0)
        WHEN '参公' THEN COALESCE(c.calc_xiaoji, 0) + COALESCE(c.salary_one_time_deduction, 0)
        WHEN '事业' THEN COALESCE(c.calc_xiaoji, 0) + COALESCE(c.salary_one_time_deduction, 0)
        WHEN '专项' THEN COALESCE(c.calc_xiaoji, 0) + COALESCE(c.salary_total_backpay_amount, 0)
        WHEN '专技' THEN COALESCE(c.calc_xiaoji, 0) + COALESCE(c.salary_total_backpay_amount, 0)
        WHEN '区聘' THEN COALESCE(c.calc_xiaoji, 0) + COALESCE(c.salary_total_backpay_amount, 0)
        WHEN '原投服' THEN COALESCE(c.calc_xiaoji, 0) + COALESCE(c.salary_salary_step_backpay_total, 0)
        ELSE COALESCE(c.calc_xiaoji, 0)
    END AS calc_total_payable,

    -- Calculate calc_net_pay (实发工资) based on JSON: 应发工资 - 扣发合计 - 其他扣款
    (CASE c.establishment_type_name
        WHEN '公务员' THEN COALESCE(c.calc_xiaoji, 0) + COALESCE(c.salary_one_time_deduction, 0)
        WHEN '参公' THEN COALESCE(c.calc_xiaoji, 0) + COALESCE(c.salary_one_time_deduction, 0)
        WHEN '事业' THEN COALESCE(c.calc_xiaoji, 0) + COALESCE(c.salary_one_time_deduction, 0)
        WHEN '专项' THEN COALESCE(c.calc_xiaoji, 0) + COALESCE(c.salary_total_backpay_amount, 0)
        WHEN '专技' THEN COALESCE(c.calc_xiaoji, 0) + COALESCE(c.salary_total_backpay_amount, 0)
        WHEN '区聘' THEN COALESCE(c.calc_xiaoji, 0) + COALESCE(c.salary_total_backpay_amount, 0)
        WHEN '原投服' THEN COALESCE(c.calc_xiaoji, 0) + COALESCE(c.salary_salary_step_backpay_total, 0)
        ELSE COALESCE(c.calc_xiaoji, 0)
    END) -- This is calc_total_payable (应发工资)
    - COALESCE(c.calc_personal_deductions, 0) -- Subtract 扣发合计
    - COALESCE(c.deduct_other_deductions, 0) -- Subtract 其他扣款
    AS calc_net_pay

FROM calculations c;
"""

# DOWN: Drop the views created in the upgrade
view_level1_calculations_down_sql = "DROP VIEW IF EXISTS view_level1_calculations;"
view_base_data_down_sql = "DROP VIEW IF EXISTS view_base_data;"


def upgrade() -> None:
    # Create view_base_data first
    op.execute(view_base_data_up_sql)
    # Then create view_level1_calculations which depends on view_base_data
    op.execute(view_level1_calculations_up_sql)


def downgrade() -> None:
    # Drop view_level1_calculations first as it depends on view_base_data
    op.execute(view_level1_calculations_down_sql)
    # Then drop view_base_data
    op.execute(view_base_data_down_sql)
