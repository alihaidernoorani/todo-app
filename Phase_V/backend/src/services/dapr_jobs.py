"""Dapr Jobs service — create/delete/get scheduled jobs via Dapr HTTP API.

T013: DaprJobsService wraps the alpha Dapr Jobs API (/v1.0-alpha1/jobs/).
Note: Python Dapr SDK v1.14 does not expose Jobs API; we call via httpx.
"""

import logging
import os

import httpx

logger = logging.getLogger(__name__)

DAPR_HTTP_PORT = int(os.environ.get("DAPR_HTTP_PORT", "3500"))


class DaprJobsService:
    """Create, delete, and retrieve Dapr Jobs via the alpha HTTP API."""

    def __init__(self) -> None:
        self._base_url = f"http://localhost:{DAPR_HTTP_PORT}"

    async def create_job(
        self,
        job_name: str,
        schedule: str,
        data: dict,
        ttl: str | None = None,
    ) -> None:
        """Create or update a Dapr Job.

        Args:
            job_name: Unique job identifier (e.g. "recurring-task-{task_id}")
            schedule: Cron expression (6-field) or ISO-8601 dueTime for one-shot
            data: Arbitrary JSON payload passed back to the callback handler
            ttl: Optional TTL for one-shot jobs (ISO-8601 duration, e.g. "1h")
        """
        url = f"{self._base_url}/v1.0-alpha1/jobs/{job_name}"
        body: dict = {"schedule": schedule, "data": data}
        if ttl:
            body["ttl"] = ttl

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(url, json=body, timeout=5.0)
                response.raise_for_status()
                logger.info("Created Dapr Job job_name=%s schedule=%s", job_name, schedule)
            except httpx.HTTPStatusError as exc:
                logger.error(
                    "Failed to create job job_name=%s status=%s body=%s",
                    job_name,
                    exc.response.status_code,
                    exc.response.text,
                )
                raise

    async def delete_job(self, job_name: str) -> None:
        """Delete a Dapr Job.

        Args:
            job_name: Job identifier to delete

        Raises:
            httpx.HTTPStatusError: On non-2xx response (404 is tolerated)
        """
        url = f"{self._base_url}/v1.0-alpha1/jobs/{job_name}"
        async with httpx.AsyncClient() as client:
            try:
                response = await client.delete(url, timeout=5.0)
                if response.status_code == 404:
                    logger.warning("Job not found for deletion job_name=%s", job_name)
                    return
                response.raise_for_status()
                logger.info("Deleted Dapr Job job_name=%s", job_name)
            except httpx.HTTPStatusError as exc:
                logger.error(
                    "Failed to delete job job_name=%s status=%s",
                    job_name,
                    exc.response.status_code,
                )
                raise

    async def get_job(self, job_name: str) -> dict | None:
        """Get a Dapr Job by name.

        Args:
            job_name: Job identifier to retrieve

        Returns:
            Job details dict or None if not found
        """
        url = f"{self._base_url}/v1.0-alpha1/jobs/{job_name}"
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, timeout=5.0)
                if response.status_code == 404:
                    return None
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as exc:
                logger.error(
                    "Failed to get job job_name=%s status=%s",
                    job_name,
                    exc.response.status_code,
                )
                raise


# Module-level singleton
dapr_jobs = DaprJobsService()
