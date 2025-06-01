"""add_report_title_and_description_lines_to_report_views

Revision ID: f1265c5cec16
Revises: 61d6ab6ad0cf
Create Date: 2024-12-19 16:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'f1265c5cec16'
down_revision: Union[str, None] = '4567e316d860'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # 添加 report_title 字段到 reports.report_views 表
    op.add_column('report_views', 
                  sa.Column('report_title', sa.String(length=500), nullable=True, comment='报表标题'), 
                  schema='reports')
    
    # 添加 description_lines 字段到 reports.report_views 表
    op.add_column('report_views', 
                  sa.Column('description_lines', postgresql.JSONB(astext_type=sa.Text()), nullable=True, comment='报表说明行列表'), 
                  schema='reports')


def downgrade() -> None:
    """Downgrade schema."""
    # 删除 description_lines 字段
    op.drop_column('report_views', 'description_lines', schema='reports')
    
    # 删除 report_title 字段
    op.drop_column('report_views', 'report_title', schema='reports')
