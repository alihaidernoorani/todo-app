"""Notification SQLModel table definition for notification-service."""

from datetime import UTC, datetime
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel


class Notification(SQLModel, table=True):
    """In-app notification delivered by notification-service."""

    __tablename__ = "notifications"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: str = Field(nullable=False, index=True)
    task_id: UUID | None = Field(default=None)
    reminder_id: UUID | None = Field(default=None)
    title: str = Field(max_length=255, nullable=False)
    body: str = Field(nullable=False)
    status: str = Field(default="unread", max_length=20, nullable=False)  # unread | read
    delivered_at: datetime | None = Field(default=None)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC), nullable=False
    )
