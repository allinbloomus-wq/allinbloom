import Link from "next/link";
import { getAdminBouquets } from "@/lib/data/bouquets";
import AdminBouquetRow from "@/components/admin-bouquet-row";

export default async function AdminPage() {
  const bouquets = await getAdminBouquets();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-stone-500">
            Admin studio
          </p>
          <h1 className="text-3xl font-semibold text-stone-900">
            Manage bouquets
          </h1>
        </div>
        <Link
          href="/admin/bouquets/new"
          className="rounded-full bg-[color:var(--brand)] px-5 py-2 text-xs uppercase tracking-[0.3em] text-white transition hover:bg-[color:var(--brand-dark)]"
        >
          Add bouquet
        </Link>
      </div>
      <div className="glass rounded-[28px] border border-white/80 p-6">
        <div className="grid gap-4">
          {bouquets.map((bouquet) => (
            <AdminBouquetRow key={bouquet.id} bouquet={bouquet} />
          ))}
        </div>
      </div>
    </div>
  );
}
