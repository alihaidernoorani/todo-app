"""Task SQLModel table definition."""

from datetime import UTC, datetime
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel


class Task(SQLModel, table=True):
    """Database table model for Task entity."""

    __tablename__ = "tasks"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    title: str = Field(max_length=255, nullable=False)
    description: str | None = Field(default=None, max_length=2000)
    is_completed: bool = Field(default=False, nullable=False)
    priority: str = Field(default="Medium", nullable=False)  # High, Medium, Low
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        nullable=False,
    )
    user_id: UUID = Field(nullable=False, index=True)
