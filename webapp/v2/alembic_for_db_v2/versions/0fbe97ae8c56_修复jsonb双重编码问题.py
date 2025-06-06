"""修复JSONB双重编码问题

Revision ID: 0fbe97ae8c56
Revises: e1e362b4b79a
Create Date: 2025-06-05 12:37:25.720733

"""
from typing import Sequence, Union
import json

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0fbe97ae8c56'
down_revision: Union[str, None] = 'e1e362b4b79a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """修复JSONB双重编码问题。
    
    将存储为JSON字符串的earnings_details和deductions_details字段
    转换为真正的JSONB格式。
    """
    
    # 获取数据库连接
    connection = op.get_bind()
    
    # 修复earnings_details字段的双重编码
    print("开始修复earnings_details字段的双重编码...")
    
    # 查询所有需要修复的记录（earnings_details是字符串类型的）
    result = connection.execute(sa.text("""
        SELECT id, earnings_details 
        FROM payroll.payroll_entries 
        WHERE jsonb_typeof(earnings_details) = 'string'
    """))
    
    earnings_fixed_count = 0
    for row in result:
        entry_id = row[0]
        earnings_str = row[1]
        
        try:
            # 解析JSON字符串
            if isinstance(earnings_str, str):
                earnings_data = json.loads(earnings_str)
            else:
                earnings_data = earnings_str
            
            # 更新为真正的JSONB - 修复SQL语法
            connection.execute(sa.text("""
                UPDATE payroll.payroll_entries 
                SET earnings_details = %(earnings_data)s::jsonb 
                WHERE id = %(entry_id)s
            """), {"earnings_data": json.dumps(earnings_data), "entry_id": entry_id})
            
            earnings_fixed_count += 1
            
        except (json.JSONDecodeError, TypeError) as e:
            print(f"警告：无法解析条目 {entry_id} 的earnings_details: {e}")
    
    print(f"修复了 {earnings_fixed_count} 条earnings_details记录")
    
    # 修复deductions_details字段的双重编码
    print("开始修复deductions_details字段的双重编码...")
    
    result = connection.execute(sa.text("""
        SELECT id, deductions_details 
        FROM payroll.payroll_entries 
        WHERE jsonb_typeof(deductions_details) = 'string'
    """))
    
    deductions_fixed_count = 0
    for row in result:
        entry_id = row[0]
        deductions_str = row[1]
        
        try:
            # 解析JSON字符串
            if isinstance(deductions_str, str):
                deductions_data = json.loads(deductions_str)
            else:
                deductions_data = deductions_str
            
            # 更新为真正的JSONB - 修复SQL语法
            connection.execute(sa.text("""
                UPDATE payroll.payroll_entries 
                SET deductions_details = %(deductions_data)s::jsonb 
                WHERE id = %(entry_id)s
            """), {"deductions_data": json.dumps(deductions_data), "entry_id": entry_id})
            
            deductions_fixed_count += 1
            
        except (json.JSONDecodeError, TypeError) as e:
            print(f"警告：无法解析条目 {entry_id} 的deductions_details: {e}")
    
    print(f"修复了 {deductions_fixed_count} 条deductions_details记录")
    
    # 验证修复结果
    result = connection.execute(sa.text("""
        SELECT 
            COUNT(*) as total_entries,
            COUNT(CASE WHEN jsonb_typeof(earnings_details) = 'string' THEN 1 END) as earnings_still_string,
            COUNT(CASE WHEN jsonb_typeof(deductions_details) = 'string' THEN 1 END) as deductions_still_string
        FROM payroll.payroll_entries
    """))
    
    stats = result.fetchone()
    print(f"修复完成统计：")
    print(f"  总条目数: {stats[0]}")
    print(f"  earnings_details仍为字符串: {stats[1]}")
    print(f"  deductions_details仍为字符串: {stats[2]}")


def downgrade() -> None:
    """降级操作 - 将JSONB转换回JSON字符串。
    
    注意：这个操作会丢失JSONB的性能优势，仅用于紧急回滚。
    """
    
    connection = op.get_bind()
    
    print("警告：正在将JSONB字段转换回JSON字符串格式...")
    
    # 将earnings_details转换为字符串
    connection.execute(sa.text("""
        UPDATE payroll.payroll_entries 
        SET earnings_details = earnings_details::text::jsonb
        WHERE jsonb_typeof(earnings_details) = 'object'
    """))
    
    # 将deductions_details转换为字符串
    connection.execute(sa.text("""
        UPDATE payroll.payroll_entries 
        SET deductions_details = deductions_details::text::jsonb
        WHERE jsonb_typeof(deductions_details) = 'object'
    """))
    
    print("降级完成")
