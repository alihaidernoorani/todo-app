"""Dapr Jobs callback handler for recurring-service.

T032: Handles POST /job/recurring-task-trigger — fired by Dapr
at each scheduled occurrence of a recurring task.
"""

import json
import logging
from datetime import UTC, datetime

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.db import get_session
from app.services.instance_creator import InstanceCreator
from app.services.publisher import EventPublisher

logger = logging.getLogger(__name__)

router = APIRouter()
_publisher = EventPublisher()
_instance_creator = InstanceCreator(publisher=_publisher)


@router.post("/job/recurring-task-trigger")
async def recurring_task_trigger(body: dict) -> JSONResponse:
    """Receive Dapr Jobs callback for a recurring task occurrence.

    Body contains a `data` field that may be JSON-encoded string.
    Expected fields: task_id, user_id, scheduled_time (ISO-8601 or None)
    """
    # Dapr Jobs passes data as JSON-encoded string or dict
    raw_data = body.get("data", {})
    if isinstance(raw_data, str):
        try:
            data = json.loads(raw_data)
        except (json.JSONDecodeError, ValueError):
            data = {}
    else:
        data = raw_data

    task_id = data.get("task_id")
    user_id = data.get("user_id", "")

    # Use provided scheduled_time or current UTC time
    scheduled_str = data.get("scheduled_time")
    if scheduled_str:
        try:
            scheduled_time = datetime.fromisoformat(scheduled_str).replace(tzinfo=UTC)
        except (ValueError, TypeError):
            scheduled_time = datetime.now(UTC)
    else:
        scheduled_time = datetime.now(UTC)

    if not task_id:
        logger.error("Missing task_id in Dapr Jobs callback body=%s", body)
        return JSONResponse(status_code=200, content={"status": "DROP"})

    logger.info(
        "Dapr Jobs callback task_id=%s scheduled_time=%s",
        task_id,
        scheduled_time.isoformat(),
    )

    try:
        async for session in get_session():
            result = await _instance_creator.create_instance_idempotent(
                task_id=task_id,
                user_id=user_id,
                scheduled_time=scheduled_time,
                session=session,
            )
            return JSONResponse(content={"status": "SUCCESS", "result": result})
    except Exception as exc:
        logger.error(
            "Failed to create TaskInstance task_id=%s error=%s", task_id, str(exc)
        )
        return JSONResponse(status_code=200, content={"status": "RETRY"})
