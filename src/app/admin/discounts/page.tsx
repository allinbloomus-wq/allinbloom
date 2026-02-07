import Link from "next/link";
import { getStoreSettings } from "@/lib/data/settings";
import { updateDiscountSettings } from "@/app/admin/discounts/actions";
import { BOUQUET_STYLES, COLOR_OPTIONS, FLOWER_TYPES } from "@/lib/constants";

export default async function AdminDiscountsPage() {
  const settings = await getStoreSettings();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-stone-500">
            Discounts
          </p>
          <h1 className="text-3xl font-semibold text-stone-900">
            Manage discounts
          </h1>
        </div>
        <Link
          href="/admin"
          className="rounded-full border border-stone-300 bg-white/80 px-4 py-2 text-xs uppercase tracking-[0.3em] text-stone-600"
        >
          Back to admin
        </Link>
      </div>

      <form
        action={updateDiscountSettings}
        className="glass space-y-6 rounded-[28px] border border-white/80 p-6"
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-stone-900">
              Global discount
            </h2>
            <label className="flex flex-col gap-2 text-sm text-stone-700">
              Discount percent
              <input
                name="globalDiscountPercent"
                type="number"
                min="0"
                max="90"
                defaultValue={settings.globalDiscountPercent}
                className="rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 text-sm text-stone-800 outline-none focus:border-stone-400"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-stone-700">
              Discount comment
              <input
                name="globalDiscountNote"
                defaultValue={settings.globalDiscountNote || ""}
                placeholder="Reason for discount"
                className="rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 text-sm text-stone-800 outline-none focus:border-stone-400"
              />
            </label>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-stone-900">
              First order discount
            </h2>
            <label className="flex flex-col gap-2 text-sm text-stone-700">
              Discount percent
              <input
                name="firstOrderDiscountPercent"
                type="number"
                min="0"
                max="90"
                defaultValue={settings.firstOrderDiscountPercent}
                className="rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 text-sm text-stone-800 outline-none focus:border-stone-400"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-stone-700">
              Discount comment
              <input
                name="firstOrderDiscountNote"
                defaultValue={settings.firstOrderDiscountNote || ""}
                placeholder="Reason for discount"
                className="rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 text-sm text-stone-800 outline-none focus:border-stone-400"
              />
            </label>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-stone-900">
              Category discount
            </h2>
            <label className="flex flex-col gap-2 text-sm text-stone-700">
              Discount percent
              <input
                name="categoryDiscountPercent"
                type="number"
                min="0"
                max="90"
                defaultValue={settings.categoryDiscountPercent}
                className="rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 text-sm text-stone-800 outline-none focus:border-stone-400"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-stone-700">
              Discount comment
              <input
                name="categoryDiscountNote"
                defaultValue={settings.categoryDiscountNote || ""}
                placeholder="Reason for discount"
                className="rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 text-sm text-stone-800 outline-none focus:border-stone-400"
              />
            </label>
          </div>
          <div className="space-y-4">
            <label className="flex flex-col gap-2 text-sm text-stone-700">
              Flower type
              <select
                name="categoryFlowerType"
                defaultValue={settings.categoryFlowerType || ""}
                className="select-field rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 text-sm text-stone-800 outline-none focus:border-stone-400"
              >
                <option value="">Any</option>
                {FLOWER_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm text-stone-700">
              Style
              <select
                name="categoryStyle"
                defaultValue={settings.categoryStyle || ""}
                className="select-field rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 text-sm text-stone-800 outline-none focus:border-stone-400"
              >
                <option value="">Any</option>
                {BOUQUET_STYLES.map((style) => (
                  <option key={style} value={style}>
                    {style}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm text-stone-700">
              Mixed / Mono
              <select
                name="categoryMixed"
                defaultValue={settings.categoryMixed || ""}
                className="select-field rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 text-sm text-stone-800 outline-none focus:border-stone-400"
              >
                <option value="">Any</option>
                <option value="mixed">Mixed</option>
                <option value="mono">Mono</option>
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm text-stone-700">
              Color
              <select
                name="categoryColor"
                defaultValue={settings.categoryColor || ""}
                className="select-field rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 text-sm text-stone-800 outline-none focus:border-stone-400"
              >
                <option value="">Any</option>
                {COLOR_OPTIONS.map((color) => (
                  <option key={color} value={color}>
                    {color}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm text-stone-700">
                Min price (USD)
                <input
                  name="categoryMinPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={
                    settings.categoryMinPriceCents !== null
                      ? (settings.categoryMinPriceCents / 100).toFixed(2)
                      : ""
                  }
                  className="rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 text-sm text-stone-800 outline-none focus:border-stone-400"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-stone-700">
                Max price (USD)
                <input
                  name="categoryMaxPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={
                    settings.categoryMaxPriceCents !== null
                      ? (settings.categoryMaxPriceCents / 100).toFixed(2)
                      : ""
                  }
                  className="rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 text-sm text-stone-800 outline-none focus:border-stone-400"
                />
              </label>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            className="rounded-full bg-[color:var(--brand)] px-6 py-3 text-xs uppercase tracking-[0.3em] text-white transition hover:bg-[color:var(--brand-dark)]"
          >
            Save discounts
          </button>
          <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
            Category and global discounts cannot be active together
          </p>
        </div>
      </form>
    </div>
  );
}
