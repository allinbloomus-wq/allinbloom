import { FLOWER_TYPES, BOUQUET_STYLES } from "@/lib/constants";

export type BouquetFormPayload = {
  name: string;
  description: string;
  priceCents: number;
  flowerType: (typeof FLOWER_TYPES)[number];
  style: (typeof BOUQUET_STYLES)[number];
  colors: string;
  isMixed: boolean;
  isFeatured: boolean;
  isActive: boolean;
  discountPercent: number;
  discountNote: string | null;
  image: string;
};

const normalizeEnum = <T extends readonly string[]>(
  value: string | null,
  allowed: T,
  fallback: T[number]
) => {
  if (!value) return fallback;
  const upper = value.toUpperCase();
  return (allowed as readonly string[]).includes(upper) ? (upper as T[number]) : fallback;
};

export const parseBouquetForm = (formData: FormData): BouquetFormPayload => {
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const price = Number(formData.get("price") || 0);
  const image = String(formData.get("image") || "/images/bouquet-1.svg").trim();
  const colors = String(formData.get("colors") || "").toLowerCase().trim();
  const discountPercent = Math.min(
    90,
    Math.max(0, Math.round(Number(formData.get("discountPercent") || 0)))
  );
  const discountNote = String(formData.get("discountNote") || "").trim();

  if (discountPercent > 0 && !discountNote) {
    throw new Error("Discount note is required when a discount is set.");
  }

  return {
    name,
    description,
    priceCents: Math.max(0, Math.round(price * 100)),
    flowerType: normalizeEnum(
      String(formData.get("flowerType")),
      FLOWER_TYPES,
      FLOWER_TYPES[0]
    ),
    style: normalizeEnum(
      String(formData.get("style")),
      BOUQUET_STYLES,
      BOUQUET_STYLES[0]
    ),
    colors,
    isMixed: formData.get("isMixed") === "on",
    isFeatured: formData.get("isFeatured") === "on",
    isActive: formData.get("isActive") === "on",
    discountPercent,
    discountNote: discountPercent > 0 ? discountNote : null,
    image,
  };
};
