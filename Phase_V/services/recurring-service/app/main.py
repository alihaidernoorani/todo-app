"""Recurring Service — FastAPI application entry point.

Handles:
- Dapr PubSub subscriptions (POST /events/task-events)
- Dapr Jobs callbacks (POST /job/recurring-task-trigger)
"""

import json
import logging
import os
from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator


# T074: Structured JSON logging
class _JsonFormatter(logging.Formatter):
    SERVICE = "recurring-service"

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
from prometheus_fastapi_instrumentator import Instrumentator

from app.consumers.task_events import router as task_events_router
from app.handlers.job_callback import router as job_callback_router
from app.db import create_tables

logger = logging.getLogger(__name__)

SERVICE_NAME = "recurring-service"


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None]:
    """Application lifespan: startup and shutdown."""
    logger.info("Starting %s", SERVICE_NAME)
    await create_tables()
    yield
    logger.info("Shutting down %s", SERVICE_NAME)


app = FastAPI(
    title="Recurring Service",
    description="Kafka consumer and Dapr Jobs callback handler for recurring tasks",
    version="1.0.0",
    lifespan=lifespan,
)

# Prometheus instrumentation (T022 / T066 pattern)
Instrumentator(group_paths=True, skip_paths=["/health"]).instrument(app).expose(
    app, endpoint="/metrics"
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
            "topic": "task-events",
            "route": "/events/task-events",
        }
    ]


# Register routers
app.include_router(task_events_router)
app.include_router(job_callback_router)
