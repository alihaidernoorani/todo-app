"""Notification Service — FastAPI application entry point.

Handles:
- Dapr PubSub subscriptions (POST /events/reminders, POST /events/task-updates)
"""

import json
import logging
from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator


# T074: Structured JSON logging
class _JsonFormatter(logging.Formatter):
    SERVICE = "notification-service"

    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "timestamp": self.formatTime(record, "%Y-%m-%dT%H:%M:%S.%f"),
            "level": record.levelname,
            "service": self.SERVICE,
            "logger": record.name,
            "message": record.getMessage(),
        }
        if record.exc_info:
            payload["exc_info"] = self.formatException(record.exc_info)
        return json.dumps(payload)


_handler = logging.StreamHandler()
_handler.setFormatter(_JsonFormatter())
logging.getLogger().setLevel(logging.INFO)
logging.getLogger().handlers = [_handler]

from fastapi import FastAPI

from app.consumers.reminders import router as reminders_router
from app.consumers.task_updates import router as task_updates_router
from app.db import create_tables

logger = logging.getLogger(__name__)

SERVICE_NAME = "notification-service"


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None]:
    """Application lifespan: startup and shutdown."""
    logger.info("Starting %s", SERVICE_NAME)
    await create_tables()
    yield
    logger.info("Shutting down %s", SERVICE_NAME)


app = FastAPI(
    title="Notification Service",
    description="Kafka consumer and notification delivery handler",
    version="1.0.0",
    lifespan=lifespan,
)


@app.get("/health", tags=["Health"])
async def health_check() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "healthy", "service": SERVICE_NAME}


# Dapr subscription discovery endpoint
@app.get("/dapr/subscribe", tags=["Dapr"])
async def dapr_subscribe() -> list[dict]:
    """Return Dapr subscription configuration."""
    return [
        {
            "pubsubname": "pubsub-kafka",
            "topic": "reminders",
            "route": "/events/reminders",
        },
        {
            "pubsubname": "pubsub-kafka",
            "topic": "task-updates",
            "route": "/events/task-updates",
        },
    ]


# Register routers
app.include_router(reminders_router)
app.include_router(task_updates_router)
