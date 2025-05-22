"""添加工资级别、工资档次和参照正编薪级字段到hr.employees表

Revision ID: add_salary_fields_to_employee
Revises: 127000d3cc92
Create Date: 2023-07-12 14:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_salary_fields_to_employee'
down_revision = '127000d3cc92'  # 设置为127000d3cc92，使其成为线性迁移链的一部分
branch_labels = None
depends_on = None


def upgrade():
    # 添加工资级别、工资档次和参照正编薪级字段到hr.employees表
    op.add_column('employees', sa.Column('salary_level_lookup_value_id', sa.BigInteger(), nullable=True, comment="员工工资级别"), schema='hr')
    op.add_column('employees', sa.Column('salary_grade_lookup_value_id', sa.BigInteger(), nullable=True, comment="员工工资档次"), schema='hr')
    op.add_column('employees', sa.Column('ref_salary_level_lookup_value_id', sa.BigInteger(), nullable=True, comment="员工参照正编薪级"), schema='hr')
    
    # 添加外键约束
    op.create_foreign_key('fk_employee_salary_level_id', 'employees', 'lookup_values', ['salary_level_lookup_value_id'], ['id'], source_schema='hr', referent_schema='config', ondelete='SET NULL')
    op.create_foreign_key('fk_employee_salary_grade_id', 'employees', 'lookup_values', ['salary_grade_lookup_value_id'], ['id'], source_schema='hr', referent_schema='config', ondelete='SET NULL')
    op.create_foreign_key('fk_employee_ref_salary_level_id', 'employees', 'lookup_values', ['ref_salary_level_lookup_value_id'], ['id'], source_schema='hr', referent_schema='config', ondelete='SET NULL')


def downgrade():
    # 删除外键约束
    op.drop_constraint('fk_employee_salary_level_id', 'employees', schema='hr')
    op.drop_constraint('fk_employee_salary_grade_id', 'employees', schema='hr')
    op.drop_constraint('fk_employee_ref_salary_level_id', 'employees', schema='hr')
    
    # 删除字段
    op.drop_column('employees', 'salary_level_lookup_value_id', schema='hr')
    op.drop_column('employees', 'salary_grade_lookup_value_id', schema='hr')
    op.drop_column('employees', 'ref_salary_level_lookup_value_id', schema='hr') 