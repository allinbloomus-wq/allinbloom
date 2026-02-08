import type { Bouquet } from "@prisma/client";
import { BOUQUET_STYLES, FLOWER_TYPES } from "@/lib/constants";
import { formatLabel } from "@/lib/format";
import AdminImageUpload from "@/components/admin-image-upload";

type AdminBouquetFormProps = {
  bouquet?: Bouquet;
  action: (formData: FormData) => Promise<void>;
};

export default function AdminBouquetForm({
  bouquet,
  action,
}: AdminBouquetFormProps) {
  return (
    <form
      action={action}
      className="glass space-y-6 rounded-[28px] border border-white/80 p-6"
    >
      {bouquet ? <input type="hidden" name="id" value={bouquet.id} /> : null}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <label className="flex flex-col gap-2 text-sm text-stone-700">
            Name
            <input
              name="name"
              defaultValue={bouquet?.name}
              required
              className="rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 text-sm text-stone-800 outline-none focus:border-stone-400"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-stone-700">
            Description
            <textarea
              name="description"
              defaultValue={bouquet?.description}
              rows={4}
              required
              className="rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 text-sm text-stone-800 outline-none focus:border-stone-400"
            />
          </label>
          <div className="grid gap-4">
            <label className="flex flex-col gap-2 text-sm text-stone-700">
              Price (USD)
              <input
                name="price"
                type="number"
                step="0.01"
                min="0"
                defaultValue={
                  bouquet ? (bouquet.priceCents / 100).toFixed(2) : ""
                }
                required
                className="rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 text-sm text-stone-800 outline-none focus:border-stone-400"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-stone-700">
              Discount percent
              <input
                name="discountPercent"
                type="number"
                min="0"
                max="90"
                defaultValue={bouquet?.discountPercent ?? 0}
                className="rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 text-sm text-stone-800 outline-none focus:border-stone-400"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-stone-700">
              Discount comment
              <input
                name="discountNote"
                defaultValue={bouquet?.discountNote || ""}
                placeholder="Reason for discount"
                className="rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 text-sm text-stone-800 outline-none focus:border-stone-400"
              />
            </label>
          </div>
          <label className="flex flex-col gap-2 text-sm text-stone-700">
            Color palette (comma separated)
            <input
              name="colors"
              defaultValue={bouquet?.colors}
              className="rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 text-sm text-stone-800 outline-none focus:border-stone-400"
            />
          </label>
        </div>
        <div className="space-y-4">
          <AdminImageUpload
            defaultValue={bouquet?.image || "/images/bouquet-0.png"}
            recommendedSize="height:600, width:800"
          />
          <label className="flex flex-col gap-2 text-sm text-stone-700">
            Flower type
            <select
              name="flowerType"
              defaultValue={bouquet?.flowerType || FLOWER_TYPES[0]}
              className="select-field rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 text-sm text-stone-800 outline-none focus:border-stone-400"
            >
              {FLOWER_TYPES.map((type) => (
                <option key={type} value={type}>
                  {formatLabel(type)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm text-stone-700">
            Style
            <select
              name="style"
              defaultValue={bouquet?.style || BOUQUET_STYLES[0]}
              className="select-field rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 text-sm text-stone-800 outline-none focus:border-stone-400"
            >
              {BOUQUET_STYLES.map((style) => (
                <option key={style} value={style}>
                  {formatLabel(style)}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-2">
            <label className="flex items-center gap-2 text-sm text-stone-700">
              <input
                type="checkbox"
                name="isMixed"
                defaultChecked={bouquet?.isMixed}
              />
              Mixed bouquet
            </label>
            <label className="flex items-center gap-2 text-sm text-stone-700">
              <input
                type="checkbox"
                name="isFeatured"
                defaultChecked={bouquet?.isFeatured}
              />
              Featured on homepage
            </label>
            <label className="flex items-center gap-2 text-sm text-stone-700">
              <input
                type="checkbox"
                name="isActive"
                defaultChecked={bouquet ? bouquet.isActive : true}
              />
              Visible in catalog
            </label>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          className="rounded-full bg-[color:var(--brand)] px-6 py-3 text-xs uppercase tracking-[0.3em] text-white transition hover:bg-[color:var(--brand-dark)]"
        >
          Save bouquet
        </button>
        <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
          Changes apply instantly
        </p>
      </div>
    </form>
  );
}
