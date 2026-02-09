import { notFound } from "next/navigation";
import Stripe from "stripe";
import { getOrderById } from "@/lib/data/orders";
import { formatDateTime, formatMoney } from "@/lib/format";
import { prisma } from "@/lib/db";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrderById(id);

  if (!order) {
    notFound();
  }

  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  let stripeSession:
    | Stripe.Checkout.Session
    | null
    | undefined = undefined;

  if (stripeSecret && order.stripeSessionId) {
    const stripe = new Stripe(stripeSecret);
    stripeSession = await stripe.checkout.sessions.retrieve(
      order.stripeSessionId
    );

    const isPaid =
      stripeSession.payment_status === "paid" &&
      stripeSession.status === "complete";
    const amountMatches =
      typeof stripeSession.amount_total === "number" &&
      stripeSession.amount_total === order.totalCents;

    if (isPaid && amountMatches && order.status !== "PAID") {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "PAID" },
      });
      order.status = "PAID";
    }
  }

  const shipping = stripeSession?.shipping_details;
  const address = shipping?.address;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.32em] text-stone-500">
          Order details
        </p>
        <h1 className="text-3xl font-semibold text-stone-900">
          Order {order.id.slice(0, 8)}
        </h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="glass rounded-[28px] border border-white/80 p-6">
          <h2 className="text-lg font-semibold text-stone-900">
            Items in order
          </h2>
          <div className="mt-4 space-y-2 text-sm text-stone-600">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between">
                <span>
                  {item.quantity} x {item.name}
                </span>
                <span>{formatMoney(item.priceCents)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-between text-sm font-semibold text-stone-900">
            <span>Total</span>
            <span>{formatMoney(order.totalCents)}</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass rounded-[28px] border border-white/80 p-6 text-sm text-stone-600">
            <h2 className="text-lg font-semibold text-stone-900">
              Order summary
            </h2>
            <div className="mt-3 space-y-2">
              <p>Status: {order.status}</p>
              <p>Created: {formatDateTime(order.createdAt)}</p>
              {order.email ? <p>Email: {order.email}</p> : null}
              {order.phone ? <p>Phone: {order.phone}</p> : null}
              {stripeSession ? (
                <p>
                  Stripe payment: {stripeSession.payment_status} (
                  {stripeSession.status})
                </p>
              ) : (
                <p>Stripe session: not linked yet.</p>
              )}
            </div>
          </div>

          <div className="glass rounded-[28px] border border-white/80 p-6 text-sm text-stone-600">
            <h2 className="text-lg font-semibold text-stone-900">
              Delivery address
            </h2>
            <div className="mt-3 space-y-2">
              {shipping ? (
                <>
                  <p>{shipping.name}</p>
                  {shipping.phone ? <p>{shipping.phone}</p> : null}
                  {address ? (
                    <>
                      <p>{address.line1}</p>
                      {address.line2 ? <p>{address.line2}</p> : null}
                      <p>
                        {address.city}, {address.state} {address.postal_code}
                      </p>
                      <p>{address.country}</p>
                    </>
                  ) : null}
                </>
              ) : (
                <p>
                  Address will appear after payment is completed in Stripe.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
