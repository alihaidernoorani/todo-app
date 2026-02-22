"""Reminder SQLModel table definition.

T046: One-time task reminders scheduled via Dapr Jobs and delivered
by notification-service.
"""

from datetime import UTC, datetime
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel


class Reminder(SQLModel, table=True):
    """Database table for one-time task reminders."""

    __tablename__ = "reminders"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: str = Field(nullable=False, index=True)

    # Exactly one of task_id or task_instance_id must be non-null
    task_id: UUID | None = Field(default=None, foreign_key="tasks.id")
    task_instance_id: UUID | None = Field(default=None, foreign_key="task_instances.id")

    reminder_type: str = Field(default="in_app", max_length=20, nullable=False)
    scheduled_for_utc: datetime = Field(nullable=False, index=True)
    status: str = Field(default="pending", max_length=20, nullable=False)
    sent_at: datetime | None = Field(default=None)
    error_message: str | None = Field(default=None)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC), nullable=False
    )
