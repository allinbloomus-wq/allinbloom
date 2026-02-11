import type { Bouquet, CatalogResponse } from "@/lib/api-types";
import { BOUQUET_STYLES, FLOWER_TYPES } from "@/lib/constants";
import { apiFetch } from "@/lib/api-server";

export type CatalogSearchParams = {
  flower?: string;
  color?: string;
  style?: string;
  mixed?: string;
  min?: string;
  max?: string;
  filter?: string;
};

export type CatalogPagination = {
  cursor?: string;
  take?: number;
};

const toNumber = (value?: string) => {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const normalizeEnum = <T extends readonly string[]>(
  value: string | undefined,
  allowed: T
) => {
  if (!value) return undefined;
  const upper = value.toUpperCase();
  return (allowed as readonly string[]).includes(upper) ? upper : undefined;
};

export async function getFeaturedBouquets(): Promise<Bouquet[]> {
  const response = await apiFetch("/api/catalog?filter=featured&take=6");
  if (!response.ok) return [];
  const data = (await response.json()) as CatalogResponse;
  return (data.items || []).map((item) => item.bouquet);
}

export async function getBouquetById(id: string): Promise<Bouquet | null> {
  const response = await apiFetch(`/api/bouquets/${id}`);
  if (!response.ok) return null;
  return response.json();
}

export async function getAdminBouquets(): Promise<Bouquet[]> {
  const response = await apiFetch("/api/bouquets?include_inactive=true", {}, true);
  if (!response.ok) return [];
  return response.json();
}

export async function getBouquets(
  filters: CatalogSearchParams = {},
  pagination: CatalogPagination = {}
): Promise<Bouquet[]> {
  const flowerType = normalizeEnum(filters.flower, FLOWER_TYPES);
  const style = normalizeEnum(filters.style, BOUQUET_STYLES);
  const min = toNumber(filters.min);
  const max = toNumber(filters.max);
  const { cursor, take } = pagination;

  const params = new URLSearchParams();
  if (filters.filter) params.set("filter", filters.filter);
  if (flowerType) params.set("flower", flowerType.toLowerCase());
  if (filters.color) params.set("color", filters.color);
  if (style) params.set("style", style.toLowerCase());
  if (filters.mixed) params.set("mixed", filters.mixed);
  if (min !== undefined) params.set("min", String(min));
  if (max !== undefined) params.set("max", String(max));
  if (cursor) params.set("cursor", cursor);
  if (take) params.set("take", String(take));

  const response = await apiFetch(`/api/catalog?${params.toString()}`);
  if (!response.ok) return [];
  const data = (await response.json()) as CatalogResponse;
  return (data.items || []).map((item) => item.bouquet);
}
