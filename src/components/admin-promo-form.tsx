import type { PromoSlide } from "@prisma/client";
import AdminImageUpload from "@/components/admin-image-upload";

type AdminPromoFormProps = {
  slide?: PromoSlide;
  action: (formData: FormData) => Promise<void>;
};

export default function AdminPromoForm({ slide, action }: AdminPromoFormProps) {
  return (
    <form
      action={action}
      className="glass space-y-6 rounded-[28px] border border-white/80 p-6"
    >
      {slide ? <input type="hidden" name="id" value={slide.id} /> : null}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <label className="flex flex-col gap-2 text-sm text-stone-700">
            Title (optional)
            <input
              name="title"
              defaultValue={slide?.title || ""}
              className="rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 text-sm text-stone-800 outline-none focus:border-stone-400"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-stone-700">
            Subtitle (optional)
            <input
              name="subtitle"
              defaultValue={slide?.subtitle || ""}
              className="rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 text-sm text-stone-800 outline-none focus:border-stone-400"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-stone-700">
            Link (optional)
            <input
              name="link"
              defaultValue={slide?.link || ""}
              placeholder="/catalog?filter=featured"
              className="rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 text-sm text-stone-800 outline-none focus:border-stone-400"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-stone-700">
            Position (lower shows first)
            <input
              name="position"
              type="number"
              defaultValue={slide?.position ?? 0}
              className="rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 text-sm text-stone-800 outline-none focus:border-stone-400"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-stone-700">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={slide ? slide.isActive : true}
            />
            Active in gallery
          </label>
        </div>
        <div className="space-y-4">
          <AdminImageUpload
            defaultValue={slide?.image || "/images/promo-1.png"}
            recommendedSize="900x1600"
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          className="rounded-full bg-[color:var(--brand)] px-6 py-3 text-xs uppercase tracking-[0.3em] text-white transition hover:bg-[color:var(--brand-dark)]"
        >
          Save slide
        </button>
        <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
          Changes apply instantly
        </p>
      </div>
    </form>
  );
}

