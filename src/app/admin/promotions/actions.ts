"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-session";
import { apiFetch } from "@/lib/api-server";

const parsePromoForm = (formData: FormData) => {
  const title = String(formData.get("title") || "").trim();
  const subtitle = String(formData.get("subtitle") || "").trim();
  const image = String(formData.get("image") || "").trim();
  const link = String(formData.get("link") || "").trim();
  const position = Number(formData.get("position") || 0);

  return {
    title,
    subtitle: subtitle || null,
    image,
    link: link || null,
    position: Number.isFinite(position) ? position : 0,
    isActive: formData.get("isActive") === "on",
  };
};

export async function createPromoSlide(formData: FormData) {
  await requireAdmin();
  const data = parsePromoForm(formData);
  const response = await apiFetch(
    "/api/promotions",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
    true
  );
  if (!response.ok) {
    throw new Error("Unable to create promotion.");
  }
  revalidatePath("/");
  revalidatePath("/admin/promotions");
  redirect("/admin/promotions");
}

export async function updatePromoSlide(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  const data = parsePromoForm(formData);
  const response = await apiFetch(
    `/api/promotions/${id}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
    true
  );
  if (!response.ok) {
    throw new Error("Unable to update promotion.");
  }
  revalidatePath("/");
  revalidatePath("/admin/promotions");
  redirect("/admin/promotions");
}

export async function deletePromoSlide(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  const response = await apiFetch(`/api/promotions/${id}`, { method: "DELETE" }, true);
  if (!response.ok) {
    throw new Error("Unable to delete promotion.");
  }
  revalidatePath("/");
  revalidatePath("/admin/promotions");
}
