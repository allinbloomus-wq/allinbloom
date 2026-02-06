import Image from "next/image";
import Link from "next/link";
import type { PromoSlide } from "@prisma/client";
import { deletePromoSlide } from "@/app/admin/promotions/actions";

export default function AdminPromoRow({ slide }: { slide: PromoSlide }) {
  return (
    <div className="flex flex-col gap-4 rounded-[24px] border border-white/80 bg-white/70 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <div className="h-16 w-24 overflow-hidden rounded-2xl border border-white/80 bg-white">
          <Image
            src={slide.image}
            alt={slide.title}
            width={120}
            height={80}
            className="h-full w-full object-cover"
          />
        </div>
        <div>
          <p className="text-sm font-semibold text-stone-900">
            {slide.title}
          </p>
          <p className="text-xs text-stone-500">
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
      <div className="flex flex-wrap gap-2">
        <Link
          href={`/admin/promotions/${slide.id}/edit`}
          className="rounded-full border border-stone-300 bg-white/80 px-4 py-2 text-xs uppercase tracking-[0.3em] text-stone-600"
        >
          Edit
        </Link>
        <form action={deletePromoSlide}>
          <input type="hidden" name="id" value={slide.id} />
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
