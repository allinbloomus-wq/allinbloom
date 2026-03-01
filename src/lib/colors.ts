import { COLOR_OPTIONS } from "@/lib/constants";

const LEGACY_COLOR_MAP: Record<string, string> = {
  blush: "pink",
  ivory: "white",
  ruby: "burgundy",
  sage: "light blue",
  lavender: "lavender",
  peach: "peach",
  champagne: "yellow",
  champange: "yellow",
};

const COLOR_SET = new Set<string>(COLOR_OPTIONS);

const normalizeKey = (value: string) => value.trim().toLowerCase();

export const normalizeColorValue = (value: string | null | undefined) => {
  const key = normalizeKey(String(value || ""));
  if (!key) return "";
  const mapped = LEGACY_COLOR_MAP[key] || key;
  return COLOR_SET.has(mapped as (typeof COLOR_OPTIONS)[number]) ? mapped : "";
};

export const normalizeColorCsv = (value: string | null | undefined) => {
  const parsed = String(value || "")
    .split(",")
    .map((entry) => normalizeColorValue(entry))
    .filter(Boolean);
  const unique = parsed.filter((entry, index) => parsed.indexOf(entry) === index);
  return unique.join(", ");
};

export const normalizePaletteText = (value: string | null | undefined) => {
  let normalized = String(value || "").toLowerCase();
  for (const [legacy, replacement] of Object.entries(LEGACY_COLOR_MAP)) {
    normalized = normalized.replaceAll(legacy, replacement);
  }
  return normalized;
};
