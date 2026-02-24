"use client";

import { useRef, useState } from "react";
import type { CartItem } from "@/lib/cart";
import { clientFetch } from "@/lib/api-client";

type CheckoutButtonProps = {
  items: CartItem[];
  deliveryAddress: string;
  deliveryAddressLine1?: string;
  deliveryAddressLine2?: string;
  deliveryCity?: string;
  deliveryState?: string;
  deliveryPostalCode?: string;
  deliveryCountry?: string;
  deliveryFloor?: string;
  orderComment?: string;
  phone?: string;
  email: string;
  disabled?: boolean;
  paymentMethod?: "stripe" | "paypal";
  label?: string;
  className?: string;
  iconSrc?: string;
  iconAlt?: string;
  iconClassName?: string;
  onBusyChange?: (busy: boolean) => void;
};

export default function CheckoutButton({
  items,
  deliveryAddress,
  deliveryAddressLine1,
  deliveryAddressLine2,
  deliveryCity,
  deliveryState,
  deliveryPostalCode,
  deliveryCountry,
  deliveryFloor,
  orderComment,
  phone,
  email,
  disabled,
  paymentMethod,
  label,
  className,
  iconSrc,
  iconAlt,
  iconClassName,
  onBusyChange,
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busyRef = useRef(false);
  const method = paymentMethod ?? "stripe";
  const buttonLabel = label ?? (method === "paypal" ? "Pay with PayPal" : "Checkout");

  const handleCheckout = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setLoading(true);
    setError(null);
    onBusyChange?.(true);

    try {
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
                  price_cents: item.priceCents,
                  image: item.image,
                  details: item.meta?.details || item.meta?.note || undefined,
                  isCustom: true,
                  is_custom: true,
                }
              : {
                  id: item.id,
                  quantity: item.quantity,
                  isCustom: false,
                  is_custom: false,
                }
          ),
          address: deliveryAddress,
          addressLine1: deliveryAddressLine1,
          addressLine2: deliveryAddressLine2,
          city: deliveryCity,
          state: deliveryState,
          postalCode: deliveryPostalCode,
          country: deliveryCountry,
          floor: deliveryFloor,
          orderComment,
          phone: phone || "",
          email,
          paymentMethod: method,
          payment_method: method,
        }),
      }, true);

      const data = (await response.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
        detail?: string;
        message?: string;
      };

      if (!response.ok) {
        setLoading(false);
        onBusyChange?.(false);
        busyRef.current = false;
        setError(data.error || data.detail || data.message || "Unable to start checkout.");
        return;
      }

      if (data.url) {
        window.location.href = data.url;
        return;
      }

      setLoading(false);
      onBusyChange?.(false);
      busyRef.current = false;
      setError("Unable to start checkout.");
    } catch {
      setLoading(false);
      onBusyChange?.(false);
      busyRef.current = false;
      setError("Unable to start checkout.");
    }
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleCheckout}
        disabled={loading || disabled}
        className={`inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-xs uppercase tracking-[0.3em] text-white transition disabled:opacity-60 ${className || "bg-[color:var(--brand)] hover:bg-[color:var(--brand-dark)]"}`}
      >
        {iconSrc ? (
          <img
            src={iconSrc}
            alt={iconAlt || ""}
            aria-hidden={iconAlt ? undefined : true}
            className={iconClassName || "h-4 w-4"}
            loading="lazy"
          />
        ) : null}
        {loading ? "Redirecting..." : buttonLabel}
      </button>
      {error ? (
        <p className="text-xs uppercase tracking-[0.24em] text-rose-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
