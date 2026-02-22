from __future__ import annotations

from datetime import datetime, timedelta, timezone
import os
import re
import unittest
from unittest.mock import patch

os.environ.setdefault("DATABASE_URL", "sqlite+pysqlite:///:memory:")

from app.core import security
from app.core.config import settings


class SecurityTests(unittest.TestCase):
    def test_generate_and_verify_otp(self):
        generated = security.generate_otp()
        code = generated["code"]
        salt = generated["salt"]
        code_hash = generated["hash"]
        expires_at = generated["expires_at"]

        self.assertRegex(str(code), r"^\d{6}$")
        self.assertRegex(str(salt), r"^[0-9a-f]{32}$")
        self.assertTrue(re.fullmatch(r"[0-9a-f]{64}", str(code_hash)))
        self.assertIsInstance(expires_at, datetime)
        self.assertGreater(expires_at, datetime.now(timezone.utc))
        self.assertTrue(security.verify_otp(str(code), str(salt), str(code_hash)))
        self.assertFalse(security.verify_otp("000000", str(salt), str(code_hash)))

    def test_access_and_refresh_token_roundtrip(self):
        with patch.object(settings, "auth_secret", "unit-test-secret"), patch.object(
            settings, "environment", "test"
        ):
            access = security.create_access_token({"sub": "user-1"}, expires_minutes=5)
            payload = security.decode_access_token(access)
            self.assertEqual(payload["sub"], "user-1")
            self.assertEqual(payload["type"], "access")

            refresh = security.create_refresh_token({"sub": "user-1"}, expires_days=3)
            refresh_payload = security.decode_refresh_token(refresh)
            self.assertEqual(refresh_payload["sub"], "user-1")
            self.assertEqual(refresh_payload["type"], "refresh")

            with self.assertRaises(ValueError):
                security.decode_access_token(refresh)

    def test_checkout_cancel_token_normalizes_values(self):
        with patch.object(settings, "auth_secret", "unit-test-secret"), patch.object(
            settings, "environment", "test"
        ):
            token = security.create_checkout_cancel_token(
                order_id=" order-123 ",
                email=" USER@Example.COM ",
                expires_hours=2,
            )
            payload = security.decode_checkout_cancel_token(token)

        self.assertEqual(payload, {"order_id": "order-123", "email": "user@example.com"})

    def test_checkout_cancel_token_validates_required_fields(self):
        with patch.object(settings, "auth_secret", "unit-test-secret"), patch.object(
            settings, "environment", "test"
        ):
            missing_order = security._encode_token(
                {"email": "user@example.com"},
                timedelta(hours=1),
                "checkout_cancel",
            )
            missing_email = security._encode_token(
                {"order_id": "order-1"},
                timedelta(hours=1),
                "checkout_cancel",
            )

            with self.assertRaisesRegex(ValueError, "missing order_id"):
                security.decode_checkout_cancel_token(missing_order)
            with self.assertRaisesRegex(ValueError, "missing email"):
                security.decode_checkout_cancel_token(missing_email)

    def test_token_encoding_requires_secret_in_production(self):
        with patch.object(settings, "auth_secret", ""), patch.object(
            settings, "environment", "production"
        ):
            with self.assertRaises(RuntimeError):
                security.create_access_token({"sub": "user-1"}, expires_minutes=1)


if __name__ == "__main__":
    unittest.main()
