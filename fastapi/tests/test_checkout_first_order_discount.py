from __future__ import annotations

import os
import unittest

os.environ.setdefault("DATABASE_URL", "sqlite+pysqlite:///:memory:")

from app.api.routes.checkout import _resolve_first_order_discount_percent


class CheckoutFirstOrderDiscountTests(unittest.TestCase):
    def test_applies_when_order_history_has_only_failed_or_canceled_orders(self):
        percent = _resolve_first_order_discount_percent(
            configured_percent=10,
            has_blocking_order_history=False,
            has_any_discount=False,
        )
        self.assertEqual(percent, 10)

    def test_skips_when_configured_percent_is_zero_or_none(self):
        self.assertEqual(
            _resolve_first_order_discount_percent(
                configured_percent=0,
                has_blocking_order_history=False,
                has_any_discount=False,
            ),
            0,
        )
        self.assertEqual(
            _resolve_first_order_discount_percent(
                configured_percent=None,
                has_blocking_order_history=False,
                has_any_discount=False,
            ),
            0,
        )

    def test_skips_when_pending_or_paid_orders_exist(self):
        percent = _resolve_first_order_discount_percent(
            configured_percent=10,
            has_blocking_order_history=True,
            has_any_discount=False,
        )
        self.assertEqual(percent, 0)

    def test_skips_when_other_discount_is_present(self):
        percent = _resolve_first_order_discount_percent(
            configured_percent=10,
            has_blocking_order_history=False,
            has_any_discount=True,
        )
        self.assertEqual(percent, 0)


if __name__ == "__main__":
    unittest.main()
