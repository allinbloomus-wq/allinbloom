"use client";

import { useCart } from "@/lib/cart";

type AddToCartControlsProps = {
  item: {
    id: string;
    name: string;
    priceCents: number;
    image: string;
  };
};

export default function AddToCartControls({ item }: AddToCartControlsProps) {
  const { items, addItem, updateQuantity } = useCart();
  const existing = items.find((entry) => entry.id === item.id);

  if (!existing) {
    return (
      <button
        type="button"
        onClick={() => addItem({ ...item, quantity: 1 })}
        className="w-full rounded-full bg-[color:var(--brand)] px-4 py-2 text-xs uppercase tracking-[0.3em] text-white transition hover:bg-[color:var(--brand-dark)]"
      >
        Add to cart
      </button>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-full border border-stone-200 bg-white/80 px-3 py-2 text-xs uppercase tracking-[0.3em] text-stone-700">
      <button
        type="button"
        onClick={() => updateQuantity(item.id, existing.quantity - 1)}
        className="h-7 w-7 rounded-full border border-stone-200 text-sm"
      >
        -
      </button>
      <span>{existing.quantity}</span>
      <button
        type="button"
        onClick={() => updateQuantity(item.id, existing.quantity + 1)}
        className="h-7 w-7 rounded-full border border-stone-200 text-sm"
      >
        +
      </button>
    </div>
  );
}
