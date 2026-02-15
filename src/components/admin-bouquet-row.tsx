import Link from "next/link";
import type { Bouquet } from "@/lib/api-types";
import { formatLabel, formatMoney } from "@/lib/format";
import { deleteBouquet } from "@/app/admin/actions";
import ImageWithFallback from "@/components/image-with-fallback";

export default function AdminBouquetRow({ bouquet }: { bouquet: Bouquet }) {
  return (
    <div className="flex max-w-full flex-col gap-4 rounded-[24px] border border-white/80 bg-white/70 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-4">
        <div className="h-16 w-16 overflow-hidden rounded-2xl border border-white/80 bg-white">
          <ImageWithFallback
            src={bouquet.image}
            alt={bouquet.name}
            width={80}
            height={80}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-stone-900">
            {bouquet.name}
          </p>
          <p className="break-words text-xs uppercase tracking-[0.2em] text-stone-500">
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
      <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
        <Link
          href={`/admin/bouquets/${bouquet.id}/edit`}
          className="inline-flex h-11 w-full items-center justify-center rounded-full border border-stone-300 bg-white/80 px-4 text-center text-xs uppercase tracking-[0.3em] text-stone-600 sm:w-auto"
        >
          Edit
        </Link>
        <form action={deleteBouquet} className="w-full sm:w-auto">
          <input type="hidden" name="id" value={bouquet.id} />
          <button
            type="submit"
            className="inline-flex h-11 w-full items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-4 text-xs uppercase tracking-[0.3em] text-rose-700 sm:w-auto"
          >
            Delete
          </button>
        </form>
      </div>
    </div>
  );
}
