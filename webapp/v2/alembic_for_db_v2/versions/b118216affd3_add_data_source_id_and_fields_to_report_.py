"""add_data_source_id_and_fields_to_report_type_definitions

Revision ID: b118216affd3
Revises: b8b9cc5f37b8
Create Date: 2025-06-09 02:49:03.001000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b118216affd3'
down_revision: Union[str, None] = 'b8b9cc5f37b8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # 为 report_type_definitions 表添加 data_source_id 字段
    op.add_column('report_type_definitions', 
                  sa.Column('data_source_id', sa.BigInteger(), nullable=True, comment='关联的数据源ID'),
                  schema='reports')
    
    # 为 report_type_definitions 表添加 fields 字段
    op.add_column('report_type_definitions', 
                  sa.Column('fields', sa.Text(), nullable=True, comment='字段列表(逗号分隔的字段ID)'),
                  schema='reports')
    
    # 添加外键约束
    op.create_foreign_key('fk_report_type_data_source', 'report_type_definitions', 'report_data_sources',
                         ['data_source_id'], ['id'], source_schema='reports', referent_schema='config')


def downgrade() -> None:
    """Downgrade schema."""
    # 删除外键约束
    op.drop_constraint('fk_report_type_data_source', 'report_type_definitions', schema='reports', type_='foreignkey')
    
    # 删除添加的字段
    op.drop_column('report_type_definitions', 'fields', schema='reports')
    op.drop_column('report_type_definitions', 'data_source_id', schema='reports')
