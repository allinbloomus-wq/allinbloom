from __future__ import annotations

import os
import unittest

os.environ.setdefault("DATABASE_URL", "sqlite+pysqlite:///:memory:")

from app.api.routes.checkout import _resolve_first_order_discount_percent


class CheckoutFirstOrderDiscountTests(unittest.TestCase):
    def test_applies_when_user_has_no_paid_orders_and_no_prior_first_discount(self):
        percent = _resolve_first_order_discount_percent(
            configured_percent=10,
            paid_orders_count=0,
            has_existing_first_order_discount=False,
            has_any_discount=False,
        )
        self.assertEqual(percent, 10)

    def test_skips_when_configured_percent_is_zero_or_none(self):
        self.assertEqual(
            _resolve_first_order_discount_percent(
                configured_percent=0,
                paid_orders_count=0,
                has_existing_first_order_discount=False,
                has_any_discount=False,
            ),
            0,
        )
        self.assertEqual(
            _resolve_first_order_discount_percent(
                configured_percent=None,
                paid_orders_count=0,
                has_existing_first_order_discount=False,
                has_any_discount=False,
            ),
            0,
        )

    def test_skips_when_paid_orders_exist(self):
        percent = _resolve_first_order_discount_percent(
            configured_percent=10,
            paid_orders_count=1,
            has_existing_first_order_discount=False,
            has_any_discount=False,
        )
        self.assertEqual(percent, 0)

    def test_skips_when_existing_first_order_discount_exists(self):
        percent = _resolve_first_order_discount_percent(
            configured_percent=10,
            paid_orders_count=0,
            has_existing_first_order_discount=True,
            has_any_discount=False,
        )
        self.assertEqual(percent, 0)

    def test_skips_when_other_discount_is_present(self):
        percent = _resolve_first_order_discount_percent(
            configured_percent=10,
            paid_orders_count=0,
            has_existing_first_order_discount=False,
            has_any_discount=True,
        )
        self.assertEqual(percent, 0)


if __name__ == "__main__":
    unittest.main()
