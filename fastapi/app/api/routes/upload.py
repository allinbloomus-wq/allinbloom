from __future__ import annotations

from datetime import datetime, timedelta
import logging

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
import httpx

from app.api.deps import require_admin
from app.core.config import settings
from app.core.critical_logging import log_critical_event
from app.schemas.upload import UploadResponse

router = APIRouter(prefix="/api/upload", tags=["upload"])

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024
REVIEW_UPLOAD_WINDOW = timedelta(minutes=30)
REVIEW_UPLOAD_LIMIT = 20
review_upload_rate_limit: dict[str, dict[str, object]] = {}


def _get_client_key(request: Request) -> str:
    if settings.trust_proxy_headers:
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            first = forwarded.split(",")[0].strip()
            if first:
                return first
        real_ip = (request.headers.get("x-real-ip") or "").strip()
        if real_ip:
            return real_ip
    return request.client.host if request.client and request.client.host else "unknown"


def _allow_review_upload(key: str) -> bool:
    now = datetime.utcnow()
    entry = review_upload_rate_limit.get(key)
    if not entry or entry["reset_at"] <= now:
        review_upload_rate_limit[key] = {"count": 1, "reset_at": now + REVIEW_UPLOAD_WINDOW}
        return True
    if entry["count"] >= REVIEW_UPLOAD_LIMIT:
        return False
    entry["count"] += 1
    return True


async def _read_and_validate_file(file: UploadFile) -> bytes:
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    content = await file.read()
    if len(content) > MAX_IMAGE_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="File is too large")

    return content


async def _upload_to_cloudinary(
    file: UploadFile,
    content: bytes,
    *,
    max_width: int | None = None,
    max_height: int | None = None,
    fmt: str | None = None,
) -> UploadResponse:
    if not settings.cloudinary_cloud_name or not settings.cloudinary_upload_preset:
        raise HTTPException(status_code=500, detail="Cloudinary not configured")

    url = f"https://api.cloudinary.com/v1_1/{settings.cloudinary_cloud_name}/image/upload"
    data = {"upload_preset": settings.cloudinary_upload_preset}
    files = {"file": (file.filename, content, file.content_type)}

    normalized_fmt = (fmt or "").strip().lower() or None
    if not normalized_fmt and file.content_type != "image/gif":
        normalized_fmt = "webp"

    if normalized_fmt:
        data["format"] = normalized_fmt

    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.post(url, data=data, files=files)

    payload = response.json()
    if response.status_code >= 400:
        message = (payload.get("error") or {}).get("message", "Upload failed")
        raise HTTPException(status_code=response.status_code, detail=message)

    raw_url = payload.get("secure_url") or payload.get("url") or ""
    return UploadResponse(
        url=raw_url,
        public_id=payload.get("public_id"),
    )


@router.post("", response_model=UploadResponse)
async def upload_image(
    file: UploadFile = File(...),
    max_width: int | None = Form(None),
    max_height: int | None = Form(None),
    format: str | None = Form(None),
    _admin=Depends(require_admin),
):
    content = await _read_and_validate_file(file)
    return await _upload_to_cloudinary(
        file, content, max_width=max_width, max_height=max_height, fmt=format
    )


@router.post("/review", response_model=UploadResponse)
async def upload_review_image(
    request: Request,
    file: UploadFile = File(...),
    max_width: int | None = Form(None),
    max_height: int | None = Form(None),
    format: str | None = Form(None),
):
    key = _get_client_key(request)
    if not _allow_review_upload(key):
        log_critical_event(
            domain="personal_data",
            event="review_image_upload_rate_limited",
            message="Review image upload blocked by rate limit.",
            request=request,
            level=logging.WARNING,
        )
        raise HTTPException(
            status_code=429,
            detail="Too many uploads. Please try again later.",
        )

    content = await _read_and_validate_file(file)
    return await _upload_to_cloudinary(
        file,
        content,
        max_width=max_width,
        max_height=max_height,
        fmt=format,
    )
