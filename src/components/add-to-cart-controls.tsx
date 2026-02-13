"use client";

import { useCart } from "@/lib/cart";
import { useToast } from "@/components/toast-provider";

type AddToCartControlsProps = {
  item: {
    id: string;
    name: string;
    priceCents: number;
    image: string;
    discountPercent?: number;
    discountNote?: string;
    flowerType?: string;
    style?: string;
    colors?: string;
    isMixed?: boolean;
  };
};

export default function AddToCartControls({ item }: AddToCartControlsProps) {
  const { items, addItem, updateQuantity } = useCart();
  const { showToast } = useToast();
  const existing = items.find((entry) => entry.id === item.id);

  if (!existing) {
    return (
      <button
        type="button"
        onClick={() => {
          addItem({
            id: item.id,
            name: item.name,
            priceCents: item.priceCents,
            image: item.image,
            quantity: 1,
            meta: {
              basePriceCents: item.priceCents,
              bouquetDiscountPercent: item.discountPercent || 0,
              bouquetDiscountNote: item.discountNote,
              flowerType: item.flowerType,
              bouquetStyle: item.style,
              bouquetColors: item.colors,
              isMixed: item.isMixed,
            },
          });
          showToast("Added to cart.");
        }}
        className="w-full rounded-full bg-[color:var(--brand)] px-4 py-2 text-xs uppercase tracking-[0.24em] text-white transition hover:bg-[color:var(--brand-dark)] sm:tracking-[0.3em]"
      >
        Add to cart
      </button>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-full border border-stone-200 bg-white/80 px-3 py-2 text-xs uppercase tracking-[0.24em] text-stone-700 sm:tracking-[0.3em]">
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
