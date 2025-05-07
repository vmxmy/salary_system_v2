"""update_consolidated_data_medical_fields

Revision ID: 16e83cdf1c84
Revises: fcab1ee11315
Create Date: 2025-05-07 17:01:06.181332

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '16e83cdf1c84'
down_revision: Union[str, None] = 'fcab1ee11315'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # 更新 ConsolidatedDataTable 模型中的字段名称
    # 注意：这里不需要修改 ConsolidatedDataTable 表中的字段名称，因为它们已经是正确的
    # 我们只需要确保 Python 模型中的字段名称与数据库表中的字段名称一致

    # 更新视图以确保它们使用正确的字段名称
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
    """)

    op.execute("""
    CREATE OR REPLACE VIEW public.聘用人员工资信息表 AS
    SELECT
        -- 基本信息
        cd.pay_period_identifier AS "薪酬周期",
        cd.employee_name AS "姓名",
        et.name AS "编制",

        -- 人员信息
        cd.sal_post_category AS "岗位类别",
        cd.sal_salary_level AS "工资级别",
        cd.sal_salary_grade AS "工资档次",
        cd.sal_ref_official_salary_step AS "参照正编薪级工资级次",

        -- 薪资信息
        cd.sal_basic_salary AS "基本工资",
        cd.sal_post_salary AS "岗位工资",
        cd.sal_performance_salary AS "绩效工资",
        cd.sal_subsidy AS "补助",
        cd.sal_petition_post_allowance AS "信访岗位津贴",
        cd.sal_basic_performance_bonus AS "基础绩效奖",

        -- 社保信息
        cd.med_total_employee_contribution AS "医疗保险个人应缴总额",
        cd.pen_pension_employee_contribution AS "养老保险个人应缴金额",
        cd.ann_annuity_employee_contribution AS "职业年金个人应缴费额",
        cd.hf_housingfund_employee_contribution AS "住房公积金个人应缴费额",
        cd.sal_other_deductions AS "其他扣款",

        -- 统计字段
        (
            COALESCE(cd.sal_basic_salary, 0) +
            COALESCE(cd.sal_post_salary, 0) +
            COALESCE(cd.sal_performance_salary, 0) +
            COALESCE(cd.sal_petition_post_allowance, 0) +
            COALESCE(cd.sal_basic_performance_bonus, 0)
        ) AS "工资小计",

        (
            COALESCE(cd.sal_basic_salary, 0) +
            COALESCE(cd.sal_post_salary, 0) +
            COALESCE(cd.sal_performance_salary, 0) +
            COALESCE(cd.sal_petition_post_allowance, 0) +
            COALESCE(cd.sal_basic_performance_bonus, 0) +
            COALESCE(cd.sal_subsidy, 0)
        ) AS "发放合计",

        (
            COALESCE(cd.med_total_employee_contribution, 0) +
            COALESCE(cd.pen_pension_employee_contribution, 0) +
            COALESCE(cd.ann_annuity_employee_contribution, 0) +
            COALESCE(cd.hf_housingfund_employee_contribution, 0) +
            COALESCE(cd.sal_other_deductions, 0)
        ) AS "扣发合计",

        (
            (
                COALESCE(cd.sal_basic_salary, 0) +
                COALESCE(cd.sal_post_salary, 0) +
                COALESCE(cd.sal_performance_salary, 0) +
                COALESCE(cd.sal_petition_post_allowance, 0) +
                COALESCE(cd.sal_basic_performance_bonus, 0) +
                COALESCE(cd.sal_subsidy, 0)
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
        -- 只包含聘用人员 (排除正编人员)
        cd.sal_employee_type_key NOT IN ('gwy', 'cg', 'sy');
    """)


def downgrade() -> None:
    """Downgrade schema."""
    # 恢复视图
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
    """)

    op.execute("""
    CREATE OR REPLACE VIEW public.聘用人员工资信息表 AS
    SELECT
        -- 基本信息
        cd.pay_period_identifier AS "薪酬周期",
        cd.employee_name AS "姓名",
        et.name AS "编制",

        -- 人员信息
        cd.sal_post_category AS "岗位类别",
        cd.sal_salary_level AS "工资级别",
        cd.sal_salary_grade AS "工资档次",
        cd.sal_ref_official_salary_step AS "参照正编薪级工资级次",

        -- 薪资信息
        cd.sal_basic_salary AS "基本工资",
        cd.sal_post_salary AS "岗位工资",
        cd.sal_performance_salary AS "绩效工资",
        cd.sal_subsidy AS "补助",
        cd.sal_petition_post_allowance AS "信访岗位津贴",
        cd.sal_basic_performance_bonus AS "基础绩效奖",

        -- 社保信息
        cd.med_total_employee_contribution AS "医疗保险个人应缴总额",
        cd.pen_pension_employee_contribution AS "养老保险个人应缴金额",
        cd.ann_annuity_employee_contribution AS "职业年金个人应缴费额",
        cd.hf_housingfund_employee_contribution AS "住房公积金个人应缴费额",
        cd.sal_other_deductions AS "其他扣款",

        -- 统计字段
        (
            COALESCE(cd.sal_basic_salary, 0) +
            COALESCE(cd.sal_post_salary, 0) +
            COALESCE(cd.sal_performance_salary, 0) +
            COALESCE(cd.sal_petition_post_allowance, 0) +
            COALESCE(cd.sal_basic_performance_bonus, 0)
        ) AS "工资小计",

        (
            COALESCE(cd.sal_basic_salary, 0) +
            COALESCE(cd.sal_post_salary, 0) +
            COALESCE(cd.sal_performance_salary, 0) +
            COALESCE(cd.sal_petition_post_allowance, 0) +
            COALESCE(cd.sal_basic_performance_bonus, 0) +
            COALESCE(cd.sal_subsidy, 0)
        ) AS "发放合计",

        (
            COALESCE(cd.med_total_employee_contribution, 0) +
            COALESCE(cd.pen_pension_employee_contribution, 0) +
            COALESCE(cd.ann_annuity_employee_contribution, 0) +
            COALESCE(cd.hf_housingfund_employee_contribution, 0) +
            COALESCE(cd.sal_other_deductions, 0)
        ) AS "扣发合计",

        (
            (
                COALESCE(cd.sal_basic_salary, 0) +
                COALESCE(cd.sal_post_salary, 0) +
                COALESCE(cd.sal_performance_salary, 0) +
                COALESCE(cd.sal_petition_post_allowance, 0) +
                COALESCE(cd.sal_basic_performance_bonus, 0) +
                COALESCE(cd.sal_subsidy, 0)
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
        -- 只包含聘用人员 (排除正编人员)
        cd.sal_employee_type_key NOT IN ('gwy', 'cg', 'sy');
    """)
