import type { StoreSettings } from "@prisma/client";
import { apiFetch } from "@/lib/api-server";

export async function getStoreSettings(): Promise<StoreSettings> {
  const response = await apiFetch("/api/settings");
  if (!response.ok) {
    throw new Error("Unable to load store settings.");
  }
  return response.json();
}

export async function updateStoreSettings(
  data: Partial<Omit<StoreSettings, "id" | "updatedAt">>
) {
  const response = await apiFetch(
    "/api/settings",
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
    true
  );
  if (!response.ok) {
    throw new Error("Unable to update settings.");
  }
  return response.json();
}
