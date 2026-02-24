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
MAX_TRANSFORM_DIM = 2400
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


def _normalize_dimension(value: int | None) -> int | None:
    if not value:
        return None
    if value <= 0:
        return None
    return min(value, MAX_TRANSFORM_DIM)


def _build_transform(
    max_width: int | None, max_height: int | None, fmt: str | None
) -> str:
    parts: list[str] = []
    if max_width or max_height:
        parts.append("c_limit")
        if max_width:
            parts.append(f"w_{max_width}")
        if max_height:
            parts.append(f"h_{max_height}")
    if fmt:
        parts.append(f"f_{fmt}")
    if parts:
        parts.append("q_auto")
    return ",".join(parts)


def _apply_transform(url: str, transform: str) -> str:
    if not url or not transform or "/upload/" not in url:
        return url
    return url.replace("/upload/", f"/upload/{transform}/", 1)


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

    normalized_width = _normalize_dimension(max_width)
    normalized_height = _normalize_dimension(max_height)
    transform = _build_transform(normalized_width, normalized_height, normalized_fmt)
    if transform:
        data["transformation"] = transform
    if normalized_fmt:
        data["format"] = normalized_fmt

    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.post(url, data=data, files=files)

    payload = response.json()
    if response.status_code >= 400:
        message = (payload.get("error") or {}).get("message", "Upload failed")
        if response.status_code == 400 and normalized_fmt:
            message = (
                "Cloudinary rejected the WebP transformation. "
                "Allow f_webp,q_auto in the unsigned upload preset or disable "
                "strict transformations."
            )
        raise HTTPException(
            status_code=response.status_code,
            detail=message,
        )

    raw_url = payload.get("secure_url") or payload.get("url") or ""
    return UploadResponse(
        url=_apply_transform(raw_url, transform),
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
