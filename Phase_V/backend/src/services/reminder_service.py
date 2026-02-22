"""Reminder service — create, cancel, and suppress reminders.

T047: ReminderService orchestrates one-time reminder lifecycle including
Dapr Jobs registration and suppression when tasks complete early.
"""

import logging
from datetime import UTC, datetime
from uuid import UUID, uuid4

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from src.models.reminder import Reminder
from src.models.task import Task
from src.services.dapr_jobs import dapr_jobs

logger = logging.getLogger(__name__)


class ReminderService:
    """Manage one-time task reminder lifecycle."""

    async def create_reminder(
        self,
        user_id: str,
        task_id: UUID | None,
        task_instance_id: UUID | None,
        scheduled_for: datetime,
        session: AsyncSession,
        reminder_type: str = "in_app",
    ) -> Reminder:
        """Create a reminder and register a Dapr Job.

        Validates that exactly one of task_id or task_instance_id is set,
        and that scheduled_for is in the future.

        Args:
            user_id: Authenticated user's ID
            task_id: Task UUID (mutually exclusive with task_instance_id)
            task_instance_id: TaskInstance UUID (mutually exclusive with task_id)
            scheduled_for: UTC datetime when the reminder fires
            session: Async DB session
            reminder_type: "in_app" | "email"

        Returns:
            Persisted Reminder instance

        Raises:
            ValueError: On validation failure
        """
        # Validate exactly one reference
        if (task_id is None) == (task_instance_id is None):
            raise ValueError(
                "Exactly one of task_id or task_instance_id must be set"
            )

        now = datetime.now(UTC)
        if scheduled_for.replace(tzinfo=UTC) <= now:
            raise ValueError("scheduled_for must be in the future")

        scheduled_utc = scheduled_for.replace(tzinfo=UTC)

        reminder = Reminder(
            id=uuid4(),
            user_id=user_id,
            task_id=task_id,
            task_instance_id=task_instance_id,
            reminder_type=reminder_type,
            scheduled_for_utc=scheduled_utc,
            status="pending",
        )
        session.add(reminder)
        await session.flush()
        await session.refresh(reminder)

        # Register Dapr one-shot job
        try:
            await dapr_jobs.create_job(
                job_name=f"reminder-{reminder.id}",
                schedule=scheduled_utc.isoformat(),  # ISO-8601 dueTime for one-shot
                data={
                    "reminder_id": str(reminder.id),
                    "user_id": user_id,
                    "task_id": str(task_id) if task_id else None,
                    "task_instance_id": str(task_instance_id) if task_instance_id else None,
                },
            )
            logger.info(
                "Registered Dapr Job for reminder reminder_id=%s scheduled=%s",
                reminder.id,
                scheduled_utc.isoformat(),
            )
        except Exception as exc:
            logger.warning(
                "Failed to register Dapr Job for reminder reminder_id=%s error=%s",
                reminder.id,
                str(exc),
            )

        return reminder

    async def cancel_reminder(
        self,
        reminder_id: UUID,
        user_id: str,
        session: AsyncSession,
    ) -> None:
        """Cancel a pending reminder.

        Args:
            reminder_id: Reminder UUID
            user_id: Authenticated user's ID
            session: Async DB session

        Raises:
            ValueError: If reminder is not found or not owned by user
        """
        stmt = select(Reminder).where(
            Reminder.id == reminder_id,
            Reminder.user_id == user_id,
        )
        result = await session.exec(stmt)
        reminder = result.first()
        if reminder is None:
            raise ValueError(f"Reminder not found: {reminder_id}")

        reminder.status = "cancelled"
        session.add(reminder)
        await session.flush()

        try:
            await dapr_jobs.delete_job(f"reminder-{reminder_id}")
        except Exception as exc:
            logger.warning(
                "Failed to delete Dapr Job for reminder reminder_id=%s error=%s",
                reminder_id,
                str(exc),
            )

    async def suppress_if_completed(
        self,
        reminder_id: UUID,
        session: AsyncSession,
    ) -> bool:
        """Cancel a reminder if its associated task is already completed.

        Args:
            reminder_id: Reminder UUID
            session: Async DB session

        Returns:
            True if suppressed (task completed), False otherwise
        """
        stmt = select(Reminder).where(Reminder.id == reminder_id)
        result = await session.exec(stmt)
        reminder = result.first()
        if reminder is None:
            return False

        # Check associated task completion
        if reminder.task_id is not None:
            task_stmt = select(Task).where(Task.id == reminder.task_id)
            task_result = await session.exec(task_stmt)
            task = task_result.first()
            if task is not None and task.is_completed:
                reminder.status = "cancelled"
                session.add(reminder)
                await session.flush()
                logger.info(
                    "Suppressed reminder reminder_id=%s because task is completed",
                    reminder_id,
                )
                return True

        return False


# Module-level singleton
reminder_service = ReminderService()
