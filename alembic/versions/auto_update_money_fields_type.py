"""
Auto update all money-related fields' data_type to NUMERIC(15, 2)
"""
from alembic import op

# revision identifiers, used by Alembic.
revision = 'auto_money_type_001'
down_revision = '81bd6241223c'
branch_labels = None
depends_on = None

def upgrade():
    op.execute("""
        UPDATE salary_field_mappings
        SET data_type = 'NUMERIC(15, 2)'
        WHERE LOWER(target_name) ~ '(salary|bonus|deduction|allowance|subsidy|wage|amount|tax|performance|backpay)';
    """)

def downgrade():
    pass  # 不做回滚 