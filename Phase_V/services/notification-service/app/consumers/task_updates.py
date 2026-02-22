"""Task updates Kafka consumer for notification-service.

T073: Handles Dapr PubSub CloudEvents on the task-updates topic.
Logs task.instance_created and task.status_changed events for observability.
"""

import logging

from fastapi import APIRouter
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/events/task-updates")
async def handle_task_updates(body: dict) -> JSONResponse:
    """Receive Dapr CloudEvent for task-updates topic.

    Phase V: logs event for observability; no UI push yet.
    """
    event_type = body.get("type", "")
    data = body.get("data", {})

    if event_type == "task.instance_created":
        logger.info(
            "task.instance_created instance_id=%s parent_task_id=%s user_id=%s",
            data.get("instance_id"),
            data.get("parent_task_id"),
            data.get("user_id"),
        )
    elif event_type == "task.status_changed":
        logger.info(
            "task.status_changed task_id=%s new_status=%s user_id=%s",
            data.get("task_id"),
            data.get("new_status"),
            data.get("user_id"),
        )
    else:
        logger.info("Unknown task-updates event type=%s", event_type)

    return JSONResponse(content={"status": "SUCCESS"})
