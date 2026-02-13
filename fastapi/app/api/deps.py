from __future__ import annotations

import logging

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.critical_logging import log_critical_event
from app.core.database import SessionLocal
from app.core.security import decode_access_token
from app.models.user import User
from app.models.enums import Role


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


security = HTTPBearer(auto_error=False)


def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    if not credentials or credentials.scheme.lower() != "bearer":
        log_critical_event(
            domain="auth",
            event="missing_bearer_token",
            message="Protected endpoint called without bearer token.",
            request=request,
            level=logging.WARNING,
        )
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")
    try:
        payload = decode_access_token(credentials.credentials)
    except Exception:
        log_critical_event(
            domain="auth",
            event="invalid_access_token",
            message="Access token failed validation.",
            request=request,
            level=logging.WARNING,
        )
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")

    user_id = payload.get("sub") or payload.get("user_id")
    email = payload.get("email")
    stmt = None
    if user_id:
        stmt = select(User).where(User.id == str(user_id))
    elif email:
        stmt = select(User).where(User.email == str(email))
    if stmt is None:
        log_critical_event(
            domain="auth",
            event="token_without_identity",
            message="Token payload does not include user identity.",
            request=request,
            level=logging.WARNING,
        )
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")
    user = db.execute(stmt).scalars().first()
    if not user:
        log_critical_event(
            domain="auth",
            event="token_user_not_found",
            message="Token resolved to unknown user.",
            request=request,
            level=logging.WARNING,
        )
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")
    return user


def require_admin(request: Request, user: User = Depends(get_current_user)) -> User:
    if user.role != Role.ADMIN:
        log_critical_event(
            domain="admin",
            event="unauthorized_admin_access",
            message="Non-admin user attempted to access admin endpoint.",
            request=request,
            context={"user_id": user.id},
            level=logging.WARNING,
        )
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized")
    return user
