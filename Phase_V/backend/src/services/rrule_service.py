"""RRULE parsing and scheduling utilities.

T025: RRuleService handles RFC 5545 RRULE validation, next-occurrence
computation, RRULE→Dapr cron conversion, and timezone validation.
"""

import logging
from datetime import UTC, datetime
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from dateutil.rrule import rrulestr

logger = logging.getLogger(__name__)


class RRuleService:
    """RRULE parsing, next-occurrence computation, and cron conversion."""

    def parse_rrule(self, rrule_str: str) -> None:
        """Validate an RFC 5545 RRULE string.

        Args:
            rrule_str: RRULE string, e.g. "FREQ=WEEKLY;BYDAY=FR;BYHOUR=14"

        Raises:
            ValueError: If the RRULE string is invalid or unparseable
        """
        try:
            rrulestr(rrule_str, ignoretz=True)
        except Exception as exc:
            raise ValueError(f"Invalid RRULE: {rrule_str!r} — {exc}") from exc

    def compute_next_occurrence(
        self,
        rrule_str: str,
        after: datetime | None = None,
    ) -> datetime | None:
        """Compute the next occurrence of an RRULE after a given datetime.

        Args:
            rrule_str: RFC 5545 RRULE string
            after: Reference datetime (defaults to now UTC)

        Returns:
            Next occurrence as UTC datetime, or None if the series is exhausted
        """
        reference = after or datetime.now(UTC)
        # Strip tzinfo for dateutil if reference is timezone-aware
        reference_naive = reference.replace(tzinfo=None)
        try:
            rule = rrulestr(rrule_str, ignoretz=True)
            next_dt = rule.after(reference_naive)
            if next_dt is None:
                return None
            # Return as UTC-aware datetime
            return next_dt.replace(tzinfo=UTC)
        except Exception as exc:
            raise ValueError(f"Failed to compute next occurrence: {exc}") from exc

    def rrule_to_dapr_cron(self, rrule_str: str) -> str:
        """Convert a simple RRULE to a 6-field Dapr Jobs cron expression.

        Supports: FREQ=DAILY, FREQ=WEEKLY (with BYDAY), FREQ=HOURLY.
        For complex RRULEs, returns a daily fallback with a warning.

        6-field cron format for Dapr: second minute hour day-of-month month day-of-week

        Args:
            rrule_str: RFC 5545 RRULE string

        Returns:
            6-field cron string compatible with Dapr Jobs API
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

        # Map RRULE day abbreviations to cron day-of-week numbers (0=Sun)
        day_map = {"SU": "0", "MO": "1", "TU": "2", "WE": "3", "TH": "4", "FR": "5", "SA": "6"}

        if freq == "HOURLY":
            return f"0 0 */{params.get('INTERVAL', '1')} * * *"

        if freq == "DAILY":
            interval = params.get("INTERVAL", "1")
            hour = byhour.split(",")[0]
            minute = byminute.split(",")[0]
            if interval == "1":
                return f"0 {minute} {hour} * * *"
            return f"0 {minute} {hour} */{interval} * *"

        if freq == "WEEKLY" and byday:
            days = []
            for day_abbr in byday.split(","):
                day_abbr = day_abbr.strip()
                # Strip position prefix (e.g. "1MO" → "MO")
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

        # Fallback: daily at midnight
        logger.warning(
            "Complex RRULE cannot be converted to simple cron; using daily fallback. rrule=%s",
            rrule_str,
        )
        return "0 0 0 * * *"

    def validate_timezone(self, tz_name: str) -> None:
        """Validate an IANA timezone name.

        Args:
            tz_name: IANA timezone string, e.g. "America/New_York"

        Raises:
            ValueError: If the timezone name is not recognised
        """
        try:
            ZoneInfo(tz_name)
        except ZoneInfoNotFoundError as exc:
            raise ValueError(f"Unknown timezone: {tz_name!r}") from exc


# Module-level singleton
rrule_service = RRuleService()
