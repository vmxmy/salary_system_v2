"""Create view_final_report

Revision ID: d074a0c1b382
Revises: 8ae18ba581d4
Create Date: 2025-04-14 16:38:39.336684

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd074a0c1b382'
down_revision: Union[str, None] = '8ae18ba581d4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    view_sql = """
    CREATE VIEW view_final_report AS
    SELECT * FROM view_level1_calculations;
    """
    op.execute(view_sql)


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("DROP VIEW IF EXISTS view_final_report;")
