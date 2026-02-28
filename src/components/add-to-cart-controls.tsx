"use client";

import { useCart } from "@/lib/cart";
import { useToast } from "@/components/toast-provider";
import { clampFlowerQuantity } from "@/lib/flower-quantity";

type AddToCartControlsProps = {
  item: {
    id: string;
    name: string;
    priceCents: number;
    image: string;
    discountPercent?: number;
    discountNote?: string;
    flowerType?: string;
    flowerTypes?: string;
    colors?: string;
    isMixed?: boolean;
    isFlowerQuantityEnabled?: boolean;
  };
  selectedQuantity?: number;
};

export default function AddToCartControls({
  item,
  selectedQuantity = 1,
}: AddToCartControlsProps) {
  const { items, addItem, updateQuantity } = useCart();
  const { showToast } = useToast();
  const existing = items.find((entry) => entry.id === item.id);
  const flowerQuantity = clampFlowerQuantity(selectedQuantity);

  if (item.isFlowerQuantityEnabled) {
    return (
      <div className="space-y-2">
        {existing ? (
          <p className="text-[10px] uppercase tracking-[0.2em] text-stone-500">
            In cart: {existing.quantity} flowers
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => {
            if (existing) {
              updateQuantity(item.id, flowerQuantity);
              showToast("Cart updated.");
              return;
            }
            addItem({
              id: item.id,
              name: item.name,
              priceCents: item.priceCents,
              image: item.image,
              quantity: flowerQuantity,
              meta: {
                basePriceCents: item.priceCents,
                bouquetDiscountPercent: item.discountPercent || 0,
                bouquetDiscountNote: item.discountNote,
                flowerType: item.flowerType,
                bouquetFlowerTypes: item.flowerTypes,
                bouquetColors: item.colors,
                isMixed: item.isMixed,
                isFlowerQuantityEnabled: true,
              },
            });
            showToast("Added to cart.");
          }}
          className="w-full rounded-full bg-[color:var(--brand)] px-3 py-2 text-[10px] uppercase tracking-[0.16em] text-white transition hover:bg-[color:var(--brand-dark)] sm:px-4 sm:text-xs sm:tracking-[0.3em]"
        >
          {existing ? "Update cart" : "Add to cart"}
        </button>
      </div>
    );
  }

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
              bouquetFlowerTypes: item.flowerTypes,
              bouquetColors: item.colors,
              isMixed: item.isMixed,
            },
          });
          showToast("Added to cart.");
        }}
        className="w-full rounded-full bg-[color:var(--brand)] px-3 py-2 text-[10px] uppercase tracking-[0.16em] text-white transition hover:bg-[color:var(--brand-dark)] sm:px-4 sm:text-xs sm:tracking-[0.3em]"
      >
        Add to cart
      </button>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2 rounded-full border border-stone-200 bg-white/80 px-2.5 py-1.5 text-[10px] uppercase tracking-[0.16em] text-stone-700 sm:gap-3 sm:px-3 sm:py-2 sm:text-xs sm:tracking-[0.3em]">
      <button
        type="button"
        onClick={() => updateQuantity(item.id, existing.quantity - 1)}
        className="h-6 w-6 rounded-full border border-stone-200 text-xs sm:h-7 sm:w-7 sm:text-sm"
      >
        -
      </button>
      <span>{existing.quantity}</span>
      <button
        type="button"
        onClick={() => updateQuantity(item.id, existing.quantity + 1)}
        className="h-6 w-6 rounded-full border border-stone-200 text-xs sm:h-7 sm:w-7 sm:text-sm"
      >
        +
      </button>
    </div>
  );
}
