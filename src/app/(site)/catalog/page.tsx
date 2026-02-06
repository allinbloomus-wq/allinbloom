import BouquetCard from "@/components/bouquet-card";
import CatalogFilters from "@/components/catalog-filters";
import { getBouquets } from "@/lib/data/bouquets";
import type { CatalogSearchParams } from "@/lib/data/bouquets";

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<CatalogSearchParams>;
}) {
  const params = await searchParams;
  const bouquets = await getBouquets(params);
  const isFeatured = params.filter === "featured";

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
      {bouquets.length ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {bouquets.map((bouquet) => (
            <BouquetCard key={bouquet.id} bouquet={bouquet} />
          ))}
        </div>
      ) : (
        <div className="glass rounded-[28px] border border-white/80 p-8 text-center text-sm text-stone-600">
          No bouquets match these filters. Try a softer palette or wider price
          range.
        </div>
      )}
    </div>
  );
}
