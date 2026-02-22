"""Event publisher for recurring-service.

T034: Publishes task.instance_created events to the task-updates Kafka topic
via the Dapr PubSub HTTP API.
"""

import logging
import os

import httpx

logger = logging.getLogger(__name__)

DAPR_HTTP_PORT = int(os.environ.get("DAPR_HTTP_PORT", "3500"))
PUBSUB_NAME = "pubsub-kafka"


class EventPublisher:
    """Publish events to Kafka via Dapr PubSub HTTP API."""

    def __init__(self) -> None:
        self._base_url = f"http://localhost:{DAPR_HTTP_PORT}"

    async def publish_instance_created(self, task_instance: object) -> None:
        """Publish a task.instance_created event to the task-updates topic.

        Args:
            task_instance: TaskInstance model with id, parent_task_id, user_id,
                           title, priority, scheduled_for_utc, status fields.
        """
        url = f"{self._base_url}/v1.0/publish/{PUBSUB_NAME}/task-updates"
        payload = {
            "type": "task.instance_created",
            "specversion": "1.0",
            "source": "recurring-service",
            "data": {
                "instance_id": str(task_instance.id),  # type: ignore[attr-defined]
                "parent_task_id": str(task_instance.parent_task_id),  # type: ignore[attr-defined]
                "user_id": task_instance.user_id,  # type: ignore[attr-defined]
                "title": task_instance.title,  # type: ignore[attr-defined]
                "priority": task_instance.priority,  # type: ignore[attr-defined]
                "scheduled_for_utc": task_instance.scheduled_for_utc.isoformat(),  # type: ignore[attr-defined]
                "status": task_instance.status,  # type: ignore[attr-defined]
            },
        }
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(url, json=payload, timeout=5.0)
                response.raise_for_status()
                logger.info(
                    "Published task.instance_created instance_id=%s",
                    task_instance.id,  # type: ignore[attr-defined]
                )
            except Exception as exc:
                logger.error("Failed to publish task.instance_created: %s", exc)
                raise
