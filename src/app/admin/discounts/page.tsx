import Link from "next/link";
import { getStoreSettings } from "@/lib/data/settings";
import { updateDiscountSettings } from "@/app/admin/discounts/actions";
import AdminDiscountsForm from "@/components/admin-discounts-form";

export default async function AdminDiscountsPage() {
  const settings = await getStoreSettings();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-stone-500">
            Discounts
          </p>
          <h1 className="text-2xl font-semibold text-stone-900 sm:text-3xl">
            Manage discounts
          </h1>
        </div>
        <Link
          href="/admin"
          className="w-full rounded-full border border-stone-300 bg-white/80 px-4 py-2 text-center text-xs uppercase tracking-[0.3em] text-stone-600 sm:w-auto"
        >
          Back to admin
        </Link>
      </div>

      <AdminDiscountsForm settings={settings} action={updateDiscountSettings} />
    </div>
  );
}
