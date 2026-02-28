"use client";

import { useMemo, useState } from "react";
import { formatLabel, formatMoney } from "@/lib/format";
import AddToCartControls from "@/components/add-to-cart-controls";
import BouquetImageCarousel from "@/components/bouquet-image-carousel";
import type { Bouquet, BouquetPricing } from "@/lib/api-types";
import { getBouquetGalleryImages } from "@/lib/bouquet-images";
import { FLOWER_TYPES } from "@/lib/constants";
import {
  clampFlowerQuantity,
  FLOWER_QUANTITY_MAX,
  FLOWER_QUANTITY_MIN,
  isFlowerQuantityEnabledForBouquet,
} from "@/lib/flower-quantity";

export default function BouquetCard({
  bouquet,
  pricing,
  enableFlowerQuantityInput = false,
}: {
  bouquet: Bouquet;
  pricing: BouquetPricing;
  enableFlowerQuantityInput?: boolean;
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
  const [flowerQuantity, setFlowerQuantity] = useState(FLOWER_QUANTITY_MIN);
  const isFlowerQuantityEnabled = useMemo(
    () =>
      enableFlowerQuantityInput &&
      isFlowerQuantityEnabledForBouquet(
        bouquetTypeLabel,
        bouquet.allowFlowerQuantity
      ),
    [bouquet.allowFlowerQuantity, bouquetTypeLabel, enableFlowerQuantityInput]
  );
  const effectiveQuantity = isFlowerQuantityEnabled ? flowerQuantity : 1;
  const originalPriceCents = pricing.originalPriceCents * effectiveQuantity;
  const finalPriceCents = pricing.finalPriceCents * effectiveQuantity;
  const perFlowerFromCents = pricing.discount
    ? pricing.finalPriceCents
    : pricing.originalPriceCents;

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
      <div className="space-y-2">
        {isFlowerQuantityEnabled ? (
          <p className="text-[10px] uppercase tracking-[0.2em] text-stone-500">
            From {formatMoney(perFlowerFromCents)} per flower
          </p>
        ) : null}
        <div className="flex items-center justify-between">
          {pricing.discount ? (
            <div className="flex min-w-0 max-w-full items-center gap-1 overflow-hidden whitespace-nowrap sm:gap-2">
              <span className="text-[clamp(7.54px,2.75vw,11.66px)] font-semibold leading-none text-[color:var(--brand)] sm:text-[clamp(13px,4.7vw,20px)]">
                {formatMoney(finalPriceCents)}
              </span>
              <span className="text-[clamp(5.83px,2.16vw,8.16px)] text-stone-400 line-through sm:text-[clamp(10px,3.7vw,14px)]">
                {formatMoney(originalPriceCents)}
              </span>
              <span className="inline-flex shrink-0 items-center rounded-full bg-[color:var(--brand)]/10 px-1.5 py-0.5 text-[clamp(4.66px,1.63vw,6.99px)] font-semibold uppercase tracking-[0.08em] text-[color:var(--brand)] sm:px-2.5 sm:text-[clamp(8px,2.8vw,12px)]">
                -{pricing.discount.percent}%
              </span>
            </div>
          ) : (
            <p className="text-[clamp(8.16px,2.8vw,11.66px)] font-semibold leading-none text-stone-900 sm:text-[clamp(14px,4.8vw,20px)]">
              {formatMoney(originalPriceCents)}
            </p>
          )}
        </div>
      </div>
      {isFlowerQuantityEnabled ? (
        <label className="flex items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white/80 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-stone-600 sm:text-xs sm:tracking-[0.24em]">
          Flowers
          <input
            type="number"
            min={FLOWER_QUANTITY_MIN}
            max={FLOWER_QUANTITY_MAX}
            inputMode="numeric"
            value={flowerQuantity}
            onChange={(event) => {
              const next = Number(event.target.value);
              setFlowerQuantity(clampFlowerQuantity(next));
            }}
            className="h-8 w-20 rounded-xl border border-stone-200 bg-white px-2 text-right text-sm font-semibold text-stone-800 outline-none focus:border-stone-400"
          />
        </label>
      ) : null}
      <AddToCartControls
        selectedQuantity={effectiveQuantity}
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
          isFlowerQuantityEnabled,
        }}
      />
    </div>
  );
}
