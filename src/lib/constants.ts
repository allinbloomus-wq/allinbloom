export const FLOWER_TYPES = [
  "ROSE",
  "TULIP",
  "LILY",
  "PEONY",
  "ORCHID",
] as const;

export const FLOWER_TYPES_WITH_MIXED = [...FLOWER_TYPES, "MIXED"] as const;

export const BOUQUET_TYPES = [
  "MONO",
  "MIXED",
  "SEASON",
] as const;

export const BOUQUET_TYPE_FILTERS = [
  "all",
  "mono",
  "mixed",
  "season",
] as const;

export const COLOR_OPTIONS = [
  "blush",
  "ivory",
  "peach",
  "sage",
  "lavender",
  "ruby",
  "champagne",
] as const;

export const PRICE_LIMITS = {
  min: 45,
  max: 2000,
};
