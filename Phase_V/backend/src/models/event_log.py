"""ProcessedEventLog SQLModel table definition.

T024: Kafka event idempotency via UNIQUE(idempotency_key) constraint.
"""

from datetime import UTC, datetime
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel


class ProcessedEventLog(SQLModel, table=True):
    """Database table for idempotent Kafka event processing records.

    idempotency_key is UNIQUE — the DB constraint prevents duplicate processing.
    """

    __tablename__ = "processed_event_logs"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    event_id: str = Field(nullable=False, index=True)
    idempotency_key: str = Field(nullable=False, unique=True)
    event_type: str = Field(max_length=64, nullable=False)
    status: str = Field(default="processing", max_length=20, nullable=False)
    result_id: str | None = Field(default=None)
    error_message: str | None = Field(default=None)
    event_timestamp: datetime | None = Field(default=None)
    processed_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC), nullable=False
    )
    expires_at: datetime | None = Field(default=None, index=True)
