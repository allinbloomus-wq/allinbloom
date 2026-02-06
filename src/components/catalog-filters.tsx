"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BOUQUET_STYLES, COLOR_OPTIONS, FLOWER_TYPES, PRICE_LIMITS } from "@/lib/constants";

export default function CatalogFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [flower, setFlower] = useState("all");
  const [color, setColor] = useState("");
  const [style, setStyle] = useState("");
  const [mixed, setMixed] = useState("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");

  useEffect(() => {
    setFlower(searchParams.get("flower") || "all");
    setColor(searchParams.get("color") || "");
    setStyle(searchParams.get("style") || "");
    setMixed(searchParams.get("mixed") || "");
    setMin(searchParams.get("min") || "");
    setMax(searchParams.get("max") || "");
  }, [searchParams]);

  const hasFilters = useMemo(
    () => [flower !== "all", color, style, mixed, min, max].some(Boolean),
    [flower, color, style, mixed, min, max]
  );

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (flower && flower !== "all") params.set("flower", flower);
    if (color) params.set("color", color);
    if (style) params.set("style", style);
    if (mixed) params.set("mixed", mixed);
    if (min) params.set("min", min);
    if (max) params.set("max", max);
    router.push(`/catalog?${params.toString()}`);
  };

  return (
    <div className="glass rounded-[28px] border border-white/80 p-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <label className="flex flex-col gap-2 text-sm text-stone-700">
          Flower type
          <select
            value={flower}
            onChange={(event) => setFlower(event.target.value)}
            className="rounded-2xl border border-stone-200 bg-white/80 px-3 py-2"
          >
            <option value="all">All flowers</option>
            {FLOWER_TYPES.map((option) => (
              <option key={option} value={option.toLowerCase()}>
                {option.charAt(0) + option.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm text-stone-700">
          Palette
          <select
            value={color}
            onChange={(event) => setColor(event.target.value)}
            className="rounded-2xl border border-stone-200 bg-white/80 px-3 py-2"
          >
            <option value="">Any color</option>
            {COLOR_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm text-stone-700">
          Style
          <select
            value={style}
            onChange={(event) => setStyle(event.target.value)}
            className="rounded-2xl border border-stone-200 bg-white/80 px-3 py-2"
          >
            <option value="">Any style</option>
            {BOUQUET_STYLES.map((option) => (
              <option key={option} value={option.toLowerCase()}>
                {option.charAt(0) + option.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm text-stone-700">
          Bouquet type
          <select
            value={mixed}
            onChange={(event) => setMixed(event.target.value)}
            className="rounded-2xl border border-stone-200 bg-white/80 px-3 py-2"
          >
            <option value="">Mixed or mono</option>
            <option value="mixed">Mixed bouquet</option>
            <option value="mono">Mono bouquet</option>
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm text-stone-700">
          Min price (${PRICE_LIMITS.min})
          <input
            type="number"
            value={min}
            onChange={(event) => setMin(event.target.value)}
            min={PRICE_LIMITS.min}
            placeholder="45"
            className="rounded-2xl border border-stone-200 bg-white/80 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-stone-700">
          Max price (${PRICE_LIMITS.max})
          <input
            type="number"
            value={max}
            onChange={(event) => setMax(event.target.value)}
            max={PRICE_LIMITS.max}
            placeholder="200"
            className="rounded-2xl border border-stone-200 bg-white/80 px-3 py-2"
          />
        </label>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={applyFilters}
          className="rounded-full bg-[color:var(--brand)] px-6 py-2 text-xs uppercase tracking-[0.3em] text-white transition hover:bg-[color:var(--brand-dark)]"
        >
          Apply filters
        </button>
        {hasFilters ? (
          <button
            type="button"
            onClick={() => router.push("/catalog")}
            className="rounded-full border border-stone-200 bg-white/80 px-5 py-2 text-xs uppercase tracking-[0.3em] text-stone-600"
          >
            Clear
          </button>
        ) : null}
      </div>
    </div>
  );
}
