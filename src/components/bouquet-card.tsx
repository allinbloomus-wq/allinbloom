"use client";

import { formatLabel, formatMoney } from "@/lib/format";
import AddToCartControls from "@/components/add-to-cart-controls";
import BouquetImageCarousel from "@/components/bouquet-image-carousel";
import type { Bouquet, BouquetPricing } from "@/lib/api-types";
import { getBouquetGalleryImages } from "@/lib/bouquet-images";
import { FLOWER_TYPES } from "@/lib/constants";

export default function BouquetCard({
  bouquet,
  pricing,
}: {
  bouquet: Bouquet;
  pricing: BouquetPricing;
}) {
  const galleryImages = getBouquetGalleryImages(bouquet);
  const selectableSet = new Set<string>(FLOWER_TYPES);
  const parsedFlowerTypes = String(bouquet.style || "")
    .split(",")
    .map((value) => value.trim().toUpperCase())
    .filter((value) => selectableSet.has(value))
    .filter((value, index, list) => list.indexOf(value) === index)
    .slice(0, 3);

  const flowerTypeLabelParts = parsedFlowerTypes.length
    ? parsedFlowerTypes.map((value) => formatLabel(value))
    : bouquet.flowerType === "MIXED"
    ? ["Assorted blooms"]
    : [formatLabel(bouquet.flowerType)];
  const flowerTypeLabel = flowerTypeLabelParts.join(", ");
  const flowerTypeTextClass =
    flowerTypeLabelParts.length >= 3
      ? "text-[8px] tracking-[0.1em] sm:text-[10px]"
      : flowerTypeLabelParts.length === 2
      ? "text-[9px] tracking-[0.12em] sm:text-[11px]"
      : "text-[10px] tracking-[0.16em] sm:text-xs sm:tracking-[0.24em]";
  const bouquetTypeLabel =
    bouquet.bouquetType ||
    (String(bouquet.style || "").trim().toUpperCase() === "SEASON"
      ? "SEASON"
      : bouquet.isMixed
      ? "MIXED"
      : "MONO");

  return (
    <div className="glass flex h-full flex-col gap-3 rounded-[24px] border border-white/80 p-[9px] sm:gap-4 sm:rounded-[28px] sm:p-5">
      <div className="overflow-hidden rounded-[18px] border border-white/80 bg-white sm:rounded-[22px]">
        <BouquetImageCarousel images={galleryImages} alt={bouquet.name} />
      </div>
      <div className="min-w-0 flex-1 space-y-1.5 sm:space-y-2">
        <div className="flex items-end justify-between gap-2 text-stone-500 uppercase">
          <span className={`min-w-0 truncate ${flowerTypeTextClass}`}>
            {flowerTypeLabel}
          </span>
          <span className="shrink-0 text-[10px] tracking-[0.16em] sm:text-xs sm:tracking-[0.24em]">
            {formatLabel(bouquetTypeLabel)}
          </span>
        </div>
        <h3 className="break-words text-base font-semibold leading-tight text-stone-900 sm:text-xl">
          {bouquet.name}
        </h3>
        <p className="break-words text-xs leading-snug text-stone-600 sm:text-sm sm:leading-relaxed">
          {bouquet.description}
        </p>
      </div>
      <div className="flex items-center justify-between">
        {pricing.discount ? (
          <div className="flex min-w-0 max-w-full items-center gap-1 overflow-hidden whitespace-nowrap sm:gap-2">
            <span className="text-[clamp(8.8px,3.2vw,13.6px)] font-semibold leading-none text-[color:var(--brand)] sm:text-[clamp(13px,4.7vw,20px)]">
              {formatMoney(pricing.finalPriceCents)}
            </span>
            <span className="text-[clamp(6.8px,2.52vw,9.52px)] text-stone-400 line-through sm:text-[clamp(10px,3.7vw,14px)]">
              {formatMoney(pricing.originalPriceCents)}
            </span>
            <span className="inline-flex shrink-0 items-center rounded-full bg-[color:var(--brand)]/10 px-1.5 py-0.5 text-[clamp(5.44px,1.904vw,8.16px)] font-semibold uppercase tracking-[0.08em] text-[color:var(--brand)] sm:px-2.5 sm:text-[clamp(8px,2.8vw,12px)]">
              -{pricing.discount.percent}%
            </span>
          </div>
        ) : (
          <p className="text-[clamp(9.52px,3.264vw,13.6px)] font-semibold leading-none text-stone-900 sm:text-[clamp(14px,4.8vw,20px)]">
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
          flowerTypes: parsedFlowerTypes.length
            ? parsedFlowerTypes.join(", ")
            : bouquet.flowerType === "MIXED"
            ? ""
            : bouquet.flowerType,
          colors: bouquet.colors,
          isMixed: bouquet.isMixed,
        }}
      />
    </div>
  );
}
