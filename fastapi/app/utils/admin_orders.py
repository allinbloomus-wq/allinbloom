from __future__ import annotations

from datetime import datetime, timedelta
from zoneinfo import ZoneInfo


ADMIN_TIMEZONE = "America/Chicago"
DAYS_IN_WEEK = 7


def parse_day_key(day_key: str) -> tuple[int, int, int] | None:
    try:
        parts = [int(part) for part in day_key.split("-")]
    except ValueError:
        return None
    if len(parts) != 3:
        return None
    year, month, day = parts
    if not year or not month or not day:
        return None
    return year, month, day


def get_day_key(date: datetime, time_zone: str = ADMIN_TIMEZONE) -> str:
    zone = ZoneInfo(time_zone)
    local = date.astimezone(zone)
    return f"{local.year:04d}-{local.month:02d}-{local.day:02d}"


def add_days_to_day_key(day_key: str, delta: int) -> str:
    parsed = parse_day_key(day_key)
    if not parsed:
        return day_key
    year, month, day = parsed
    date = datetime(year, month, day) + timedelta(days=delta)
    return f"{date.year:04d}-{date.month:02d}-{date.day:02d}"


def get_day_range(day_key: str, time_zone: str = ADMIN_TIMEZONE) -> dict[str, datetime] | None:
    parsed = parse_day_key(day_key)
    if not parsed:
        return None
    year, month, day = parsed
    zone = ZoneInfo(time_zone)
    try:
        start = datetime(year, month, day, tzinfo=zone)
    except ValueError:
        return None
    next_day = start + timedelta(days=1)
    return {"start": start, "end": next_day}


def get_week_range(
    week_start_key: str, time_zone: str = ADMIN_TIMEZONE
) -> dict[str, datetime] | None:
    parsed = parse_day_key(week_start_key)
    if not parsed:
        return None
    year, month, day = parsed
    zone = ZoneInfo(time_zone)
    try:
        start = datetime(year, month, day, tzinfo=zone)
    except ValueError:
        return None
    end = start + timedelta(days=DAYS_IN_WEEK)
    return {"start": start, "end": end}
