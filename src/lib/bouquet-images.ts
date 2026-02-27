import type { Bouquet } from "@/lib/api-types";

type BouquetImageFields = Pick<
  Bouquet,
  "image" | "image2" | "image3" | "image4" | "image5" | "image6"
>;

export const getBouquetGalleryImages = (bouquet: BouquetImageFields): string[] => {
  const candidates = [
    bouquet.image,
    bouquet.image2,
    bouquet.image3,
    bouquet.image4,
    bouquet.image5,
    bouquet.image6,
  ]
    .map((value) => String(value || "").trim())
    .filter(Boolean);

  return candidates.filter((value, index) => candidates.indexOf(value) === index);
};
