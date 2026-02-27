import type { Bouquet, StoreSettings } from "@/lib/api-types";

export type DiscountInfo = {
  percent: number;
  note: string;
  source: "bouquet" | "category" | "global";
};

export const clampPercent = (value: number) =>
  Math.min(90, Math.max(0, Math.round(value)));

export const applyPercentDiscount = (priceCents: number, percent: number) => {
  const clamped = clampPercent(percent);
  return Math.max(0, Math.round(priceCents * (100 - clamped) / 100));
};

type CategorySettings = Pick<
  StoreSettings,
  | "categoryDiscountPercent"
  | "categoryDiscountNote"
  | "categoryFlowerType"
  | "categoryMixed"
  | "categoryColor"
  | "categoryMinPriceCents"
  | "categoryMaxPriceCents"
>;

type GlobalSettings = Pick<
  StoreSettings,
  "globalDiscountPercent" | "globalDiscountNote"
>;

const hasCategoryFilters = (settings: CategorySettings) =>
  Boolean(
    settings.categoryFlowerType ||
      settings.categoryMixed ||
      settings.categoryColor ||
      settings.categoryMinPriceCents !== null ||
      settings.categoryMaxPriceCents !== null
  );

const matchesCategory = (
  bouquet: Pick<Bouquet, "flowerType" | "isMixed" | "colors" | "priceCents">,
  settings: CategorySettings
) => {
  if (settings.categoryDiscountPercent <= 0) return false;
  if (!hasCategoryFilters(settings)) return false;

  if (
    settings.categoryFlowerType &&
    settings.categoryFlowerType !== bouquet.flowerType
  ) {
    return false;
  }

  if (settings.categoryMixed === "mixed" && !bouquet.isMixed) {
    return false;
  }

  if (settings.categoryMixed === "mono" && bouquet.isMixed) {
    return false;
  }

  if (settings.categoryColor) {
    const palette = bouquet.colors.toLowerCase();
    if (!palette.includes(settings.categoryColor.toLowerCase())) {
      return false;
    }
  }

  if (
    settings.categoryMinPriceCents !== null &&
    bouquet.priceCents < settings.categoryMinPriceCents
  ) {
    return false;
  }

  if (
    settings.categoryMaxPriceCents !== null &&
    bouquet.priceCents > settings.categoryMaxPriceCents
  ) {
    return false;
  }

  return true;
};

export const getBouquetDiscount = (
  bouquet: Pick<
    Bouquet,
    | "discountPercent"
    | "discountNote"
    | "flowerType"
    | "isMixed"
    | "colors"
    | "priceCents"
  >,
  settings: CategorySettings & GlobalSettings
): DiscountInfo | null => {
  if (bouquet.discountPercent > 0) {
    return {
      percent: bouquet.discountPercent,
      note: bouquet.discountNote || "Discount",
      source: "bouquet",
    };
  }

  if (matchesCategory(bouquet, settings)) {
    return {
      percent: settings.categoryDiscountPercent,
      note: settings.categoryDiscountNote || "Discount",
      source: "category",
    };
  }

  if (settings.globalDiscountPercent > 0) {
    return {
      percent: settings.globalDiscountPercent,
      note: settings.globalDiscountNote || "Discount",
      source: "global",
    };
  }

  return null;
};

export const getBouquetPricing = (
  bouquet: Pick<
    Bouquet,
    | "priceCents"
    | "discountPercent"
    | "discountNote"
    | "flowerType"
    | "isMixed"
    | "colors"
  >,
  settings: CategorySettings & GlobalSettings
) => {
  const discount = getBouquetDiscount(bouquet, settings);
  const finalPriceCents = discount
    ? applyPercentDiscount(bouquet.priceCents, discount.percent)
    : bouquet.priceCents;

  return {
    originalPriceCents: bouquet.priceCents,
    finalPriceCents,
    discount,
  };
};

export const getCartItemDiscount = (
  item: {
    basePriceCents: number;
    bouquetDiscountPercent?: number;
    bouquetDiscountNote?: string;
    flowerType?: string;
    isMixed?: boolean;
    colors?: string;
  },
  settings: CategorySettings & GlobalSettings
): DiscountInfo | null => {
  if (item.bouquetDiscountPercent && item.bouquetDiscountPercent > 0) {
    return {
      percent: item.bouquetDiscountPercent,
      note: item.bouquetDiscountNote || "Discount",
      source: "bouquet",
    };
  }

  if (
    matchesCategory(
      {
        flowerType: (item.flowerType || "") as Bouquet["flowerType"],
        isMixed: Boolean(item.isMixed),
        colors: item.colors || "",
        priceCents: item.basePriceCents,
      },
      settings
    )
  ) {
    return {
      percent: settings.categoryDiscountPercent,
      note: settings.categoryDiscountNote || "Discount",
      source: "category",
    };
  }

  if (settings.globalDiscountPercent > 0) {
    return {
      percent: settings.globalDiscountPercent,
      note: settings.globalDiscountNote || "Discount",
      source: "global",
    };
  }

  return null;
};
