import { describe, expect, it } from "vitest";

import { parseBouquetForm } from "@/lib/bouquet-form";
import { BOUQUET_STYLES, FLOWER_TYPES } from "@/lib/constants";

const makeFormData = (entries: Record<string, string>) => {
  const formData = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    formData.set(key, value);
  }
  return formData;
};

describe("parseBouquetForm", () => {
  it("normalizes and parses standard form values", () => {
    const payload = parseBouquetForm(
      makeFormData({
        name: "  Garden Mood  ",
        description: "  Fresh seasonal flowers  ",
        price: "45.555",
        flowerType: "rose",
        style: "garden",
        colors: "  Blush, Ivory ",
        isMixed: "on",
        isFeatured: "on",
        isActive: "on",
        discountPercent: "14.7",
        discountNote: "  Spring promo ",
        image: " /images/custom.webp ",
      })
    );

    expect(payload).toEqual({
      name: "Garden Mood",
      description: "Fresh seasonal flowers",
      priceCents: 4556,
      flowerType: "ROSE",
      style: "GARDEN",
      colors: "blush, ivory",
      isMixed: true,
      isFeatured: true,
      isActive: true,
      discountPercent: 15,
      discountNote: "Spring promo",
      image: "/images/custom.webp",
      image2: null,
      image3: null,
      image4: null,
      image5: null,
      image6: null,
    });
  });

  it("uses fallback enums and clamps numbers", () => {
    const payload = parseBouquetForm(
      makeFormData({
        name: "Fallback bouquet",
        description: "desc",
        price: "-20",
        flowerType: "unknown",
        style: "unknown",
        colors: "  ",
        discountPercent: "999",
        discountNote: "",
        image: " ",
      })
    );

    expect(payload.flowerType).toBe(FLOWER_TYPES[0]);
    expect(payload.style).toBe(BOUQUET_STYLES[0]);
    expect(payload.priceCents).toBe(0);
    expect(payload.discountPercent).toBe(90);
    expect(payload.discountNote).toBe("Discount");
    expect(payload.image).toBe("/images/bouquet-1.webp");
    expect(payload.image2).toBeNull();
    expect(payload.image3).toBeNull();
    expect(payload.image4).toBeNull();
    expect(payload.image5).toBeNull();
    expect(payload.image6).toBeNull();
  });

  it("drops discount note when discount is disabled", () => {
    const payload = parseBouquetForm(
      makeFormData({
        name: "No promo",
        description: "desc",
        price: "100",
        flowerType: "rose",
        style: "romantic",
        colors: "red",
        discountPercent: "-4",
        discountNote: "Should be ignored",
      })
    );

    expect(payload.discountPercent).toBe(0);
    expect(payload.discountNote).toBeNull();
  });

  it("normalizes additional gallery image URLs", () => {
    const payload = parseBouquetForm(
      makeFormData({
        name: "Gallery bouquet",
        description: "desc",
        price: "75",
        flowerType: "rose",
        style: "modern",
        colors: "white",
        image: "/images/main.webp",
        image2: " /images/2.webp ",
        image3: " ",
        image4: "/images/4.webp",
        image5: "",
        image6: "/images/6.webp",
      })
    );

    expect(payload.image).toBe("/images/main.webp");
    expect(payload.image2).toBe("/images/2.webp");
    expect(payload.image3).toBeNull();
    expect(payload.image4).toBe("/images/4.webp");
    expect(payload.image5).toBeNull();
    expect(payload.image6).toBe("/images/6.webp");
  });
});
