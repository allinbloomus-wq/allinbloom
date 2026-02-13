"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import type { Bouquet } from "@/lib/api-types";
import { BOUQUET_STYLES, FLOWER_TYPES } from "@/lib/constants";
import { formatLabel } from "@/lib/format";
import AdminImageUpload from "@/components/admin-image-upload";

type AdminBouquetFormProps = {
  bouquet?: Bouquet;
  action: (formData: FormData) => Promise<void>;
};

const fieldClass = (isInvalid: boolean) =>
  `rounded-2xl bg-white/80 px-4 py-3 text-sm text-stone-800 outline-none ${
    isInvalid
      ? "border border-rose-300 focus:border-rose-500"
      : "border border-stone-200 focus:border-stone-400"
  }`;

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
      className="rounded-full bg-[color:var(--brand)] px-6 py-3 text-xs uppercase tracking-[0.3em] text-white transition hover:bg-[color:var(--brand-dark)] disabled:cursor-not-allowed disabled:opacity-60"
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
  const invalidSet = useMemo(() => new Set(invalidFields), [invalidFields]);

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
      className="glass space-y-6 rounded-[28px] border border-white/80 p-6"
    >
      {bouquet ? <input type="hidden" name="id" value={bouquet.id} /> : null}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <label className="flex flex-col gap-2 text-sm text-stone-700">
            Name
            <input
              name="name"
              defaultValue={bouquet?.name}
              required
              className={fieldClass(invalidSet.has("name"))}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-stone-700">
            Description
            <textarea
              name="description"
              defaultValue={bouquet?.description}
              rows={4}
              required
              className={fieldClass(invalidSet.has("description"))}
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
                className={fieldClass(invalidSet.has("price"))}
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
                className={fieldClass(false)}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-stone-700">
              Discount comment
              <input
                name="discountNote"
                defaultValue={bouquet?.discountNote || ""}
                placeholder="Reason for discount"
                className={fieldClass(invalidSet.has("discountNote"))}
              />
            </label>
          </div>
          <label className="flex flex-col gap-2 text-sm text-stone-700">
            Color palette (comma separated)
            <input
              name="colors"
              defaultValue={bouquet?.colors}
              className={fieldClass(false)}
            />
          </label>
        </div>
        <div className="space-y-4">
          <AdminImageUpload
            defaultValue={bouquet?.image || "/images/bouquet-0.webp"}
            recommendedSize="1000x1000"
            isInvalid={invalidSet.has("image")}
          />
          <label className="flex flex-col gap-2 text-sm text-stone-700">
            Flower type
            <select
              name="flowerType"
              defaultValue={bouquet?.flowerType || FLOWER_TYPES[0]}
              className={`select-field ${fieldClass(false)}`}
            >
              {FLOWER_TYPES.map((type) => (
                <option key={type} value={type}>
                  {formatLabel(type)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm text-stone-700">
            Style
            <select
              name="style"
              defaultValue={bouquet?.style || BOUQUET_STYLES[0]}
              className={`select-field ${fieldClass(false)}`}
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

