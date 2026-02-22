"""Add processed_event_logs table

Revision ID: 007
Revises: 006
Create Date: 2026-02-22

T021: Creates processed_event_logs table for Kafka event idempotency.
UNIQUE(idempotency_key) prevents duplicate processing of the same event.
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = "007"
down_revision = "006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add processed_event_logs table."""
    op.create_table(
        "processed_event_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("event_id", sa.String(), nullable=False),
        sa.Column("idempotency_key", sa.String(), nullable=False),
        sa.Column("event_type", sa.String(64), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="processing"),
        sa.Column("result_id", sa.String(), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("event_timestamp", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "processed_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_processed_event_logs_event_id", "processed_event_logs", ["event_id"])
    op.create_unique_constraint(
        "uq_processed_event_logs_idempotency_key",
        "processed_event_logs",
        ["idempotency_key"],
    )
    op.create_index(
        "ix_processed_event_logs_expires_at", "processed_event_logs", ["expires_at"]
    )


def downgrade() -> None:
    """Drop processed_event_logs table."""
    op.drop_index("ix_processed_event_logs_expires_at", table_name="processed_event_logs")
    op.drop_constraint(
        "uq_processed_event_logs_idempotency_key",
        "processed_event_logs",
        type_="unique",
    )
    op.drop_index("ix_processed_event_logs_event_id", table_name="processed_event_logs")
    op.drop_table("processed_event_logs")
