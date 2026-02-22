"""RecurringTask and TaskInstance SQLModel table definitions.

T023: Models for recurring task series and individual task occurrences.
"""

from datetime import UTC, datetime
from uuid import UUID, uuid4

from sqlmodel import Field, Relationship, SQLModel


class RecurringTask(SQLModel, table=True):
    """Database table for recurring task series (RRULE-based)."""

    __tablename__ = "recurring_tasks"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    task_id: UUID = Field(foreign_key="tasks.id", nullable=False, unique=True)
    user_id: str = Field(nullable=False, index=True)
    series_id: UUID = Field(default_factory=uuid4, nullable=False)
    rrule: str = Field(nullable=False)  # RFC 5545 RRULE string
    timezone_iana: str = Field(max_length=64, nullable=False)  # e.g. "America/New_York"

    # Recurrence end conditions (at most one should be set)
    recurrence_end_type: str | None = Field(default=None, max_length=20)  # "count" | "date" | None
    recurrence_max_count: int | None = Field(default=None)
    recurrence_end_date: datetime | None = Field(default=None)

    # State machine: pending → active ↔ paused → completed | → cancelled
    status: str = Field(default="active", max_length=20, nullable=False)

    # Scheduling metadata
    next_occurrence_at_utc: datetime | None = Field(default=None, index=True)
    current_instance_index: int = Field(default=0, nullable=False)
    total_occurrences_executed: int = Field(default=0, nullable=False)

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC), nullable=False
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC), nullable=False
    )

    # Relationship
    instances: list["TaskInstance"] = Relationship(back_populates="recurring_task")


class TaskInstance(SQLModel, table=True):
    """Database table for individual occurrences of a recurring task."""

    __tablename__ = "task_instances"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    parent_task_id: UUID = Field(
        foreign_key="recurring_tasks.id", nullable=False, index=True
    )
    user_id: str = Field(nullable=False)
    title: str = Field(max_length=255, nullable=False)
    priority: str = Field(default="Medium", max_length=20, nullable=False)
    scheduled_for_utc: datetime = Field(nullable=False, index=True)

    # Status: pending | completed | failed | skipped
    status: str = Field(default="pending", max_length=20, nullable=False)
    completed_at: datetime | None = Field(default=None)
    error_message: str | None = Field(default=None)
    retry_count: int = Field(default=0, nullable=False)

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC), nullable=False
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC), nullable=False
    )

    # Relationship
    recurring_task: RecurringTask | None = Relationship(back_populates="instances")
