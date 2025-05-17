"""create initial schemas and tables for salary_system_v2

Revision ID: v2_initial_schema
Revises:
Create Date: 2025-05-10 20:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql # 导入postgresql方言以支持JSONB

# revision identifiers, used by Alembic.
revision = 'v2_initial_schema'
down_revision: Union[str, None] = None # 这是第一个脚本，所以down_revision是None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """创建所有Schema和表"""
    print("Creating schemas...")
    op.execute("CREATE SCHEMA IF NOT EXISTS config")
    op.execute("CREATE SCHEMA IF NOT EXISTS hr")
    op.execute("CREATE SCHEMA IF NOT EXISTS payroll")
    op.execute("CREATE SCHEMA IF NOT EXISTS security")
    print("Schemas created.")

    print("Creating tables in config schema...")
    op.create_table('lookup_types',
        sa.Column('id', sa.BigInteger, sa.Identity(always=True), primary_key=True, comment='Primary key'),
        sa.Column('code', sa.VARCHAR(length=50), nullable=False, unique=True, comment='Unique code for the lookup type'),
        sa.Column('name', sa.VARCHAR(length=100), nullable=False, comment='Human-readable name for the lookup type'),
        sa.Column('description', sa.TEXT, nullable=True, comment='Description of the lookup type'),
        schema='config'
    )

    op.create_table('lookup_values',
        sa.Column('id', sa.BigInteger, sa.Identity(always=True), primary_key=True, comment='Primary key'),
        sa.Column('lookup_type_id', sa.BigInteger, sa.ForeignKey('config.lookup_types.id', ondelete='RESTRICT'), nullable=False, comment='Foreign key to lookup_types'),
        sa.Column('code', sa.VARCHAR(length=50), nullable=False, comment='Unique code for the lookup value within its type'),
        sa.Column('name', sa.VARCHAR(length=100), nullable=False, comment='Human-readable name for the lookup value'),
        sa.Column('description', sa.TEXT, nullable=True, comment='Description of the lookup value'),
        sa.Column('sort_order', sa.Integer, nullable=False, server_default='0', comment='Order for displaying values'),
        sa.Column('is_active', sa.Boolean, nullable=False, server_default='TRUE', comment='Whether the lookup value is active'),
        sa.UniqueConstraint('lookup_type_id', 'code', name='uq_lookup_values_type_code'),
        schema='config'
    )

    op.create_table('system_parameters',
        sa.Column('id', sa.BigInteger, sa.Identity(always=True), primary_key=True, comment='Primary key'),
        sa.Column('key', sa.VARCHAR(length=100), nullable=False, unique=True, comment='Unique parameter key'),
        sa.Column('value', sa.TEXT, nullable=False, comment='Parameter value'),
        sa.Column('description', sa.TEXT, nullable=True, comment='Description of the parameter'),
        schema='config'
    )

    op.create_table('payroll_component_definitions',
        sa.Column('id', sa.BigInteger, sa.Identity(always=True), primary_key=True, comment='Primary key'),
        sa.Column('code', sa.VARCHAR(length=50), nullable=False, unique=True, comment='Unique code for the component'),
        sa.Column('name', sa.VARCHAR(length=100), nullable=False, comment='Name of the component (e.g., Basic Salary, Income Tax)'),
        sa.Column('type', sa.VARCHAR(length=20), nullable=False, comment='Component type (Earning or Deduction)'),
        sa.Column('calculation_method', sa.VARCHAR(length=50), nullable=True, comment='Method used for calculation (e.g., FixedAmount, Percentage, Formula)'),
        sa.Column('calculation_parameters', postgresql.JSONB, nullable=True, comment='Parameters for the calculation method'),
        sa.Column('is_taxable', sa.Boolean, nullable=False, server_default='TRUE', comment='Whether this component is subject to income tax'),
        sa.Column('is_social_security_base', sa.Boolean, nullable=False, server_default='FALSE', comment='Whether this component contributes to social security base'),
        sa.Column('is_housing_fund_base', sa.Boolean, nullable=False, server_default='FALSE', comment='Whether this component contributes to housing fund base'),
        sa.Column('display_order', sa.Integer, nullable=False, server_default='0', comment='Order for displaying on payslip'),
        sa.Column('is_active', sa.Boolean, nullable=False, server_default='TRUE', comment='Whether this component is active'),
        sa.Column('effective_date', sa.Date, nullable=False, comment='Definition effective date'),
        sa.Column('end_date', sa.Date, nullable=True, comment='Definition end date'),
        sa.CheckConstraint("type IN ('Earning', 'Deduction')", name='chk_payroll_component_type'),
        schema='config'
    )

    op.create_table('tax_brackets',
        sa.Column('id', sa.BigInteger, sa.Identity(always=True), primary_key=True, comment='Primary key'),
        sa.Column('region_code', sa.VARCHAR(length=50), nullable=False, comment='Region code (e.g., CN, US-CA)'),
        sa.Column('tax_type', sa.VARCHAR(length=50), nullable=False, comment='Type of tax (e.g., IncomeTax)'),
        sa.Column('income_range_start', sa.NUMERIC(precision=18, scale=4), nullable=False, comment='Income range start amount'),
        sa.Column('income_range_end', sa.NUMERIC(precision=18, scale=4), nullable=True, comment='Income range end amount (null for highest bracket)'),
        sa.Column('tax_rate', sa.NUMERIC(precision=5, scale=4), nullable=False, comment='Tax rate as a decimal (e.g., 0.03)'),
        sa.Column('quick_deduction', sa.NUMERIC(precision=18, scale=4), nullable=False, server_default='0', comment='Quick deduction amount'),
        sa.Column('effective_date', sa.Date, nullable=False, comment='Bracket effective date'),
        sa.Column('end_date', sa.Date, nullable=True, comment='Bracket end date'),
        sa.CheckConstraint("income_range_start < income_range_end OR income_range_end IS NULL", name='chk_tax_bracket_range'),
        schema='config'
    )

    op.create_table('social_security_rates',
        sa.Column('id', sa.BigInteger, sa.Identity(always=True), primary_key=True, comment='Primary key'),
        sa.Column('region_code', sa.VARCHAR(length=50), nullable=False, comment='Region code (e.g., CN-Shanghai)'),
        sa.Column('contribution_type', sa.VARCHAR(length=50), nullable=False, comment='Contribution type (e.g., Pension, Medical, HousingFund)'),
        sa.Column('participant_type', sa.VARCHAR(length=20), nullable=False, comment='Participant (Employee or Employer)'),
        sa.Column('rate', sa.NUMERIC(precision=5, scale=4), nullable=False, comment='Contribution rate as a decimal'),
        sa.Column('base_min', sa.NUMERIC(precision=18, scale=4), nullable=True, comment='Contribution base minimum'),
        sa.Column('base_max', sa.NUMERIC(precision=18, scale=4), nullable=True, comment='Contribution base maximum'),
        sa.Column('fixed_amount', sa.NUMERIC(precision=18, scale=4), nullable=False, server_default='0', comment='Fixed contribution amount if applicable'),
        sa.Column('effective_date', sa.Date, nullable=False, comment='Rate effective date'),
        sa.Column('end_date', sa.Date, nullable=True, comment='Rate end date'),
        sa.CheckConstraint("participant_type IN ('Employee', 'Employer')", name='chk_ss_rate_participant_type'),
        schema='config'
    )
    print("Tables in config schema created.")

    print("Creating tables in hr schema...")
    op.create_table('employees',
        sa.Column('id', sa.BigInteger, sa.Identity(always=True), primary_key=True, comment='Primary key'),
        sa.Column('employee_code', sa.VARCHAR(length=50), nullable=False, unique=True, comment='Unique employee ID/Code'),
        sa.Column('first_name', sa.VARCHAR(length=100), nullable=False, comment='Employee\'s first name'),
        sa.Column('last_name', sa.VARCHAR(length=100), nullable=False, comment='Employee\'s last name'),
        sa.Column('date_of_birth', sa.Date, nullable=True, comment='Employee\'s date of birth'),
        sa.Column('gender_lookup_value_id', sa.BigInteger, sa.ForeignKey('config.lookup_values.id', ondelete='SET NULL'), nullable=True, comment='Foreign key to gender lookup value'),
        sa.Column('id_number', sa.VARCHAR(length=50), nullable=True, unique=True, comment='National ID or passport number (unique if applicable)'),
        sa.Column('nationality', sa.VARCHAR(length=100), nullable=True, comment='Employee\'s nationality'),
        sa.Column('hire_date', sa.Date, nullable=False, comment='Employee\'s hire date'),
        sa.Column('status_lookup_value_id', sa.BigInteger, sa.ForeignKey('config.lookup_values.id', ondelete='RESTRICT'), nullable=False, comment='Foreign key to employee status lookup value (e.g., Active, Terminated)'),
        sa.Column('email', sa.VARCHAR(length=100), nullable=True, comment='Employee\'s email address'),
        sa.Column('phone_number', sa.VARCHAR(length=50), nullable=True, comment='Employee\'s phone number'),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('now()'), comment='Record creation timestamp'),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('now()'), onupdate=sa.text('now()'), comment='Record last update timestamp'), # Added onupdate for updated_at
        schema='hr'
    )

    op.create_table('departments',
        sa.Column('id', sa.BigInteger, sa.Identity(always=True), primary_key=True, comment='Primary key'),
        sa.Column('code', sa.VARCHAR(length=50), nullable=False, unique=True, comment='Unique department code'),
        sa.Column('name', sa.VARCHAR(length=100), nullable=False, comment='Department name'),
        sa.Column('parent_department_id', sa.BigInteger, sa.ForeignKey('hr.departments.id', ondelete='SET NULL'), nullable=True, comment='Foreign key to parent department (for hierarchy)'),
        sa.Column('effective_date', sa.Date, nullable=False, comment='Department structure effective date'),
        sa.Column('end_date', sa.Date, nullable=True, comment='Department structure end date'),
        sa.Column('is_active', sa.Boolean, nullable=False, server_default='TRUE', comment='Whether the department is currently active'),
        schema='hr'
    )

    op.create_table('job_titles',
        sa.Column('id', sa.BigInteger, sa.Identity(always=True), primary_key=True, comment='Primary key'),
        sa.Column('code', sa.VARCHAR(length=50), nullable=False, unique=True, comment='Unique job title code'),
        sa.Column('name', sa.VARCHAR(length=100), nullable=False, comment='Job title name'),
        sa.Column('description', sa.TEXT, nullable=True, comment='Description of the job title'),
        sa.Column('effective_date', sa.Date, nullable=False, comment='Job title definition effective date'),
        sa.Column('end_date', sa.Date, nullable=True, comment='Job title definition end date'),
        sa.Column('is_active', sa.Boolean, nullable=False, server_default='TRUE', comment='Whether the job title is currently in use'),
        schema='hr'
    )

    op.create_table('employee_job_history',
        sa.Column('id', sa.BigInteger, sa.Identity(always=True), primary_key=True, comment='Primary key'),
        sa.Column('employee_id', sa.BigInteger, sa.ForeignKey('hr.employees.id', ondelete='CASCADE'), nullable=False, comment='Foreign key to employees'),
        sa.Column('department_id', sa.BigInteger, sa.ForeignKey('hr.departments.id', ondelete='RESTRICT'), nullable=False, comment='Foreign key to departments at this period'),
        sa.Column('job_title_id', sa.BigInteger, sa.ForeignKey('hr.job_titles.id', ondelete='RESTRICT'), nullable=False, comment='Foreign key to job_titles at this period'),
        sa.Column('manager_id', sa.BigInteger, sa.ForeignKey('hr.employees.id', ondelete='SET NULL'), nullable=True, comment='Foreign key to manager employee at this period'),
        sa.Column('location', sa.VARCHAR(length=100), nullable=True, comment='Work location at this period'),
        sa.Column('effective_date', sa.Date, nullable=False, comment='Record effective date'),
        sa.Column('end_date', sa.Date, nullable=True, comment='Record end date'),
        sa.UniqueConstraint('employee_id', 'effective_date', name='uq_employee_job_history_effective'),
        schema='hr'
    )

    op.create_table('employee_contracts',
        sa.Column('id', sa.BigInteger, sa.Identity(always=True), primary_key=True, comment='Primary key'),
        sa.Column('employee_id', sa.BigInteger, sa.ForeignKey('hr.employees.id', ondelete='CASCADE'), nullable=False, comment='Foreign key to employees'),
        sa.Column('contract_type_lookup_value_id', sa.BigInteger, sa.ForeignKey('config.lookup_values.id', ondelete='RESTRICT'), nullable=False, comment='Foreign key to contract type lookup value'),
        sa.Column('contract_start_date', sa.Date, nullable=False, comment='Contract start date'),
        sa.Column('contract_end_date', sa.Date, nullable=True, comment='Contract end date'),
        sa.Column('signing_date', sa.Date, nullable=True, comment='Contract signing date'),
        sa.Column('effective_date', sa.Date, nullable=False, comment='Record effective date'),
        sa.Column('end_date', sa.Date, nullable=True, comment='Record end date'),
        schema='hr'
    )

    op.create_table('employee_compensation_history',
        sa.Column('id', sa.BigInteger, sa.Identity(always=True), primary_key=True, comment='Primary key'),
        sa.Column('employee_id', sa.BigInteger, sa.ForeignKey('hr.employees.id', ondelete='CASCADE'), nullable=False, comment='Foreign key to employees'),
        sa.Column('salary_amount', sa.NUMERIC(precision=18, scale=4), nullable=False, comment='Salary amount'),
        sa.Column('currency', sa.VARCHAR(length=10), nullable=False, comment='Currency code (e.g., CNY, USD)'),
        sa.Column('pay_frequency_lookup_value_id', sa.BigInteger, sa.ForeignKey('config.lookup_values.id', ondelete='RESTRICT'), nullable=False, comment='Foreign key to pay frequency lookup value'),
        sa.Column('effective_date', sa.Date, nullable=False, comment='Compensation effective date'),
        sa.Column('end_date', sa.Date, nullable=True, comment='Compensation end date'),
        schema='hr'
    )

    op.create_table('employee_payroll_components',
        sa.Column('id', sa.BigInteger, sa.Identity(always=True), primary_key=True, comment='Primary key'),
        sa.Column('employee_id', sa.BigInteger, sa.ForeignKey('hr.employees.id', ondelete='CASCADE'), nullable=False, comment='Foreign key to employees'),
        sa.Column('component_definition_id', sa.BigInteger, sa.ForeignKey('config.payroll_component_definitions.id', ondelete='RESTRICT'), nullable=False, comment='Foreign key to payroll_component_definitions'),
        sa.Column('fixed_amount', sa.NUMERIC(precision=18, scale=4), nullable=True, comment='Fixed amount for this component if applicable to this employee'),
        sa.Column('percentage', sa.NUMERIC(precision=5, scale=4), nullable=True, comment='Percentage for this component if applicable to this employee'),
        sa.Column('parameters', postgresql.JSONB, nullable=True, comment='Employee-specific parameters, overrides general definition'),
        sa.Column('effective_date', sa.Date, nullable=False, comment='Assignment effective date'),
        sa.Column('end_date', sa.Date, nullable=True, comment='Assignment end date'),
        schema='hr'
    )

    op.create_table('leave_types',
        sa.Column('id', sa.BigInteger, sa.Identity(always=True), primary_key=True, comment='Primary key'),
        sa.Column('code', sa.VARCHAR(length=50), nullable=False, unique=True, comment='Unique leave type code (e.g., AnnualLeave, SickLeave)'),
        sa.Column('name', sa.VARCHAR(length=100), nullable=False, comment='Leave type name'),
        sa.Column('accrual_rule_definition', postgresql.JSONB, nullable=True, comment='Definition of how this leave type accrues (e.g., per month, per year based on service)'),
        sa.Column('is_paid', sa.Boolean, nullable=False, server_default='TRUE', comment='Whether this leave type is paid'),
        sa.Column('is_active', sa.Boolean, nullable=False, server_default='TRUE', comment='Whether this leave type is active'),
        schema='hr'
    )

    op.create_table('employee_leave_balances',
        sa.Column('id', sa.BigInteger, sa.Identity(always=True), primary_key=True, comment='Primary key'),
        sa.Column('employee_id', sa.BigInteger, sa.ForeignKey('hr.employees.id', ondelete='CASCADE'), nullable=False, comment='Foreign key to employees'),
        sa.Column('leave_type_id', sa.BigInteger, sa.ForeignKey('hr.leave_types.id', ondelete='RESTRICT'), nullable=False, comment='Foreign key to leave_types'),
        sa.Column('balance_date', sa.Date, nullable=False, comment='Date for which the balance is recorded'),
        sa.Column('hours_accrued', sa.NUMERIC(precision=8, scale=4), nullable=False, server_default='0', comment='Hours accrued up to this date'),
        sa.Column('hours_taken', sa.NUMERIC(precision=8, scale=4), nullable=False, server_default='0', comment='Hours taken up to this date'),
        sa.Column('hours_adjusted', sa.NUMERIC(precision=8, scale=4), nullable=False, server_default='0', comment='Hours adjusted (manual, carry-over) up to this date'),
        sa.Column('current_balance', sa.NUMERIC(precision=8, scale=4), nullable=False, server_default='0', comment='Current balance (accrued - taken + adjusted)'),
        sa.Column('effective_date', sa.Date, nullable=False, comment='Balance record effective date'),
        sa.Column('end_date', sa.Date, nullable=True, comment='Balance record end date'),
        schema='hr'
    )

    op.create_table('employee_leave_requests',
        sa.Column('id', sa.BigInteger, sa.Identity(always=True), primary_key=True, comment='Primary key'),
        sa.Column('employee_id', sa.BigInteger, sa.ForeignKey('hr.employees.id', ondelete='CASCADE'), nullable=False, comment='Foreign key to employees'),
        sa.Column('leave_type_id', sa.BigInteger, sa.ForeignKey('hr.leave_types.id', ondelete='RESTRICT'), nullable=False, comment='Foreign key to leave_types'),
        sa.Column('start_date', sa.Date, nullable=False, comment='Leave start date'),
        sa.Column('end_date', sa.Date, nullable=False, comment='Leave end date'),
        sa.Column('requested_hours', sa.NUMERIC(precision=8, scale=4), nullable=True, comment='Total hours requested'),
        sa.Column('status_lookup_value_id', sa.BigInteger, sa.ForeignKey('config.lookup_values.id', ondelete='RESTRICT'), nullable=False, comment='Foreign key to leave request status lookup value (e.g., Pending, Approved, Rejected)'),
        sa.Column('requested_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('now()'), comment='Request timestamp'),
        sa.Column('approved_by_employee_id', sa.BigInteger, sa.ForeignKey('hr.employees.id', ondelete='SET NULL'), nullable=True, comment='Foreign key to employee who approved (if approved)'),
        sa.Column('approved_at', sa.TIMESTAMP(timezone=True), nullable=True, comment='Approval timestamp'),
        sa.Column('rejection_reason', sa.TEXT, nullable=True, comment='Reason for rejection'),
        schema='hr'
    )
    print("Tables in hr schema created.")

    print("Creating tables in security schema...")
    # Note: security.users needs to be created BEFORE payroll.payroll_runs due to FK
    op.create_table('users',
        sa.Column('id', sa.BigInteger, sa.Identity(always=True), primary_key=True, comment='Primary key'),
        sa.Column('username', sa.VARCHAR(length=50), nullable=False, unique=True, comment='Unique username'),
        sa.Column('password_hash', sa.VARCHAR(length=255), nullable=False, comment='Hashed password'),
        sa.Column('employee_id', sa.BigInteger, sa.ForeignKey('hr.employees.id', ondelete='SET NULL'), nullable=True, unique=True, comment='Optional link to an employee'),
        sa.Column('is_active', sa.Boolean, nullable=False, server_default='TRUE', comment='Whether the user account is active'),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('now()'), comment='User creation timestamp'),
        schema='security'
    )

    op.create_table('roles',
        sa.Column('id', sa.BigInteger, sa.Identity(always=True), primary_key=True, comment='Primary key'),
        sa.Column('code', sa.VARCHAR(length=50), nullable=False, unique=True, comment='Unique role code'),
        sa.Column('name', sa.VARCHAR(length=100), nullable=False, comment='Role name'),
        schema='security'
    )

    op.create_table('user_roles',
        sa.Column('user_id', sa.BigInteger, sa.ForeignKey('security.users.id', ondelete='CASCADE'), nullable=False, comment='Foreign key to users'),
        sa.Column('role_id', sa.BigInteger, sa.ForeignKey('security.roles.id', ondelete='CASCADE'), nullable=False, comment='Foreign key to roles'),
        sa.PrimaryKeyConstraint('user_id', 'role_id', name='pk_user_roles'), # Explicitly define composite PK
        schema='security'
    )

    op.create_table('permissions',
        sa.Column('id', sa.BigInteger, sa.Identity(always=True), primary_key=True, comment='Primary key'),
        sa.Column('code', sa.VARCHAR(length=50), nullable=False, unique=True, comment='Unique permission code (e.g., payroll:view, employee:edit)'),
        sa.Column('description', sa.TEXT, nullable=True, comment='Description of the permission'),
        schema='security'
    )

    op.create_table('role_permissions',
        sa.Column('role_id', sa.BigInteger, sa.ForeignKey('security.roles.id', ondelete='CASCADE'), nullable=False, comment='Foreign key to roles'),
        sa.Column('permission_id', sa.BigInteger, sa.ForeignKey('security.permissions.id', ondelete='CASCADE'), nullable=False, comment='Foreign key to permissions'),
        sa.PrimaryKeyConstraint('role_id', 'permission_id', name='pk_role_permissions'), # Explicitly define composite PK
        schema='security'
    )
    print("Tables in security schema created.")

    print("Creating tables in payroll schema...")
    op.create_table('payroll_periods',
        sa.Column('id', sa.BigInteger, sa.Identity(always=True), primary_key=True, comment='Primary key'),
        sa.Column('name', sa.VARCHAR(length=100), nullable=False, comment='Payroll period name (e.g., 2024-01 Monthly)'),
        sa.Column('start_date', sa.Date, nullable=False, comment='Period start date'),
        sa.Column('end_date', sa.Date, nullable=False, comment='Period end date'),
        sa.Column('pay_date', sa.Date, nullable=False, comment='Date when payment is scheduled/made'),
        sa.Column('frequency_lookup_value_id', sa.BigInteger, sa.ForeignKey('config.lookup_values.id', ondelete='RESTRICT'), nullable=False, comment='Foreign key to pay frequency lookup value (e.g., Monthly, Weekly)'),
        sa.UniqueConstraint('start_date', 'end_date', 'frequency_lookup_value_id', name='uq_payroll_periods_dates_frequency'),
        schema='payroll'
    )

    op.create_table('payroll_runs',
        sa.Column('id', sa.BigInteger, sa.Identity(always=True), primary_key=True, comment='Primary key'),
        sa.Column('payroll_period_id', sa.BigInteger, sa.ForeignKey('payroll.payroll_periods.id', ondelete='RESTRICT'), nullable=False, comment='Foreign key to the payroll period'),
        sa.Column('run_date', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('now()'), comment='Timestamp of the payroll run execution'),
        sa.Column('status_lookup_value_id', sa.BigInteger, sa.ForeignKey('config.lookup_values.id', ondelete='RESTRICT'), nullable=False, comment='Foreign key to run status lookup value (e.g., Processing, Completed, Archived)'),
        sa.Column('initiated_by_user_id', sa.BigInteger, sa.ForeignKey('security.users.id', ondelete='SET NULL'), nullable=True, comment='Foreign key to user who initiated the run'),
        sa.Column('total_employees', sa.Integer, nullable=True, comment='Total number of employees processed in this run'),
        sa.Column('total_net_pay', sa.NUMERIC(precision=18, scale=4), nullable=True, comment='Total net pay amount for this run'),
        schema='payroll'
    )

    op.create_table('payroll_entries',
        sa.Column('id', sa.BigInteger, sa.Identity(always=True), primary_key=True, comment='Primary key'),
        sa.Column('employee_id', sa.BigInteger, sa.ForeignKey('hr.employees.id', ondelete='CASCADE'), nullable=False, comment='Foreign key to employees'),
        sa.Column('payroll_period_id', sa.BigInteger, sa.ForeignKey('payroll.payroll_periods.id', ondelete='RESTRICT'), nullable=False, comment='Foreign key to the payroll period'),
        sa.Column('payroll_run_id', sa.BigInteger, sa.ForeignKey('payroll.payroll_runs.id', ondelete='CASCADE'), nullable=False, comment='Foreign key to the specific payroll run this result belongs to'),
        sa.Column('gross_pay', sa.NUMERIC(precision=18, scale=4), nullable=False, server_default='0', comment='Total gross pay (應發合計)'),
        sa.Column('total_deductions', sa.NUMERIC(precision=18, scale=4), nullable=False, server_default='0', comment='Total deductions (應扣合計)'),
        sa.Column('net_pay', sa.NUMERIC(precision=18, scale=4), nullable=False, server_default='0', comment='Total net pay (實發合計)'),
        sa.Column('earnings_details', postgresql.JSONB, nullable=False, server_default='{}', comment='JSONB object storing individual earning items (key: component code, value: amount)'),
        sa.Column('deductions_details', postgresql.JSONB, nullable=False, server_default='{}', comment='JSONB object storing individual deduction items (key: component code, value: amount)'),
        sa.Column('calculation_inputs', postgresql.JSONB, nullable=True, comment='Optional JSONB for storing calculation input values (e.g., contribution bases, hours worked) used in this specific entry\'s calculation run'),
        sa.Column('calculation_log', postgresql.JSONB, nullable=True, comment='Optional JSONB for storing calculation log/details for this employee/period'),
        sa.Column('status_lookup_value_id', sa.BigInteger, sa.ForeignKey('config.lookup_values.id', ondelete='RESTRICT'), nullable=False, comment='Foreign key to payroll entry status (e.g., Draft, Finalized, Paid)'),
        sa.Column('remarks', sa.TEXT, nullable=True, comment='Remarks for this payroll entry, as seen in examples'),
        sa.Column('calculated_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('now()'), comment='Timestamp when this entry was calculated'),
        sa.UniqueConstraint('employee_id', 'payroll_period_id', 'payroll_run_id', name='uq_payroll_entries_employee_period_run'),
        schema='payroll'
    )
    print("Tables in payroll schema created.")


def downgrade() -> None:
    """删除所有表和Schema (注意依赖顺序)"""
    print("Dropping tables in security schema...")
    op.drop_table('role_permissions', schema='security')
    op.drop_table('permissions', schema='security')
    op.drop_table('user_roles', schema='security')
    op.drop_table('roles', schema='security')
    op.drop_table('users', schema='security') # Note: security.users must be dropped before payroll.payroll_runs can be dropped due to FK

    print("Dropping tables in payroll schema...")
    op.drop_table('payroll_entries', schema='payroll')
    op.drop_table('payroll_runs', schema='payroll')
    op.drop_table('payroll_periods', schema='payroll')

    print("Dropping tables in hr schema...")
    op.drop_table('employee_leave_requests', schema='hr')
    op.drop_table('employee_leave_balances', schema='hr')
    op.drop_table('leave_types', schema='hr')
    op.drop_table('employee_payroll_components', schema='hr')
    op.drop_table('employee_compensation_history', schema='hr')
    op.drop_table('employee_contracts', schema='hr')
    op.drop_table('employee_job_history', schema='hr')
    op.drop_table('job_titles', schema='hr')
    op.drop_table('departments', schema='hr')
    op.drop_table('employees', schema='hr')

    print("Dropping tables in config schema...")
    op.drop_table('social_security_rates', schema='config')
    op.drop_table('tax_brackets', schema='config')
    op.drop_table('payroll_component_definitions', schema='config')
    op.drop_table('system_parameters', schema='config')
    op.drop_table('lookup_values', schema='config')
    op.drop_table('lookup_types', schema='config')
    print("Tables dropped.")

    print("Dropping schemas...")
    op.execute("DROP SCHEMA IF EXISTS security CASCADE")
    op.execute("DROP SCHEMA IF EXISTS payroll CASCADE")
    op.execute("DROP SCHEMA IF EXISTS hr CASCADE")
    op.execute("DROP SCHEMA IF EXISTS config CASCADE")
    print("Schemas dropped.")
