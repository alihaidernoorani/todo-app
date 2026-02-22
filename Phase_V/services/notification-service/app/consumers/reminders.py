"""Reminders Kafka consumer for notification-service.

T052: Handles Dapr PubSub CloudEvents on the reminders topic.
"""

import hashlib
import logging

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.db import get_session
from app.services.event_log import EventLogService
from app.services.notifier import NotificationService

logger = logging.getLogger(__name__)

router = APIRouter()
_notifier = NotificationService()
_event_log = EventLogService()


@router.post("/events/reminders")
async def handle_reminders(body: dict) -> JSONResponse:
    """Receive Dapr CloudEvent for reminders topic."""
    event_type = body.get("type", "")
    data = body.get("data", {})
    event_id = body.get("id", "")

    if event_type != "reminder.scheduled":
        logger.info("Ignoring event type=%s on reminders topic", event_type)
        return JSONResponse(content={"status": "DROP"})

    # Idempotency key
    reminder_id = data.get("reminder_id", event_id)
    idempotency_key = hashlib.sha256(f"reminder:{reminder_id}".encode()).hexdigest()[:16]

    try:
        async for session in get_session():
            already_processed = await _event_log.check_and_register_idempotent(
                event_id=event_id,
                idempotency_key=idempotency_key,
                event_type=event_type,
                session=session,
            )
            if already_processed:
                return JSONResponse(content={"status": "SUCCESS"})

            await _notifier.deliver_notification(data, session)
            return JSONResponse(content={"status": "SUCCESS"})
    except Exception as exc:
        logger.error("Failed to process reminder event error=%s", exc)
        return JSONResponse(content={"status": "RETRY"})
