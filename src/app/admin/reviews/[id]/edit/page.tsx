import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminReviewById } from "@/lib/data/reviews";
import AdminReviewForm from "@/components/admin-review-form";
import { updateAdminReview } from "@/app/admin/reviews/actions";

export default async function EditAdminReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const review = await getAdminReviewById(id);

  if (!review) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-stone-500">
            Edit review
          </p>
          <h1 className="text-2xl font-semibold text-stone-900 sm:text-3xl">
            {review.name}
          </h1>
        </div>
        <Link
          href="/admin/reviews"
          className="inline-flex h-11 w-full items-center justify-center rounded-full border border-stone-300 bg-white/80 px-4 text-center text-xs uppercase tracking-[0.3em] text-stone-600 sm:w-auto"
        >
          Back to reviews
        </Link>
      </div>
      <AdminReviewForm action={updateAdminReview} review={review} />
    </div>
  );
}
