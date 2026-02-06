import Link from "next/link";
import { notFound } from "next/navigation";
import { getPromoSlideById } from "@/lib/data/promotions";
import AdminPromoForm from "@/components/admin-promo-form";
import { updatePromoSlide } from "@/app/admin/promotions/actions";

export default async function EditPromoSlidePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const slide = await getPromoSlideById(id);

  if (!slide) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-stone-500">
            Edit slide
          </p>
          <h1 className="text-3xl font-semibold text-stone-900">
            {slide.title}
          </h1>
        </div>
        <Link
          href="/admin/promotions"
          className="rounded-full border border-stone-300 bg-white/80 px-4 py-2 text-xs uppercase tracking-[0.3em] text-stone-600"
        >
          Back to gallery
        </Link>
      </div>
      <AdminPromoForm action={updatePromoSlide} slide={slide} />
    </div>
  );
}
