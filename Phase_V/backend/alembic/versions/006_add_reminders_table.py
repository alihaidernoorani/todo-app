"""Add reminders table

Revision ID: 006
Revises: 005
Create Date: 2026-02-22

T020: Creates reminders table for one-time task reminders delivered
via notification-service.
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = "006"
down_revision = "005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add reminders table."""
    op.create_table(
        "reminders",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column(
            "task_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("tasks.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "task_instance_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("task_instances.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("reminder_type", sa.String(20), nullable=False, server_default="in_app"),
        sa.Column("scheduled_for_utc", sa.DateTime(timezone=True), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index("ix_reminders_user_id", "reminders", ["user_id"])
    op.create_index(
        "ix_reminders_status_scheduled_for",
        "reminders",
        ["status", "scheduled_for_utc"],
    )


def downgrade() -> None:
    """Drop reminders table."""
    op.drop_index("ix_reminders_status_scheduled_for", table_name="reminders")
    op.drop_index("ix_reminders_user_id", table_name="reminders")
    op.drop_table("reminders")
