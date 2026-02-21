"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { clearCartStorage, useCart } from "@/lib/cart";
import { clientFetch } from "@/lib/api-client";

export default function CheckoutSuccessPage() {
  const { clear } = useCart();
  const searchParams = useSearchParams();
  const paypalToken = searchParams.get("token");
  const isPaypalReturn =
    searchParams.get("provider") === "paypal" || Boolean(paypalToken);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    isPaypalReturn ? "loading" : "success"
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isPaypalReturn) return;
    clearCartStorage();
    clear();
    setStatus("success");
  }, [clear, isPaypalReturn]);

  useEffect(() => {
    if (!isPaypalReturn) return;
    if (!paypalToken) {
      setStatus("error");
      setError("Missing PayPal approval token.");
      return;
    }

    let isMounted = true;
    const capture = async () => {
      setStatus("loading");
      setError(null);
      const response = await clientFetch(
        "/api/paypal/capture",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: paypalToken }),
        },
        true
      );

      if (!isMounted) return;

      if (!response.ok) {
        setStatus("error");
        setError("Unable to confirm PayPal payment.");
        return;
      }

      setStatus("success");
      clearCartStorage();
      clear();
    };

    capture();
    return () => {
      isMounted = false;
    };
  }, [clear, isPaypalReturn, paypalToken]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center sm:gap-6">
      <div className="rounded-full bg-white/80 px-5 py-2 text-xs uppercase tracking-[0.32em] text-stone-500">
        {status === "loading"
          ? "Finalizing PayPal payment"
          : status === "error"
          ? "Payment not confirmed"
          : "Payment confirmed"}
      </div>
      <h1 className="text-4xl font-semibold text-stone-900 sm:text-5xl">
        {status === "error" ? "We need a quick check" : "Your order is in bloom"}
      </h1>
      <p className="text-sm leading-relaxed text-stone-600">
        {status === "loading"
          ? "Hang tight while we confirm your PayPal payment."
          : status === "error"
          ? error ||
            "We could not confirm your PayPal payment yet. Please return to the cart and try again."
          : "We have received your order and our florists are preparing your bouquet now. You will receive a confirmation email with delivery details shortly."}
      </p>
      <Link
        href={status === "error" ? "/cart" : "/catalog"}
        className="rounded-full bg-[color:var(--brand)] px-6 py-3 text-xs uppercase tracking-[0.3em] text-white transition hover:bg-[color:var(--brand-dark)]"
      >
        {status === "error" ? "Return to cart" : "Continue shopping"}
      </Link>
    </div>
  );
}
