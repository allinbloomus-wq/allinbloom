from __future__ import annotations

import os
import unittest

os.environ.setdefault("DATABASE_URL", "sqlite+pysqlite:///:memory:")

from app.services.payment_diagnostics import (
    build_exception_failure_diagnostics,
    build_paypal_failure_diagnostics,
    build_stripe_payment_intent_failure_diagnostics,
    build_stripe_session_failure_diagnostics,
    build_timeout_failure_diagnostics,
    payment_failure_values,
    payment_success_values,
)


class PaymentDiagnosticsTests(unittest.TestCase):
    def test_build_stripe_payment_intent_failure_diagnostics_uses_last_error(self):
        diagnostics = build_stripe_payment_intent_failure_diagnostics(
            {
                "id": "pi_123",
                "status": "requires_payment_method",
                "last_payment_error": {
                    "code": "card_declined",
                    "decline_code": "insufficient_funds",
                    "message": "Your card has insufficient funds.",
                    "type": "card_error",
                },
            },
            event_type="payment_intent.payment_failed",
        )

        self.assertEqual(diagnostics.stage, "stripe_payment_intent")
        self.assertEqual(diagnostics.code, "card_declined")
        self.assertEqual(diagnostics.message, "Your card has insufficient funds.")
        self.assertIn("Decline code: insufficient_funds", diagnostics.details or "")

    def test_build_stripe_session_failure_diagnostics_marks_expired_session(self):
        diagnostics = build_stripe_session_failure_diagnostics(
            {
                "id": "cs_123",
                "status": "expired",
                "payment_status": "unpaid",
                "payment_intent": None,
            },
            event_type="checkout.session.expired",
        )

        self.assertEqual(diagnostics.stage, "stripe_checkout")
        self.assertEqual(diagnostics.code, "session_expired")
        self.assertIn("session expired", diagnostics.message.lower())

    def test_build_paypal_failure_diagnostics_uses_capture_reason(self):
        diagnostics = build_paypal_failure_diagnostics(
            {
                "id": "paypal_123",
                "status": "COMPLETED",
                "purchase_units": [
                    {
                        "amount": {"value": "149.00", "currency_code": "USD"},
                        "custom_id": "ord_123",
                        "payments": {
                            "captures": [
                                {
                                    "id": "cap_123",
                                    "status": "DECLINED",
                                    "status_details": {"reason": "BUYER_COMPLAINT"},
                                    "processor_response": {
                                        "response_code": "0500",
                                        "avs_code": "A",
                                        "cvv_code": "N",
                                    },
                                }
                            ]
                        },
                    }
                ],
            },
            event_type="PAYMENT.CAPTURE.DECLINED",
        )

        self.assertEqual(diagnostics.stage, "paypal_capture")
        self.assertEqual(diagnostics.code, "DECLINED")
        self.assertIn("declined", diagnostics.message.lower())
        self.assertIn("BUYER_COMPLAINT", diagnostics.details or "")

    def test_payment_value_helpers_set_and_clear_failure_fields(self):
        failed = payment_failure_values(
            build_timeout_failure_diagnostics(has_provider_session=True)
        )
        paid = payment_success_values()

        self.assertEqual(failed["status"].value, "FAILED")
        self.assertIsNotNone(failed["payment_failure_message"])
        self.assertIsNotNone(failed["payment_failed_at"])
        self.assertEqual(paid["status"].value, "PAID")
        self.assertIsNone(paid["payment_failure_message"])
        self.assertIsNone(paid["payment_failed_at"])

    def test_build_exception_failure_diagnostics_captures_exception_metadata(self):
        diagnostics = build_exception_failure_diagnostics(
            stage="stripe_checkout_create",
            code="stripe_checkout_session_failed",
            message="Failed to create the Stripe Checkout session.",
            exc=RuntimeError("gateway timeout"),
            provider="stripe",
        )

        self.assertEqual(diagnostics.stage, "stripe_checkout_create")
        self.assertEqual(diagnostics.code, "stripe_checkout_session_failed")
        self.assertIn("gateway timeout", diagnostics.details or "")


if __name__ == "__main__":
    unittest.main()
