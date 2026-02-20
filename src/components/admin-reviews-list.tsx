"use client";

import { useEffect, useState } from "react";
import type { AdminReview } from "@/lib/api-types";
import AdminReviewRow from "@/components/admin-review-row";

type AdminReviewsListProps = {
  initialReviews: AdminReview[];
};

export default function AdminReviewsList({ initialReviews }: AdminReviewsListProps) {
  const [reviews, setReviews] = useState<AdminReview[]>(initialReviews);

  useEffect(() => {
    setReviews(initialReviews);
  }, [initialReviews]);

  const handleRemoved = (reviewId: string) => {
    setReviews((current) => current.filter((review) => review.id !== reviewId));
  };

  if (!reviews.length) {
    return (
      <div className="rounded-[24px] border border-white/80 bg-white/70 p-6 text-sm text-stone-600">
        No reviews yet.
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {reviews.map((review) => (
        <AdminReviewRow key={review.id} review={review} onRemoved={handleRemoved} />
      ))}
    </div>
  );
}
