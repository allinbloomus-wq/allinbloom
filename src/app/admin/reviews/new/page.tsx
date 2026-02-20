import Link from "next/link";
import AdminReviewForm from "@/components/admin-review-form";
import { createAdminReview } from "@/app/admin/reviews/actions";

export default function NewAdminReviewPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-stone-500">
            New review
          </p>
          <h1 className="text-2xl font-semibold text-stone-900 sm:text-3xl">
            Add customer review
          </h1>
        </div>
        <Link
          href="/admin/reviews"
          className="inline-flex h-11 w-full items-center justify-center rounded-full border border-stone-300 bg-white/80 px-4 text-center text-xs uppercase tracking-[0.3em] text-stone-600 sm:w-auto"
        >
          Back to reviews
        </Link>
      </div>
      <AdminReviewForm action={createAdminReview} />
    </div>
  );
}
