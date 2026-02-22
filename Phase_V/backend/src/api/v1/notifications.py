"""Notifications proxy endpoint.

T056: Proxies GET /api/{user_id}/notifications to notification-service
via Dapr Service Invocation.
"""

import logging
import os

import httpx
from fastapi import APIRouter, HTTPException, status

from src.api.deps import AuthorizedUserDep

logger = logging.getLogger(__name__)

DAPR_HTTP_PORT = int(os.environ.get("DAPR_HTTP_PORT", "3500"))

router = APIRouter()


@router.get("", response_model=list[dict])
async def get_notifications(
    user: AuthorizedUserDep,
) -> list[dict]:
    """Retrieve unread notifications for the current user.

    Proxies to notification-service via Dapr Service Invocation.
    Returns empty list on service unavailability (graceful degradation).
    """
    dapr_url = (
        f"http://localhost:{DAPR_HTTP_PORT}/v1.0/invoke/"
        f"notification-service/method/notifications/{user.user_id}"
    )
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(dapr_url, timeout=5.0)
            response.raise_for_status()
            return response.json()
    except httpx.HTTPStatusError as exc:
        if exc.response.status_code == 404:
            return []
        logger.error("Notification service error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Notification service unavailable",
        ) from exc
    except Exception as exc:
        logger.warning("Could not reach notification service: %s", exc)
        return []  # graceful degradation
