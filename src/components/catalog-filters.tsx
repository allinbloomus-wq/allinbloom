"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

type DropdownField = "flower" | "color" | "style" | "mixed";

type FilterOption = {
  value: string;
  label: string;
};

const readSearchParams = (searchParams: { get: (key: string) => string | null }): FilterFormValues => ({
  flower: searchParams.get("flower") || "all",
  color: searchParams.get("color") || "",
  style: searchParams.get("style") || "",
  mixed: searchParams.get("mixed") || "",
  min: searchParams.get("min") || "",
  max: searchParams.get("max") || "",
});

const formatLabel = (value: string) => value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();

type FilterDropdownProps = {
  label: string;
  value: string;
  options: FilterOption[];
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (value: string) => void;
  onClose: () => void;
  controlId: string;
};

function FilterDropdown({
  label,
  value,
  options,
  isOpen,
  onToggle,
  onSelect,
  onClose,
  controlId,
}: FilterDropdownProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selectedLabel = useMemo(
    () => options.find((option) => option.value === value)?.label || options[0]?.label || "",
    [options, value]
  );

  useEffect(() => {
    if (!isOpen) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (rootRef.current?.contains(target)) return;
      onClose();
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen, onClose]);

  return (
    <div ref={rootRef} className="relative flex flex-col gap-2 text-sm text-stone-700">
      <span>{label}</span>
      <button
        type="button"
        id={`${controlId}-button`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={`${controlId}-listbox`}
        onClick={onToggle}
        data-open={isOpen}
        className="custom-select-trigger"
      >
        <span className="pr-8">{selectedLabel}</span>
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          className={`absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--brand)] transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          <path d="M3.5 6.5L8 11l4.5-4.5" stroke="currentColor" strokeWidth="1.7" fill="none" strokeLinecap="round" />
        </svg>
      </button>
      {isOpen ? (
        <div
          role="listbox"
          id={`${controlId}-listbox`}
          aria-labelledby={`${controlId}-button`}
          className="custom-select-panel"
        >
          {options.map((option) => {
            const active = option.value === value;
            return (
              <button
                key={option.value || "__empty"}
                type="button"
                role="option"
                aria-selected={active}
                data-active={active}
                onClick={() => {
                  onSelect(option.value);
                  onClose();
                }}
                className="custom-select-option"
              >
                <span>{option.label}</span>
                {active ? (
                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--brand)]">
                    Current
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export default function CatalogFilters() {
  const searchParams = useSearchParams();
  const values = useMemo(() => readSearchParams(searchParams), [searchParams]);

  return <CatalogFiltersForm key={searchParams.toString()} initialValues={values} />;
}

type CatalogFiltersFormProps = {
  initialValues: FilterFormValues;
};

function CatalogFiltersForm({ initialValues }: CatalogFiltersFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement | null>(null);
  const [formValues, setFormValues] = useState<FilterFormValues>(initialValues);
  const [openDropdown, setOpenDropdown] = useState<DropdownField | null>(null);

  const dropdownOptions = useMemo(
    () => ({
      flower: [
        { value: "all", label: "All flowers" },
        ...FLOWER_TYPES.map((option) => ({
          value: option.toLowerCase(),
          label: formatLabel(option),
        })),
      ],
      color: [
        { value: "", label: "Any color" },
        ...COLOR_OPTIONS.map((option) => ({ value: option, label: formatLabel(option) })),
      ],
      style: [
        { value: "", label: "Any style" },
        ...BOUQUET_STYLES.map((option) => ({
          value: option.toLowerCase(),
          label: formatLabel(option),
        })),
      ],
      mixed: [
        { value: "", label: "Mixed or mono" },
        { value: "mixed", label: "Mixed bouquet" },
        { value: "mono", label: "Mono bouquet" },
      ],
    }),
    []
  );

  const setDropdownValue = (field: DropdownField, value: string) => {
    setFormValues((current) => ({ ...current, [field]: value }));
  };

  const hasFilters = useMemo(
    () =>
      [formValues.flower !== "all", formValues.color, formValues.style, formValues.mixed, formValues.min, formValues.max].some(
        Boolean
      ),
    [formValues]
  );

  const applyFilters = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const { flower, color, style, mixed, min, max } = formValues;

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
        ref={formRef}
        onSubmit={applyFilters}
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
      >
        <FilterDropdown
          label="Flower type"
          controlId="catalog-filter-flower"
          value={formValues.flower}
          options={dropdownOptions.flower}
          isOpen={openDropdown === "flower"}
          onToggle={() => setOpenDropdown((current) => (current === "flower" ? null : "flower"))}
          onClose={() => setOpenDropdown(null)}
          onSelect={(value) => setDropdownValue("flower", value)}
        />
        <FilterDropdown
          label="Palette"
          controlId="catalog-filter-color"
          value={formValues.color}
          options={dropdownOptions.color}
          isOpen={openDropdown === "color"}
          onToggle={() => setOpenDropdown((current) => (current === "color" ? null : "color"))}
          onClose={() => setOpenDropdown(null)}
          onSelect={(value) => setDropdownValue("color", value)}
        />
        <FilterDropdown
          label="Style"
          controlId="catalog-filter-style"
          value={formValues.style}
          options={dropdownOptions.style}
          isOpen={openDropdown === "style"}
          onToggle={() => setOpenDropdown((current) => (current === "style" ? null : "style"))}
          onClose={() => setOpenDropdown(null)}
          onSelect={(value) => setDropdownValue("style", value)}
        />
        <FilterDropdown
          label="Bouquet type"
          controlId="catalog-filter-mixed"
          value={formValues.mixed}
          options={dropdownOptions.mixed}
          isOpen={openDropdown === "mixed"}
          onToggle={() => setOpenDropdown((current) => (current === "mixed" ? null : "mixed"))}
          onClose={() => setOpenDropdown(null)}
          onSelect={(value) => setDropdownValue("mixed", value)}
        />
        <label className="flex flex-col gap-2 text-sm text-stone-700">
          Min price (${PRICE_LIMITS.min})
          <input
            type="number"
            name="min"
            value={formValues.min}
            onChange={(event) => setFormValues((current) => ({ ...current, min: event.target.value }))}
            min={PRICE_LIMITS.min}
            placeholder="45"
            className="rounded-2xl border border-stone-200 bg-white/80 px-3 py-2 outline-none focus:border-[color:var(--brand)]"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-stone-700">
          Max price (${PRICE_LIMITS.max})
          <input
            type="number"
            name="max"
            value={formValues.max}
            onChange={(event) => setFormValues((current) => ({ ...current, max: event.target.value }))}
            max={PRICE_LIMITS.max}
            placeholder="200"
            className="rounded-2xl border border-stone-200 bg-white/80 px-3 py-2 outline-none focus:border-[color:var(--brand)]"
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
