export const FLOWER_TYPES = [
  "ROSE",
  "TULIP",
  "PEONY",
  "ORCHID",
  "HYDRANGEAS",
  "SPRAY_ROSES",
  "RANUNCULUSES",
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

export const CATALOG_SORT_VALUES = [
  "name_asc",
  "name_desc",
  "price_asc",
  "price_desc",
] as const;

export const COLOR_OPTIONS = [
  "pink",
  "white",
  "red",
  "peach",
  "blue",
  "lavender",
  "orange",
  "light blue",
  "burgundy",
  "yellow",
] as const;

export const PRICE_LIMITS = {
  min: 45,
  max: 2000,
};
