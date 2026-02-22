"""Task Pydantic schemas for request/response validation."""

from datetime import datetime
from enum import Enum
from uuid import UUID

from sqlmodel import Field, SQLModel


# ── Schemas added by Phase V ──────────────────────────────────────────────────


class TaskPriority(str, Enum):
    """Task priority enumeration."""

    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"


class TaskCreate(SQLModel):
    """Schema for creating a new task (request body)."""

    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=2000)
    priority: TaskPriority = Field(default=TaskPriority.MEDIUM)


class TaskUpdate(SQLModel):
    """Schema for PUT update - all fields required for full replacement."""

    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=2000)
    is_completed: bool
    priority: TaskPriority


class TaskRead(SQLModel):
    """Schema for reading a task (response body)."""

    id: UUID
    title: str
    description: str | None
    is_completed: bool
    priority: str
    created_at: datetime
    user_id: str


class TaskList(SQLModel):
    """Schema for listing tasks (response body)."""

    items: list[TaskRead]
    count: int


class TaskMetrics(SQLModel):
    """Schema for aggregated task statistics (response body)."""

    total: int
    completed: int
    pending: int
    overdue: int
    high_priority: int
    medium_priority: int
    low_priority: int


# ── Phase V: Tags (T040) ──────────────────────────────────────────────────────

class TaskCreate(SQLModel):  # noqa: F811 — intentional override adding tags
    """Schema for creating a new task — extended with priority and tags."""

    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=2000)
    priority: TaskPriority = Field(default=TaskPriority.MEDIUM)
    tags: list[str] = Field(default_factory=list)


class TaskUpdate(SQLModel):  # noqa: F811 — intentional override adding tags
    """Schema for PUT update — extended with priority and tags."""

    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=2000)
    is_completed: bool
    priority: TaskPriority
    tags: list[str] = Field(default_factory=list)


class TagRead(SQLModel):
    """Schema for reading a tag."""

    id: UUID
    user_id: str
    name: str


# ── Phase V: Recurring Tasks (T028) ──────────────────────────────────────────

class RecurringTaskCreate(SQLModel):
    """Schema for creating a recurring task (request body)."""

    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=2000)
    priority: TaskPriority = Field(default=TaskPriority.MEDIUM)
    rrule: str = Field(description="RFC 5545 RRULE string, e.g. FREQ=WEEKLY;BYDAY=FR;BYHOUR=14")
    timezone_iana: str = Field(description="IANA timezone name, e.g. America/New_York")
    recurrence_end_type: str | None = Field(default=None)  # "count" | "date" | None
    recurrence_max_count: int | None = Field(default=None, ge=1)
    recurrence_end_date: datetime | None = Field(default=None)
    tags: list[str] = Field(default_factory=list)


class RecurringTaskResponse(SQLModel):
    """Schema for reading a recurring task (response body)."""

    id: UUID
    task_id: UUID
    user_id: str
    series_id: UUID
    rrule: str
    timezone_iana: str
    recurrence_end_type: str | None
    recurrence_max_count: int | None
    recurrence_end_date: datetime | None
    status: str
    next_occurrence_at: str | None  # ISO-8601 string
    current_instance_index: int
    total_occurrences_executed: int
    created_at: datetime
    updated_at: datetime
    task: "TaskRead | None" = None


# ── Phase V: Reminders (T049) ─────────────────────────────────────────────────

class ReminderCreate(SQLModel):
    """Schema for creating a one-time reminder."""

    task_id: UUID | None = Field(default=None)
    task_instance_id: UUID | None = Field(default=None)
    reminder_type: str = Field(default="in_app")
    scheduled_for: datetime = Field(description="UTC datetime for the reminder")


class ReminderResponse(SQLModel):
    """Schema for reading a reminder."""

    id: UUID
    user_id: str
    task_id: UUID | None
    task_instance_id: UUID | None
    reminder_type: str
    scheduled_for_utc: datetime
    status: str
    sent_at: datetime | None
    created_at: datetime
