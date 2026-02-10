import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/db";
import { sendAdminOrderEmail, sendCustomerOrderEmail } from "@/lib/email";

export async function POST(request: Request) {
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecret || !webhookSecret) {
    return NextResponse.json(
      { error: "Stripe webhook is not configured." },
      { status: 400 }
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "Missing Stripe signature." },
      { status: 400 }
    );
  }

  const body = await request.text();
  const stripe = new Stripe(stripeSecret);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error("Stripe webhook signature verification failed", error);
    return NextResponse.json(
      { error: "Invalid signature." },
      { status: 400 }
    );
  }

  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded"
  ) {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;
    if (!orderId) {
      return NextResponse.json({ received: true });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) {
      return NextResponse.json({ received: true });
    }

    const isPaid =
      session.payment_status === "paid" && session.status === "complete";
    const amountMatches =
      typeof session.amount_total === "number" &&
      session.amount_total === order.totalCents;
    const currencyMatches =
      !session.currency ||
      session.currency.toLowerCase() === order.currency.toLowerCase();

    if (isPaid && amountMatches && currencyMatches) {
      const updated = await prisma.order.updateMany({
        where: { id: orderId, status: { not: "PAID" } },
        data: {
          status: "PAID",
          stripeSessionId: session.id || order.stripeSessionId,
        },
      });

      if (updated.count > 0) {
        const emailPayload = {
          orderId: order.id,
          totalCents: order.totalCents,
          currency: order.currency,
          email: order.email,
          phone: session.metadata?.phone || order.phone || null,
          items: order.items.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            priceCents: item.priceCents,
          })),
          deliveryAddress: session.metadata?.deliveryAddress || null,
          deliveryMiles: session.metadata?.deliveryMiles || null,
          deliveryFeeCents: session.metadata?.deliveryFeeCents || null,
          firstOrderDiscountPercent:
            session.metadata?.firstOrderDiscountPercent || null,
        };

        await sendAdminOrderEmail(emailPayload);
        await sendCustomerOrderEmail(emailPayload);
      }
    }
  }

  if (
    event.type === "checkout.session.expired" ||
    event.type === "checkout.session.async_payment_failed"
  ) {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;
    if (orderId) {
      await prisma.order.updateMany({
        where: { id: orderId, status: { not: "PAID" } },
        data: { status: "FAILED" },
      });
    }
  }

  return NextResponse.json({ received: true });
}
