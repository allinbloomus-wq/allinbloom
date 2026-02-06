import Image from "next/image";
import Link from "next/link";
import type { Bouquet } from "@prisma/client";
import { formatLabel, formatMoney } from "@/lib/format";
import { deleteBouquet } from "@/app/admin/actions";

export default function AdminBouquetRow({ bouquet }: { bouquet: Bouquet }) {
  return (
    <div className="flex flex-col gap-4 rounded-[24px] border border-white/80 bg-white/70 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 overflow-hidden rounded-2xl border border-white/80 bg-white">
          <Image
            src={bouquet.image}
            alt={bouquet.name}
            width={80}
            height={80}
            className="h-full w-full object-cover"
          />
        </div>
        <div>
          <p className="text-sm font-semibold text-stone-900">
            {bouquet.name}
          </p>
          <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
            {formatLabel(bouquet.flowerType)} - {formatMoney(bouquet.priceCents)}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {bouquet.isFeatured && (
          <span className="rounded-full bg-rose-100 px-3 py-1 text-rose-700">
            Featured
          </span>
        )}
        {!bouquet.isActive && (
          <span className="rounded-full bg-stone-200 px-3 py-1 text-stone-600">
            Hidden
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <Link
          href={`/admin/bouquets/${bouquet.id}/edit`}
          className="rounded-full border border-stone-300 bg-white/80 px-4 py-2 text-xs uppercase tracking-[0.3em] text-stone-600"
        >
          Edit
        </Link>
        <form action={deleteBouquet}>
          <input type="hidden" name="id" value={bouquet.id} />
          <button
            type="submit"
            className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs uppercase tracking-[0.3em] text-rose-700"
          >
            Delete
          </button>
        </form>
      </div>
    </div>
  );
}
