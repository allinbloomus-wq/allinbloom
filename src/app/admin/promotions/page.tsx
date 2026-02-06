import Link from "next/link";
import { getAdminPromoSlides } from "@/lib/data/promotions";
import AdminPromoRow from "@/components/admin-promo-row";

export default async function AdminPromotionsPage() {
  const slides = await getAdminPromoSlides();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-stone-500">
            Admin studio
          </p>
          <h1 className="text-3xl font-semibold text-stone-900">
            Promotions gallery
          </h1>
        </div>
        <Link
          href="/admin/promotions/new"
          className="rounded-full bg-[color:var(--brand)] px-5 py-2 text-xs uppercase tracking-[0.3em] text-white transition hover:bg-[color:var(--brand-dark)]"
        >
          Add slide
        </Link>
      </div>
      <div className="glass rounded-[28px] border border-white/80 p-6">
        <div className="grid gap-4">
          {slides.length ? (
            slides.map((slide) => (
              <AdminPromoRow key={slide.id} slide={slide} />
            ))
          ) : (
            <div className="rounded-[24px] border border-white/80 bg-white/70 p-6 text-sm text-stone-600">
              No slides yet. Add your first promotion.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
