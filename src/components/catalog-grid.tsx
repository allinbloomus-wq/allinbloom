"use client";

import type { Bouquet } from "@prisma/client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import BouquetCard from "@/components/bouquet-card";
import type { CatalogSearchParams } from "@/lib/data/bouquets";
import type { DiscountInfo } from "@/lib/pricing";

type BouquetPricing = {
  originalPriceCents: number;
  finalPriceCents: number;
  discount: DiscountInfo | null;
};

type CatalogItem = {
  bouquet: Bouquet;
  pricing: BouquetPricing;
};

type CatalogGridProps = {
  initialItems: CatalogItem[];
  initialCursor: string | null;
  filters: CatalogSearchParams;
  filtersKey: string;
};

const MOBILE_PAGE_SIZE = 6;
const DESKTOP_PAGE_SIZE = 12;

const useCatalogPageSize = () => {
  const [pageSize, setPageSize] = useState(DESKTOP_PAGE_SIZE);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const update = () => {
      setPageSize(query.matches ? DESKTOP_PAGE_SIZE : MOBILE_PAGE_SIZE);
    };
    update();
    if ("addEventListener" in query) {
      query.addEventListener("change", update);
      return () => query.removeEventListener("change", update);
    }
    query.addListener(update);
    return () => query.removeListener(update);
  }, []);

  return pageSize;
};

export default function CatalogGrid({
  initialItems,
  initialCursor,
  filters,
  filtersKey,
}: CatalogGridProps) {
  const [items, setItems] = useState<CatalogItem[]>(initialItems);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [hasMore, setHasMore] = useState(Boolean(initialCursor));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const pageSize = useCatalogPageSize();
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setItems(initialItems);
    setCursor(initialCursor);
    setHasMore(Boolean(initialCursor));
    setIsLoading(false);
    setError("");
  }, [filtersKey, initialCursor, initialItems]);

  const baseParams = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.filter) params.set("filter", filters.filter);
    if (filters.flower) params.set("flower", filters.flower);
    if (filters.color) params.set("color", filters.color);
    if (filters.style) params.set("style", filters.style);
    if (filters.mixed) params.set("mixed", filters.mixed);
    if (filters.min) params.set("min", filters.min);
    if (filters.max) params.set("max", filters.max);
    return params;
  }, [
    filters.color,
    filters.filter,
    filters.flower,
    filters.max,
    filters.min,
    filters.mixed,
    filters.style,
  ]);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    setError("");

    try {
      const params = new URLSearchParams(baseParams);
      params.set("take", String(pageSize));
      if (cursor) {
        params.set("cursor", cursor);
      }

      const response = await fetch(`/api/catalog?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to load more bouquets.");
      }

      const data = (await response.json()) as {
        items: CatalogItem[];
        nextCursor: string | null;
      };

      setItems((prev) => [...prev, ...data.items]);
      setCursor(data.nextCursor);
      setHasMore(Boolean(data.nextCursor));
    } catch (err) {
      setError("Unable to load more bouquets right now.");
    } finally {
      setIsLoading(false);
    }
  }, [baseParams, cursor, hasMore, isLoading, pageSize]);

  useEffect(() => {
    if (!hasMore) return;
    const target = sentinelRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "360px" }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  if (!items.length) {
    return (
      <div className="glass rounded-[28px] border border-white/80 p-8 text-center text-sm text-stone-600">
        No bouquets match these filters. Try a softer palette or wider price
        range.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {items.map((entry) => (
          <BouquetCard
            key={entry.bouquet.id}
            bouquet={entry.bouquet}
            pricing={entry.pricing}
          />
        ))}
      </div>
      <div className="flex flex-col items-center gap-2 text-xs uppercase tracking-[0.3em] text-stone-500">
        {hasMore ? (
          <>
            <span>{isLoading ? "Loading more bouquets" : "Scroll for more"}</span>
            <div
              ref={sentinelRef}
              className="h-6 w-full"
              aria-hidden="true"
            />
          </>
        ) : (
          <span>All bouquets loaded</span>
        )}
        {error ? (
          <span className="text-[11px] uppercase tracking-[0.22em] text-rose-500">
            {error}
          </span>
        ) : null}
      </div>
    </div>
  );
}
