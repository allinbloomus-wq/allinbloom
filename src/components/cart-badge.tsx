"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart";

export default function CartBadge() {
  const { itemCount } = useCart();

  return (
    <Link
      href="/cart"
      className="relative rounded-full border border-stone-200 bg-white/80 px-3 py-2 text-[11px] uppercase tracking-[0.22em] text-stone-600 sm:px-4 sm:text-xs sm:tracking-[0.3em]"
    >
      Cart
      {itemCount > 0 ? (
        <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[color:var(--brand)] text-[10px] font-semibold text-white">
          {itemCount}
        </span>
      ) : null}
    </Link>
  );
}
