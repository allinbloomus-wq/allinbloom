import type { Metadata } from "next";
import CatalogFilters from "@/components/catalog-filters";
import CatalogGrid from "@/components/catalog-grid";
import { getBouquets } from "@/lib/data/bouquets";
import type { CatalogSearchParams } from "@/lib/data/bouquets";
import { getStoreSettings } from "@/lib/data/settings";
import { getBouquetPricing } from "@/lib/pricing";
import { SITE_DESCRIPTION } from "@/lib/site";
import { headers } from "next/headers";

const MOBILE_UA =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i;

const getInitialPageSize = async () => {
  const headerStore = await headers();
  const ua = headerStore.get("user-agent") || "";
  return MOBILE_UA.test(ua) ? 6 : 12;
};

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<CatalogSearchParams>;
}): Promise<Metadata> {
  const params = await searchParams;
  const isFeatured = params.filter === "featured";
  const title = isFeatured
    ? "Signature Bouquets | Chicago Florist"
    : "Bouquet Catalog | Chicago Flower Delivery";
  const description = isFeatured
    ? "Discover our most-loved signature bouquets curated by Chicago florists."
    : "Browse our full Chicago flower delivery catalog. Filter by palette, style, and price.";
  const canonical = isFeatured ? "/catalog?filter=featured" : "/catalog";

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description: SITE_DESCRIPTION,
      url: canonical,
    },
  };
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<CatalogSearchParams>;
}) {
  const params = await searchParams;
  const pageSize = await getInitialPageSize();
  const rawBouquets = await getBouquets(params, { take: pageSize + 1 });
  const hasMore = rawBouquets.length > pageSize;
  const bouquets = hasMore ? rawBouquets.slice(0, pageSize) : rawBouquets;
  const settings = await getStoreSettings();
  const isFeatured = params.filter === "featured";
  const initialItems = bouquets.map((bouquet) => ({
    bouquet,
    pricing: getBouquetPricing(bouquet, settings),
  }));
  const lastBouquet = bouquets[bouquets.length - 1];
  const initialCursor = hasMore && lastBouquet ? lastBouquet.id : null;
  const filtersKey = [
    params.filter || "",
    params.flower || "",
    params.color || "",
    params.style || "",
    params.mixed || "",
    params.min || "",
    params.max || "",
  ].join("|");

  return (
    <div className="flex flex-col gap-10">
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.32em] text-stone-500">
          {isFeatured ? "Signature edit" : "Catalog"}
        </p>
        <h1 className="text-4xl font-semibold text-stone-900 sm:text-5xl">
          {isFeatured ? "Signature sets" : "Bouquets for every mood"}
        </h1>
        <p className="max-w-2xl text-balance text-sm leading-relaxed text-stone-600">
          {isFeatured
            ? "Our most loved bouquets, curated by the All in Bloom Floral Studio team."
            : "Filter by flower, palette, price, and arrangement style. Every bouquet is assembled fresh on the day of delivery by our in-house florists."}
        </p>
      </div>
      <CatalogFilters />
      <CatalogGrid
        initialItems={initialItems}
        initialCursor={initialCursor}
        filters={params}
        filtersKey={filtersKey}
      />
    </div>
  );
}
