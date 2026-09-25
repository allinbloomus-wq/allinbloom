import type { PromoSlide } from "@/lib/api-types";
import AdminImageUpload from "@/components/admin-image-upload";
import { adminInputClass } from "@/lib/ui-classes";

type AdminPromoFormProps = {
  slide?: PromoSlide;
  action: (formData: FormData) => Promise<void>;
};

const fieldClass = adminInputClass();

export default function AdminPromoForm({ slide, action }: AdminPromoFormProps) {
  return (
    <form
      action={action}
      className="relative z-10 max-w-full space-y-6 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6"
    >
      {slide ? <input type="hidden" name="id" value={slide.id} /> : null}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="min-w-0 space-y-4">
          <label className="flex flex-col gap-2 text-sm font-medium text-stone-700">
            Title (optional)
            <input
              name="title"
              defaultValue={slide?.title || ""}
              className={fieldClass}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-stone-700">
            Subtitle (optional)
            <input
              name="subtitle"
              defaultValue={slide?.subtitle || ""}
              className={fieldClass}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-stone-700">
            Link (optional)
            <input
              name="link"
              defaultValue={slide?.link || ""}
              placeholder="/catalog?filter=featured"
              className={fieldClass}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-stone-700">
            Position (lower shows first)
            <input
              name="position"
              type="number"
              defaultValue={slide?.position ?? 0}
              className={fieldClass}
            />
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-stone-700">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={slide ? slide.isActive : true}
            />
            Active in gallery
          </label>
        </div>
        <div className="min-w-0 space-y-4">
          <AdminImageUpload
            defaultValue={slide?.image || "/images/promo-1.webp"}
            recommendedSize="900x1600"
          />
        </div>
      </div>
      <div className="sticky bottom-0 z-20 -mx-4 -mb-4 flex rounded-b-2xl sm:-mb-6 flex-wrap items-center justify-end gap-3 border-t border-stone-200 bg-white/95 px-4 py-3 sm:-mx-6 sm:px-6">
        <button
          type="submit"
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-[color:var(--brand)] px-5 text-sm font-medium text-white transition hover:bg-[color:var(--brand-dark)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand)] focus-visible:ring-offset-2 sm:w-auto"
        >
          Save slide
        </button>
        <p className="text-xs font-medium text-stone-500">
          Changes apply instantly
        </p>
      </div>
    </form>
  );
}


