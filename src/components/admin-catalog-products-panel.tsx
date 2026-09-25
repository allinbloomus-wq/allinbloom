"use client";

import { useMemo, useState } from "react";
import type { Bouquet, CatalogType } from "@/lib/api-types";
import AdminCatalogProductRow from "@/components/admin-catalog-product-row";

type AdminCatalogProductsPanelProps = {
  products: Bouquet[];
  catalogType: Extract<CatalogType, "BALOONS" | "GIFTS" | "EVENT_SPACE">;
  editPath: string;
  label: string;
};

export default function AdminCatalogProductsPanel({
  products,
  catalogType,
  editPath,
  label,
}: AdminCatalogProductsPanelProps) {
  const [query, setQuery] = useState("");
  const visibleProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return products;
    return products.filter((product) => product.name.toLowerCase().includes(normalized));
  }, [products, query]);

  return (
    <div className="grid gap-4">
      <label className="flex min-w-0 items-center gap-2 rounded-full border border-stone-300 bg-white p-1.5 transition-colors focus-within:border-[color:var(--brand)] focus-within:ring-2 focus-within:ring-[color:rgba(var(--brand-rgb),0.18)]">
        <span className="sr-only">Search {label}</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={`Search ${label.toLowerCase()} by name`}
          className="h-10 min-w-0 flex-1 rounded-full border-0 bg-transparent px-3 text-sm text-stone-800 outline-none placeholder:text-stone-400"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-500 transition hover:border-stone-300 hover:text-stone-700"
            aria-label="Clear search"
          >
            ×
          </button>
        ) : null}
      </label>
      <div className="flex items-center justify-between gap-2 text-xs font-medium text-stone-500">
        <span>Shown {label.toLowerCase()}</span>
        <span>{visibleProducts.length}</span>
      </div>
      {visibleProducts.length ? (
        visibleProducts.map((product) => (
          <AdminCatalogProductRow
            key={product.id}
            product={product}
            catalogType={catalogType}
            editPath={editPath}
          />
        ))
      ) : (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50/60 p-5 text-sm text-stone-600">
          No {label.toLowerCase()} match this search.
        </div>
      )}
    </div>
  );
}
