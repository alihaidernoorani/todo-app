"""add priority field to tasks

Revision ID: 002
Revises: 001
Create Date: 2026-01-26

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add priority column to tasks table with default value."""
    # Add priority column with NOT NULL constraint and default value
    op.add_column(
        'tasks',
        sa.Column('priority', sa.String(length=20), nullable=False, server_default='Medium')
    )

    # Remove server default after backfill (keeps default in code, not DB)
    op.alter_column('tasks', 'priority', server_default=None)


def downgrade() -> None:
    """Remove priority column from tasks table."""
    op.drop_column('tasks', 'priority')
