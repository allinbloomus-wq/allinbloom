"use client";

import { useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BOUQUET_STYLES, COLOR_OPTIONS, FLOWER_TYPES, PRICE_LIMITS } from "@/lib/constants";

type FilterFormValues = {
  flower: string;
  color: string;
  style: string;
  mixed: string;
  min: string;
  max: string;
};

const readSearchParams = (searchParams: { get: (key: string) => string | null }): FilterFormValues => ({
  flower: searchParams.get("flower") || "all",
  color: searchParams.get("color") || "",
  style: searchParams.get("style") || "",
  mixed: searchParams.get("mixed") || "",
  min: searchParams.get("min") || "",
  max: searchParams.get("max") || "",
});

export default function CatalogFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const formRef = useRef<HTMLFormElement | null>(null);
  const values = useMemo(() => readSearchParams(searchParams), [searchParams]);

  const hasFilters = useMemo(
    () =>
      [values.flower !== "all", values.color, values.style, values.mixed, values.min, values.max].some(
        Boolean
      ),
    [values]
  );

  const applyFilters = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = formRef.current;
    if (!form) return;

    const data = new FormData(form);
    const flower = String(data.get("flower") || "all");
    const color = String(data.get("color") || "");
    const style = String(data.get("style") || "");
    const mixed = String(data.get("mixed") || "");
    const min = String(data.get("min") || "");
    const max = String(data.get("max") || "");

    const params = new URLSearchParams();
    if (flower && flower !== "all") params.set("flower", flower);
    if (color) params.set("color", color);
    if (style) params.set("style", style);
    if (mixed) params.set("mixed", mixed);
    if (min) params.set("min", min);
    if (max) params.set("max", max);
    const query = params.toString();
    router.push(query ? `/catalog?${query}` : "/catalog");
  };

  return (
    <div className="glass rounded-[28px] border border-white/80 p-6">
      <form
        key={searchParams.toString()}
        ref={formRef}
        onSubmit={applyFilters}
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
      >
        <label className="flex flex-col gap-2 text-sm text-stone-700">
          Flower type
          <select
            name="flower"
            defaultValue={values.flower}
            className="select-field rounded-2xl border border-stone-200 bg-white/80 px-3 py-2"
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
            name="color"
            defaultValue={values.color}
            className="select-field rounded-2xl border border-stone-200 bg-white/80 px-3 py-2"
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
            name="style"
            defaultValue={values.style}
            className="select-field rounded-2xl border border-stone-200 bg-white/80 px-3 py-2"
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
            name="mixed"
            defaultValue={values.mixed}
            className="select-field rounded-2xl border border-stone-200 bg-white/80 px-3 py-2"
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
            name="min"
            defaultValue={values.min}
            min={PRICE_LIMITS.min}
            placeholder="45"
            className="rounded-2xl border border-stone-200 bg-white/80 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-stone-700">
          Max price (${PRICE_LIMITS.max})
          <input
            type="number"
            name="max"
            defaultValue={values.max}
            max={PRICE_LIMITS.max}
            placeholder="200"
            className="rounded-2xl border border-stone-200 bg-white/80 px-3 py-2"
          />
        </label>
      </form>
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => formRef.current?.requestSubmit()}
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
