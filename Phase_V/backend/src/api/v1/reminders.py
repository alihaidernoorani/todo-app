"""Reminder endpoints.

T048: JWT-protected CRUD for one-time task reminders.
Publishes reminder.scheduled / reminder.cancelled events to Dapr PubSub.
"""

import logging
from uuid import UUID

from fastapi import APIRouter, HTTPException, status

from src.api.deps import AuthorizedUserDep, SessionDep
from src.schemas.task import ReminderCreate, ReminderResponse
from src.services.dapr_pubsub import dapr_pubsub
from src.services.reminder_service import reminder_service

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("", response_model=ReminderResponse, status_code=status.HTTP_201_CREATED)
async def create_reminder(
    body: ReminderCreate,
    session: SessionDep,
    user: AuthorizedUserDep,
) -> ReminderResponse:
    """Create a one-time reminder for a task.

    Validates exactly one of task_id/task_instance_id is set.
    Registers a Dapr Job for the scheduled time.
    Publishes reminder.scheduled event to reminders topic.
    """
    try:
        reminder = await reminder_service.create_reminder(
            user_id=user.user_id,
            task_id=body.task_id,
            task_instance_id=body.task_instance_id,
            scheduled_for=body.scheduled_for,
            session=session,
            reminder_type=body.reminder_type,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc

    # Publish event to Kafka reminders topic
    try:
        await dapr_pubsub.publish(
            "reminders",
            {
                "type": "reminder.scheduled",
                "specversion": "1.0",
                "source": "backend",
                "data": {
                    "reminder_id": str(reminder.id),
                    "user_id": user.user_id,
                    "task_id": str(reminder.task_id) if reminder.task_id else None,
                    "scheduled_for_utc": reminder.scheduled_for_utc.isoformat(),
                },
            },
        )
    except Exception as exc:
        logger.warning("Failed to publish reminder.scheduled: %s", exc)

    return ReminderResponse(
        id=reminder.id,
        user_id=reminder.user_id,
        task_id=reminder.task_id,
        task_instance_id=reminder.task_instance_id,
        reminder_type=reminder.reminder_type,
        scheduled_for_utc=reminder.scheduled_for_utc,
        status=reminder.status,
        sent_at=reminder.sent_at,
        created_at=reminder.created_at,
    )


@router.delete("/{reminder_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_reminder(
    reminder_id: UUID,
    session: SessionDep,
    user: AuthorizedUserDep,
) -> None:
    """Cancel a pending reminder and delete its Dapr Job."""
    try:
        await reminder_service.cancel_reminder(reminder_id, user.user_id, session)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    # Publish cancellation event
    try:
        await dapr_pubsub.publish(
            "reminders",
            {
                "type": "reminder.cancelled",
                "specversion": "1.0",
                "source": "backend",
                "data": {"reminder_id": str(reminder_id), "user_id": user.user_id},
            },
        )
    except Exception as exc:
        logger.warning("Failed to publish reminder.cancelled: %s", exc)
