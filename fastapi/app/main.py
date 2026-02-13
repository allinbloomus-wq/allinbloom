from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import (
    auth_router,
    bouquets_router,
    catalog_router,
    checkout_router,
    contact_router,
    delivery_router,
    orders_router,
    promotions_router,
    settings_router,
    stripe_webhook_router,
    upload_router,
    users_router,
)
from app.core.config import settings
from app.core.critical_logging import infer_domain_from_path, log_critical_event, setup_critical_logging

setup_critical_logging()

app = FastAPI(title="All in Bloom FastAPI")

origins = [
    settings.resolved_site_url(),
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(dict.fromkeys(origins)),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(bouquets_router)
app.include_router(catalog_router)
app.include_router(checkout_router)
app.include_router(contact_router)
app.include_router(delivery_router)
app.include_router(orders_router)
app.include_router(promotions_router)
app.include_router(settings_router)
app.include_router(stripe_webhook_router)
app.include_router(upload_router)
app.include_router(users_router)


@app.middleware("http")
async def log_unhandled_exceptions(request: Request, call_next):
    try:
        return await call_next(request)
    except Exception as exc:
        log_critical_event(
            domain=infer_domain_from_path(request.url.path),
            event="unhandled_exception",
            message="Unhandled server exception.",
            request=request,
            context={"path": request.url.path},
            exc=exc,
        )
        raise


@app.on_event("startup")
def validate_runtime_config() -> None:
    if not settings.resolved_auth_secret():
        raise RuntimeError("AUTH_SECRET must be configured for non-development environments.")


@app.get("/health")
def health():
    return {"ok": True}
