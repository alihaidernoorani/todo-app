"""Dapr Jobs client for recurring-service.

T031: RecurringJobsClient registers and cancels Dapr Jobs
by calling the alpha HTTP Jobs API.
"""

import logging
import os

import httpx

logger = logging.getLogger(__name__)

DAPR_HTTP_PORT = int(os.environ.get("DAPR_HTTP_PORT", "3500"))


class RecurringJobsClient:
    """Register and cancel Dapr Jobs via the alpha HTTP API."""

    def __init__(self) -> None:
        self._base_url = f"http://localhost:{DAPR_HTTP_PORT}"

    def job_name_for_task(self, task_id: str) -> str:
        """Return the canonical Dapr Job name for a task ID."""
        return f"recurring-task-{task_id}"

    async def register_job(
        self,
        task_id: str,
        rrule: str,
        timezone_iana: str,
        payload: dict,
    ) -> None:
        """Register a Dapr Job for a recurring task.

        Converts the RRULE to a 6-field cron expression then POSTs to Dapr.

        Args:
            task_id: Task UUID string
            rrule: RFC 5545 RRULE string
            timezone_iana: IANA timezone name (informational; Dapr uses UTC)
            payload: Job callback payload
        """
        from dateutil.rrule import rrulestr

        cron = self._rrule_to_cron(rrule)
        job_name = self.job_name_for_task(task_id)
        url = f"{self._base_url}/v1.0-alpha1/jobs/{job_name}"
        body = {
            "schedule": cron,
            "data": payload,
        }
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=body, timeout=5.0)
            response.raise_for_status()
            logger.info("Registered Dapr Job job_name=%s cron=%s", job_name, cron)

    async def cancel_job(self, task_id: str) -> None:
        """Delete a Dapr Job for a recurring task.

        Args:
            task_id: Task UUID string
        """
        job_name = self.job_name_for_task(task_id)
        url = f"{self._base_url}/v1.0-alpha1/jobs/{job_name}"
        async with httpx.AsyncClient() as client:
            response = await client.delete(url, timeout=5.0)
            if response.status_code == 404:
                logger.warning("Job not found: %s", job_name)
                return
            response.raise_for_status()
            logger.info("Cancelled Dapr Job job_name=%s", job_name)

    def _rrule_to_cron(self, rrule_str: str) -> str:
        """Convert a simple RRULE to a 6-field Dapr cron expression.

        6-field format: second minute hour day-of-month month day-of-week
        """
        rrule_upper = rrule_str.upper()
        params: dict[str, str] = {}
        for part in rrule_upper.split(";"):
            if "=" in part:
                k, v = part.split("=", 1)
                params[k.strip()] = v.strip()

        freq = params.get("FREQ", "DAILY")
        byhour = params.get("BYHOUR", "0")
        byminute = params.get("BYMINUTE", "0")
        byday = params.get("BYDAY", "")
        day_map = {"SU": "0", "MO": "1", "TU": "2", "WE": "3", "TH": "4", "FR": "5", "SA": "6"}

        if freq == "HOURLY":
            return f"0 0 */{params.get('INTERVAL', '1')} * * *"

        if freq == "DAILY":
            interval = params.get("INTERVAL", "1")
            hour = byhour.split(",")[0]
            minute = byminute.split(",")[0]
            return (
                f"0 {minute} {hour} * * *"
                if interval == "1"
                else f"0 {minute} {hour} */{interval} * *"
            )

        if freq == "WEEKLY" and byday:
            days = []
            for day_abbr in byday.split(","):
                day_abbr = day_abbr.strip()
                for abbr, num in day_map.items():
                    if day_abbr.endswith(abbr):
                        days.append(num)
                        break
            hour = byhour.split(",")[0]
            minute = byminute.split(",")[0]
            cron_days = ",".join(days) if days else "*"
            return f"0 {minute} {hour} * * {cron_days}"

        if freq == "MONTHLY":
            bymonthday = params.get("BYMONTHDAY", "1")
            hour = byhour.split(",")[0]
            minute = byminute.split(",")[0]
            return f"0 {minute} {hour} {bymonthday.split(',')[0]} * *"

        return "0 0 0 * * *"  # fallback: daily at midnight
