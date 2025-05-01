{{
  config(
    materialized='table' 
  )
}}

-- This view replicates the logic previously in Alembic migration 21edb53a3f59
-- It calculates various totals based on establishment type using data from view_base_data.

WITH base_data AS (
    SELECT * FROM {{ ref('view_base_data') }} -- Reference the dbt model for base data
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

FROM calculations c 