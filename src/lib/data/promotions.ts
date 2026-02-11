import { apiFetch } from "@/lib/api-server";
import type { PromoSlide } from "@/lib/api-types";

const parseResponse = async (response: Response): Promise<PromoSlide[]> => {
  if (!response.ok) {
    throw new Error("Unable to load promotions.");
  }
  return response.json() as Promise<PromoSlide[]>;
};

export async function getActivePromoSlides(): Promise<PromoSlide[]> {
  const response = await apiFetch("/api/promotions");
  return parseResponse(response);
}

export async function getAdminPromoSlides(): Promise<PromoSlide[]> {
  const response = await apiFetch("/api/promotions?include_inactive=true", {}, true);
  return parseResponse(response);
}

export async function getPromoSlideById(id: string): Promise<PromoSlide | null> {
  const response = await apiFetch(`/api/promotions/${id}`, {}, true);
  if (!response.ok) return null;
  return response.json() as Promise<PromoSlide>;
}
