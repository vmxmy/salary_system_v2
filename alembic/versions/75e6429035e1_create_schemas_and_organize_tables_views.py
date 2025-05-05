"""Create schemas and organize tables/views

Revision ID: 75e6429035e1
Revises: None
Create Date: <timestamp>            # 会自动生成

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '75e6429035e1' # 替换为你的新 Revision ID
down_revision = None # 替换为上一个 Revision ID 或 None
branch_labels = None
depends_on = None

# 定义要移动的对象及其目标 schema
# 格式: ('object_name', 'object_type', 'target_schema')
# object_type: 'table' or 'view'
objects_to_move = [
    # staging
    ('raw_salary_data_staging', 'table', 'staging'),
    # core
    ('users', 'table', 'core'),
    ('roles', 'table', 'core'),
    ('units', 'table', 'core'),
    ('departments', 'table', 'core'),
    ('employees', 'table', 'core'),
    ('establishment_types', 'table', 'core'),
    ('field_mappings', 'table', 'core'),
    ('report_links', 'table', 'core'),
    ('salary_field_mappings', 'table', 'core'), # 假设移至 core
    ('sheet_name_mappings', 'table', 'core'),   # 假设移至 core
    ('employee_type_field_rules', 'table', 'core'), # 假设移至 core
    # payroll
    ('salary_records', 'table', 'payroll'), # 假设是最终记录
    ('calculated_salary_records', 'table', 'payroll'),
    ('calculation_formulas', 'table', 'payroll'),
    ('calculation_rule_conditions', 'table', 'payroll'),
    ('calculation_rules', 'table', 'payroll'),
    # analytics
    ('dim_departments', 'table', 'analytics'),
    ('dim_establishment_types', 'table', 'analytics'),
    ('dim_units', 'table', 'analytics'),
    ('stg_departments', 'view', 'analytics'),
    ('stg_employees', 'view', 'analytics'),
    ('stg_establishment_types', 'view', 'analytics'),
    ('stg_raw_salary_data', 'view', 'analytics'),
    ('stg_units', 'view', 'analytics'),
    ('view_base_data', 'view', 'analytics'),
    ('view_level1_calculations', 'table', 'analytics'), # 按原样是表
    ('vw_salary_gwy', 'view', 'analytics'),
    ('vw_salary_sy', 'view', 'analytics'),
    ('my_first_dbt_model', 'table', 'analytics'), # 假设移至 analytics
]

new_schemas = ['staging', 'core', 'payroll', 'analytics']

def upgrade():
    # ### Airbyte Cleanup (假设您确认要删除) ###
    print("STEP 1: Dropping Airbyte schema and related tables...")
    op.execute("DROP SCHEMA IF EXISTS airbyte_internal CASCADE;")
    op.execute("DROP TABLE IF EXISTS public.raw_salary_data_staging_ab_soft_reset;")
    print("STEP 1: Airbyte cleanup complete.")
    # ### End Airbyte Cleanup ###

    # ### Schema Creation ###
    print("STEP 2: Creating new schemas...")
    for schema_name in new_schemas:
        op.execute(f"CREATE SCHEMA IF NOT EXISTS {schema_name};")
    print(f"STEP 2: New schemas {new_schemas} ensured.")
    # ### End Schema Creation ###

    # ### Object Reorganization ###
    print("STEP 3: Moving tables and views to new schemas...")
    conn = op.get_bind()
    for obj_name, obj_type, target_schema in objects_to_move:
        # 检查对象是否存在于 public schema
        check_exists_sql = sa.text(f"""
            SELECT EXISTS (
                SELECT 1
                FROM information_schema.{'tables' if obj_type == 'table' else 'views'}
                WHERE table_schema = 'public' AND table_name = :obj_name
            );
        """)
        exists = conn.execute(check_exists_sql, {'obj_name': obj_name}).scalar()

        if exists:
            alter_prefix = 'TABLE' if obj_type == 'table' else 'VIEW'
            sql = f'ALTER {alter_prefix} public."{obj_name}" SET SCHEMA {target_schema};'
            print(f"  - Moving {obj_type} public.{obj_name} to {target_schema}...")
            op.execute(sql)
        else:
             print(f"  - WARNING: {obj_type.capitalize()} public.{obj_name} not found. Skipping move.")

    print("STEP 3: Object reorganization complete.")
    # ### End Object Reorganization ###
    print("Upgrade finished.")

def downgrade():
    print("Starting downgrade...")
    # ### Object Reorganization Downgrade ###
    print("STEP 1: Moving tables and views back to public schema...")
    conn = op.get_bind()
    for obj_name, obj_type, source_schema in reversed(objects_to_move): # Reverse order might be safer
        # 检查对象是否存在于源 schema
        check_exists_sql = sa.text(f"""
            SELECT EXISTS (
                SELECT 1
                FROM information_schema.{'tables' if obj_type == 'table' else 'views'}
                WHERE table_schema = :source_schema AND table_name = :obj_name
            );
        """)
        exists = conn.execute(check_exists_sql, {'source_schema': source_schema, 'obj_name': obj_name}).scalar()

        if exists:
            alter_prefix = 'TABLE' if obj_type == 'table' else 'VIEW'
            sql = f'ALTER {alter_prefix} {source_schema}."{obj_name}" SET SCHEMA public;'
            print(f"  - Moving {obj_type} {source_schema}.{obj_name} back to public...")
            op.execute(sql)
        else:
             print(f"  - WARNING: {obj_type.capitalize()} {source_schema}.{obj_name} not found. Skipping move back.")
    print("STEP 1: Objects moved back to public.")
    # ### End Object Reorganization Downgrade ###

    # 注意：Downgrade 不会恢复被删除的 Airbyte 对象
    # 通常也不删除在 upgrade 中创建的 schema，除非有特殊原因
    print("STEP 2: Airbyte objects are NOT restored.")
    # print("STEP 3: Schemas created during upgrade are NOT dropped by default.")
    # op.execute("DROP SCHEMA IF EXISTS staging;") # 谨慎使用
    # op.execute("DROP SCHEMA IF EXISTS core;")
    # op.execute("DROP SCHEMA IF EXISTS payroll;")
    # op.execute("DROP SCHEMA IF EXISTS analytics;")

    print("Downgrade finished.")
