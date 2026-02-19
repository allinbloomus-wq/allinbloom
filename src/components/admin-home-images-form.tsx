"use client";

import { useFormStatus } from "react-dom";
import type { StoreSettings } from "@/lib/api-types";
import AdminImageUpload from "@/components/admin-image-upload";

type AdminHomeImagesFormProps = {
  settings: StoreSettings;
  action: (formData: FormData) => Promise<void>;
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 w-full items-center justify-center rounded-full bg-[color:var(--brand)] px-6 text-xs uppercase tracking-[0.3em] text-white transition hover:bg-[color:var(--brand-dark)] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
    >
      {pending ? "Saving..." : "Save images"}
    </button>
  );
}

export default function AdminHomeImagesForm({
  settings,
  action,
}: AdminHomeImagesFormProps) {
  return (
    <form
      action={action}
      className="glass relative z-10 max-w-full space-y-6 rounded-[28px] border border-white/80 p-4 sm:p-6"
    >
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-stone-900">Hero image</h2>
        <AdminImageUpload
          name="homeHeroImage"
          urlLabel="Hero image URL"
          previewAlt="Homepage hero preview"
          defaultValue={settings.homeHeroImage}
          recommendedSize="1200x1500"
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-stone-900">
          Atelier gallery images
        </h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <AdminImageUpload
            name="homeGalleryImage1"
            urlLabel="Gallery image 1 URL"
            previewAlt="Homepage gallery image 1 preview"
            defaultValue={settings.homeGalleryImage1}
            recommendedSize="1000x1000"
          />
          <AdminImageUpload
            name="homeGalleryImage2"
            urlLabel="Gallery image 2 URL"
            previewAlt="Homepage gallery image 2 preview"
            defaultValue={settings.homeGalleryImage2}
            recommendedSize="1000x1000"
          />
          <AdminImageUpload
            name="homeGalleryImage3"
            urlLabel="Gallery image 3 URL"
            previewAlt="Homepage gallery image 3 preview"
            defaultValue={settings.homeGalleryImage3}
            recommendedSize="1000x1000"
          />
          <AdminImageUpload
            name="homeGalleryImage4"
            urlLabel="Gallery image 4 URL"
            previewAlt="Homepage gallery image 4 preview"
            defaultValue={settings.homeGalleryImage4}
            recommendedSize="1000x1000"
          />
          <AdminImageUpload
            name="homeGalleryImage5"
            urlLabel="Gallery image 5 URL"
            previewAlt="Homepage gallery image 5 preview"
            defaultValue={settings.homeGalleryImage5}
            recommendedSize="1000x1000"
          />
          <AdminImageUpload
            name="homeGalleryImage6"
            urlLabel="Gallery image 6 URL"
            previewAlt="Homepage gallery image 6 preview"
            defaultValue={settings.homeGalleryImage6}
            recommendedSize="1000x1000"
          />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-stone-900">
          Catalog category images
        </h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <AdminImageUpload
            name="catalogCategoryImageMono"
            urlLabel="Catalog Mono category image URL"
            previewAlt="Catalog mono category image preview"
            defaultValue={settings.catalogCategoryImageMono}
            recommendedSize="1000x1000"
          />
          <AdminImageUpload
            name="catalogCategoryImageMixed"
            urlLabel="Catalog Mixed category image URL"
            previewAlt="Catalog mixed category image preview"
            defaultValue={settings.catalogCategoryImageMixed}
            recommendedSize="1000x1000"
          />
          <AdminImageUpload
            name="catalogCategoryImageSeason"
            urlLabel="Catalog Season category image URL"
            previewAlt="Catalog season category image preview"
            defaultValue={settings.catalogCategoryImageSeason}
            recommendedSize="1000x1000"
          />
          <AdminImageUpload
            name="catalogCategoryImageAll"
            urlLabel="Catalog All category image URL"
            previewAlt="Catalog all category image preview"
            defaultValue={settings.catalogCategoryImageAll}
            recommendedSize="1000x1000"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <SubmitButton />
        <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
          Applies to homepage and catalog category tiles
        </p>
      </div>
    </form>
  );
}
