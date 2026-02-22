"""Notification delivery service.

T053: NotificationService delivers in-app notifications, checking task
completion via Dapr Service Invocation before delivering.
"""

import logging
import os
from datetime import UTC, datetime
from uuid import uuid4

import httpx
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.notification import Notification

logger = logging.getLogger(__name__)

DAPR_HTTP_PORT = int(os.environ.get("DAPR_HTTP_PORT", "3500"))


class NotificationService:
    """Deliver in-app notifications via Dapr Service Invocation."""

    async def deliver_notification(
        self,
        event: dict,
        session: AsyncSession,
    ) -> None:
        """Deliver a reminder notification.

        Checks if associated task is already completed via Dapr Service Invocation.
        If completed → skip delivery.
        Otherwise → insert Notification record with status=delivered.

        Args:
            event: CloudEvent data dict with reminder_id, user_id, task_id, etc.
            session: Async DB session
        """
        reminder_id = event.get("reminder_id", "")
        user_id = event.get("user_id", "")
        task_id = event.get("task_id")

        # Check task completion via Dapr Service Invocation to backend
        if task_id:
            is_completed = await self._check_task_completed(task_id)
            if is_completed:
                logger.info(
                    "Reminder suppressed — task already completed task_id=%s reminder_id=%s",
                    task_id,
                    reminder_id,
                )
                return

        # Deliver notification
        notification = Notification(
            id=uuid4(),
            user_id=user_id,
            task_id=task_id,
            reminder_id=reminder_id,
            title="Task Reminder",
            body=f"Reminder for task {task_id or 'unknown'}",
            status="unread",
            delivered_at=datetime.now(UTC),
        )
        session.add(notification)
        await session.flush()
        logger.info(
            "Delivered notification notification_id=%s user_id=%s",
            notification.id,
            user_id,
        )

    async def get_user_notifications(
        self, user_id: str, session: AsyncSession
    ) -> list[Notification]:
        """Return all notifications for a user.

        Args:
            user_id: User ID to filter by
            session: Async DB session

        Returns:
            List of Notification records
        """
        stmt = select(Notification).where(Notification.user_id == user_id)
        result = await session.exec(stmt)
        return list(result.all())

    async def _check_task_completed(self, task_id: str) -> bool:
        """Check if a task is completed via Dapr Service Invocation.

        Calls GET /api/{task_id} on the backend service via Dapr sidecar.

        Args:
            task_id: Task UUID string

        Returns:
            True if task.is_completed, False otherwise or on error
        """
        dapr_url = (
            f"http://localhost:{DAPR_HTTP_PORT}/v1.0/invoke/backend/method/api/tasks/{task_id}"
        )
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(dapr_url, timeout=3.0)
                if response.status_code == 200:
                    data = response.json()
                    return data.get("is_completed", False)
                return False
        except Exception as exc:
            logger.warning(
                "Could not check task completion task_id=%s error=%s", task_id, exc
            )
            return False
