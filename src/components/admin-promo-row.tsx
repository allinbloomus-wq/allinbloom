import Link from "next/link";
import type { PromoSlide } from "@/lib/api-types";
import { deletePromoSlide } from "@/app/admin/promotions/actions";
import ImageWithFallback from "@/components/image-with-fallback";

export default function AdminPromoRow({ slide }: { slide: PromoSlide }) {
  return (
    <div className="flex max-w-full flex-col gap-4 rounded-[24px] border border-white/80 bg-white/70 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-4">
        <div className="h-16 w-24 overflow-hidden rounded-2xl border border-white/80 bg-white">
          <ImageWithFallback
            src={slide.image}
            alt={slide.title || "Promo slide"}
            width={120}
            height={80}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-stone-900">
            {slide.title || "Untitled slide"}
          </p>
          <p className="break-words text-xs text-stone-500">
            Position: {slide.position}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {!slide.isActive ? (
          <span className="rounded-full bg-stone-200 px-3 py-1 text-stone-600">
            Hidden
          </span>
        ) : null}
        {slide.link ? (
          <span className="rounded-full border border-stone-200 bg-white/80 px-3 py-1 text-stone-600">
            Linked
          </span>
        ) : null}
      </div>
      <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
        <Link
          href={`/admin/promotions/${slide.id}/edit`}
          className="inline-flex h-11 w-full items-center justify-center rounded-full border border-stone-300 bg-white/80 px-4 text-center text-xs uppercase tracking-[0.3em] text-stone-600 sm:w-auto"
        >
          Edit
        </Link>
        <form action={deletePromoSlide} className="w-full sm:w-auto">
          <input type="hidden" name="id" value={slide.id} />
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
