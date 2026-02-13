from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from typing import Any

import httpx
from fastapi import Request

from app.core.config import settings

CRITICAL_LOGGER_NAME = "app.critical"
DEFAULT_BETTERSTACK_INGEST_URL = "https://in.logs.betterstack.com"

_SENSITIVE_KEYS = {
    "address",
    "authorization",
    "code",
    "cookie",
    "delivery_address",
    "email",
    "id_token",
    "message",
    "name",
    "otp",
    "password",
    "phone",
    "refresh_token",
    "token",
    "x_api_key",
}


def _mask_email(value: str) -> str:
    if "@" not in value:
        return "***"
    local, domain = value.split("@", 1)
    if len(local) <= 2:
        return f"{local[:1]}***@{domain}"
    return f"{local[:2]}***@{domain}"


def _mask_phone(value: str) -> str:
    digits = "".join(ch for ch in value if ch.isdigit())
    if len(digits) <= 4:
        return "***"
    return f"***{digits[-4:]}"


def _mask_sensitive(key: str, value: Any) -> Any:
    lowered = key.lower()
    if lowered not in _SENSITIVE_KEYS:
        return value
    if value is None:
        return None
    if "email" in lowered and isinstance(value, str):
        return _mask_email(value)
    if "phone" in lowered and isinstance(value, str):
        return _mask_phone(value)
    return "***"


def sanitize_context(value: Any, parent_key: str = "") -> Any:
    if isinstance(value, dict):
        sanitized: dict[str, Any] = {}
        for key, nested in value.items():
            masked = _mask_sensitive(str(key), nested)
            if masked != nested:
                sanitized[str(key)] = masked
                continue
            sanitized[str(key)] = sanitize_context(nested, str(key))
        return sanitized
    if isinstance(value, list):
        return [sanitize_context(item, parent_key) for item in value[:25]]
    if isinstance(value, tuple):
        return tuple(sanitize_context(item, parent_key) for item in value[:25])
    if isinstance(value, str):
        if parent_key.lower() in _SENSITIVE_KEYS:
            return _mask_sensitive(parent_key, value)
        return value[:500]
    return value


def _extract_request_context(request: Request | None) -> dict[str, Any] | None:
    if request is None:
        return None

    forwarded = request.headers.get("x-forwarded-for", "")
    client_ip = ""
    if forwarded:
        client_ip = forwarded.split(",")[0].strip()
    if not client_ip:
        client_ip = request.headers.get("x-real-ip", "")
    if not client_ip and request.client:
        client_ip = request.client.host

    request_data = {
        "method": request.method,
        "path": request.url.path,
        "request_id": request.headers.get("x-request-id"),
        "client_ip": client_ip or "unknown",
    }
    return sanitize_context(request_data)


class _JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        created_at = datetime.fromtimestamp(record.created, tz=timezone.utc).isoformat()
        payload: dict[str, Any] = {
            "dt": created_at,
            "timestamp": created_at,
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        domain = getattr(record, "domain", None)
        if domain:
            payload["domain"] = domain
        event = getattr(record, "event", None)
        if event:
            payload["event"] = event
        context = getattr(record, "context", None)
        if context:
            payload["context"] = context
        request_data = getattr(record, "request_data", None)
        if request_data:
            payload["request"] = request_data

        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)

        return json.dumps(payload, ensure_ascii=True, separators=(",", ":"))


class _BetterStackHandler(logging.Handler):
    def __init__(self, source_token: str, ingest_url: str) -> None:
        super().__init__()
        self._source_token = source_token
        self._ingest_url = ingest_url.rstrip("/")
        self._client = httpx.Client(timeout=2.5)

    def emit(self, record: logging.LogRecord) -> None:
        try:
            rendered = self.format(record)
            self._client.post(
                self._ingest_url,
                content=rendered.encode("utf-8"),
                headers={
                    "Authorization": f"Bearer {self._source_token}",
                    "Content-Type": "application/json",
                },
            )
        except Exception:
            # Never fail request flow because of observability transport.
            return

    def close(self) -> None:
        self._client.close()
        super().close()


def _resolve_level(name: str) -> int:
    value = (name or "INFO").strip().upper()
    if value in {"DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"}:
        return getattr(logging, value)
    return logging.INFO


def _resolve_ingest_url(raw: str | None) -> str:
    value = (raw or "").strip()
    if not value:
        return DEFAULT_BETTERSTACK_INGEST_URL
    if value.startswith("http://") or value.startswith("https://"):
        return value.rstrip("/")
    return f"https://{value.rstrip('/')}"


def setup_critical_logging() -> None:
    logger = logging.getLogger(CRITICAL_LOGGER_NAME)
    if getattr(logger, "_aib_critical_configured", False):
        return

    logger.setLevel(_resolve_level(settings.log_level))
    logger.propagate = False

    formatter = _JsonFormatter()

    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    source_token = (settings.betterstack_source_token or "").strip()
    if source_token:
        ingest_url = _resolve_ingest_url(settings.betterstack_ingest_url)
        betterstack_handler = _BetterStackHandler(source_token=source_token, ingest_url=ingest_url)
        betterstack_handler.setFormatter(formatter)
        logger.addHandler(betterstack_handler)

    logger._aib_critical_configured = True  # type: ignore[attr-defined]


def infer_domain_from_path(path: str) -> str:
    normalized = (path or "").lower()
    if normalized.startswith("/api/auth"):
        return "auth"
    if normalized.startswith("/api/users"):
        return "auth"
    if normalized.startswith("/api/promotions") or normalized.startswith("/api/settings") or normalized.startswith("/api/upload"):
        return "admin"
    if normalized.startswith("/api/orders"):
        return "payment"
    if normalized.startswith("/api/checkout") or normalized.startswith("/api/stripe"):
        return "payment"
    if normalized.startswith("/api/contact"):
        return "messaging"
    if normalized.startswith("/api/admin") or "/admin/" in normalized:
        return "admin"
    if normalized.startswith("/api/catalog") or normalized.startswith("/api/bouquets"):
        return "cart"
    return "system"


def log_critical_event(
    *,
    domain: str,
    event: str,
    message: str,
    request: Request | None = None,
    context: dict[str, Any] | None = None,
    exc: Exception | None = None,
    level: int = logging.ERROR,
) -> None:
    logger = logging.getLogger(CRITICAL_LOGGER_NAME)

    payload_context = sanitize_context(context or {})
    request_data = _extract_request_context(request)

    extra = {
        "domain": domain,
        "event": event,
        "context": payload_context,
        "request_data": request_data,
    }

    if exc is not None:
        logger.log(level, message, extra=extra, exc_info=(type(exc), exc, exc.__traceback__))
        return
    logger.log(level, message, extra=extra)
