"use client";

import { useState } from "react";
import type { CartItem } from "@/lib/cart";

type CheckoutButtonProps = {
  items: CartItem[];
  totalCents: number;
};

export default function CheckoutButton({
  items,
  totalCents,
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);

    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items, totalCents }),
    });

    if (!response.ok) {
      setLoading(false);
      setError("Checkout is not configured yet.");
      return;
    }

    const data = (await response.json()) as { url?: string };
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
        disabled={loading}
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
