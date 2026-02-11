"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-session";
import { updateStoreSettings } from "@/lib/data/settings";
import { clampPercent } from "@/lib/pricing";

const parsePriceCents = (value: FormDataEntryValue | null) => {
  if (!value) return null;
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  return Math.max(0, Math.round(num * 100));
};

export async function updateDiscountSettings(formData: FormData) {
  await requireAdmin();

  const globalPercent = clampPercent(
    Number(formData.get("globalDiscountPercent") || 0)
  );
  const globalNote = String(formData.get("globalDiscountNote") || "").trim();
  const categoryPercent = clampPercent(
    Number(formData.get("categoryDiscountPercent") || 0)
  );
  const categoryNote = String(
    formData.get("categoryDiscountNote") || ""
  ).trim();
  const categoryFlowerType = String(
    formData.get("categoryFlowerType") || ""
  ).trim();
  const categoryStyle = String(formData.get("categoryStyle") || "").trim();
  const categoryMixed = String(formData.get("categoryMixed") || "").trim();
  const categoryColor = String(formData.get("categoryColor") || "").trim();
  const categoryMinPriceCents = parsePriceCents(
    formData.get("categoryMinPrice")
  );
  const categoryMaxPriceCents = parsePriceCents(
    formData.get("categoryMaxPrice")
  );
  const firstPercent = clampPercent(
    Number(formData.get("firstOrderDiscountPercent") || 0)
  );
  const firstNote = String(formData.get("firstOrderDiscountNote") || "").trim();

  if (globalPercent > 0 && categoryPercent > 0) {
    throw new Error("Global and category discounts cannot be active together.");
  }

  if (globalPercent > 0 && !globalNote) {
    throw new Error("Global discount comment is required.");
  }

  const hasCategoryFilter = Boolean(
    categoryFlowerType ||
      categoryStyle ||
      categoryMixed ||
      categoryColor ||
      categoryMinPriceCents !== null ||
      categoryMaxPriceCents !== null
  );

  if (categoryPercent > 0 && !categoryNote) {
    throw new Error("Category discount comment is required.");
  }

  if (categoryPercent > 0 && !hasCategoryFilter) {
    throw new Error("Category discount requires at least one filter.");
  }

  if (
    categoryMinPriceCents !== null &&
    categoryMaxPriceCents !== null &&
    categoryMinPriceCents > categoryMaxPriceCents
  ) {
    throw new Error("Category min price must be less than max price.");
  }

  if (firstPercent > 0 && !firstNote) {
    throw new Error("First order discount comment is required.");
  }

  await updateStoreSettings({
    globalDiscountPercent: globalPercent,
    globalDiscountNote: globalPercent > 0 ? globalNote : null,
    categoryDiscountPercent: categoryPercent,
    categoryDiscountNote: categoryPercent > 0 ? categoryNote : null,
    categoryFlowerType: categoryPercent > 0 ? categoryFlowerType || null : null,
    categoryStyle: categoryPercent > 0 ? categoryStyle || null : null,
    categoryMixed: categoryPercent > 0 ? categoryMixed || null : null,
    categoryColor: categoryPercent > 0 ? categoryColor || null : null,
    categoryMinPriceCents:
      categoryPercent > 0 ? categoryMinPriceCents : null,
    categoryMaxPriceCents:
      categoryPercent > 0 ? categoryMaxPriceCents : null,
    firstOrderDiscountPercent: firstPercent,
    firstOrderDiscountNote: firstPercent > 0 ? firstNote : null,
  });

  revalidatePath("/admin/discounts");
  revalidatePath("/admin");
  revalidatePath("/catalog");
  revalidatePath("/");
}
