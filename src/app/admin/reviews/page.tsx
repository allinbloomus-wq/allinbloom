import Link from "next/link";
import { getAdminReviews } from "@/lib/data/reviews";
import AdminReviewsList from "@/components/admin-reviews-list";

export default async function AdminReviewsPage() {
  const reviews = await getAdminReviews();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-stone-500">
            Admin studio
          </p>
          <h1 className="text-2xl font-semibold text-stone-900 sm:text-3xl">
            Customer reviews
          </h1>
        </div>
        <Link
          href="/admin/reviews/new"
          className="inline-flex h-11 w-full items-center justify-center rounded-full bg-[color:var(--brand)] px-5 text-center text-xs uppercase tracking-[0.3em] text-white transition hover:bg-[color:var(--brand-dark)] sm:w-auto"
        >
          Add review
        </Link>
      </div>
      <div className="glass rounded-[28px] border border-white/80 p-4 sm:p-6">
        <AdminReviewsList initialReviews={reviews} />
      </div>
    </div>
  );
}
