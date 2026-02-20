"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-session";
import { apiFetch } from "@/lib/api-server";

const parseReviewForm = (formData: FormData) => {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const text = String(formData.get("text") || "").trim();
  const image = String(formData.get("image") || "").trim();
  const createdAtDate = String(formData.get("createdAtDate") || "").trim();
  const createdAtTime = String(formData.get("createdAtTime") || "").trim();
  const createdAt = createdAtDate
    ? `${createdAtDate}T${createdAtTime || "12:00"}`
    : "";
  const rating = Math.min(
    5,
    Math.max(1, Math.round(Number(formData.get("rating") || 5)))
  );

  return {
    name,
    email,
    text,
    image: image || null,
    createdAt: createdAt || null,
    rating,
    isActive: formData.get("isActive") === "on",
    isRead: formData.get("isRead") === "on",
  };
};

const revalidateReviewPaths = () => {
  revalidatePath("/reviews");
  revalidatePath("/admin");
  revalidatePath("/admin/reviews");
};

export async function createAdminReview(formData: FormData) {
  await requireAdmin();
  const data = parseReviewForm(formData);
  const response = await apiFetch(
    "/api/admin/reviews",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
    true
  );
  if (!response.ok) {
    throw new Error("Unable to create review.");
  }
  revalidateReviewPaths();
  redirect("/admin/reviews?toast=review-added");
}

export async function updateAdminReview(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  const data = parseReviewForm(formData);
  const response = await apiFetch(
    `/api/admin/reviews/${id}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
    true
  );
  if (!response.ok) {
    throw new Error("Unable to update review.");
  }
  revalidateReviewPaths();
  redirect("/admin/reviews");
}

export async function deleteAdminReview(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  const response = await apiFetch(`/api/admin/reviews/${id}`, { method: "DELETE" }, true);
  if (!response.ok) {
    throw new Error("Unable to delete review.");
  }
  revalidateReviewPaths();
}
