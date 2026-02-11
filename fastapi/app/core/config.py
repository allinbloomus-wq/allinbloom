from __future__ import annotations

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False)

    environment: str = Field(default="development", alias="ENVIRONMENT")
    database_url: str = Field(default="", alias="DATABASE_URL")

    auth_secret: str = Field(default="", alias="AUTH_SECRET")
    access_token_expire_minutes: int = Field(default=60 * 24 * 7)
    refresh_token_expire_days: int = Field(default=30, alias="REFRESH_TOKEN_EXPIRE_DAYS")
    refresh_token_cookie_name: str = Field(default="aib_refresh", alias="REFRESH_TOKEN_COOKIE_NAME")
    refresh_token_cookie_samesite: str = Field(default="lax", alias="REFRESH_TOKEN_COOKIE_SAMESITE")

    admin_email: str = Field(default="allinbloom.us@gmail.com", alias="ADMIN_EMAIL")
    resend_api_key: str | None = Field(default=None, alias="RESEND_API_KEY")
    email_from: str = Field(
        default="All in Bloom Floral Studio <allinbloom.us@gmail.com>",
        alias="EMAIL_FROM",
    )
    email_reply_to: str = Field(
        default="allinbloom.us@gmail.com",
        alias="EMAIL_REPLY_TO",
    )

    google_client_id: str | None = Field(default=None, alias="GOOGLE_CLIENT_ID")
    google_client_secret: str | None = Field(
        default=None, alias="GOOGLE_CLIENT_SECRET"
    )

    stripe_secret_key: str | None = Field(default=None, alias="STRIPE_SECRET_KEY")
    stripe_webhook_secret: str | None = Field(
        default=None, alias="STRIPE_WEBHOOK_SECRET"
    )

    site_url: str = Field(default="http://localhost:3000", alias="SITE_URL")

    google_maps_api_key: str | None = Field(
        default=None, alias="GOOGLE_MAPS_API_KEY"
    )
    delivery_base_address: str = Field(
        default="1995 Hicks Rd, Rolling Meadows, IL 60008, USA",
        alias="DELIVERY_BASE_ADDRESS",
    )

    cloudinary_cloud_name: str | None = Field(
        default=None, alias="CLOUDINARY_CLOUD_NAME"
    )
    cloudinary_upload_preset: str | None = Field(
        default=None, alias="CLOUDINARY_UPLOAD_PRESET"
    )

    def normalized_database_url(self) -> str:
        value = self.database_url.strip()
        if value.startswith("postgresql://"):
            return value.replace("postgresql://", "postgresql+psycopg://", 1)
        return value

    def resolved_auth_secret(self) -> str:
        return self.auth_secret

    def resolved_site_url(self) -> str:
        value = self.site_url
        return (value or "http://localhost:3000").rstrip("/")


settings = Settings()
