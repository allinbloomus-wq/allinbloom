import Link from "next/link";

export default function CheckoutSuccessPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
      <div className="rounded-full bg-white/80 px-5 py-2 text-xs uppercase tracking-[0.32em] text-stone-500">
        Payment confirmed
      </div>
      <h1 className="text-4xl font-semibold text-stone-900 sm:text-5xl">
        Your order is in bloom
      </h1>
      <p className="text-sm leading-relaxed text-stone-600">
        We have received your order and our florists are preparing your bouquet
        now. You will receive a confirmation email with delivery details shortly.
      </p>
      <Link
        href="/catalog"
        className="rounded-full bg-[color:var(--brand)] px-6 py-3 text-xs uppercase tracking-[0.3em] text-white transition hover:bg-[color:var(--brand-dark)]"
      >
        Continue shopping
      </Link>
    </div>
  );
}
