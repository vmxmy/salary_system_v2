"""add email and email related tables

Revision ID: b886a3391bbd
Revises: 7a9886d11537
Create Date: 2025-05-10 12:21:24.800603

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB # Import JSONB


# revision identifiers, used by Alembic.
revision: str = 'b886a3391bbd'
down_revision: Union[str, None] = '7a9886d11537'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add email column to employees table
    op.add_column('employees', sa.Column('email', sa.String(), nullable=True), schema='core')

    # Create email_server_configs table
    op.create_table('email_server_configs',
        sa.Column('id', sa.Integer(), index=True, nullable=False),
        sa.Column('server_name', sa.String(length=255), unique=True, nullable=False),
        sa.Column('host', sa.String(length=255), nullable=False),
        sa.Column('port', sa.Integer(), nullable=False),
        sa.Column('use_tls', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('use_ssl', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('username', sa.String(length=255), nullable=False),
        sa.Column('encrypted_password', sa.Text(), nullable=False),
        sa.Column('encryption_method', sa.String(length=50), nullable=True),
        sa.Column('sender_email', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), onupdate=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        schema='core'
    )

    # Create email_logs table
    op.create_table('email_logs',
        sa.Column('id', sa.Integer(), index=True, nullable=False),
        sa.Column('sender_email', sa.String(length=255), nullable=False),
        sa.Column('recipient_emails', JSONB(), nullable=False), # Use imported JSONB
        sa.Column('subject', sa.String(length=500), nullable=False),
        sa.Column('body', sa.Text(), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('sent_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('sender_employee_id', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['sender_employee_id'], ['core.employees.id'], ),
        sa.PrimaryKeyConstraint('id'),
        schema='core'
    )

def downgrade() -> None:
    """Downgrade schema."""
    # Drop email_logs table
    op.drop_table('email_logs', schema='core')

    # Drop email_server_configs table
    op.drop_table('email_server_configs', schema='core')

    # Drop email column from employees table
    op.drop_column('employees', 'email', schema='core')
