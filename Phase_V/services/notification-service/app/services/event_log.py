"""Event idempotency log for notification-service.

T054: Prevents duplicate notification delivery for repeated Kafka events.
"""

import hashlib
import logging
from datetime import UTC, datetime
from uuid import uuid4

from sqlalchemy.exc import IntegrityError
from sqlmodel import SQLModel, Field, select
from sqlmodel.ext.asyncio.session import AsyncSession

logger = logging.getLogger(__name__)


class NotificationEventLog(SQLModel, table=True):
    """Idempotency log for notification events."""

    __tablename__ = "notification_event_logs"

    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    idempotency_key: str = Field(nullable=False, unique=True)
    event_type: str = Field(max_length=64, nullable=False)
    status: str = Field(default="processed", max_length=20, nullable=False)
    processed_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC), nullable=False
    )


class EventLogService:
    """Check and register event idempotency."""

    async def check_and_register_idempotent(
        self,
        event_id: str,
        idempotency_key: str,
        event_type: str,
        session: AsyncSession,
    ) -> bool:
        """Return True if already processed; insert log entry if not.

        Args:
            event_id: Event ID from CloudEvent
            idempotency_key: Unique key for dedup
            event_type: Event type string
            session: Async DB session

        Returns:
            True if duplicate (already processed), False if new
        """
        stmt = select(NotificationEventLog).where(
            NotificationEventLog.idempotency_key == idempotency_key
        )
        result = await session.exec(stmt)
        existing = result.first()
        if existing is not None:
            logger.info("Duplicate event detected idempotency_key=%s", idempotency_key)
            return True

        log_entry = NotificationEventLog(
            idempotency_key=idempotency_key,
            event_type=event_type,
        )
        session.add(log_entry)
        try:
            await session.flush()
        except IntegrityError:
            await session.rollback()
            return True

        return False
