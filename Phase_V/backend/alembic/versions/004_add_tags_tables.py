"""Add tags and task_tags junction tables

Revision ID: 004
Revises: 14fa95511b5d
Create Date: 2026-02-22

T018: Creates tags table with normalized lowercase uniqueness per user,
and task_tags junction table for M2M relationship between tasks and tags.
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = "004"
down_revision = "14fa95511b5d"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add tags and task_tags tables."""
    # tags table
    op.create_table(
        "tags",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("name", sa.String(50), nullable=False),
    )
    op.create_index("ix_tags_user_id", "tags", ["user_id"])
    # Unique on (user_id, lower(name)) — enforced via expression index
    op.execute(
        "CREATE UNIQUE INDEX uq_tags_user_id_name_lower ON tags (user_id, lower(name))"
    )

    # task_tags junction table
    op.create_table(
        "task_tags",
        sa.Column(
            "task_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("tasks.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column(
            "tag_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("tags.id", ondelete="CASCADE"),
            primary_key=True,
        ),
    )


def downgrade() -> None:
    """Drop task_tags and tags tables."""
    op.drop_table("task_tags")
    op.drop_index("uq_tags_user_id_name_lower", table_name="tags")
    op.drop_index("ix_tags_user_id", table_name="tags")
    op.drop_table("tags")
