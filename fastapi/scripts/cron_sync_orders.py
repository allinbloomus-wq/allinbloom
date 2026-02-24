from __future__ import annotations

import logging
import os
import sys
from pathlib import Path

from sqlalchemy import text

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.core.critical_logging import log_critical_event, setup_critical_logging
from app.core.database import SessionLocal, engine
from app.services.orders import sync_pending_orders


CRON_LOCK_ID = 701264913
_NO_LOCK = object()


def _acquire_advisory_lock():
    if engine.dialect.name != "postgresql":
        return _NO_LOCK
    conn = engine.connect()
    try:
        locked = conn.execute(
            text("SELECT pg_try_advisory_lock(:lock_id)"), {"lock_id": CRON_LOCK_ID}
        ).scalar()
    except Exception:
        conn.close()
        raise
    if not locked:
        conn.close()
        return None
    return conn


def _release_advisory_lock(conn) -> None:
    if engine.dialect.name == "postgresql":
        try:
            conn.execute(
                text("SELECT pg_advisory_unlock(:lock_id)"), {"lock_id": CRON_LOCK_ID}
            )
        except Exception:
            pass
    conn.close()


def _resolve_limit() -> int:
    raw = os.environ.get("CRON_SYNC_LIMIT") or "200"
    try:
        return max(1, int(raw))
    except ValueError:
        return 200


def main() -> None:
    setup_critical_logging()
    lock_conn = None
    try:
        lock_conn = _acquire_advisory_lock()
    except Exception as exc:
        log_critical_event(
            domain="payment",
            event="cron_lock_error",
            message="Cron sync failed to acquire advisory lock.",
            exc=exc,
        )
        raise

    if lock_conn is None:
        log_critical_event(
            domain="payment",
            event="cron_sync_skipped",
            message="Cron sync skipped; another worker holds the lock.",
            level=logging.INFO,
        )
        return

    db = SessionLocal()
    try:
        updates = sync_pending_orders(db, limit=_resolve_limit())
        log_critical_event(
            domain="payment",
            event="cron_sync_completed",
            message="Cron sync completed.",
            context={"updated": len(updates)},
            level=logging.INFO,
        )
    except Exception as exc:
        log_critical_event(
            domain="payment",
            event="cron_sync_failed",
            message="Cron sync failed.",
            exc=exc,
        )
        raise
    finally:
        db.close()
        if lock_conn not in (None, _NO_LOCK):
            _release_advisory_lock(lock_conn)


if __name__ == "__main__":
    main()
