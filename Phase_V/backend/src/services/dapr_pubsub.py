"""Dapr PubSub service — publish events via Dapr HTTP API.

T012: DaprPubSubService publishes CloudEvents to Kafka topics
via the Dapr sidecar HTTP API endpoint.
"""

import logging
import os

import httpx

logger = logging.getLogger(__name__)

DAPR_HTTP_PORT = int(os.environ.get("DAPR_HTTP_PORT", "3500"))
PUBSUB_NAME = "pubsub-kafka"


class DaprPubSubService:
    """Publishes events to Kafka topics via Dapr PubSub HTTP API."""

    def __init__(self) -> None:
        self._base_url = f"http://localhost:{DAPR_HTTP_PORT}"

    async def publish(self, topic: str, data: dict) -> None:
        """Publish an event to a Dapr PubSub topic.

        Args:
            topic: Kafka topic name (e.g. "task-events", "reminders")
            data: Event payload dict (serialised as CloudEvent data)

        Raises:
            httpx.HTTPStatusError: If Dapr returns a non-2xx response
        """
        url = f"{self._base_url}/v1.0/publish/{PUBSUB_NAME}/{topic}"
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(url, json=data, timeout=5.0)
                response.raise_for_status()
                logger.info(
                    "Published event to topic=%s event_type=%s",
                    topic,
                    data.get("type", "unknown"),
                )
            except httpx.HTTPStatusError as exc:
                logger.error(
                    "Failed to publish to topic=%s status=%s body=%s",
                    topic,
                    exc.response.status_code,
                    exc.response.text,
                )
                raise
            except httpx.RequestError as exc:
                logger.error(
                    "Dapr sidecar unreachable when publishing to topic=%s error=%s",
                    topic,
                    str(exc),
                )
                raise


# Module-level singleton for use across the backend
dapr_pubsub = DaprPubSubService()
