import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderById, getOrderStripeSession } from "@/lib/data/orders";
import { formatDateTime, formatMoney, formatOrderStatus } from "@/lib/format";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [order, stripeSession] = await Promise.all([
    getOrderById(id),
    getOrderStripeSession(id),
  ]);

  if (!order) {
    notFound();
  }

  const verifiedDeliveryAddress = stripeSession?.deliveryAddress?.trim() || "";
  const fallbackDeliveryAddress = order.deliveryAddress?.trim() || "";
  const line1 = order.deliveryAddressLine1?.trim() || "";
  const line2 = order.deliveryAddressLine2?.trim() || "";
  const floor = order.deliveryFloor?.trim() || "";
  const floorLabel = floor
    ? floor.toLowerCase().startsWith("floor")
      ? floor
      : `Floor ${floor}`
    : "";
  const city = order.deliveryCity?.trim() || "";
  const state = order.deliveryState?.trim() || "";
  const postal = order.deliveryPostalCode?.trim() || "";
  const country = order.deliveryCountry?.trim() || "";
  const cityStateZip = [city, [state, postal].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  const structuredLines = [line1, line2, floorLabel, cityStateZip, country].filter(
    Boolean
  );
  const deliveryAddress = structuredLines.length
    ? structuredLines.join(", ")
    : verifiedDeliveryAddress || fallbackDeliveryAddress;
  const deliveryMiles = stripeSession?.deliveryMiles || order.deliveryMiles;
  const deliveryFeeCents =
    stripeSession?.deliveryFeeCents ?? order.deliveryFeeCents ?? null;
  const shipping = stripeSession?.shipping;
  const address = shipping?.address;
  const hasStripeSession = Boolean(
    stripeSession?.paymentStatus ||
      stripeSession?.status ||
      shipping ||
      verifiedDeliveryAddress
  );
  const hasPayPalOrder = Boolean(order.paypalOrderId);
  const paymentProvider = hasPayPalOrder
    ? "PayPal"
    : order.stripeSessionId
    ? "Stripe"
    : "Unknown";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-stone-500">
            Order details
          </p>
          <h1 className="text-2xl font-semibold text-stone-900 sm:text-3xl">
            Order {order.id.slice(0, 8)}
          </h1>
        </div>
        <Link
          href="/admin/orders"
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-stone-300 bg-white/80 px-4 text-center text-xs uppercase tracking-[0.3em] text-stone-600 sm:w-auto"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4"
          >
            <path
              fillRule="evenodd"
              d="M12.78 4.22a.75.75 0 0 1 0 1.06L8.06 10l4.72 4.72a.75.75 0 1 1-1.06 1.06l-5.25-5.25a.75.75 0 0 1 0-1.06l5.25-5.25a.75.75 0 0 1 1.06 0Z"
              clipRule="evenodd"
            />
          </svg>
          Back to orders
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="glass rounded-[28px] border border-white/80 p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-stone-900">
            Items in order
          </h2>
          <div className="mt-4 space-y-2 text-sm text-stone-600">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-3">
                <span className="min-w-0 break-words">
                  {item.quantity} x {item.name}
                </span>
                <span className="shrink-0">{formatMoney(item.priceCents)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-between text-sm font-semibold text-stone-900">
            <span>Total</span>
            <span>{formatMoney(order.totalCents)}</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass rounded-[28px] border border-white/80 p-4 text-sm text-stone-600 sm:p-6">
            <h2 className="text-lg font-semibold text-stone-900">
              Order summary
            </h2>
            <div className="mt-3 space-y-2">
              <p>Status: {formatOrderStatus(order.status)}</p>
              <p>Created: {formatDateTime(order.createdAt)}</p>
              {order.email ? <p className="break-all">Email: {order.email}</p> : null}
              {order.phone ? <p>Phone: {order.phone}</p> : null}
              <p>Payment method: {paymentProvider}</p>
              {hasStripeSession ? (
                <p>
                  Stripe payment: {stripeSession?.paymentStatus || "unknown"} (
                  {stripeSession?.status || "unknown"})
                </p>
              ) : hasPayPalOrder ? (
                <p>PayPal order: {order.paypalOrderId}</p>
              ) : (
                <p>Stripe session: not linked yet.</p>
              )}
              {order.paypalCaptureId ? (
                <p>PayPal capture: {order.paypalCaptureId}</p>
              ) : null}
            </div>
          </div>

          <div className="glass rounded-[28px] border border-white/80 p-4 text-sm text-stone-600 sm:p-6">
            <h2 className="text-lg font-semibold text-stone-900">
              Delivery address
            </h2>
            <div className="mt-3 space-y-2">
              {deliveryAddress ? (
                <>
                  {structuredLines.length ? (
                    structuredLines.map((line, index) => (
                      <p key={`${line}-${index}`} className="break-words">
                        {line}
                      </p>
                    ))
                  ) : (
                    <p className="break-words">{deliveryAddress}</p>
                  )}
                  {deliveryMiles ? <p>Distance: {deliveryMiles} miles</p> : null}
                  {deliveryFeeCents !== null ? (
                    <p>
                      Delivery fee:{" "}
                      {deliveryFeeCents > 0 ? formatMoney(deliveryFeeCents) : "Free"}
                    </p>
                  ) : null}
                  {order.orderComment ? (
                    <div className="pt-2">
                      <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
                        Order comment
                      </p>
                      <p className="break-words">{order.orderComment}</p>
                    </div>
                  ) : null}
                </>
              ) : shipping ? (
                <>
                  <p>{shipping.name}</p>
                  {shipping.phone ? <p>{shipping.phone}</p> : null}
                  {address ? (
                    <>
                      <p>{address.line1}</p>
                      {address.line2 ? <p>{address.line2}</p> : null}
                      <p>
                        {address.city}, {address.state} {address.postalCode}
                      </p>
                      <p>{address.country}</p>
                    </>
                  ) : null}
                </>
              ) : (
                <p>
                  Address will appear after checkout is created.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
