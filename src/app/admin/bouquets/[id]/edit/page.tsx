import Link from "next/link";
import { notFound } from "next/navigation";
import { getBouquetById } from "@/lib/data/bouquets";
import AdminBouquetForm from "@/components/admin-bouquet-form";
import { updateBouquet } from "@/app/admin/actions";

export default async function EditBouquetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const bouquet = await getBouquetById(id);

  if (!bouquet) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-stone-500">
            Edit bouquet
          </p>
          <h1 className="text-2xl font-semibold text-stone-900 sm:text-3xl">
            {bouquet.name}
          </h1>
        </div>
        <Link
          href="/admin"
          className="w-full rounded-full border border-stone-300 bg-white/80 px-4 py-2 text-center text-xs uppercase tracking-[0.3em] text-stone-600 sm:w-auto"
        >
          Back to admin
        </Link>
      </div>
      <AdminBouquetForm action={updateBouquet} bouquet={bouquet} />
    </div>
  );
}
