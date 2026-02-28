export const FLOWER_QUANTITY_MIN = 1;
export const FLOWER_QUANTITY_MAX = 1001;

const FLOWER_QUANTITY_ELIGIBLE_TYPES = new Set(["MONO", "SEASON"]);

export const clampFlowerQuantity = (value: number) => {
  if (!Number.isFinite(value)) return FLOWER_QUANTITY_MIN;
  return Math.min(
    FLOWER_QUANTITY_MAX,
    Math.max(FLOWER_QUANTITY_MIN, Math.round(value))
  );
};

export const isFlowerQuantityEnabledForBouquet = (
  bouquetType: string,
  allowFlowerQuantity: boolean
) =>
  Boolean(allowFlowerQuantity) &&
  FLOWER_QUANTITY_ELIGIBLE_TYPES.has(String(bouquetType || "").toUpperCase());
