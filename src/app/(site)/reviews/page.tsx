import type { Metadata } from "next";
import ReviewForm from "@/components/review-form";
import ReviewStars from "@/components/review-stars";
import ReviewsGallery from "@/components/reviews-gallery";
import { getActiveReviews } from "@/lib/data/reviews";

export const metadata: Metadata = {
  title: "Flower Delivery Reviews: Wheeling, IL",
  description:
    "Flower delivery reviews from customers of All in Bloom Floral Studio in Wheeling, IL. Read what people say about our bouquets and leave your own.",
  alternates: {
    canonical: "/reviews",
  },
  openGraph: {
    title: "Flower Delivery Reviews | All in Bloom Floral Studio",
    description:
      "Customer reviews of flower delivery from All in Bloom Floral Studio in Wheeling, IL.",
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
        <h1 className="text-3xl font-semibold text-stone-900 sm:text-5xl">
          What our customers say
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-stone-600">
          Reviews from people who ordered flowers from our studio.
        </p>
        {reviewsCount > 0 ? (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2">
            <p className="text-4xl font-semibold tabular-nums text-stone-900">
              {averageRating}
              <span className="ml-1 text-lg text-stone-500">/ 5</span>
            </p>
            <ReviewStars value={Number(averageRating)} size="lg" />
            <p className="text-sm text-stone-600">
              from {reviewsCount} review{reviewsCount === 1 ? "" : "s"}
            </p>
          </div>
        ) : null}
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
