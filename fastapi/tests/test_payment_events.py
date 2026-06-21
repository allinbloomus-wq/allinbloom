from __future__ import annotations

import os
import unittest

os.environ.setdefault("DATABASE_URL", "sqlite+pysqlite:///:memory:")

from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.models.order import Order
from app.models.payment_event import PaymentEvent
from app.services.payment_events import record_payment_event


class PaymentEventTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite+pysqlite:///:memory:")
        Base.metadata.create_all(self.engine)
        self.Session = sessionmaker(bind=self.engine)
        self.db = self.Session()

    def tearDown(self):
        self.db.close()
        Base.metadata.drop_all(self.engine)
        self.engine.dispose()

    def test_record_payment_event_sanitizes_context_and_persists_timeline(self):
        order = Order(email="buyer@example.com", total_cents=14700)
        self.db.add(order)
        self.db.commit()

        event = record_payment_event(
            self.db,
            order_id=order.id,
            provider="stripe",
            source="server",
            event="stripe_checkout_session_created",
            message="Stripe Checkout session was created.",
            stripe_session_id="cs_test_123",
            context={
                "email": "buyer@example.com",
                "order_status": "PENDING",
                "amount_total": 14700,
            },
        )

        stored = self.db.execute(
            select(PaymentEvent).where(PaymentEvent.id == event.id)
        ).scalar_one()

        self.assertEqual(stored.order_id, order.id)
        self.assertEqual(stored.provider, "stripe")
        self.assertEqual(stored.stripe_session_id, "cs_test_123")
        self.assertEqual(stored.context["email"], "bu***@example.com")
        self.assertEqual(stored.context["amount_total"], 14700)


if __name__ == "__main__":
    unittest.main()
