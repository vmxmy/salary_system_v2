"""update_regular_employee_salary_view_with_join

Revision ID: 9e0c283175c0
Revises: 39e112379eaa
Create Date: 2025-05-07 16:09:34.989468

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9e0c283175c0'
down_revision: Union[str, None] = '39e112379eaa'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # 修改视图，添加与establishment_types表的关联
    op.execute("""
    CREATE OR REPLACE VIEW public.正编人员工资信息表 AS
    SELECT
        -- 基本信息
        cd.pay_period_identifier AS "薪酬周期",
        cd.employee_name AS "姓名",
        et.name AS "编制",
        cd.sal_personnel_identity AS "人员身份",
        cd.sal_position_rank AS "职务级别",
        cd.sal_is_leader AS "是否领导",

        -- 薪资信息
        cd.sal_position_or_post_wage AS "职务/岗位工资",
        cd.sal_rank_or_step_wage AS "级别/薪级工资",
        cd.sal_probation_salary AS "试用期工资",
        cd.sal_reform_1993_reserved_subsidy AS "93年工改保留补贴",
        cd.sal_only_child_parents_reward AS "独生子女父母奖励金",
        cd.sal_post_position_allowance AS "岗位职务津贴",
        cd.sal_petition_worker_post_allowance AS "信访工作人员岗位津贴",
        cd.sal_basic_performance_bonus AS "基础绩效奖",
        cd.sal_salary_civil_servant_normative_allowance AS "公务员规范性津贴补贴",
        cd.sal_salary_transportation_allowance AS "公务交通补贴",

        -- 社保信息
        cd.med_total_employee_contribution AS "医疗保险个人应缴总额",
        cd.pen_pension_employee_contribution AS "养老保险个人应缴金额",
        cd.ann_annuity_employee_contribution AS "职业年金个人应缴费额",
        cd.hf_housingfund_employee_contribution AS "住房公积金个人应缴费额",
        cd.sal_other_deductions AS "其他扣款",

        -- 统计字段
        (
            COALESCE(cd.sal_position_or_post_wage, 0) +
            COALESCE(cd.sal_rank_or_step_wage, 0) +
            COALESCE(cd.sal_probation_salary, 0) +
            COALESCE(cd.sal_reform_1993_reserved_subsidy, 0) +
            COALESCE(cd.sal_only_child_parents_reward, 0) +
            COALESCE(cd.sal_post_position_allowance, 0) +
            COALESCE(cd.sal_petition_worker_post_allowance, 0) +
            COALESCE(cd.sal_basic_performance_bonus, 0) +
            COALESCE(cd.sal_salary_civil_servant_normative_allowance, 0) +
            COALESCE(cd.sal_salary_transportation_allowance, 0)
        ) AS "应发工资",

        (
            COALESCE(cd.med_total_employee_contribution, 0) +
            COALESCE(cd.pen_pension_employee_contribution, 0) +
            COALESCE(cd.ann_annuity_employee_contribution, 0) +
            COALESCE(cd.hf_housingfund_employee_contribution, 0) +
            COALESCE(cd.sal_other_deductions, 0)
        ) AS "扣发合计",

        (
            (
                COALESCE(cd.sal_position_or_post_wage, 0) +
                COALESCE(cd.sal_rank_or_step_wage, 0) +
                COALESCE(cd.sal_probation_salary, 0) +
                COALESCE(cd.sal_reform_1993_reserved_subsidy, 0) +
                COALESCE(cd.sal_only_child_parents_reward, 0) +
                COALESCE(cd.sal_post_position_allowance, 0) +
                COALESCE(cd.sal_petition_worker_post_allowance, 0) +
                COALESCE(cd.sal_basic_performance_bonus, 0) +
                COALESCE(cd.sal_salary_civil_servant_normative_allowance, 0) +
                COALESCE(cd.sal_salary_transportation_allowance, 0)
            ) -
            (
                COALESCE(cd.med_total_employee_contribution, 0) +
                COALESCE(cd.pen_pension_employee_contribution, 0) +
                COALESCE(cd.ann_annuity_employee_contribution, 0) +
                COALESCE(cd.hf_housingfund_employee_contribution, 0) +
                COALESCE(cd.sal_other_deductions, 0)
            )
        ) AS "实发工资"

    FROM
        staging.consolidated_data cd
    LEFT JOIN
        core.establishment_types et ON cd.sal_employee_type_key = et.employee_type_key
    WHERE
        -- 只包含正编人员 (gwy=公务员, cg=参公, sy=事业编)
        cd.sal_employee_type_key IN ('gwy', 'cg', 'sy');

    -- 添加视图注释
    COMMENT ON VIEW public.正编人员工资信息表 IS '正编人员工资信息表，包含正编人员(公务员gwy、参公cg、事业编sy)的基本薪资信息和统计字段（应发工资、扣发合计、实发工资）';
    """)


def downgrade() -> None:
    """Downgrade schema."""
    # 恢复到之前的视图定义
    op.execute("""
    CREATE OR REPLACE VIEW public.正编人员工资信息表 AS
    SELECT
        -- 基本信息
        cd.pay_period_identifier AS "薪酬周期",
        cd.employee_name AS "姓名",
        cd.sal_establishment_type_name AS "编制",
        cd.sal_personnel_identity AS "人员身份",
        cd.sal_position_rank AS "职务级别",
        cd.sal_is_leader AS "是否领导",

        -- 薪资信息
        cd.sal_position_or_post_wage AS "职务/岗位工资",
        cd.sal_rank_or_step_wage AS "级别/薪级工资",
        cd.sal_probation_salary AS "试用期工资",
        cd.sal_reform_1993_reserved_subsidy AS "93年工改保留补贴",
        cd.sal_only_child_parents_reward AS "独生子女父母奖励金",
        cd.sal_post_position_allowance AS "岗位职务津贴",
        cd.sal_petition_worker_post_allowance AS "信访工作人员岗位津贴",
        cd.sal_basic_performance_bonus AS "基础绩效奖",
        cd.sal_salary_civil_servant_normative_allowance AS "公务员规范性津贴补贴",
        cd.sal_salary_transportation_allowance AS "公务交通补贴",

        -- 社保信息
        cd.med_total_employee_contribution AS "医疗保险个人应缴总额",
        cd.pen_pension_employee_contribution AS "养老保险个人应缴金额",
        cd.ann_annuity_employee_contribution AS "职业年金个人应缴费额",
        cd.hf_housingfund_employee_contribution AS "住房公积金个人应缴费额",
        cd.sal_other_deductions AS "其他扣款",

        -- 统计字段
        (
            COALESCE(cd.sal_position_or_post_wage, 0) +
            COALESCE(cd.sal_rank_or_step_wage, 0) +
            COALESCE(cd.sal_probation_salary, 0) +
            COALESCE(cd.sal_reform_1993_reserved_subsidy, 0) +
            COALESCE(cd.sal_only_child_parents_reward, 0) +
            COALESCE(cd.sal_post_position_allowance, 0) +
            COALESCE(cd.sal_petition_worker_post_allowance, 0) +
            COALESCE(cd.sal_basic_performance_bonus, 0) +
            COALESCE(cd.sal_salary_civil_servant_normative_allowance, 0) +
            COALESCE(cd.sal_salary_transportation_allowance, 0)
        ) AS "应发工资",

        (
            COALESCE(cd.med_total_employee_contribution, 0) +
            COALESCE(cd.pen_pension_employee_contribution, 0) +
            COALESCE(cd.ann_annuity_employee_contribution, 0) +
            COALESCE(cd.hf_housingfund_employee_contribution, 0) +
            COALESCE(cd.sal_other_deductions, 0)
        ) AS "扣发合计",

        (
            (
                COALESCE(cd.sal_position_or_post_wage, 0) +
                COALESCE(cd.sal_rank_or_step_wage, 0) +
                COALESCE(cd.sal_probation_salary, 0) +
                COALESCE(cd.sal_reform_1993_reserved_subsidy, 0) +
                COALESCE(cd.sal_only_child_parents_reward, 0) +
                COALESCE(cd.sal_post_position_allowance, 0) +
                COALESCE(cd.sal_petition_worker_post_allowance, 0) +
                COALESCE(cd.sal_basic_performance_bonus, 0) +
                COALESCE(cd.sal_salary_civil_servant_normative_allowance, 0) +
                COALESCE(cd.sal_salary_transportation_allowance, 0)
            ) -
            (
                COALESCE(cd.med_total_employee_contribution, 0) +
                COALESCE(cd.pen_pension_employee_contribution, 0) +
                COALESCE(cd.ann_annuity_employee_contribution, 0) +
                COALESCE(cd.hf_housingfund_employee_contribution, 0) +
                COALESCE(cd.sal_other_deductions, 0)
            )
        ) AS "实发工资"

    FROM
        staging.consolidated_data cd
    WHERE
        -- 只包含正编人员 (gwy=公务员, cg=参公, sy=事业编)
        cd.sal_employee_type_key IN ('gwy', 'cg', 'sy');
    """)
