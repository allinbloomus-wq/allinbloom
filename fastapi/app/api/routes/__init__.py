from app.api.routes.auth import router as auth_router
from app.api.routes.bouquets import router as bouquets_router
from app.api.routes.catalog import router as catalog_router
from app.api.routes.checkout import router as checkout_router
from app.api.routes.contact import router as contact_router
from app.api.routes.delivery import router as delivery_router
from app.api.routes.orders import router as orders_router
from app.api.routes.paypal import router as paypal_router
from app.api.routes.promotions import router as promotions_router
from app.api.routes.reviews import router as reviews_router
from app.api.routes.settings import router as settings_router
from app.api.routes.stripe_webhook import router as stripe_webhook_router
from app.api.routes.upload import router as upload_router
from app.api.routes.users import router as users_router

__all__ = [
    "auth_router",
    "bouquets_router",
    "catalog_router",
    "checkout_router",
    "contact_router",
    "delivery_router",
    "orders_router",
    "paypal_router",
    "promotions_router",
    "reviews_router",
    "settings_router",
    "stripe_webhook_router",
    "upload_router",
    "users_router",
]
