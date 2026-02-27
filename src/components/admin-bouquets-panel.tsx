"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Bouquet } from "@/lib/api-types";
import {
  BOUQUET_TYPE_FILTERS,
  CATALOG_SORT_VALUES,
  COLOR_OPTIONS,
  FLOWER_TYPES,
  PRICE_LIMITS,
} from "@/lib/constants";
import AdminBouquetRow from "@/components/admin-bouquet-row";
import MultiCheckboxDropdown from "@/components/multi-checkbox-dropdown";

type AdminFilterValues = {
  flowers: string[];
  color: string;
  bouquetType: string;
  min: string;
  max: string;
  sort: string;
};

type DropdownField = "color" | "bouquetType" | "sort";

type FilterOption = {
  value: string;
  label: string;
};

const initialFilters: AdminFilterValues = {
  flowers: [],
  color: "",
  bouquetType: "",
  min: "",
  max: "",
  sort: "",
};

const formatLabel = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();

const toUniqueArray = (values: string[]) =>
  values.filter((value, index) => values.indexOf(value) === index);

const parseMoneyToCents = (value: string) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.max(0, Math.round(parsed * 100));
};

const resolveBouquetType = (bouquet: Bouquet) => {
  const direct = String(bouquet.bouquetType || "")
    .trim()
    .toLowerCase();
  if (direct === "mono" || direct === "mixed" || direct === "season") {
    return direct;
  }
  if (String(bouquet.style || "").trim().toLowerCase() === "season") {
    return "season";
  }
  return bouquet.isMixed ? "mixed" : "mono";
};

const parseBouquetFlowerTypes = (bouquet: Bouquet) => {
  const selectableSet = new Set<string>(FLOWER_TYPES);
  const parsed = String(bouquet.style || "")
    .split(",")
    .map((value) => value.trim().toUpperCase())
    .filter((value) => selectableSet.has(value))
    .filter((value, index, list) => list.indexOf(value) === index)
    .slice(0, 3)
    .map((value) => value.toLowerCase());
  if (parsed.length) return parsed;
  const fallback = String(bouquet.flowerType || "").trim().toLowerCase();
  if ((FLOWER_TYPES as readonly string[]).includes(fallback.toUpperCase())) {
    return [fallback];
  }
  return [];
};

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
    <div
      ref={rootRef}
      className={`relative flex min-w-0 flex-col gap-2 text-sm text-stone-700 ${
        isOpen ? "z-30" : "z-0"
      }`}
    >
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
          <path
            d="M3.5 6.5L8 11l4.5-4.5"
            stroke="currentColor"
            strokeWidth="1.7"
            fill="none"
            strokeLinecap="round"
          />
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

export default function AdminBouquetsPanel({ bouquets }: { bouquets: Bouquet[] }) {
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<AdminFilterValues>(initialFilters);
  const [openDropdown, setOpenDropdown] = useState<DropdownField | null>(null);
  const priceFieldClass =
    "h-11 w-full min-w-0 rounded-2xl border border-stone-200 bg-white/80 px-4 py-0 text-[0.93rem] leading-[1.35] text-stone-800 outline-none focus:border-[color:var(--brand)]";

  const dropdownOptions = useMemo(
    () => ({
      flower: FLOWER_TYPES.map((option) => ({
        value: option.toLowerCase(),
        label: formatLabel(option),
      })),
      color: [
        { value: "", label: "Any color" },
        ...COLOR_OPTIONS.map((option) => ({ value: option, label: formatLabel(option) })),
      ],
      bouquetType: [
        { value: "", label: "All bouquets" },
        ...BOUQUET_TYPE_FILTERS.filter((value) => value !== "all").map((value) => ({
          value,
          label: `${formatLabel(value)} bouquet`,
        })),
      ],
      sort: [
        { value: "", label: "Default order" },
        ...CATALOG_SORT_VALUES.map((value) => {
          if (value === "name_asc") return { value, label: "Name (A-Z)" };
          if (value === "name_desc") return { value, label: "Name (Z-A)" };
          if (value === "price_asc") return { value, label: "Price (low-high)" };
          return { value, label: "Price (high-low)" };
        }),
      ],
    }),
    []
  );

  const filteredAndSorted = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const minCents = parseMoneyToCents(filters.min);
    const maxCents = parseMoneyToCents(filters.max);
    const selectedFlowers = filters.flowers;
    const selectedColor = filters.color.trim().toLowerCase();
    const selectedBouquetType = filters.bouquetType.trim().toLowerCase();

    const filtered = bouquets.filter((bouquet) => {
      if (q && !bouquet.name.toLowerCase().includes(q)) return false;

      const bouquetFlowers = parseBouquetFlowerTypes(bouquet);
      if (
        selectedFlowers.length &&
        !selectedFlowers.some((flower) => bouquetFlowers.includes(flower))
      ) {
        return false;
      }

      if (selectedColor) {
        const normalizedColors = String(bouquet.colors || "").toLowerCase();
        if (!normalizedColors.includes(selectedColor)) {
          return false;
        }
      }

      if (selectedBouquetType) {
        if (resolveBouquetType(bouquet) !== selectedBouquetType) {
          return false;
        }
      }

      if (minCents !== null && bouquet.priceCents < minCents) return false;
      if (maxCents !== null && bouquet.priceCents > maxCents) return false;

      return true;
    });

    if (!filters.sort) return filtered;

    const sorted = [...filtered];
    if (filters.sort === "name_asc") {
      sorted.sort((left, right) =>
        left.name.localeCompare(right.name, undefined, { sensitivity: "base" })
      );
    } else if (filters.sort === "name_desc") {
      sorted.sort((left, right) =>
        right.name.localeCompare(left.name, undefined, { sensitivity: "base" })
      );
    } else if (filters.sort === "price_asc") {
      sorted.sort((left, right) => left.priceCents - right.priceCents || left.id.localeCompare(right.id));
    } else if (filters.sort === "price_desc") {
      sorted.sort((left, right) => right.priceCents - left.priceCents || right.id.localeCompare(left.id));
    }
    return sorted;
  }, [bouquets, filters, searchQuery]);

  const hasAnyFilters = useMemo(
    () =>
      Boolean(
        filters.flowers.length ||
          filters.color ||
          filters.bouquetType ||
          filters.min ||
          filters.max ||
          filters.sort
      ),
    [filters]
  );

  const toggleFlower = (value: string) => {
    setFilters((current) => {
      const exists = current.flowers.includes(value);
      const nextFlowers = exists
        ? current.flowers.filter((entry) => entry !== value)
        : [...current.flowers, value];
      return { ...current, flowers: toUniqueArray(nextFlowers) };
    });
  };

  const setDropdownValue = (field: DropdownField, value: string) => {
    setFilters((current) => ({ ...current, [field]: value }));
  };

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setSearchQuery(searchInput.trim());
          }}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-stone-200 bg-white/80 p-1.5"
        >
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search bouquet by name"
            className="h-10 min-w-0 flex-1 rounded-full border-0 bg-transparent px-3 text-sm text-stone-800 outline-none"
          />
          <button
            type="submit"
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-full bg-[color:var(--brand)] px-5 text-[10px] uppercase tracking-[0.24em] text-white transition hover:bg-[color:var(--brand-dark)] sm:text-xs sm:tracking-[0.3em]"
          >
            Find
          </button>
        </form>
        <button
          type="button"
          onClick={() => setIsFiltersOpen((current) => !current)}
          className="inline-flex h-10 shrink-0 items-center justify-center rounded-full border border-stone-300 bg-white/80 px-4 text-[10px] uppercase tracking-[0.24em] text-stone-700 transition hover:border-stone-400 sm:text-xs sm:tracking-[0.3em]"
        >
          Filters
        </button>
      </div>

      {isFiltersOpen ? (
        <div className="rounded-[24px] border border-white/80 bg-white/60 p-4 sm:p-5">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <MultiCheckboxDropdown
              label="Flower type"
              controlId="admin-bouquet-filter-flowers"
              options={dropdownOptions.flower}
              values={filters.flowers}
              onToggle={toggleFlower}
              onClear={() => setFilters((current) => ({ ...current, flowers: [] }))}
              emptyLabel="All flowers"
            />
            <FilterDropdown
              label="Palette"
              controlId="admin-bouquet-filter-color"
              value={filters.color}
              options={dropdownOptions.color}
              isOpen={openDropdown === "color"}
              onToggle={() => setOpenDropdown((current) => (current === "color" ? null : "color"))}
              onClose={() => setOpenDropdown(null)}
              onSelect={(value) => setDropdownValue("color", value)}
            />
            <FilterDropdown
              label="Bouquet type"
              controlId="admin-bouquet-filter-bouquet-type"
              value={filters.bouquetType}
              options={dropdownOptions.bouquetType}
              isOpen={openDropdown === "bouquetType"}
              onToggle={() =>
                setOpenDropdown((current) => (current === "bouquetType" ? null : "bouquetType"))
              }
              onClose={() => setOpenDropdown(null)}
              onSelect={(value) => setDropdownValue("bouquetType", value)}
            />
            <label className="flex flex-col gap-2 text-sm text-stone-700">
              Min price (${PRICE_LIMITS.min})
              <input
                type="number"
                name="min"
                value={filters.min}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, min: event.target.value }))
                }
                min={PRICE_LIMITS.min}
                placeholder="45"
                className={priceFieldClass}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-stone-700">
              Max price (${PRICE_LIMITS.max})
              <input
                type="number"
                name="max"
                value={filters.max}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, max: event.target.value }))
                }
                max={PRICE_LIMITS.max}
                placeholder="200"
                className={priceFieldClass}
              />
            </label>
            <FilterDropdown
              label="Sort by"
              controlId="admin-bouquet-filter-sort"
              value={filters.sort}
              options={dropdownOptions.sort}
              isOpen={openDropdown === "sort"}
              onToggle={() => setOpenDropdown((current) => (current === "sort" ? null : "sort"))}
              onClose={() => setOpenDropdown(null)}
              onSelect={(value) => setDropdownValue("sort", value)}
            />
          </div>
          {hasAnyFilters ? (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setFilters(initialFilters)}
                className="inline-flex h-10 items-center justify-center rounded-full border border-stone-200 bg-white/80 px-4 text-[10px] uppercase tracking-[0.24em] text-stone-700 transition hover:border-stone-300 sm:text-xs sm:tracking-[0.3em]"
              >
                Clear filters
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-2 text-xs uppercase tracking-[0.2em] text-stone-500">
        <span>Shown bouquets</span>
        <span>{filteredAndSorted.length}</span>
      </div>

      {filteredAndSorted.length ? (
        filteredAndSorted.map((bouquet) => (
          <AdminBouquetRow key={bouquet.id} bouquet={bouquet} />
        ))
      ) : (
        <div className="rounded-[24px] border border-stone-200/80 bg-white/70 p-5 text-sm text-stone-600">
          No bouquets match current search and filters.
        </div>
      )}
    </div>
  );
}
