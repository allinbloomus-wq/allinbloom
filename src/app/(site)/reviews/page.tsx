import type { Metadata } from "next";
import ReviewForm from "@/components/review-form";
import ReviewsGallery from "@/components/reviews-gallery";
import { getActiveReviews } from "@/lib/data/reviews";
import { SITE_DESCRIPTION } from "@/lib/site";

export const metadata: Metadata = {
  title: "Reviews | Chicago Flower Delivery",
  description:
    "Read customer reviews for All in Bloom Floral Studio and share your own bouquet experience.",
  alternates: {
    canonical: "/reviews",
  },
  openGraph: {
    title: "Reviews | Chicago Flower Delivery",
    description: SITE_DESCRIPTION,
    url: "/reviews",
  },
};

export default async function ReviewsPage() {
  const reviews = await getActiveReviews();
  const reviewsCount = reviews.length;
  const averageRating = reviewsCount
    ? (
        reviews.reduce((sum, review) => sum + review.rating, 0) / reviewsCount
      ).toFixed(1)
    : "0.0";

  return (
    <div className="space-y-8 sm:space-y-10">
      <section className="space-y-4">
        <p className="text-xs uppercase tracking-[0.32em] text-stone-500">
          Reviews
        </p>
        <h1 className="text-3xl font-semibold text-stone-900 sm:text-5xl">
          Stories from our customers
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-stone-600">
          Real feedback from people who ordered our bouquets in Chicago.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
          <div className="rounded-[24px] border border-white/80 bg-white/75 px-4 py-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.22em] text-stone-500">
              Total reviews
            </p>
            <p className="mt-2 text-3xl font-semibold text-stone-900">
              {reviewsCount}
            </p>
          </div>
          <div className="rounded-[24px] border border-white/80 bg-white/75 px-4 py-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.22em] text-stone-500">
              Average rating
            </p>
            <p className="mt-2 text-3xl font-semibold text-stone-900">
              {averageRating}
              <span className="ml-1 text-lg text-stone-500">/ 5</span>
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-stone-900 sm:text-3xl">
          Customer highlights
        </h2>
        <ReviewsGallery reviews={reviews} />
      </section>

      <section>
        <ReviewForm />
      </section>
    </div>
  );
}
