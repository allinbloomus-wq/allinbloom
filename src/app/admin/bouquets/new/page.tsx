import Link from "next/link";
import { createBouquet } from "@/app/admin/actions";
import AdminBouquetForm from "@/components/admin-bouquet-form";

export default function NewBouquetPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-stone-500">
            New bouquet
          </p>
          <h1 className="text-3xl font-semibold text-stone-900">
            Add a fresh bouquet
          </h1>
        </div>
        <Link
          href="/admin"
          className="rounded-full border border-stone-300 bg-white/80 px-4 py-2 text-xs uppercase tracking-[0.3em] text-stone-600"
        >
          Back to admin
        </Link>
      </div>
      <AdminBouquetForm action={createBouquet} />
    </div>
  );
}
