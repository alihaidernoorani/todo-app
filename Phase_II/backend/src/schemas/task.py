"""Task Pydantic schemas for request/response validation."""

from datetime import datetime
from enum import Enum
from uuid import UUID

from sqlmodel import Field, SQLModel


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
