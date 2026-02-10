import { apiFetch } from "@/lib/api-server";

const parseResponse = async (response: Response) => {
  if (!response.ok) {
    throw new Error("Unable to load promotions.");
  }
  return response.json();
};

export async function getActivePromoSlides() {
  const response = await apiFetch("/api/promotions");
  return parseResponse(response);
}

export async function getAdminPromoSlides() {
  const response = await apiFetch("/api/promotions?include_inactive=true", {}, true);
  return parseResponse(response);
}

export async function getPromoSlideById(id: string) {
  const response = await apiFetch(`/api/promotions/${id}`, {}, true);
  if (!response.ok) return null;
  return response.json();
}
