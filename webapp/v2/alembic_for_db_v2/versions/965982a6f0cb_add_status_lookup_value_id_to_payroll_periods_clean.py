"""add_status_lookup_value_id_to_payroll_periods

Revision ID: 965982a6f0cb
Revises: 270332cdbf03
Create Date: 2025-05-22 23:12:10.890314

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy.sql import text

# revision identifiers, used by Alembic.
revision: str = '965982a6f0cb'
down_revision: Union[str, None] = '270332cdbf03'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # 1. 添加PAYROLL_PERIOD_STATUS查找类型
    conn = op.get_bind()
    
    # 检查lookup_type是否已存在
    result = conn.execute(text(
        "SELECT id FROM config.lookup_types WHERE code = 'PAYROLL_PERIOD_STATUS'"
    )).fetchone()
    
    if not result:
        # 创建lookup_type
        lookup_type_id = conn.execute(text(
            """
            INSERT INTO config.lookup_types (code, name, description)
            VALUES ('PAYROLL_PERIOD_STATUS', '薪资周期状态', '薪资周期的可能状态值')
            RETURNING id
            """
        )).fetchone()[0]
        
        # 添加lookup_values
        conn.execute(text(
            """
            INSERT INTO config.lookup_values 
            (lookup_type_id, code, name, description, sort_order, is_active)
            VALUES
            (:type_id, 'ACTIVE', '活动', '当前可用于薪资计算的周期', 10, true),
            (:type_id, 'CLOSED', '已关闭', '薪资计算已完成的周期', 20, true),
            (:type_id, 'ARCHIVED', '已归档', '历史周期，不再显示在主视图中', 30, true),
            (:type_id, 'PLANNED', '计划中', '尚未开始的未来薪资周期', 5, true)
            """
        ), {'type_id': lookup_type_id})
    else:
        lookup_type_id = result[0]
    
    # 2. 添加status_lookup_value_id字段到payroll_periods表
    op.add_column('payroll_periods',
                  sa.Column('status_lookup_value_id', sa.BigInteger(), nullable=True),
                  schema='payroll')
    
    # 3. 添加外键约束
    op.create_foreign_key(
        'fk_payroll_period_status',
        'payroll_periods', 'lookup_values',
        ['status_lookup_value_id'], ['id'],
        source_schema='payroll', referent_schema='config'
    )
    
    # 4. 数据迁移：基于现有status字段值设置status_lookup_value_id
    conn.execute(text(
        """
        UPDATE payroll.payroll_periods p
        SET status_lookup_value_id = lv.id
        FROM config.lookup_values lv
        JOIN config.lookup_types lt ON lv.lookup_type_id = lt.id
        WHERE lt.code = 'PAYROLL_PERIOD_STATUS'
        AND UPPER(p.status::text) = UPPER(lv.code)
        """
    ))


def downgrade() -> None:
    """Downgrade schema."""
    # 1. 移除外键约束
    op.drop_constraint('fk_payroll_period_status', 'payroll_periods', schema='payroll')
    
    # 2. 移除字段
    op.drop_column('payroll_periods', 'status_lookup_value_id', schema='payroll')
    
    # 3. 移除lookup_values (可选，如果其他地方没有使用)
    conn = op.get_bind()
    conn.execute(text(
        """
        DELETE FROM config.lookup_values 
        WHERE lookup_type_id IN (
            SELECT id FROM config.lookup_types WHERE code = 'PAYROLL_PERIOD_STATUS'
        )
        """
    ))
    
    # 4. 移除lookup_type
    conn.execute(text(
        "DELETE FROM config.lookup_types WHERE code = 'PAYROLL_PERIOD_STATUS'"
    )) 