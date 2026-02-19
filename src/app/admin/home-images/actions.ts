"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-session";
import { updateStoreSettings } from "@/lib/data/settings";
import {
  DEFAULT_CATALOG_CATEGORY_IMAGES,
  DEFAULT_HOME_GALLERY_IMAGES,
  DEFAULT_HOME_HERO_IMAGE,
} from "@/lib/home-images";

const parseImageUrl = (value: FormDataEntryValue | null, fallback: string) => {
  const parsed = String(value || "").trim();
  return parsed || fallback;
};

export async function updateHomeImages(formData: FormData) {
  await requireAdmin();

  await updateStoreSettings({
    homeHeroImage: parseImageUrl(
      formData.get("homeHeroImage"),
      DEFAULT_HOME_HERO_IMAGE
    ),
    homeGalleryImage1: parseImageUrl(
      formData.get("homeGalleryImage1"),
      DEFAULT_HOME_GALLERY_IMAGES[0]
    ),
    homeGalleryImage2: parseImageUrl(
      formData.get("homeGalleryImage2"),
      DEFAULT_HOME_GALLERY_IMAGES[1]
    ),
    homeGalleryImage3: parseImageUrl(
      formData.get("homeGalleryImage3"),
      DEFAULT_HOME_GALLERY_IMAGES[2]
    ),
    homeGalleryImage4: parseImageUrl(
      formData.get("homeGalleryImage4"),
      DEFAULT_HOME_GALLERY_IMAGES[3]
    ),
    homeGalleryImage5: parseImageUrl(
      formData.get("homeGalleryImage5"),
      DEFAULT_HOME_GALLERY_IMAGES[4]
    ),
    homeGalleryImage6: parseImageUrl(
      formData.get("homeGalleryImage6"),
      DEFAULT_HOME_GALLERY_IMAGES[5]
    ),
    catalogCategoryImageMono: parseImageUrl(
      formData.get("catalogCategoryImageMono"),
      DEFAULT_CATALOG_CATEGORY_IMAGES.mono
    ),
    catalogCategoryImageMixed: parseImageUrl(
      formData.get("catalogCategoryImageMixed"),
      DEFAULT_CATALOG_CATEGORY_IMAGES.mixed
    ),
    catalogCategoryImageSeason: parseImageUrl(
      formData.get("catalogCategoryImageSeason"),
      DEFAULT_CATALOG_CATEGORY_IMAGES.season
    ),
    catalogCategoryImageAll: parseImageUrl(
      formData.get("catalogCategoryImageAll"),
      DEFAULT_CATALOG_CATEGORY_IMAGES.all
    ),
  });

  revalidatePath("/admin/home-images");
  revalidatePath("/catalog");
  revalidatePath("/");
  redirect("/admin/home-images?toast=home-images-saved");
}
