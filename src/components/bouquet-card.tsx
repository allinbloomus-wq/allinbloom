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
    <div className="glass flex h-full flex-col gap-4 rounded-[28px] border border-white/80 p-5">
      <div className="overflow-hidden rounded-[22px] border border-white/80 bg-white">
        <BouquetImageLightbox
          src={bouquet.image}
          alt={bouquet.name}
          className="block w-full"
        />
      </div>
      <div className="flex-1 space-y-2">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.24em] text-stone-500">
          <span>{formatLabel(bouquet.style)}</span>
          <span>{bouquet.isMixed ? "Mixed" : "Mono"}</span>
        </div>
        <h3 className="text-xl font-semibold text-stone-900">
          {bouquet.name}
        </h3>
        <p className="text-sm leading-relaxed text-stone-600">
          {bouquet.description}
        </p>
      </div>
      <div className="flex items-center justify-between">
        {pricing.discount ? (
          <div className="flex items-baseline gap-2">
            <span className="text-sm text-stone-400 line-through">
              {formatMoney(pricing.originalPriceCents)}
            </span>
            <span className="text-lg font-semibold text-[color:var(--brand)]">
              {formatMoney(pricing.finalPriceCents)}
            </span>
          </div>
        ) : (
          <p className="text-lg font-semibold text-stone-900">
            {formatMoney(pricing.originalPriceCents)}
          </p>
        )}
        <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
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
