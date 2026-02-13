"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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

  const globalPercentRaw = clampPercent(
    Number(formData.get("globalDiscountPercent") || 0)
  );
  const globalNote = String(formData.get("globalDiscountNote") || "").trim();
  const categoryPercentRaw = clampPercent(
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

  const hasCategoryFilter = Boolean(
    categoryFlowerType ||
      categoryStyle ||
      categoryMixed ||
      categoryColor ||
      categoryMinPriceCents !== null ||
      categoryMaxPriceCents !== null
  );

  // Normalize risky form combinations instead of throwing.
  const categoryCanApply = categoryPercentRaw > 0 && hasCategoryFilter;
  const categoryPercent = categoryCanApply ? categoryPercentRaw : 0;
  let globalPercent = globalPercentRaw;

  // Category has higher precedence when both are set.
  if (globalPercent > 0 && categoryPercent > 0) {
    globalPercent = 0;
  }

  const normalizedGlobalNote =
    globalPercent > 0 ? globalNote || "Storewide discount" : null;
  const normalizedCategoryNote =
    categoryPercent > 0 ? categoryNote || "Category discount" : null;
  const normalizedFirstNote =
    firstPercent > 0 ? firstNote || "First order discount" : null;

  let normalizedCategoryMinPriceCents =
    categoryPercent > 0 ? categoryMinPriceCents : null;
  let normalizedCategoryMaxPriceCents =
    categoryPercent > 0 ? categoryMaxPriceCents : null;

  if (
    normalizedCategoryMinPriceCents !== null &&
    normalizedCategoryMaxPriceCents !== null &&
    normalizedCategoryMinPriceCents > normalizedCategoryMaxPriceCents
  ) {
    const swap = normalizedCategoryMinPriceCents;
    normalizedCategoryMinPriceCents = normalizedCategoryMaxPriceCents;
    normalizedCategoryMaxPriceCents = swap;
  }

  await updateStoreSettings({
    globalDiscountPercent: globalPercent,
    globalDiscountNote: normalizedGlobalNote,
    categoryDiscountPercent: categoryPercent,
    categoryDiscountNote: normalizedCategoryNote,
    categoryFlowerType: categoryPercent > 0 ? categoryFlowerType || null : null,
    categoryStyle: categoryPercent > 0 ? categoryStyle || null : null,
    categoryMixed: categoryPercent > 0 ? categoryMixed || null : null,
    categoryColor: categoryPercent > 0 ? categoryColor || null : null,
    categoryMinPriceCents: normalizedCategoryMinPriceCents,
    categoryMaxPriceCents: normalizedCategoryMaxPriceCents,
    firstOrderDiscountPercent: firstPercent,
    firstOrderDiscountNote: normalizedFirstNote,
  });

  revalidatePath("/admin/discounts");
  revalidatePath("/admin");
  revalidatePath("/catalog");
  revalidatePath("/");
  redirect("/admin/discounts?toast=discounts-saved");
}
