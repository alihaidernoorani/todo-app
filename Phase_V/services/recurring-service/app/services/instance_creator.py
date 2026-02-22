"""Idempotent TaskInstance creator for recurring-service.

T033: InstanceCreator creates TaskInstances with idempotency enforcement
via ProcessedEventLog.
"""

import hashlib
import logging
from datetime import UTC, datetime
from uuid import UUID, uuid4

from sqlalchemy.exc import IntegrityError
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.event_log import ProcessedEventLog
from app.models.task_instance import TaskInstance

logger = logging.getLogger(__name__)


class InstanceCreator:
    """Create TaskInstances idempotently using ProcessedEventLog."""

    def __init__(self, publisher: object) -> None:
        self._publisher = publisher

    def _build_idempotency_key(
        self, user_id: str, task_id: str, scheduled_time: datetime
    ) -> str:
        """Compute a 16-char hex idempotency key."""
        raw = f"{user_id}:{task_id}:{scheduled_time.isoformat()}"
        return hashlib.sha256(raw.encode()).hexdigest()[:16]

    async def create_instance_idempotent(
        self,
        task_id: str,
        user_id: str,
        scheduled_time: datetime,
        session: AsyncSession,
        title: str = "Recurring Task",
        priority: str = "Medium",
    ) -> dict:
        """Create a TaskInstance with idempotency guard.

        Algorithm:
        1. Compute idempotency_key
        2. Check ProcessedEventLog — return cached result_id if found
        3. Insert ProcessedEventLog(status=processing)
        4. Create TaskInstance in DB
        5. Update ProcessedEventLog(status=processed, result_id=instance_id)
        6. Publish task.instance_created event

        Args:
            task_id: Recurring task's task_id (UUID string)
            user_id: Owning user's ID
            scheduled_time: UTC datetime this instance is scheduled for
            session: Async DB session
            title: Task title for the instance
            priority: Task priority

        Returns:
            dict with "instance_id" and "status" ("created" | "duplicate")
        """
        idempotency_key = self._build_idempotency_key(user_id, task_id, scheduled_time)

        # Check for existing log entry
        existing_stmt = select(ProcessedEventLog).where(
            ProcessedEventLog.idempotency_key == idempotency_key
        )
        existing_result = await session.exec(existing_stmt)
        existing_log = existing_result.first()

        if existing_log is not None and existing_log.status == "processed":
            logger.info(
                "Duplicate event detected, returning cached result idempotency_key=%s result_id=%s",
                idempotency_key,
                existing_log.result_id,
            )
            return {"instance_id": existing_log.result_id, "status": "duplicate"}

        # Find parent recurring task
        from sqlmodel import select as sq_select
        from sqlalchemy import text

        # Get the parent recurring_task.id by task_id
        parent_query = await session.exec(
            sq_select(text("id FROM recurring_tasks WHERE task_id = :tid")).bindparams(tid=task_id)
            if False  # placeholder; use raw query below
            else sq_select(text("1")).where(text("1=1"))
        )
        # Simpler: use raw SQL
        raw_result = await session.exec(
            sq_select(text("id")).select_from(text("recurring_tasks")).where(
                text("task_id = :tid")
            ).bindparams(tid=task_id)
        )
        parent_rows = raw_result.all()
        parent_id = parent_rows[0][0] if parent_rows else None

        if parent_id is None:
            logger.error("Cannot find recurring_task for task_id=%s", task_id)
            raise ValueError(f"RecurringTask not found for task_id={task_id}")

        # Insert ProcessedEventLog with status=processing
        event_log = ProcessedEventLog(
            id=uuid4(),
            event_id=idempotency_key,
            idempotency_key=idempotency_key,
            event_type="task.instance_created",
            status="processing",
            event_timestamp=datetime.now(UTC),
            expires_at=None,
        )
        session.add(event_log)
        try:
            await session.flush()
        except IntegrityError:
            await session.rollback()
            logger.warning(
                "Concurrent duplicate detected for idempotency_key=%s", idempotency_key
            )
            return {"instance_id": None, "status": "duplicate"}

        # Create TaskInstance
        instance = TaskInstance(
            id=uuid4(),
            parent_task_id=UUID(str(parent_id)),
            user_id=user_id,
            title=title,
            priority=priority,
            scheduled_for_utc=scheduled_time,
            status="pending",
        )
        session.add(instance)
        await session.flush()
        await session.refresh(instance)

        # Update event log to processed
        event_log.status = "processed"
        event_log.result_id = str(instance.id)
        event_log.processed_at = datetime.now(UTC)
        session.add(event_log)
        await session.flush()

        # Publish event (best-effort)
        try:
            await self._publisher.publish_instance_created(instance)
        except Exception as exc:
            logger.error("Failed to publish task.instance_created: %s", exc)

        logger.info(
            "Created TaskInstance instance_id=%s task_id=%s scheduled=%s",
            instance.id,
            task_id,
            scheduled_time.isoformat(),
        )
        return {"instance_id": str(instance.id), "status": "created"}
