"""optimize_database_schema_structure

Revision ID: 12ff3f54ef9d
Revises: c62ed9129bc5
Create Date: 2025-05-31 20:09:48.201497

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '12ff3f54ef9d'
down_revision: Union[str, None] = 'enhance_report_data_source_models'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    数据库结构优化迁移
    
    主要优化内容：
    1. 删除重复的 public.employees 表
    2. 添加跨schema外键约束
    3. 优化表的schema归属
    """
    
    # 1. 删除重复的 public.employees 表
    # 首先检查表是否存在，如果存在则删除
    connection = op.get_bind()
    
    # 检查 public.employees 表是否存在
    result = connection.execute(sa.text("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'employees'
        );
    """))
    
    if result.scalar():
        print("🗑️ 删除重复的 public.employees 表...")
        op.drop_table('employees', schema='public')
        print("✅ 已删除 public.employees 表")
    else:
        print("ℹ️ public.employees 表不存在，跳过删除")
    
    # 2. 添加跨schema外键约束
    print("🔗 添加跨schema外键约束...")
    
    # 2.1 为 payroll.payroll_entries 添加 employee_id 外键
    try:
        # 检查外键是否已存在
        fk_exists = connection.execute(sa.text("""
            SELECT EXISTS (
                SELECT 1 FROM information_schema.table_constraints 
                WHERE constraint_name = 'fk_payroll_entries_employee_id'
                AND table_schema = 'payroll'
                AND table_name = 'payroll_entries'
            );
        """)).scalar()
        
        if not fk_exists:
            op.create_foreign_key(
                'fk_payroll_entries_employee_id',
                'payroll_entries', 'employees',
                ['employee_id'], ['id'],
                source_schema='payroll',
                referent_schema='hr'
            )
            print("✅ 已添加 payroll.payroll_entries.employee_id 外键")
        else:
            print("ℹ️ payroll.payroll_entries.employee_id 外键已存在")
    except Exception as e:
        print(f"⚠️ 添加 payroll.payroll_entries.employee_id 外键失败: {e}")
    
    # 2.2 为 security.users 添加 employee_id 外键
    try:
        # 检查外键是否已存在
        fk_exists = connection.execute(sa.text("""
            SELECT EXISTS (
                SELECT 1 FROM information_schema.table_constraints 
                WHERE constraint_name = 'fk_users_employee_id'
                AND table_schema = 'security'
                AND table_name = 'users'
            );
        """)).scalar()
        
        if not fk_exists:
            op.create_foreign_key(
                'fk_users_employee_id',
                'users', 'employees',
                ['employee_id'], ['id'],
                source_schema='security',
                referent_schema='hr'
            )
            print("✅ 已添加 security.users.employee_id 外键")
        else:
            print("ℹ️ security.users.employee_id 外键已存在")
    except Exception as e:
        print(f"⚠️ 添加 security.users.employee_id 外键失败: {e}")
    
    # 3. 添加一些有用的索引来优化性能
    print("📊 添加性能优化索引...")
    
    try:
        # 为常用查询字段添加索引
        op.create_index(
            'idx_employees_department_id',
            'employees',
            ['department_id'],
            schema='hr'
        )
        print("✅ 已添加 hr.employees.department_id 索引")
    except Exception as e:
        print(f"ℹ️ hr.employees.department_id 索引可能已存在: {e}")
    
    try:
        op.create_index(
            'idx_payroll_entries_employee_period',
            'payroll_entries',
            ['employee_id', 'payroll_period_id'],
            schema='payroll'
        )
        print("✅ 已添加 payroll.payroll_entries 复合索引")
    except Exception as e:
        print(f"ℹ️ payroll.payroll_entries 复合索引可能已存在: {e}")
    
    print("🎉 数据库结构优化完成！")


def downgrade() -> None:
    """
    回滚数据库结构优化
    """
    print("🔄 开始回滚数据库结构优化...")
    
    # 删除添加的索引
    try:
        op.drop_index('idx_payroll_entries_employee_period', 'payroll_entries', schema='payroll')
        print("✅ 已删除 payroll.payroll_entries 复合索引")
    except Exception as e:
        print(f"ℹ️ 删除 payroll.payroll_entries 复合索引失败: {e}")
    
    try:
        op.drop_index('idx_employees_department_id', 'employees', schema='hr')
        print("✅ 已删除 hr.employees.department_id 索引")
    except Exception as e:
        print(f"ℹ️ 删除 hr.employees.department_id 索引失败: {e}")
    
    # 删除跨schema外键约束
    try:
        op.drop_constraint('fk_users_employee_id', 'users', schema='security', type_='foreignkey')
        print("✅ 已删除 security.users.employee_id 外键")
    except Exception as e:
        print(f"ℹ️ 删除 security.users.employee_id 外键失败: {e}")
    
    try:
        op.drop_constraint('fk_payroll_entries_employee_id', 'payroll_entries', schema='payroll', type_='foreignkey')
        print("✅ 已删除 payroll.payroll_entries.employee_id 外键")
    except Exception as e:
        print(f"ℹ️ 删除 payroll.payroll_entries.employee_id 外键失败: {e}")
    
    # 注意：我们不会重新创建 public.employees 表，因为它是重复的
    print("⚠️ 注意：不会重新创建 public.employees 表（因为它是重复表）")
    
    print("🔄 数据库结构优化回滚完成！")