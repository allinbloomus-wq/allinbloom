"use client";

import { useState } from "react";
import type { CartItem } from "@/lib/cart";
import { clientFetch } from "@/lib/api-client";

type CheckoutButtonProps = {
  items: CartItem[];
  deliveryAddress: string;
  phone: string;
  email: string;
  disabled?: boolean;
};

export default function CheckoutButton({
  items,
  deliveryAddress,
  phone,
  email,
  disabled,
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);

    const response = await clientFetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map((item) =>
          item.meta?.isCustom
            ? {
                id: item.id,
                quantity: item.quantity,
                name: item.name,
                priceCents: item.priceCents,
                image: item.image,
                isCustom: true,
              }
            : { id: item.id, quantity: item.quantity }
        ),
        address: deliveryAddress,
        phone,
        email,
      }),
    }, true);

    const data = (await response.json().catch(() => ({}))) as {
      url?: string;
      error?: string;
    };

    if (!response.ok) {
      setLoading(false);
      setError(data.error || "Unable to start checkout.");
      return;
    }

    if (data.url) {
      window.location.href = data.url;
      return;
    }

    setLoading(false);
    setError("Unable to start checkout.");
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleCheckout}
        disabled={loading || disabled}
        className="w-full rounded-full bg-[color:var(--brand)] px-6 py-3 text-xs uppercase tracking-[0.3em] text-white transition hover:bg-[color:var(--brand-dark)] disabled:opacity-60"
      >
        {loading ? "Redirecting..." : "Checkout"}
      </button>
      {error ? (
        <p className="text-xs uppercase tracking-[0.24em] text-rose-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
