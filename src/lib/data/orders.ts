import Stripe from "stripe";
import { prisma } from "@/lib/db";
import { getDayRange } from "@/lib/admin-orders";

const PENDING_EXPIRATION_HOURS = 24;

async function expirePendingOrders() {
  const cutoff = new Date(
    Date.now() - PENDING_EXPIRATION_HOURS * 60 * 60 * 1000
  );

  await prisma.order.updateMany({
    where: {
      status: "PENDING",
      stripeSessionId: { not: null },
      createdAt: { lt: cutoff },
    },
    data: { status: "FAILED" },
  });
}

type OrderForSync = {
  id: string;
  status: string;
  stripeSessionId: string | null;
  totalCents: number;
  currency: string;
};

async function syncStripeOrders(orders: OrderForSync[]) {
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecret || orders.length === 0) {
    return new Map<string, string>();
  }

  const stripe = new Stripe(stripeSecret);
  const updates = new Map<string, string>();
  const nowSeconds = Math.floor(Date.now() / 1000);

  for (const order of orders) {
    if (order.status !== "PENDING" || !order.stripeSessionId) {
      continue;
    }

    try {
      const session = await stripe.checkout.sessions.retrieve(
        order.stripeSessionId
      );

      const amountMatches =
        typeof session.amount_total === "number" &&
        session.amount_total === order.totalCents;
      const currencyMatches =
        !session.currency ||
        session.currency.toLowerCase() === order.currency.toLowerCase();
      const isPaid =
        session.payment_status === "paid" &&
        session.status === "complete" &&
        amountMatches &&
        currencyMatches;

      if (isPaid) {
        await prisma.order.update({
          where: { id: order.id },
          data: { status: "PAID" },
        });
        updates.set(order.id, "PAID");
        continue;
      }

      const isExpired =
        session.status === "expired" ||
        (typeof session.expires_at === "number" &&
          session.expires_at < nowSeconds);
      const isUnpaidComplete =
        session.payment_status === "unpaid" && session.status !== "open";

      if (isExpired || isUnpaidComplete) {
        await prisma.order.update({
          where: { id: order.id },
          data: { status: "FAILED" },
        });
        updates.set(order.id, "FAILED");
      }
    } catch (error) {
      // Ignore Stripe errors and keep the current status.
    }
  }

  return updates;
}

export async function getAdminOrders() {
  await expirePendingOrders();
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });
  const updates = await syncStripeOrders(orders);
  if (updates.size === 0) return orders;
  return orders.map((order) =>
    updates.has(order.id)
      ? { ...order, status: updates.get(order.id)! }
      : order
  );
}

export async function getAdminOrdersByDay(dayKey: string) {
  await expirePendingOrders();
  const range = getDayRange(dayKey);
  if (!range) return [];
  const orders = await prisma.order.findMany({
    where: {
      createdAt: {
        gte: range.start,
        lt: range.end,
      },
    },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });
  const updates = await syncStripeOrders(orders);
  if (updates.size === 0) return orders;
  return orders.map((order) =>
    updates.has(order.id)
      ? { ...order, status: updates.get(order.id)! }
      : order
  );
}

export async function getOrderById(id: string) {
  await expirePendingOrders();
  return prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });
}

export async function getOrdersByEmail(email: string) {
  await expirePendingOrders();
  const orders = await prisma.order.findMany({
    where: { email },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });
  const updates = await syncStripeOrders(orders);
  if (updates.size === 0) return orders;
  return orders.map((order) =>
    updates.has(order.id)
      ? { ...order, status: updates.get(order.id)! }
      : order
  );
}

export async function countOrdersByEmail(email: string) {
  return prisma.order.count({ where: { email } });
}
