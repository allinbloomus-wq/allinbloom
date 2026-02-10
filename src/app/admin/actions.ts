"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseBouquetForm } from "@/lib/bouquet-form";
import { requireAdmin } from "@/lib/auth-session";
import { apiFetch } from "@/lib/api-server";

export async function createBouquet(formData: FormData) {
  requireAdmin();
  const data = parseBouquetForm(formData);
  const response = await apiFetch(
    "/api/bouquets",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
    true
  );
  if (!response.ok) {
    throw new Error("Unable to create bouquet.");
  }
  revalidatePath("/admin");
  redirect("/admin");
}

export async function updateBouquet(formData: FormData) {
  requireAdmin();
  const id = String(formData.get("id") || "");
  const data = parseBouquetForm(formData);
  const response = await apiFetch(
    `/api/bouquets/${id}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
    true
  );
  if (!response.ok) {
    throw new Error("Unable to update bouquet.");
  }
  revalidatePath("/admin");
  redirect("/admin");
}

export async function deleteBouquet(formData: FormData) {
  requireAdmin();
  const id = String(formData.get("id") || "");
  const response = await apiFetch(`/api/bouquets/${id}`, { method: "DELETE" }, true);
  if (!response.ok) {
    throw new Error("Unable to delete bouquet.");
  }
  revalidatePath("/admin");
}
