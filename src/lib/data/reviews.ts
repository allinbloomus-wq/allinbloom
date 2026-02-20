import { apiFetch } from "@/lib/api-server";
import type { AdminReview, Review } from "@/lib/api-types";

const parseReviews = async <T>(response: Response): Promise<T[]> => {
  if (!response.ok) {
    throw new Error("Unable to load reviews.");
  }
  return response.json() as Promise<T[]>;
};

export async function getActiveReviews(): Promise<Review[]> {
  const response = await apiFetch("/api/reviews");
  return parseReviews<Review>(response);
}

export async function getAdminReviews(): Promise<AdminReview[]> {
  const response = await apiFetch("/api/admin/reviews", {}, true);
  return parseReviews<AdminReview>(response);
}

export async function getAdminReviewById(id: string): Promise<AdminReview | null> {
  const response = await apiFetch(`/api/admin/reviews/${id}`, {}, true);
  if (!response.ok) return null;
  return response.json() as Promise<AdminReview>;
}
