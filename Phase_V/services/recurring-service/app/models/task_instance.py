"""TaskInstance SQLModel table definition for recurring-service."""

from datetime import UTC, datetime
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel


class TaskInstance(SQLModel, table=True):
    """Individual occurrence of a recurring task."""

    __tablename__ = "task_instances"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    parent_task_id: UUID = Field(foreign_key="recurring_tasks.id", nullable=False, index=True)
    user_id: str = Field(nullable=False)
    title: str = Field(max_length=255, nullable=False)
    priority: str = Field(default="Medium", max_length=20, nullable=False)
    scheduled_for_utc: datetime = Field(nullable=False, index=True)
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
