"""Add parent_job_title_id to job_titles

Revision ID: add_parent_job_title_id
Revises: v2_initial_schema
Create Date: 2023-11-01

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_parent_job_title_id'
down_revision = 'v2_initial_schema'
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('job_titles', sa.Column('parent_job_title_id', sa.BigInteger(), nullable=True), schema='hr')
    op.create_foreign_key(
        'fk_job_title_parent',
        'job_titles', 'job_titles',
        ['parent_job_title_id'], ['id'],
        source_schema='hr', referent_schema='hr',
        ondelete='SET NULL'
    )

def downgrade():
    op.drop_constraint('fk_job_title_parent', 'job_titles', schema='hr', type_='foreignkey')
    op.drop_column('job_titles', 'parent_job_title_id', schema='hr')
