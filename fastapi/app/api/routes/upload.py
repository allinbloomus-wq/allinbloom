from __future__ import annotations

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
import httpx

from app.api.deps import require_admin
from app.core.config import settings
from app.schemas.upload import UploadResponse

router = APIRouter(prefix="/api/upload", tags=["upload"])


@router.post("", response_model=UploadResponse)
async def upload_image(file: UploadFile = File(...), _admin=Depends(require_admin)):
    allowed = {"image/jpeg", "image/png", "image/webp", "image/gif"}
    if file.content_type not in allowed:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File is too large")

    if not settings.cloudinary_cloud_name or not settings.cloudinary_upload_preset:
        raise HTTPException(status_code=500, detail="Cloudinary not configured")

    url = f"https://api.cloudinary.com/v1_1/{settings.cloudinary_cloud_name}/image/upload"
    data = {"upload_preset": settings.cloudinary_upload_preset}
    files = {"file": (file.filename, content, file.content_type)}

    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.post(url, data=data, files=files)

    payload = response.json()
    if response.status_code >= 400:
        raise HTTPException(
            status_code=response.status_code,
            detail=(payload.get("error") or {}).get("message", "Upload failed"),
        )

    return UploadResponse(url=payload.get("secure_url") or payload.get("url"), public_id=payload.get("public_id"))
