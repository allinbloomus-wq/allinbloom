import { BOUQUET_TYPES, FLOWER_TYPES } from "@/lib/constants";

export type BouquetFormPayload = {
  name: string;
  description: string;
  priceCents: number;
  flowerType: (typeof FLOWER_TYPES)[number];
  style: string;
  bouquetType: (typeof BOUQUET_TYPES)[number];
  colors: string;
  isMixed: boolean;
  isFeatured: boolean;
  isActive: boolean;
  discountPercent: number;
  discountNote: string | null;
  image: string;
  image2: string | null;
  image3: string | null;
  image4: string | null;
  image5: string | null;
  image6: string | null;
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

const parseFlowerTypes = (formData: FormData): (typeof FLOWER_TYPES)[number][] => {
  const valid = new Set<string>(FLOWER_TYPES);
  const parsed = formData
    .getAll("flowerTypes")
    .map((value) => String(value || "").trim().toUpperCase())
    .filter((value): value is (typeof FLOWER_TYPES)[number] => valid.has(value));

  const unique = parsed.filter((value, index) => parsed.indexOf(value) === index);
  if (unique.length) {
    return unique.slice(0, 3);
  }

  const fallbackCsv = String(formData.get("style") || "");
  const fallbackFromCsv = fallbackCsv
    .split(",")
    .map((value) => value.trim().toUpperCase())
    .filter((value): value is (typeof FLOWER_TYPES)[number] => valid.has(value))
    .filter((value, index, list) => list.indexOf(value) === index)
    .slice(0, 3);
  if (fallbackFromCsv.length) {
    return fallbackFromCsv;
  }

  const fallbackPrimary = normalizeEnum(
    String(formData.get("flowerType")),
    FLOWER_TYPES,
    FLOWER_TYPES[0]
  );
  return [fallbackPrimary];
};

export const parseBouquetForm = (formData: FormData): BouquetFormPayload => {
  const normalizeOptionalImage = (value: FormDataEntryValue | null) => {
    const normalized = String(value || "").trim();
    return normalized || null;
  };

  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const price = Number(formData.get("price") || 0);
  const rawImage = String(formData.get("image") || "").trim();
  const image = rawImage || "/images/bouquet-1.webp";
  const colors = String(formData.get("colors") || "").toLowerCase().trim();
  const discountPercent = Math.min(
    90,
    Math.max(0, Math.round(Number(formData.get("discountPercent") || 0)))
  );
  const discountNote = String(formData.get("discountNote") || "").trim();
  const normalizedDiscountNote =
    discountPercent > 0 ? discountNote || "Discount" : null;
  const flowerTypes = parseFlowerTypes(formData);
  const bouquetType = normalizeEnum(
    String(formData.get("bouquetType")),
    BOUQUET_TYPES,
    formData.get("isMixed") === "on" ? "MIXED" : "MONO"
  );

  return {
    name,
    description,
    priceCents: Math.max(0, Math.round(price * 100)),
    flowerType: flowerTypes[0],
    style: flowerTypes.join(", "),
    bouquetType,
    colors,
    isMixed: bouquetType === "MIXED",
    isFeatured: formData.get("isFeatured") === "on",
    isActive: formData.get("isActive") === "on",
    discountPercent,
    discountNote: normalizedDiscountNote,
    image,
    image2: normalizeOptionalImage(formData.get("image2")),
    image3: normalizeOptionalImage(formData.get("image3")),
    image4: normalizeOptionalImage(formData.get("image4")),
    image5: normalizeOptionalImage(formData.get("image5")),
    image6: normalizeOptionalImage(formData.get("image6")),
  };
};

