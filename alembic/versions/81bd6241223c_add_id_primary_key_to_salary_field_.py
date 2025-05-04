"""Add id primary key to salary_field_mappings

Revision ID: 81bd6241223c
Revises: 3d408b8ec864
Create Date: 2025-05-04 14:14:39.931945

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '81bd6241223c'
down_revision: Union[str, None] = '3d408b8ec864'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # 1. 添加 id 字段，允许 NULL
    op.add_column('salary_field_mappings', sa.Column('id', sa.Integer(), autoincrement=True, nullable=True))
    # 2. 用 row_number() 填充所有历史行唯一 id
    op.execute("""
        UPDATE salary_field_mappings SET id = sub.rn
        FROM (
            SELECT ctid, row_number() OVER () AS rn FROM salary_field_mappings
        ) AS sub
        WHERE salary_field_mappings.ctid = sub.ctid AND salary_field_mappings.id IS NULL;
    """)
    # 3. 删除原主键，设 id 为主键
    with op.batch_alter_table('salary_field_mappings') as batch_op:
        batch_op.drop_constraint('pk_salary_field_mappings', type_='primary')
        batch_op.create_primary_key('pk_salary_field_mappings', ['id'])
    # 4. 将 id 字段设为 NOT NULL
    op.alter_column('salary_field_mappings', 'id', nullable=False)
    # 5. 若已存在 target_name 唯一性约束，先删除
    op.execute("""
    DO $$
    BEGIN
        IF EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'uq_salary_field_mappings_target_name'
        ) THEN
            ALTER TABLE salary_field_mappings DROP CONSTRAINT uq_salary_field_mappings_target_name;
        END IF;
    END$$;
    """)
    # 6. 添加 target_name 唯一性约束
    op.create_unique_constraint('uq_salary_field_mappings_target_name', 'salary_field_mappings', ['target_name'])
    # 7. 自动批量修正所有金额相关字段 data_type
    op.execute("""
        UPDATE salary_field_mappings SET data_type = 'NUMERIC(15, 2)'
        WHERE LOWER(target_name) ~ '(salary|bonus|deduction|allowance|subsidy|wage|amount|tax|performance|backpay)';
    """)


def downgrade() -> None:
    """Downgrade schema."""
    # 1. 删除 target_name 唯一性约束
    op.drop_constraint('uq_salary_field_mappings_target_name', 'salary_field_mappings', type_='unique')
    # 2. 删除 id 主键，恢复 source_name 为主键
    with op.batch_alter_table('salary_field_mappings') as batch_op:
        batch_op.drop_constraint('pk_salary_field_mappings', type_='primary')
        batch_op.create_primary_key('pk_salary_field_mappings', ['source_name'])
    # 3. 删除 id 字段
    op.drop_column('salary_field_mappings', 'id')
