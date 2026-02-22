"""Recurring task endpoints.

T027: JWT-protected CRUD for recurring task series.
Routes registered under /api/{user_id}/recurring.
"""

import logging
from uuid import UUID

from fastapi import APIRouter, HTTPException, status

from src.api.deps import AuthorizedUserDep, SessionDep
from src.models.recurring import RecurringTask, TaskInstance
from src.schemas.task import RecurringTaskCreate, RecurringTaskResponse, TaskRead
from src.services import task_service
from src.services.dapr_pubsub import dapr_pubsub
from src.services.recurring_task_service import recurring_task_service

from sqlmodel import col, select

logger = logging.getLogger(__name__)

router = APIRouter()


def _to_response(recurring: RecurringTask, task: TaskRead | None = None) -> RecurringTaskResponse:
    """Map RecurringTask model to RecurringTaskResponse schema."""
    next_occ = (
        recurring.next_occurrence_at_utc.isoformat()
        if recurring.next_occurrence_at_utc
        else None
    )
    return RecurringTaskResponse(
        id=recurring.id,
        task_id=recurring.task_id,
        user_id=recurring.user_id,
        series_id=recurring.series_id,
        rrule=recurring.rrule,
        timezone_iana=recurring.timezone_iana,
        recurrence_end_type=recurring.recurrence_end_type,
        recurrence_max_count=recurring.recurrence_max_count,
        recurrence_end_date=recurring.recurrence_end_date,
        status=recurring.status,
        next_occurrence_at=next_occ,
        current_instance_index=recurring.current_instance_index,
        total_occurrences_executed=recurring.total_occurrences_executed,
        created_at=recurring.created_at,
        updated_at=recurring.updated_at,
        task=task,
    )


@router.post("", response_model=RecurringTaskResponse, status_code=status.HTTP_201_CREATED)
async def create_recurring_task(
    body: RecurringTaskCreate,
    session: SessionDep,
    user: AuthorizedUserDep,
) -> RecurringTaskResponse:
    """Create a recurring task series.

    Creates the parent Task, the RecurringTask series record, and registers a Dapr Job.
    Publishes a `recurring.scheduled` event to the `task-events` topic.
    """
    from src.schemas.task import TaskCreate, TaskPriority

    task_in = TaskCreate(
        title=body.title,
        description=body.description,
        priority=body.priority,
        tags=body.tags,
    )
    task = await task_service.create_task(session, user.user_id, task_in)

    try:
        recurring = await recurring_task_service.create_recurring_task(
            task_id=task.id,
            user_id=user.user_id,
            rrule=body.rrule,
            timezone_iana=body.timezone_iana,
            session=session,
            recurrence_end_type=body.recurrence_end_type,
            recurrence_max_count=body.recurrence_max_count,
            recurrence_end_date=body.recurrence_end_date,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc

    # Publish event
    try:
        await dapr_pubsub.publish(
            "task-events",
            {
                "type": "recurring.scheduled",
                "specversion": "1.0",
                "source": "backend",
                "data": {
                    "task_id": str(task.id),
                    "user_id": user.user_id,
                    "rrule": body.rrule,
                    "timezone_iana": body.timezone_iana,
                    "series_id": str(recurring.series_id),
                },
            },
        )
    except Exception as exc:
        logger.warning("Failed to publish recurring.scheduled event: %s", exc)

    return _to_response(recurring, task)


@router.get("/{task_id}", response_model=RecurringTaskResponse)
async def get_recurring_task(
    task_id: UUID,
    session: SessionDep,
    user: AuthorizedUserDep,
) -> RecurringTaskResponse:
    """Get a recurring task series by parent task ID."""
    stmt = select(RecurringTask).where(
        RecurringTask.task_id == task_id,
        RecurringTask.user_id == user.user_id,
    )
    result = await session.exec(stmt)
    recurring = result.first()
    if recurring is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recurring task not found")

    task = await task_service.get_task(session, task_id, user.user_id)
    return _to_response(recurring, task)


@router.patch("/{task_id}", response_model=RecurringTaskResponse)
async def update_recurring_task(
    task_id: UUID,
    body: dict,
    session: SessionDep,
    user: AuthorizedUserDep,
) -> RecurringTaskResponse:
    """Update RRULE or timezone for a recurring task series.

    Deletes and recreates the Dapr Job with the new schedule.
    """
    from datetime import UTC, datetime

    stmt = select(RecurringTask).where(
        RecurringTask.task_id == task_id,
        RecurringTask.user_id == user.user_id,
    )
    result = await session.exec(stmt)
    recurring = result.first()
    if recurring is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recurring task not found")

    if "rrule" in body:
        from src.services.rrule_service import rrule_service
        try:
            rrule_service.parse_rrule(body["rrule"])
        except ValueError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc
        recurring.rrule = body["rrule"]
        recurring.next_occurrence_at_utc = rrule_service.compute_next_occurrence(body["rrule"])

    if "timezone_iana" in body:
        from src.services.rrule_service import rrule_service
        try:
            rrule_service.validate_timezone(body["timezone_iana"])
        except ValueError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc
        recurring.timezone_iana = body["timezone_iana"]

    recurring.updated_at = datetime.now(UTC)
    session.add(recurring)
    await session.flush()

    # Re-register Dapr Job
    from src.services.dapr_jobs import dapr_jobs
    from src.services.rrule_service import rrule_service
    try:
        await dapr_jobs.delete_job(f"recurring-task-{task_id}")
        cron = rrule_service.rrule_to_dapr_cron(recurring.rrule)
        await dapr_jobs.create_job(
            job_name=f"recurring-task-{task_id}",
            schedule=cron,
            data={"task_id": str(task_id), "user_id": user.user_id},
        )
    except Exception as exc:
        logger.warning("Failed to re-register Dapr Job after update: %s", exc)

    return _to_response(recurring)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_recurring_task(
    task_id: UUID,
    session: SessionDep,
    user: AuthorizedUserDep,
) -> None:
    """Cancel a recurring task series."""
    try:
        await recurring_task_service.cancel_recurring_task(task_id, user.user_id, session)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    try:
        await dapr_pubsub.publish(
            "task-events",
            {
                "type": "recurring.cancelled",
                "specversion": "1.0",
                "source": "backend",
                "data": {"task_id": str(task_id), "user_id": user.user_id},
            },
        )
    except Exception as exc:
        logger.warning("Failed to publish recurring.cancelled event: %s", exc)


@router.get("/{task_id}/instances", response_model=list[dict])
async def list_task_instances(
    task_id: UUID,
    session: SessionDep,
    user: AuthorizedUserDep,
    page: int = 1,
    page_size: int = 20,
) -> list[dict]:
    """List task instances for a recurring task series (paginated)."""
    stmt = (
        select(RecurringTask)
        .where(RecurringTask.task_id == task_id, RecurringTask.user_id == user.user_id)
    )
    result = await session.exec(stmt)
    recurring = result.first()
    if recurring is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recurring task not found")

    offset = (page - 1) * page_size
    inst_stmt = (
        select(TaskInstance)
        .where(TaskInstance.parent_task_id == recurring.id)
        .order_by(col(TaskInstance.scheduled_for_utc).desc())
        .offset(offset)
        .limit(page_size)
    )
    inst_result = await session.exec(inst_stmt)
    instances = inst_result.all()

    return [
        {
            "id": str(inst.id),
            "parent_task_id": str(inst.parent_task_id),
            "user_id": inst.user_id,
            "title": inst.title,
            "priority": inst.priority,
            "scheduled_for_utc": inst.scheduled_for_utc.isoformat(),
            "status": inst.status,
            "completed_at": inst.completed_at.isoformat() if inst.completed_at else None,
            "retry_count": inst.retry_count,
            "created_at": inst.created_at.isoformat(),
        }
        for inst in instances
    ]
