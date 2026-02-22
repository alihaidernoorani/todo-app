"""Add recurring_tasks and task_instances tables

Revision ID: 005
Revises: 004
Create Date: 2026-02-22

T019: Creates recurring_tasks table for RRULE-based recurring series
and task_instances table for individual occurrences.
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = "005"
down_revision = "004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add recurring_tasks and task_instances tables."""
    # recurring_tasks table
    op.create_table(
        "recurring_tasks",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "task_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("tasks.id", ondelete="CASCADE"),
            nullable=False,
            unique=True,
        ),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("series_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("rrule", sa.Text(), nullable=False),
        sa.Column("timezone_iana", sa.String(64), nullable=False),
        sa.Column("recurrence_end_type", sa.String(20), nullable=True),
        sa.Column("recurrence_max_count", sa.Integer(), nullable=True),
        sa.Column("recurrence_end_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="active"),
        sa.Column("next_occurrence_at_utc", sa.DateTime(timezone=True), nullable=True),
        sa.Column("current_instance_index", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("total_occurrences_executed", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index("ix_recurring_tasks_user_id", "recurring_tasks", ["user_id"])
    op.create_index(
        "ix_recurring_tasks_status_next_occurrence",
        "recurring_tasks",
        ["status", "next_occurrence_at_utc"],
    )

    # task_instances table
    op.create_table(
        "task_instances",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "parent_task_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("recurring_tasks.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("priority", sa.String(20), nullable=False, server_default="Medium"),
        sa.Column("scheduled_for_utc", sa.DateTime(timezone=True), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("retry_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index("ix_task_instances_parent_task_id", "task_instances", ["parent_task_id"])
    op.create_index(
        "ix_task_instances_user_id_scheduled_for",
        "task_instances",
        ["user_id", "scheduled_for_utc"],
    )
    op.create_index(
        "ix_task_instances_parent_status",
        "task_instances",
        ["parent_task_id", "status"],
    )


def downgrade() -> None:
    """Drop task_instances and recurring_tasks tables."""
    op.drop_index("ix_task_instances_parent_status", table_name="task_instances")
    op.drop_index("ix_task_instances_user_id_scheduled_for", table_name="task_instances")
    op.drop_index("ix_task_instances_parent_task_id", table_name="task_instances")
    op.drop_table("task_instances")

    op.drop_index("ix_recurring_tasks_status_next_occurrence", table_name="recurring_tasks")
    op.drop_index("ix_recurring_tasks_user_id", table_name="recurring_tasks")
    op.drop_table("recurring_tasks")
