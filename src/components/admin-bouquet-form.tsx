"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import type { Bouquet } from "@/lib/api-types";
import { BOUQUET_STYLES, COLOR_OPTIONS, FLOWER_TYPES } from "@/lib/constants";
import { formatLabel } from "@/lib/format";
import AdminImageUpload from "@/components/admin-image-upload";

type AdminBouquetFormProps = {
  bouquet?: Bouquet;
  action: (formData: FormData) => Promise<void>;
};

const fieldStateClass = (isInvalid: boolean) =>
  isInvalid
    ? "border border-rose-300 focus:border-rose-500"
    : "border border-stone-200 focus:border-stone-400";

const controlFieldClass = (isInvalid: boolean) =>
  `h-11 w-full min-w-0 rounded-2xl bg-white/80 px-4 py-0 text-sm text-stone-800 outline-none ${fieldStateClass(
    isInvalid
  )}`;

const textareaFieldClass = (isInvalid: boolean) =>
  `w-full min-w-0 rounded-2xl bg-white/80 px-4 py-3 text-sm text-stone-800 outline-none ${fieldStateClass(
    isInvalid
  )}`;

const COLOR_OPTIONS_SET = new Set<string>(COLOR_OPTIONS);

const parsePaletteColors = (value: string | undefined) =>
  String(value || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .filter((item, idx, arr) => arr.indexOf(item) === idx);

const sortPaletteColors = (values: string[]) => {
  const known = COLOR_OPTIONS.filter((color) => values.includes(color));
  const unknown = values.filter((value) => !COLOR_OPTIONS_SET.has(value));
  return [...known, ...unknown];
};

const formatPaletteLabel = (value: string) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : value;

const parseNumber = (value: FormDataEntryValue | null) => {
  const raw = String(value || "").trim();
  if (!raw) return NaN;
  return Number(raw);
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 w-full items-center justify-center rounded-full bg-[color:var(--brand)] px-6 text-xs uppercase tracking-[0.3em] text-white transition hover:bg-[color:var(--brand-dark)] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
    >
      {pending ? "Saving..." : "Save bouquet"}
    </button>
  );
}

export default function AdminBouquetForm({
  bouquet,
  action,
}: AdminBouquetFormProps) {
  const [errors, setErrors] = useState<string[]>([]);
  const [invalidFields, setInvalidFields] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>(() =>
    sortPaletteColors(parsePaletteColors(bouquet?.colors))
  );
  const [isColorMenuOpen, setIsColorMenuOpen] = useState(false);
  const colorMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isColorMenuOpen) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (
        colorMenuRef.current &&
        !colorMenuRef.current.contains(event.target as Node)
      ) {
        setIsColorMenuOpen(false);
      }
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsColorMenuOpen(false);
      }
    };

    window.addEventListener("pointerdown", closeOnOutsideClick);
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      window.removeEventListener("pointerdown", closeOnOutsideClick);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isColorMenuOpen]);

  const invalidSet = useMemo(() => new Set(invalidFields), [invalidFields]);
  const selectedColorsValue = useMemo(
    () => selectedColors.join(", "),
    [selectedColors]
  );
  const selectedColorsLabel = useMemo(() => {
    if (!selectedColors.length) return "Select colors";
    const preview = selectedColors.slice(0, 3).map(formatPaletteLabel).join(", ");
    const hiddenCount = selectedColors.length - 3;
    return hiddenCount > 0 ? `${preview} +${hiddenCount}` : preview;
  }, [selectedColors]);

  const toggleColorOption = (color: string) => {
    setSelectedColors((current) => {
      if (current.includes(color)) {
        return current.filter((value) => value !== color);
      }
      return sortPaletteColors([...current, color]);
    });
  };

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const formData = new FormData(event.currentTarget);
    const nextErrors: string[] = [];
    const nextInvalid = new Set<string>();

    const name = String(formData.get("name") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const image = String(formData.get("image") || "").trim();
    const price = parseNumber(formData.get("price"));
    const discountPercent = Math.max(
      0,
      Math.min(90, Math.round(parseNumber(formData.get("discountPercent")) || 0))
    );
    const discountNote = String(formData.get("discountNote") || "").trim();

    if (!name) {
      nextErrors.push("Bouquet name is required.");
      nextInvalid.add("name");
    }

    if (!description) {
      nextErrors.push("Bouquet description is required.");
      nextInvalid.add("description");
    }

    if (!Number.isFinite(price) || price <= 0) {
      nextErrors.push("Price must be greater than 0.");
      nextInvalid.add("price");
    }

    if (!image) {
      nextErrors.push("Image URL is required.");
      nextInvalid.add("image");
    }

    if (discountPercent > 0 && !discountNote) {
      nextErrors.push("Discount comment is required when discount percent is greater than 0.");
      nextInvalid.add("discountNote");
    }

    if (nextErrors.length) {
      event.preventDefault();
      setErrors(nextErrors);
      setInvalidFields(Array.from(nextInvalid));
      return;
    }

    setErrors([]);
    setInvalidFields([]);
  };

  return (
    <form
      action={action}
      onSubmit={onSubmit}
      className="glass relative z-10 max-w-full space-y-6 rounded-[28px] border border-white/80 p-4 sm:p-6"
    >
      {bouquet ? <input type="hidden" name="id" value={bouquet.id} /> : null}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="min-w-0 space-y-4">
          <label className="flex flex-col gap-2 text-sm text-stone-700">
            Name
            <input
              name="name"
              defaultValue={bouquet?.name}
              required
              className={controlFieldClass(invalidSet.has("name"))}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-stone-700">
            Description
            <textarea
              name="description"
              defaultValue={bouquet?.description}
              rows={4}
              required
              className={textareaFieldClass(invalidSet.has("description"))}
            />
          </label>
          <div className="grid gap-4">
            <label className="flex flex-col gap-2 text-sm text-stone-700">
              Price (USD)
              <input
                name="price"
                type="number"
                step="0.01"
                min="0"
                defaultValue={
                  bouquet ? (bouquet.priceCents / 100).toFixed(2) : ""
                }
                required
                className={controlFieldClass(invalidSet.has("price"))}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-stone-700">
              Discount percent
              <input
                name="discountPercent"
                type="number"
                min="0"
                max="90"
                defaultValue={bouquet?.discountPercent ?? 0}
                className={controlFieldClass(false)}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-stone-700">
              Discount comment
              <input
                name="discountNote"
                defaultValue={bouquet?.discountNote || ""}
                placeholder="Reason for discount"
                className={controlFieldClass(invalidSet.has("discountNote"))}
              />
            </label>
          </div>
          <div
            ref={colorMenuRef}
            className="relative z-20 flex flex-col gap-2 text-sm text-stone-700"
          >
            <span>Color palette</span>
            <input type="hidden" name="colors" value={selectedColorsValue} />
            <button
              type="button"
              onClick={() => setIsColorMenuOpen((current) => !current)}
              aria-haspopup="true"
              aria-expanded={isColorMenuOpen}
              className="flex h-11 w-full items-center justify-between rounded-2xl border border-stone-200 bg-white/80 px-4 text-sm text-stone-800 outline-none transition hover:border-stone-300 focus:border-stone-400"
            >
              <span
                className={`truncate text-left ${
                  selectedColors.length ? "text-stone-800" : "text-stone-500"
                }`}
              >
                {selectedColorsLabel}
              </span>
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                fill="none"
                className={`h-4 w-4 text-stone-500 transition-transform ${
                  isColorMenuOpen ? "rotate-180" : ""
                }`}
              >
                <path
                  d="m5 7 5 6 5-6"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            {isColorMenuOpen ? (
              <div className="absolute left-0 right-0 top-full z-30 mt-2 rounded-2xl border border-stone-200 bg-white p-2 shadow-[0_14px_28px_rgba(28,21,18,0.14)]">
                <div className="max-h-56 space-y-1 overflow-auto pr-1">
                  {COLOR_OPTIONS.map((color) => (
                    <label
                      key={color}
                      className="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-1.5 text-sm text-stone-700 transition hover:bg-stone-50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedColors.includes(color)}
                        onChange={() => toggleColorOption(color)}
                        className="h-4 w-4 accent-[color:var(--brand)]"
                      />
                      <span>{formatPaletteLabel(color)}</span>
                    </label>
                  ))}
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-stone-100 px-1 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedColors([])}
                    className="text-[10px] uppercase tracking-[0.2em] text-stone-500 transition hover:text-stone-700"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsColorMenuOpen(false)}
                    className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--brand)] transition hover:text-[color:var(--brand-dark)]"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
        <div className="min-w-0 space-y-4">
          <AdminImageUpload
            defaultValue={bouquet?.image || "/images/mock.webp"}
            recommendedSize="1000x1000"
            isInvalid={invalidSet.has("image")}
          />
          <label className="relative z-10 flex flex-col gap-2 text-sm text-stone-700">
            Flower type
            <select
              name="flowerType"
              defaultValue={bouquet?.flowerType || FLOWER_TYPES[0]}
              className={`select-field ${controlFieldClass(false)}`}
            >
              {FLOWER_TYPES.map((type) => (
                <option key={type} value={type}>
                  {formatLabel(type)}
                </option>
              ))}
            </select>
          </label>
          <label className="relative z-10 flex flex-col gap-2 text-sm text-stone-700">
            Style
            <select
              name="style"
              defaultValue={bouquet?.style || BOUQUET_STYLES[0]}
              className={`select-field ${controlFieldClass(false)}`}
            >
              {BOUQUET_STYLES.map((style) => (
                <option key={style} value={style}>
                  {formatLabel(style)}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-2">
            <label className="flex items-center gap-2 text-sm text-stone-700">
              <input
                type="checkbox"
                name="isMixed"
                defaultChecked={bouquet?.isMixed}
              />
              Mixed bouquet
            </label>
            <label className="flex items-center gap-2 text-sm text-stone-700">
              <input
                type="checkbox"
                name="isFeatured"
                defaultChecked={bouquet?.isFeatured}
              />
              Featured on homepage
            </label>
            <label className="flex items-center gap-2 text-sm text-stone-700">
              <input
                type="checkbox"
                name="isActive"
                defaultChecked={bouquet ? bouquet.isActive : true}
              />
              Visible in catalog
            </label>
          </div>
        </div>
      </div>

      {errors.length ? (
        <div className="rounded-2xl border border-rose-300 bg-rose-50/80 px-4 py-3 text-sm text-rose-700">
          <p className="font-semibold">Please fix the following before saving:</p>
          <ul className="mt-2 list-disc pl-5">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <SubmitButton />
        <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
          Changes apply instantly
        </p>
      </div>
    </form>
  );
}

