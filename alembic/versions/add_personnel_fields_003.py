"""
Add education_level, work_start_date, service_interruption_years, continuous_service_years to employees table
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_personnel_fields_003'
down_revision = 'update_specific_field_types_002' # Assumes the previous migration was this
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('employees', sa.Column('education_level', sa.Text(), nullable=True))
    op.add_column('employees', sa.Column('work_start_date', sa.Date(), nullable=True))
    op.add_column('employees', sa.Column('service_interruption_years', sa.Numeric(4, 2), nullable=True))
    op.add_column('employees', sa.Column('continuous_service_years', sa.Numeric(4, 2), nullable=True))

def downgrade():
    op.drop_column('employees', 'continuous_service_years')
    op.drop_column('employees', 'service_interruption_years')
    op.drop_column('employees', 'work_start_date')
    op.drop_column('employees', 'education_level') 