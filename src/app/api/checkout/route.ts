import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type CheckoutItem = {
  name: string;
  priceCents: number;
  quantity: number;
  image: string;
};

export async function POST(request: Request) {
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecret) {
    return NextResponse.json(
      { error: "Stripe is not configured." },
      { status: 400 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const items = (body?.items || []) as CheckoutItem[];

  if (!items.length) {
    return NextResponse.json({ error: "No items provided." }, { status: 400 });
  }

  const origin = request.headers.get("origin") || "http://localhost:3000";
  const computedTotal = items.reduce(
    (sum, item) => sum + item.priceCents * item.quantity,
    0
  );
  const stripe = new Stripe(stripeSecret, {
    apiVersion: "2024-06-20",
  });

  const session = await getServerSession(authOptions);

  const order = await prisma.order.create({
    data: {
      email: session?.user?.email || undefined,
      totalCents: computedTotal,
      items: {
        create: items.map((item) => ({
          name: item.name,
          priceCents: item.priceCents,
          quantity: item.quantity,
          image: item.image,
        })),
      },
    },
  });

  const lineItems = items.map((item) => ({
    price_data: {
      currency: "usd",
      product_data: {
        name: item.name,
        images: item.image ? [`${origin}${item.image}`] : [],
      },
      unit_amount: item.priceCents,
    },
    quantity: item.quantity,
  }));

  const stripeSession = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: lineItems,
    success_url: `${origin}/checkout/success`,
    cancel_url: `${origin}/cart`,
    shipping_address_collection: { allowed_countries: ["US"] },
    payment_method_types: ["card"],
    customer_email: session?.user?.email || undefined,
    metadata: {
      orderId: order.id,
    },
  });

  await prisma.order.update({
    where: { id: order.id },
    data: { stripeSessionId: stripeSession.id },
  });

  return NextResponse.json({ url: stripeSession.url });
}
