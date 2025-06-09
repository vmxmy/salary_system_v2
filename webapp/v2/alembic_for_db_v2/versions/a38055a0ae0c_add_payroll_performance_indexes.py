"""add_payroll_performance_indexes

Revision ID: a38055a0ae0c
Revises: 946648c5bd5c
Create Date: 2025-01-09 07:59:30.382891

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a38055a0ae0c'
down_revision: Union[str, None] = '946648c5bd5c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add performance indexes for payroll queries."""
    
    # 1. 主要JOIN字段索引
    # 注意：在 Alembic 中不使用 CONCURRENTLY，因为它不能在事务中运行
    op.create_index(
        'idx_payroll_entries_employee_id',
        'payroll_entries',
        ['employee_id'],
        schema='payroll'
    )
    
    op.create_index(
        'idx_payroll_entries_period_id',
        'payroll_entries',
        ['payroll_period_id'],
        schema='payroll'
    )
    
    op.create_index(
        'idx_payroll_entries_run_id',
        'payroll_entries',
        ['payroll_run_id'],
        schema='payroll'
    )
    
    op.create_index(
        'idx_employees_department_id',
        'employees',
        ['department_id'],
        schema='hr'
    )
    
    op.create_index(
        'idx_employees_position_id',
        'employees',
        ['actual_position_id'],
        schema='hr'
    )
    
    op.create_index(
        'idx_employees_category_id',
        'employees',
        ['personnel_category_id'],
        schema='hr'
    )
    
    # 2. 人员类别层级查询优化
    op.create_index(
        'idx_personnel_categories_parent',
        'personnel_categories',
        ['parent_category_id'],
        schema='hr'
    )
    
    op.create_index(
        'idx_personnel_categories_tree',
        'personnel_categories',
        ['parent_category_id', 'id'],
        schema='hr'
    )
    
    # 3. JSONB字段GIN索引（用于频繁访问的JSONB键）
    op.create_index(
        'idx_payroll_entries_earnings_gin',
        'payroll_entries',
        ['earnings_details'],
        schema='payroll',
        postgresql_using='gin'
    )
    
    op.create_index(
        'idx_payroll_entries_deductions_gin',
        'payroll_entries',
        ['deductions_details'],
        schema='payroll',
        postgresql_using='gin'
    )
    
    op.create_index(
        'idx_payroll_entries_calculation_gin',
        'payroll_entries',
        ['calculation_inputs'],
        schema='payroll',
        postgresql_using='gin'
    )
    
    # 4. 复合索引用于常见查询模式
    op.create_index(
        'idx_payroll_entries_period_employee',
        'payroll_entries',
        ['payroll_period_id', 'employee_id'],
        schema='payroll'
    )
    
    # 5. 部分索引（只对活跃员工）
    op.execute("""
        CREATE INDEX idx_employees_active_dept 
        ON hr.employees(is_active, department_id) 
        WHERE is_active = true
    """)


def downgrade() -> None:
    """Remove performance indexes for payroll queries."""
    
    # 删除所有创建的索引（按相反顺序）
    op.execute("DROP INDEX CONCURRENTLY IF EXISTS hr.idx_employees_active_dept")
    op.execute("DROP INDEX CONCURRENTLY IF EXISTS payroll.idx_payroll_entries_period_employee")
    op.execute("DROP INDEX CONCURRENTLY IF EXISTS payroll.idx_payroll_entries_calculation_gin")
    op.execute("DROP INDEX CONCURRENTLY IF EXISTS payroll.idx_payroll_entries_deductions_gin")
    op.execute("DROP INDEX CONCURRENTLY IF EXISTS payroll.idx_payroll_entries_earnings_gin")
    op.execute("DROP INDEX CONCURRENTLY IF EXISTS hr.idx_personnel_categories_tree")
    op.execute("DROP INDEX CONCURRENTLY IF EXISTS hr.idx_personnel_categories_parent")
    op.execute("DROP INDEX CONCURRENTLY IF EXISTS hr.idx_employees_category_id")
    op.execute("DROP INDEX CONCURRENTLY IF EXISTS hr.idx_employees_position_id")
    op.execute("DROP INDEX CONCURRENTLY IF EXISTS hr.idx_employees_department_id")
    op.execute("DROP INDEX CONCURRENTLY IF EXISTS payroll.idx_payroll_entries_run_id")
    op.execute("DROP INDEX CONCURRENTLY IF EXISTS payroll.idx_payroll_entries_period_id")
    op.execute("DROP INDEX CONCURRENTLY IF EXISTS payroll.idx_payroll_entries_employee_id")
