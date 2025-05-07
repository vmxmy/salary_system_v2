"""create_contract_employee_salary_view

Revision ID: 851ec9edd4b6
Revises: 9e0c283175c0
Create Date: 2025-05-07 16:19:05.259319

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '851ec9edd4b6'
down_revision: Union[str, None] = '9e0c283175c0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # 创建聘用人员视图
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

    -- 添加视图注释
    COMMENT ON VIEW public.聘用人员工资信息表 IS '聘用人员工资信息表，包含非正编人员(排除公务员gwy、参公cg、事业编sy)的基本薪资信息和统计字段（工资小计、发放合计、扣发合计、实发工资）';
    """)


def downgrade() -> None:
    """Downgrade schema."""
    # 删除视图
    op.execute("DROP VIEW IF EXISTS public.聘用人员工资信息表;")
