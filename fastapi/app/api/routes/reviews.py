from __future__ import annotations

from datetime import datetime, timedelta
import logging
import re

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_admin
from app.core.critical_logging import log_critical_event
from app.models.review import Review
from app.schemas.review import (
    ReviewAdminOut,
    ReviewCountOut,
    ReviewCreateAdmin,
    ReviewCreatePublic,
    ReviewDeleteOut,
    ReviewPublicOut,
    ReviewToggleActiveOut,
    ReviewToggleReadOut,
    ReviewUpdateAdmin,
)

router = APIRouter(prefix="/api", tags=["reviews"])

PUBLIC_RATE_WINDOW = timedelta(minutes=30)
PUBLIC_RATE_LIMIT = 8
NAME_MAX_LENGTH = 80
EMAIL_MAX_LENGTH = 254
TEXT_MAX_LENGTH = 1800
IMAGE_URL_MAX_LENGTH = 1200

rate_limit: dict[str, dict[str, object]] = {}
EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _get_client_key(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.headers.get("x-real-ip") or "unknown"


def _allow_public_create(key: str) -> bool:
    now = datetime.utcnow()
    entry = rate_limit.get(key)
    if not entry or entry["reset_at"] <= now:
        rate_limit[key] = {"count": 1, "reset_at": now + PUBLIC_RATE_WINDOW}
        return True
    if entry["count"] >= PUBLIC_RATE_LIMIT:
        return False
    entry["count"] += 1
    return True


def _normalize_name(value: str | None) -> str:
    normalized = (value or "").strip()
    if not normalized:
        raise HTTPException(status_code=400, detail="Name is required.")
    if len(normalized) > NAME_MAX_LENGTH:
        raise HTTPException(status_code=400, detail="Name is too long.")
    return normalized


def _normalize_email(value: str | None) -> str:
    normalized = (value or "").strip().lower()
    if not normalized:
        raise HTTPException(status_code=400, detail="Email is required.")
    if len(normalized) > EMAIL_MAX_LENGTH:
        raise HTTPException(status_code=400, detail="Email is too long.")
    if not EMAIL_PATTERN.match(normalized):
        raise HTTPException(status_code=400, detail="Invalid email format.")
    return normalized


def _normalize_text(value: str | None) -> str:
    normalized = (value or "").strip()
    if not normalized:
        raise HTTPException(status_code=400, detail="Review text is required.")
    if len(normalized) > TEXT_MAX_LENGTH:
        raise HTTPException(status_code=400, detail="Review text is too long.")
    return normalized


def _normalize_image(value: str | None) -> str | None:
    normalized = (value or "").strip()
    if not normalized:
        return None
    if len(normalized) > IMAGE_URL_MAX_LENGTH:
        raise HTTPException(status_code=400, detail="Image URL is too long.")
    return normalized


def _normalize_rating(value: int | None) -> int:
    rating = int(value or 0)
    if rating < 1 or rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5.")
    return rating


@router.get("/reviews", response_model=list[ReviewPublicOut])
def list_reviews(db: Session = Depends(get_db)):
    return (
        db.execute(
            select(Review)
            .where(Review.is_active.is_(True))
            .order_by(Review.created_at.desc())
        )
        .scalars()
        .all()
    )


@router.post(
    "/reviews",
    response_model=ReviewPublicOut,
    status_code=status.HTTP_201_CREATED,
)
def create_review(
    payload: ReviewCreatePublic,
    request: Request,
    db: Session = Depends(get_db),
):
    key = _get_client_key(request)
    if not _allow_public_create(key):
        log_critical_event(
            domain="messaging",
            event="review_rate_limited",
            message="Review create request blocked by rate limit.",
            request=request,
            level=logging.WARNING,
        )
        raise HTTPException(
            status_code=429,
            detail="Too many requests. Please try again later.",
        )

    review = Review(
        name=_normalize_name(payload.name),
        email=_normalize_email(payload.email),
        rating=_normalize_rating(payload.rating),
        text=_normalize_text(payload.text),
        image=_normalize_image(payload.image),
        is_active=True,
        is_read=False,
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return review


@router.get("/admin/reviews", response_model=list[ReviewAdminOut])
def list_admin_reviews(
    include_hidden: bool = Query(default=True),
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    query = select(Review)
    if not include_hidden:
        query = query.where(Review.is_active.is_(True))
    query = query.order_by(Review.created_at.desc())
    return db.execute(query).scalars().all()


@router.get("/admin/reviews/new-count", response_model=ReviewCountOut)
def get_new_reviews_count(
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    count = db.execute(
        select(func.count()).select_from(Review).where(Review.is_read.is_(False))
    ).scalar_one()
    return ReviewCountOut(count=count)


@router.get("/admin/reviews/{review_id}", response_model=ReviewAdminOut)
def get_admin_review(
    review_id: str,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    review = db.get(Review, review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Not found")
    return review


@router.post(
    "/admin/reviews",
    response_model=ReviewAdminOut,
    status_code=status.HTTP_201_CREATED,
)
def create_admin_review(
    payload: ReviewCreateAdmin,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    review = Review(
        name=_normalize_name(payload.name),
        email=_normalize_email(payload.email),
        rating=_normalize_rating(payload.rating),
        text=_normalize_text(payload.text),
        image=_normalize_image(payload.image),
        is_active=bool(payload.is_active),
        is_read=bool(payload.is_read),
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return review


@router.patch("/admin/reviews/{review_id}", response_model=ReviewAdminOut)
def update_admin_review(
    review_id: str,
    payload: ReviewUpdateAdmin,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    review = db.get(Review, review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Not found")

    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        if key == "name":
            review.name = _normalize_name(value)
        elif key == "email":
            review.email = _normalize_email(value)
        elif key == "rating":
            review.rating = _normalize_rating(value)
        elif key == "text":
            review.text = _normalize_text(value)
        elif key == "image":
            review.image = _normalize_image(value)
        elif key == "is_active":
            review.is_active = bool(value)
        elif key == "is_read":
            review.is_read = bool(value)

    db.commit()
    db.refresh(review)
    return review


@router.patch("/admin/reviews/{review_id}/toggle-read", response_model=ReviewToggleReadOut)
def toggle_review_read(
    review_id: str,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    review = db.get(Review, review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Not found")
    review.is_read = not bool(review.is_read)
    db.commit()
    db.refresh(review)
    return ReviewToggleReadOut(is_read=bool(review.is_read))


@router.patch(
    "/admin/reviews/{review_id}/toggle-active",
    response_model=ReviewToggleActiveOut,
)
def toggle_review_active(
    review_id: str,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    review = db.get(Review, review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Not found")
    review.is_active = not bool(review.is_active)
    db.commit()
    db.refresh(review)
    return ReviewToggleActiveOut(is_active=bool(review.is_active))


@router.delete("/admin/reviews/{review_id}", response_model=ReviewDeleteOut)
def delete_admin_review(
    review_id: str,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    review = db.get(Review, review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(review)
    db.commit()
    return ReviewDeleteOut(deleted=True)
