"""Add PostgreSQL GIN full-text search index on tasks

Revision ID: 008
Revises: 007
Create Date: 2026-02-22

T057: Creates a GIN tsvector index on tasks.title and tasks.description
to enable fast full-text search via to_tsvector('english', ...).
"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "008"
down_revision = "007"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add GIN index for full-text search on title + description.
    # COALESCE handles NULL descriptions gracefully.
    op.execute(
        """
        CREATE INDEX IF NOT EXISTS tasks_fts_idx
        ON tasks
        USING GIN (
            to_tsvector(
                'english',
                title || ' ' || COALESCE(description, '')
            )
        )
        """
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS tasks_fts_idx")
