"""Task events Kafka consumer for recurring-service.

T030: Handles Dapr PubSub CloudEvents on the task-events topic.
Routes recurring.scheduled → register_recurring_job
       recurring.cancelled → cancel_recurring_job
"""

import logging

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.services.dapr_jobs_client import RecurringJobsClient

logger = logging.getLogger(__name__)

router = APIRouter()
_jobs_client = RecurringJobsClient()


@router.post("/events/task-events")
async def handle_task_events(body: dict) -> JSONResponse:
    """Receive Dapr CloudEvent for task-events topic.

    Returns:
        {"status": "SUCCESS"} — event processed
        {"status": "RETRY"}   — transient error; Dapr will retry
        {"status": "DROP"}    — non-retriable error; discard
    """
    event_type = body.get("type", "")
    data = body.get("data", {})

    logger.info("Received task-event type=%s", event_type)

    if event_type == "recurring.scheduled":
        return await _handle_recurring_scheduled(data)
    elif event_type == "recurring.cancelled":
        return await _handle_recurring_cancelled(data)
    else:
        logger.info("Ignoring unknown event type=%s", event_type)
        return JSONResponse(content={"status": "DROP"})


async def _handle_recurring_scheduled(data: dict) -> JSONResponse:
    """Register a Dapr Job for a newly scheduled recurring task."""
    task_id = data.get("task_id")
    user_id = data.get("user_id")
    rrule = data.get("rrule")
    timezone_iana = data.get("timezone_iana", "UTC")

    if not task_id or not rrule:
        logger.error("Missing task_id or rrule in recurring.scheduled event data=%s", data)
        return JSONResponse(content={"status": "DROP"})

    try:
        await _jobs_client.register_job(
            task_id=task_id,
            rrule=rrule,
            timezone_iana=timezone_iana,
            payload={
                "task_id": task_id,
                "user_id": user_id,
                "scheduled_time": None,  # filled at callback time
            },
        )
        return JSONResponse(content={"status": "SUCCESS"})
    except Exception as exc:
        logger.error("Failed to register Dapr Job for task_id=%s error=%s", task_id, exc)
        return JSONResponse(content={"status": "RETRY"})


async def _handle_recurring_cancelled(data: dict) -> JSONResponse:
    """Cancel a Dapr Job for a cancelled recurring task."""
    task_id = data.get("task_id")
    if not task_id:
        return JSONResponse(content={"status": "DROP"})

    try:
        await _jobs_client.cancel_job(task_id)
        return JSONResponse(content={"status": "SUCCESS"})
    except Exception as exc:
        logger.error("Failed to cancel Dapr Job for task_id=%s error=%s", task_id, exc)
        return JSONResponse(content={"status": "RETRY"})
