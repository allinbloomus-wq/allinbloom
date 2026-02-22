from __future__ import annotations

import os
import unittest
from unittest.mock import AsyncMock, patch

os.environ.setdefault("DATABASE_URL", "sqlite+pysqlite:///:memory:")

from app.services import delivery


class _FakeResponse:
    def __init__(self, *, status_code: int, payload: dict):
        self.status_code = status_code
        self._payload = payload

    def json(self):
        return self._payload


class _FakeAsyncClient:
    def __init__(self, *args, **kwargs):
        self._response = _FakeResponse(
            status_code=200,
            payload={
                "status": "OK",
                "rows": [
                    {
                        "elements": [
                            {
                                "status": "OK",
                                "distance": {"value": 40234, "text": "25 mi"},
                            }
                        ]
                    }
                ],
            },
        )

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        return False

    async def get(self, url, params):  # noqa: ARG002
        return self._response


class _FarDistanceAsyncClient(_FakeAsyncClient):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._response = _FakeResponse(
            status_code=200,
            payload={
                "status": "OK",
                "rows": [
                    {
                        "elements": [
                            {
                                "status": "OK",
                                "distance": {"value": 56327, "text": "35 mi"},
                            }
                        ]
                    }
                ],
            },
        )


class DeliveryValidationTests(unittest.TestCase):
    def test_validate_address_format(self):
        self.assertEqual(
            delivery._validate_address_format("  "),
            "Address is too short. Please provide a complete address.",
        )
        self.assertEqual(
            delivery._validate_address_format("Main Street, Chicago, IL"),
            "Please include a street number.",
        )
        self.assertEqual(
            delivery._validate_address_format("123 Main Street Chicago IL"),
            "Please provide a complete address with city and state (e.g., 123 Main St, Chicago, IL).",
        )
        self.assertIsNone(delivery._validate_address_format("123 Main St, Chicago, IL"))

    def test_get_delivery_fee_cents_tiers(self):
        self.assertEqual(delivery.get_delivery_fee_cents(0), 0)
        self.assertEqual(delivery.get_delivery_fee_cents(10), 0)
        self.assertEqual(delivery.get_delivery_fee_cents(10.01), 1500)
        self.assertEqual(delivery.get_delivery_fee_cents(20), 1500)
        self.assertEqual(delivery.get_delivery_fee_cents(25), 3000)
        self.assertEqual(delivery.get_delivery_fee_cents(30), 3000)
        self.assertIsNone(delivery.get_delivery_fee_cents(30.1))


class DeliveryQuoteTests(unittest.IsolatedAsyncioTestCase):
    async def test_delivery_quote_requires_address(self):
        quote = await delivery.get_delivery_quote("   ")
        self.assertFalse(quote.ok)
        self.assertEqual(quote.error, "Delivery address is required.")

    async def test_delivery_quote_requires_google_maps_configuration(self):
        with patch.object(delivery.settings, "google_maps_api_key", None):
            quote = await delivery.get_delivery_quote("123 Main St, Chicago, IL")
        self.assertFalse(quote.ok)
        self.assertEqual(quote.error, "Delivery is not configured.")

    async def test_delivery_quote_success_path(self):
        with patch.object(delivery.settings, "google_maps_api_key", "test-key"), patch.object(
            delivery.settings, "delivery_base_address", "1995 Hicks Rd, Rolling Meadows, IL"
        ), patch(
            "app.services.delivery._validate_and_geocode",
            AsyncMock(return_value=(True, "123 Main St, Chicago, IL", None)),
        ), patch("app.services.delivery.httpx.AsyncClient", _FakeAsyncClient):
            quote = await delivery.get_delivery_quote("123 Main St, Chicago, IL")

        self.assertTrue(quote.ok)
        self.assertEqual(quote.fee_cents, 3000)
        self.assertEqual(quote.distance_text, "25 mi")
        self.assertEqual(quote.formatted_address, "123 Main St, Chicago, IL")

    async def test_delivery_quote_rejects_addresses_outside_radius(self):
        with patch.object(delivery.settings, "google_maps_api_key", "test-key"), patch.object(
            delivery.settings, "delivery_base_address", "1995 Hicks Rd, Rolling Meadows, IL"
        ), patch(
            "app.services.delivery._validate_and_geocode",
            AsyncMock(return_value=(True, "500 Faraway Ave, Rockford, IL", None)),
        ), patch("app.services.delivery.httpx.AsyncClient", _FarDistanceAsyncClient):
            quote = await delivery.get_delivery_quote("500 Faraway Ave, Rockford, IL")

        self.assertFalse(quote.ok)
        self.assertIsNotNone(quote.error)
        self.assertIn("within 30 miles", quote.error)


if __name__ == "__main__":
    unittest.main()
