import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDeliveryQuote } from "@/lib/delivery";
import { getStoreSettings } from "@/lib/data/settings";
import { getBouquetDiscount, applyPercentDiscount } from "@/lib/pricing";

type CheckoutItem = {
  id: string;
  quantity: number;
  name?: string;
  priceCents?: number;
  image?: string;
  isCustom?: boolean;
};

function getSiteUrl(request: Request) {
  const configured =
    process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      // fall through to header + localhost
    }
  }
  const originHeader = request.headers.get("origin");
  if (originHeader) {
    try {
      return new URL(originHeader).origin;
    } catch {
      // ignore invalid header
    }
  }
  return "http://localhost:3000";
}

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
  const address = String(body?.address || "").trim();

  if (!items.length) {
    return NextResponse.json({ error: "No items provided." }, { status: 400 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json(
      { error: "Please sign in to place an order." },
      { status: 401 }
    );
  }

  if (!address) {
    return NextResponse.json(
      { error: "Delivery address is required." },
      { status: 400 }
    );
  }

  const settings = await getStoreSettings();
  const delivery = await getDeliveryQuote(address);
  if (!delivery.ok) {
    return NextResponse.json({ error: delivery.error }, { status: 400 });
  }

  const origin = getSiteUrl(request);
  const bouquetIds = items.map((item) => item.id);
  const bouquets = await prisma.bouquet.findMany({
    where: { id: { in: bouquetIds }, isActive: true },
  });
  const bouquetMap = new Map(bouquets.map((bouquet) => [bouquet.id, bouquet]));

  let hasAnyDiscount = false;

  const normalizedItems = items.map((item) => {
    if (item.isCustom) {
      const priceCents = Number(item.priceCents || 0);
      const quantity = Math.max(1, item.quantity);
      if (!item.name || !item.image) return null;
      if (priceCents < 6500 || priceCents > 18000) return null;
      return {
        id: item.id,
        name: item.name,
        image: item.image,
        quantity,
        unitPrice: priceCents,
      };
    }

    const bouquet = bouquetMap.get(item.id);
    if (!bouquet) return null;
    const discount = getBouquetDiscount(bouquet, settings);
    if (discount) {
      hasAnyDiscount = true;
    }
    const unitPrice = discount
      ? applyPercentDiscount(bouquet.priceCents, discount.percent)
      : bouquet.priceCents;
    return {
      id: bouquet.id,
      name: bouquet.name,
      image: bouquet.image,
      quantity: Math.max(1, item.quantity),
      unitPrice,
    };
  });

  if (normalizedItems.some((item) => !item)) {
    return NextResponse.json(
      { error: "Some items are unavailable." },
      { status: 400 }
    );
  }

  const safeItems = normalizedItems.filter(Boolean) as Array<{
    id: string;
    name: string;
    image: string;
    quantity: number;
    unitPrice: number;
  }>;

  const computedSubtotal = safeItems.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );

  const ordersCount = await prisma.order.count({
    where: { email: session.user.email },
  });
  const firstOrderDiscountPercent =
    ordersCount === 0 && !hasAnyDiscount
      ? settings.firstOrderDiscountPercent
      : 0;
  const discountedItems = safeItems.map((item) => ({
    ...item,
    unitPrice:
      firstOrderDiscountPercent > 0
        ? applyPercentDiscount(item.unitPrice, firstOrderDiscountPercent)
        : item.unitPrice,
  }));

  const discountedSubtotal = discountedItems.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );
  const computedTotal = discountedSubtotal + delivery.feeCents;
  const stripe = new Stripe(stripeSecret, {
    apiVersion: "2024-06-20",
  });

  const orderItems = discountedItems.map((item) => ({
    name: item.name,
    priceCents: item.unitPrice,
    quantity: item.quantity,
    image: item.image,
  }));

  if (delivery.feeCents > 0) {
    orderItems.push({
      name: `Delivery (${delivery.distanceText})`,
      priceCents: delivery.feeCents,
      quantity: 1,
      image: "",
    });
  }

  const order = await prisma.order.create({
    data: {
      email: session.user.email,
      totalCents: computedTotal,
      items: {
        create: orderItems,
      },
    },
  });

  const lineItems = discountedItems.map((item) => ({
    price_data: {
      currency: "usd",
      product_data: {
        name: item.name,
        images: item.image ? [`${origin}${item.image}`] : [],
      },
      unit_amount: item.unitPrice,
    },
    quantity: item.quantity,
  }));

  if (delivery.feeCents > 0) {
    lineItems.push({
      price_data: {
        currency: "usd",
        product_data: {
          name: "Delivery",
        },
        unit_amount: delivery.feeCents,
      },
      quantity: 1,
    });
  }

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
      deliveryAddress: address,
      deliveryMiles: delivery.miles.toFixed(1),
      deliveryFeeCents: String(delivery.feeCents),
      firstOrderDiscountPercent: String(firstOrderDiscountPercent),
    },
  });

  await prisma.order.update({
    where: { id: order.id },
    data: { stripeSessionId: stripeSession.id },
  });

  return NextResponse.json({ url: stripeSession.url });
}
