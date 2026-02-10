import { NextResponse } from "next/server";
import { getBouquets } from "@/lib/data/bouquets";
import type { CatalogSearchParams } from "@/lib/data/bouquets";
import { getStoreSettings } from "@/lib/data/settings";
import { getBouquetPricing } from "@/lib/pricing";

export const dynamic = "force-dynamic";

const PAGE_SIZES = new Set([6, 12]);

const toPageSize = (value: string | null) => {
  const parsed = Number(value);
  if (PAGE_SIZES.has(parsed)) return parsed;
  return 12;
};

const buildFilters = (searchParams: URLSearchParams): CatalogSearchParams => ({
  filter: searchParams.get("filter") || undefined,
  flower: searchParams.get("flower") || undefined,
  color: searchParams.get("color") || undefined,
  style: searchParams.get("style") || undefined,
  mixed: searchParams.get("mixed") || undefined,
  min: searchParams.get("min") || undefined,
  max: searchParams.get("max") || undefined,
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pageSize = toPageSize(searchParams.get("take"));
    const cursor = searchParams.get("cursor") || undefined;
    const filters = buildFilters(searchParams);

    const results = await getBouquets(filters, {
      take: pageSize + 1,
      cursor,
    });

    const hasMore = results.length > pageSize;
    const page = hasMore ? results.slice(0, pageSize) : results;
    const last = page[page.length - 1];
    const nextCursor = hasMore && last ? last.id : null;
    const settings = await getStoreSettings();
    const items = page.map((bouquet) => ({
      bouquet,
      pricing: getBouquetPricing(bouquet, settings),
    }));

    return NextResponse.json({ items, nextCursor });
  } catch (error) {
    console.error("Catalog pagination error:", error);
    return NextResponse.json(
      { error: "Failed to load bouquets." },
      { status: 500 }
    );
  }
}
