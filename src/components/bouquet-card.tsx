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
    <div className="glass flex h-full flex-col gap-3 rounded-[24px] border border-white/80 p-[9px] sm:gap-4 sm:rounded-[28px] sm:p-5">
      <div className="overflow-hidden rounded-[18px] border border-white/80 bg-white sm:rounded-[22px]">
        <BouquetImageLightbox
          src={bouquet.image}
          alt={bouquet.name}
          className="block w-full"
          imageClassName="aspect-square w-full object-cover"
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
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
        <p className="order-1 break-words text-left text-[10px] uppercase tracking-[0.14em] text-stone-500 sm:order-2 sm:text-right sm:text-xs sm:tracking-[0.2em]">
          {formatLabel(bouquet.flowerType)}
        </p>
        {pricing.discount ? (
          <div className="order-2 flex min-w-0 max-w-full items-center gap-1.5 overflow-hidden whitespace-nowrap sm:order-1 sm:gap-2">
            <span className="shrink-0 text-sm font-semibold text-[color:var(--brand)] sm:text-base">
              {formatMoney(pricing.finalPriceCents)}
            </span>
            <span className="min-w-0 truncate text-[11px] text-stone-400 line-through sm:text-xs">
              {formatMoney(pricing.originalPriceCents)}
            </span>
            <span className="inline-flex shrink-0 items-center rounded-full bg-[color:var(--brand)]/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-[color:var(--brand)] sm:px-2 sm:text-[10px]">
              -{pricing.discount.percent}%
            </span>
          </div>
        ) : (
          <p className="order-2 text-sm font-semibold text-stone-900 sm:order-1 sm:text-base">
            {formatMoney(pricing.originalPriceCents)}
          </p>
        )}
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
