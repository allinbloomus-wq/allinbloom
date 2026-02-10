"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useCart } from "@/lib/cart";
import { formatMoney } from "@/lib/format";
import { getCartItemDiscount } from "@/lib/pricing";
import CheckoutButton from "@/components/checkout-button";
import ImageWithFallback from "@/components/image-with-fallback";

type DiscountInfo = {
  percent: number;
  note: string;
};

type CartViewProps = {
  isAuthenticated: boolean;
  globalDiscount: DiscountInfo | null;
  firstOrderDiscount: DiscountInfo | null;
  categoryDiscount: {
    percent: number;
    note: string;
    flowerType?: string | null;
    style?: string | null;
    mixed?: string | null;
    color?: string | null;
    minPriceCents?: number | null;
    maxPriceCents?: number | null;
  } | null;
};

export default function CartView({
  isAuthenticated,
  globalDiscount,
  firstOrderDiscount,
  categoryDiscount,
}: CartViewProps) {
  const { items, updateQuantity, removeItem } = useCart();
  const [address, setAddress] = useState("");
  const [phoneLocal, setPhoneLocal] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const autocompleteRef = useRef<any>(null);
  const [quote, setQuote] = useState<{
    feeCents: number;
    miles: number;
    distanceText: string;
  } | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const deliveryLocked = !isAuthenticated;
  const formatPhone = (localDigits: string) => {
    const part1 = localDigits.slice(0, 3);
    const part2 = localDigits.slice(3, 6);
    const part3 = localDigits.slice(6, 10);
    let result = "+1";
    if (part1) result += ` ${part1}`;
    if (part2) result += ` ${part2}`;
    if (part3) result += ` ${part3}`;
    return result;
  };
  const phoneValid = phoneLocal.length === 10;
  const phoneValue = formatPhone(phoneLocal);

  useEffect(() => {
    if (deliveryLocked) return;
    if (!mapsKey || !inputRef.current) return;
    if (autocompleteRef.current) return;

    const loadGoogleMaps = () =>
      new Promise<void>((resolve, reject) => {
        if ((window as any).google?.maps?.places) {
          resolve();
          return;
        }
        const existing = document.getElementById("google-maps-js");
        if (existing) {
          existing.addEventListener("load", () => resolve());
          existing.addEventListener("error", () => reject());
          return;
        }
        const script = document.createElement("script");
        script.id = "google-maps-js";
        script.async = true;
        script.defer = true;
        script.src = `https://maps.googleapis.com/maps/api/js?key=${mapsKey}&libraries=places`;
        script.onload = () => resolve();
        script.onerror = () => reject();
        document.head.appendChild(script);
      });

    loadGoogleMaps()
      .then(() => {
        if (!inputRef.current) return;
        const googleMaps = (window as any).google;
        if (!googleMaps?.maps?.places) return;
        autocompleteRef.current = new googleMaps.maps.places.Autocomplete(
          inputRef.current,
          {
            types: ["address"],
            componentRestrictions: { country: "us" },
            fields: ["formatted_address"],
          }
        );
        autocompleteRef.current.addListener("place_changed", () => {
          const place = autocompleteRef.current?.getPlace();
          if (place?.formatted_address) {
            setAddress(place.formatted_address);
            setQuote(null);
            setQuoteError(null);
          }
        });
      })
      .catch(() => {
        // Ignore script load errors; user can still type manually.
      });
  }, [mapsKey, deliveryLocked]);

  const lineItems = useMemo(() => {
    return items.map((item) => {
      const basePrice = item.meta?.basePriceCents ?? item.priceCents;
      const discount = getCartItemDiscount(
        {
          basePriceCents: basePrice,
          bouquetDiscountPercent: item.meta?.bouquetDiscountPercent,
          bouquetDiscountNote: item.meta?.bouquetDiscountNote,
          flowerType: item.meta?.flowerType,
          style: item.meta?.bouquetStyle,
          isMixed: item.meta?.isMixed,
          colors: item.meta?.bouquetColors,
        },
        {
          globalDiscountPercent: globalDiscount?.percent || 0,
          globalDiscountNote: globalDiscount?.note || null,
          categoryDiscountPercent: categoryDiscount?.percent || 0,
          categoryDiscountNote: categoryDiscount?.note || null,
          categoryFlowerType: categoryDiscount?.flowerType || null,
          categoryStyle: categoryDiscount?.style || null,
          categoryMixed: categoryDiscount?.mixed || null,
          categoryColor: categoryDiscount?.color || null,
          categoryMinPriceCents: categoryDiscount?.minPriceCents ?? null,
          categoryMaxPriceCents: categoryDiscount?.maxPriceCents ?? null,
        }
      );

      const discountedPrice = discount
        ? Math.max(
            0,
            Math.round(basePrice * (100 - discount.percent) / 100)
          )
        : basePrice;

      return {
        ...item,
        basePrice,
        discount,
        discountedPrice,
        lineTotal: discountedPrice * item.quantity,
        lineOriginal: basePrice * item.quantity,
      };
    });
  }, [items, globalDiscount, categoryDiscount]);

  const subtotalCents = useMemo(
    () => lineItems.reduce((sum, item) => sum + item.lineTotal, 0),
    [lineItems]
  );

  const hasAnyDiscount = useMemo(
    () => lineItems.some((item) => Boolean(item.discount)),
    [lineItems]
  );

  const firstOrderDiscountCents = useMemo(() => {
    if (!firstOrderDiscount || hasAnyDiscount) return 0;
    return Math.round(subtotalCents * (firstOrderDiscount.percent / 100));
  }, [firstOrderDiscount, subtotalCents, hasAnyDiscount]);

  const shippingCents = quote?.feeCents ?? 0;
  const totalCents = Math.max(
    0,
    subtotalCents - firstOrderDiscountCents + shippingCents
  );

  const requestQuote = async () => {
    if (deliveryLocked) {
      setQuote(null);
      setQuoteError("Please sign in to check delivery.");
      return;
    }
    const trimmed = address.trim();
    if (!trimmed) {
      setQuote(null);
      setQuoteError("Please enter a delivery address.");
      return;
    }

    setQuoteLoading(true);
    setQuoteError(null);

    const response = await fetch("/api/delivery/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: trimmed }),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      setQuote(null);
      setQuoteError(payload?.error || "Unable to calculate delivery.");
      setQuoteLoading(false);
      return;
    }

    setQuote({
      feeCents: payload.feeCents,
      miles: payload.miles,
      distanceText: payload.distanceText,
    });
    setQuoteLoading(false);
  };

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
        {lineItems.map((item) => (
          <div
            key={item.id}
            className="glass flex flex-col gap-4 rounded-[28px] border border-white/80 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 overflow-hidden rounded-2xl border border-white/80 bg-white">
                <ImageWithFallback
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
                {item.discount ? (
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-[0.2em] text-stone-400 line-through">
                      {formatMoney(item.basePrice)}
                    </p>
                    <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--brand)]">
                      {formatMoney(item.discountedPrice)}
                    </p>
                    <p className="text-xs text-stone-500">
                      -{item.discount.percent}% · {item.discount.note}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
                    {formatMoney(item.basePrice)}
                  </p>
                )}
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
        <div className="space-y-3">
          <label className="flex flex-col gap-2 text-sm text-stone-700">
            Delivery address
            <input
              ref={inputRef}
              value={address}
              onChange={(event) => {
                setAddress(event.target.value);
                setQuote(null);
                setQuoteError(null);
              }}
              placeholder={
                deliveryLocked
                  ? "Sign in to enter a delivery address"
                  : "Street, city, state, ZIP"
              }
              disabled={deliveryLocked}
              className="rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 text-sm text-stone-800 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-stone-700">
            Phone number
            <input
              value={phoneValue}
              onChange={(event) => {
                const digits = event.target.value.replace(/\D/g, "");
                const local =
                  digits.startsWith("1") ? digits.slice(1) : digits;
                setPhoneLocal(local.slice(0, 10));
              }}
              placeholder={
                deliveryLocked ? "Sign in to add a phone number" : "+1 312 555 0123"
              }
              inputMode="numeric"
              autoComplete="tel"
              maxLength={15}
              pattern="^\\+1 \\d{3} \\d{3} \\d{4}$"
              disabled={deliveryLocked}
              className="rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 text-sm text-stone-800 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400"
            />
          </label>
          {phoneLocal.length > 0 && !phoneValid ? (
            <p className="text-xs uppercase tracking-[0.24em] text-rose-700">
              Use format +1 312 555 0123.
            </p>
          ) : null}
          <button
            type="button"
            onClick={requestQuote}
            disabled={deliveryLocked || quoteLoading || !address.trim()}
            className="w-full rounded-full border border-stone-200 bg-white/80 px-4 py-2 text-xs uppercase tracking-[0.3em] text-stone-600 disabled:opacity-50"
          >
            {deliveryLocked
              ? "Sign in to check delivery"
              : quoteLoading
              ? "Checking..."
              : "Check delivery"}
          </button>
          <p className="text-xs text-stone-500">
            Delivery pricing: free within 10 miles, $15 within 20 miles, $30
            within 30 miles.
          </p>
          {quote ? (
            <p className="text-xs text-stone-500">
              Distance: {quote.distanceText}
            </p>
          ) : null}
          {quoteError ? (
            <p className="text-xs uppercase tracking-[0.24em] text-rose-700">
              {quoteError}
            </p>
          ) : null}
        </div>
        <div className="space-y-2 text-sm text-stone-600">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatMoney(subtotalCents)}</span>
          </div>
          {firstOrderDiscount && !hasAnyDiscount ? (
            <div className="flex justify-between text-sm text-stone-600">
              <span>
                First order discount ({firstOrderDiscount.percent}%)
              </span>
              <span>-{formatMoney(firstOrderDiscountCents)}</span>
            </div>
          ) : null}
          <div className="flex justify-between">
            <span>Delivery</span>
            <span>
              {!quote
                ? "Add address"
                : shippingCents === 0
                ? "Free"
                : formatMoney(shippingCents)}
            </span>
          </div>
          <div className="flex justify-between font-semibold text-stone-900">
            <span>Total</span>
            <span>{quote ? formatMoney(totalCents) : "--"}</span>
          </div>
        </div>
        <CheckoutButton
          items={items}
          deliveryAddress={address.trim()}
          phone={phoneValue}
          disabled={
            !quote ||
            quoteLoading ||
            Boolean(quoteError) ||
            !isAuthenticated ||
            !phoneValid
          }
        />
        {!isAuthenticated ? (
          <p className="text-xs uppercase tracking-[0.24em] text-rose-700">
            Please sign in to place an order.
          </p>
        ) : null}
        <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
          Secure checkout with Stripe
        </p>
      </div>
    </div>
  );
}
