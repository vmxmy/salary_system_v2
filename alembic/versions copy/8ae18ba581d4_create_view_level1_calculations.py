"""Create view_level1_calculations

Revision ID: 8ae18ba581d4
Revises: ec0535f0a351
Create Date: 2025-04-14 15:16:52.298012

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8ae18ba581d4'
down_revision: Union[str, None] = 'ec0535f0a351'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    view_sql = """
    CREATE VIEW view_level1_calculations AS
    WITH base_data AS (
        SELECT * FROM view_base_data
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
                ELSE 0 
            END AS calc_xiaoji,

            -- Define source fields for yingfa based on the provided (identical) formula
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

            -- Calculate calc_koufa based on formula
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
        c.salary_other_allowance, c.salary_salary_backpay, c.salary_allowance, c.salary_quarterly_performance_bonus,
        c.salary_subsidy, c.salary_petition_post_allowance, c.salary_total_deduction_adjustment,
        c.salary_living_allowance, c.salary_q1_q3_performance_bonus, c.salary_salary_step_backpay_total,
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

        -- Define the final civil servant allowance using CASE
        CASE
            WHEN c.establishment_type_name = '事业'
            THEN COALESCE(c.salary_monthly_basic_performance, 0) + COALESCE(c.salary_monthly_reward_performance, 0)
            ELSE c.salary_civil_servant_normative_allowance -- Use original value from base_data for non-'事业' types
        END AS salary_civil_servant_normative_allowance

    FROM calculations c;
    """
    op.execute(view_sql)


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("DROP VIEW IF EXISTS view_level1_calculations;")
