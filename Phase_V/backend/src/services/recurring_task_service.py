"""Recurring task service — create, cancel, and advance recurring task series.

T026: RecurringTaskService orchestrates the lifecycle of recurring tasks,
including RRULE validation, Dapr Jobs registration, and DB persistence.
"""

import logging
from datetime import UTC, datetime
from uuid import UUID, uuid4

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from src.models.recurring import RecurringTask
from src.services.dapr_jobs import dapr_jobs
from src.services.rrule_service import rrule_service

logger = logging.getLogger(__name__)


class RecurringTaskService:
    """Manage recurring task series lifecycle."""

    async def create_recurring_task(
        self,
        task_id: UUID,
        user_id: str,
        rrule: str,
        timezone_iana: str,
        session: AsyncSession,
        recurrence_end_type: str | None = None,
        recurrence_max_count: int | None = None,
        recurrence_end_date: datetime | None = None,
    ) -> RecurringTask:
        """Create a new recurring task series.

        Validates the RRULE and timezone, computes the first occurrence,
        persists the RecurringTask, and registers a Dapr Job.

        Args:
            task_id: Parent Task ID (1:1 with RecurringTask)
            user_id: Authenticated user's ID
            rrule: RFC 5545 RRULE string
            timezone_iana: IANA timezone name
            session: Async DB session
            recurrence_end_type: "count" | "date" | None
            recurrence_max_count: Max occurrences (when end_type="count")
            recurrence_end_date: End date (when end_type="date")

        Returns:
            Persisted RecurringTask instance

        Raises:
            ValueError: On invalid RRULE or timezone
        """
        rrule_service.parse_rrule(rrule)
        rrule_service.validate_timezone(timezone_iana)

        next_occurrence = rrule_service.compute_next_occurrence(rrule)

        recurring = RecurringTask(
            id=uuid4(),
            task_id=task_id,
            user_id=user_id,
            series_id=uuid4(),
            rrule=rrule,
            timezone_iana=timezone_iana,
            recurrence_end_type=recurrence_end_type,
            recurrence_max_count=recurrence_max_count,
            recurrence_end_date=recurrence_end_date,
            status="active",
            next_occurrence_at_utc=next_occurrence,
        )
        session.add(recurring)
        await session.flush()
        await session.refresh(recurring)

        # Register Dapr Job for this recurring series
        cron_expr = rrule_service.rrule_to_dapr_cron(rrule)
        try:
            await dapr_jobs.create_job(
                job_name=f"recurring-task-{task_id}",
                schedule=cron_expr,
                data={
                    "task_id": str(task_id),
                    "user_id": user_id,
                    "series_id": str(recurring.series_id),
                },
            )
            logger.info(
                "Registered Dapr Job for recurring task task_id=%s cron=%s",
                task_id,
                cron_expr,
            )
        except Exception as exc:
            logger.error(
                "Failed to register Dapr Job for recurring task task_id=%s error=%s",
                task_id,
                str(exc),
            )
            # Don't fail the task creation — job can be re-registered later
            # Log the error but continue

        return recurring

    async def cancel_recurring_task(
        self,
        task_id: UUID,
        user_id: str,
        session: AsyncSession,
    ) -> None:
        """Cancel a recurring task series.

        Sets status to 'cancelled' and deletes the associated Dapr Job.

        Args:
            task_id: Task ID of the recurring series
            user_id: Authenticated user's ID (for scoping)
            session: Async DB session

        Raises:
            ValueError: If the recurring task is not found
        """
        statement = select(RecurringTask).where(
            RecurringTask.task_id == task_id,
            RecurringTask.user_id == user_id,
        )
        result = await session.exec(statement)
        recurring = result.first()
        if recurring is None:
            raise ValueError(f"RecurringTask not found for task_id={task_id}")

        recurring.status = "cancelled"
        recurring.updated_at = datetime.now(UTC)
        session.add(recurring)
        await session.flush()

        try:
            await dapr_jobs.delete_job(f"recurring-task-{task_id}")
        except Exception as exc:
            logger.warning(
                "Failed to delete Dapr Job for recurring task task_id=%s error=%s",
                task_id,
                str(exc),
            )

    async def advance_next_occurrence(
        self,
        recurring: RecurringTask,
        session: AsyncSession,
    ) -> RecurringTask:
        """Recompute and advance the next_occurrence_at_utc after an instance fires.

        Args:
            recurring: Current RecurringTask record
            session: Async DB session

        Returns:
            Updated RecurringTask with new next_occurrence_at_utc
        """
        current_next = recurring.next_occurrence_at_utc or datetime.now(UTC)
        new_next = rrule_service.compute_next_occurrence(recurring.rrule, after=current_next)

        recurring.next_occurrence_at_utc = new_next
        recurring.current_instance_index += 1
        recurring.total_occurrences_executed += 1
        recurring.updated_at = datetime.now(UTC)

        # Check end conditions
        if recurring.recurrence_end_type == "count":
            if (
                recurring.recurrence_max_count is not None
                and recurring.total_occurrences_executed >= recurring.recurrence_max_count
            ):
                recurring.status = "completed"
                recurring.next_occurrence_at_utc = None

        elif recurring.recurrence_end_type == "date":
            if (
                recurring.recurrence_end_date is not None
                and new_next is not None
                and new_next > recurring.recurrence_end_date
            ):
                recurring.status = "completed"
                recurring.next_occurrence_at_utc = None

        elif new_next is None:
            recurring.status = "completed"

        session.add(recurring)
        await session.flush()
        await session.refresh(recurring)
        return recurring


# Module-level singleton
recurring_task_service = RecurringTaskService()
