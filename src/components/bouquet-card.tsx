"use client";

import { formatLabel, formatMoney } from "@/lib/format";
import AddToCartControls from "@/components/add-to-cart-controls";
import BouquetImageLightbox from "@/components/bouquet-image-lightbox";
import type { Bouquet, BouquetPricing } from "@/lib/api-types";

export default function BouquetCard({
  bouquet,
  pricing,
}: {
  bouquet: Bouquet;
  pricing: BouquetPricing;
}) {
  return (
    <div className="glass flex h-full flex-col gap-3 rounded-[24px] border border-white/80 p-4 sm:gap-4 sm:rounded-[28px] sm:p-5">
      <div className="overflow-hidden rounded-[18px] border border-white/80 bg-white sm:rounded-[22px]">
        <BouquetImageLightbox
          src={bouquet.image}
          alt={bouquet.name}
          className="block w-full"
          imageClassName="aspect-[4/5] w-full object-cover sm:aspect-square"
        />
      </div>
      <div className="min-w-0 flex-1 space-y-1.5 sm:space-y-2">
        <div className="flex items-center justify-between gap-2 text-[10px] uppercase tracking-[0.16em] text-stone-500 sm:text-xs sm:tracking-[0.24em]">
          <span className="truncate">{formatLabel(bouquet.style)}</span>
          <span className="shrink-0">{bouquet.isMixed ? "Mixed" : "Mono"}</span>
        </div>
        <h3 className="break-words text-base font-semibold leading-tight text-stone-900 sm:text-xl">
          {bouquet.name}
        </h3>
        <p className="break-words text-xs leading-snug text-stone-600 sm:text-sm sm:leading-relaxed">
          {bouquet.description}
        </p>
      </div>
      <div className="flex items-center justify-between gap-2">
        {pricing.discount ? (
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-stone-400 line-through sm:text-sm">
              {formatMoney(pricing.originalPriceCents)}
            </span>
            <span className="text-base font-semibold text-[color:var(--brand)] sm:text-lg">
              {formatMoney(pricing.finalPriceCents)}
            </span>
          </div>
        ) : (
          <p className="text-base font-semibold text-stone-900 sm:text-lg">
            {formatMoney(pricing.originalPriceCents)}
          </p>
        )}
        <p className="break-words text-right text-[10px] uppercase tracking-[0.14em] text-stone-500 sm:text-xs sm:tracking-[0.2em]">
          {formatLabel(bouquet.flowerType)}
        </p>
      </div>
      <AddToCartControls
        item={{
          id: bouquet.id,
          name: bouquet.name,
          priceCents: bouquet.priceCents,
          image: bouquet.image,
          discountPercent: bouquet.discountPercent,
          discountNote: bouquet.discountNote || undefined,
          flowerType: bouquet.flowerType,
          style: bouquet.style,
          colors: bouquet.colors,
          isMixed: bouquet.isMixed,
        }}
      />
    </div>
  );
}
