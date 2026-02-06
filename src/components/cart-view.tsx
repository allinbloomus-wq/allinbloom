"use client";

import Image from "next/image";
import { useCart } from "@/lib/cart";
import { formatMoney } from "@/lib/format";
import CheckoutButton from "@/components/checkout-button";

export default function CartView() {
  const { items, updateQuantity, removeItem, subtotalCents } = useCart();

  const shippingCents = subtotalCents > 12000 ? 0 : items.length ? 1500 : 0;
  const totalCents = subtotalCents + shippingCents;

  if (!items.length) {
    return (
      <div className="glass rounded-[28px] border border-white/80 p-8 text-center text-sm text-stone-600">
        Your cart is empty. Explore the catalog to add bouquets.
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="glass flex flex-col gap-4 rounded-[28px] border border-white/80 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 overflow-hidden rounded-2xl border border-white/80 bg-white">
                <Image
                  src={item.image}
                  alt={item.name}
                  width={120}
                  height={140}
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-stone-900">
                  {item.name}
                </p>
                {item.meta?.note ? (
                  <p className="text-xs text-stone-500">{item.meta.note}</p>
                ) : null}
                <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
                  {formatMoney(item.priceCents)}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-full border border-stone-200 bg-white/80 px-3 py-2 text-xs uppercase tracking-[0.3em] text-stone-600">
                <button
                  type="button"
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="h-6 w-6 rounded-full border border-stone-200 text-sm"
                >
                  -
                </button>
                <span>{item.quantity}</span>
                <button
                  type="button"
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="h-6 w-6 rounded-full border border-stone-200 text-sm"
                >
                  +
                </button>
              </div>
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs uppercase tracking-[0.3em] text-rose-700"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="glass h-fit space-y-4 rounded-[28px] border border-white/80 p-6">
        <h2 className="text-xl font-semibold text-stone-900">Order summary</h2>
        <div className="space-y-2 text-sm text-stone-600">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatMoney(subtotalCents)}</span>
          </div>
          <div className="flex justify-between">
            <span>Delivery</span>
            <span>
              {shippingCents === 0 ? "Free" : formatMoney(shippingCents)}
            </span>
          </div>
          <div className="flex justify-between font-semibold text-stone-900">
            <span>Total</span>
            <span>{formatMoney(totalCents)}</span>
          </div>
        </div>
        <CheckoutButton totalCents={totalCents} items={items} />
        <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
          Secure checkout with Stripe
        </p>
      </div>
    </div>
  );
}
