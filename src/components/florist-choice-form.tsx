"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useCart } from "@/lib/cart";
import { useToast } from "@/components/toast-provider";

const paletteOptions = [
  "Blush & Ivory",
  "Peach & Champagne",
  "Lavender Mist",
  "Sage & Cream",
  "Ruby & Blush",
];

const styleOptions = ["Romantic", "Modern", "Garden", "Minimal"];

type ChoiceDropdownProps = {
  label: string;
  value: string;
  options: string[];
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (value: string) => void;
  onClose: () => void;
  controlId: string;
};

function ChoiceDropdown({
  label,
  value,
  options,
  isOpen,
  onToggle,
  onSelect,
  onClose,
  controlId,
}: ChoiceDropdownProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selectedLabel = useMemo(
    () => (options.includes(value) ? value : options[0] || ""),
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
            const active = option === value;
            return (
              <button
                key={option}
                type="button"
                role="option"
                aria-selected={active}
                data-active={active}
                onClick={() => {
                  onSelect(option);
                  onClose();
                }}
                className="custom-select-option"
              >
                <span>{option}</span>
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

export default function FloristChoiceForm() {
  const { addItem } = useCart();
  const { showToast } = useToast();
  const [price, setPrice] = useState(95);
  const [palette, setPalette] = useState(paletteOptions[0]);
  const [style, setStyle] = useState(styleOptions[0]);
  const [mixed, setMixed] = useState(true);
  const [note, setNote] = useState("");
  const [openDropdown, setOpenDropdown] = useState<"palette" | "style" | null>(
    null
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedNote = note.trim();
    const detailsParts = [
      `Palette: ${palette}`,
      `Style: ${style}`,
      `Bouquet: ${mixed ? "Mixed" : "Mono"}`,
    ];
    if (trimmedNote) {
      detailsParts.push(`Note: ${trimmedNote}`);
    }
    const details = detailsParts.join(" | ");

    addItem({
      id: `florist-choice-${Date.now()}`,
      name: "Florist Choice Bouquet",
      priceCents: Math.round(price * 100),
      image: "/images/florist-choice.webp",
      quantity: 1,
      meta: {
        colors: [palette],
        style,
        note: details,
        details,
        isCustom: true,
      },
    });
    showToast("Added to cart.");
    setNote("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-full space-y-4 rounded-[28px] border border-white/80 bg-white/80 p-5 shadow-sm sm:p-6"
    >
      <div className="space-y-2">
        <label className="text-xs uppercase tracking-[0.3em] text-stone-500">
          Budget: ${price}
        </label>
        <input
          type="range"
          min={65}
          max={180}
          step={5}
          value={price}
          onChange={(event) => setPrice(Number(event.target.value))}
          className="w-full"
        />
      </div>
      <ChoiceDropdown
        label="Preferred palette"
        controlId="florist-choice-palette"
        value={palette}
        options={paletteOptions}
        isOpen={openDropdown === "palette"}
        onToggle={() =>
          setOpenDropdown((current) => (current === "palette" ? null : "palette"))
        }
        onClose={() => setOpenDropdown(null)}
        onSelect={setPalette}
      />
      <ChoiceDropdown
        label="Style"
        controlId="florist-choice-style"
        value={style}
        options={styleOptions}
        isOpen={openDropdown === "style"}
        onToggle={() =>
          setOpenDropdown((current) => (current === "style" ? null : "style"))
        }
        onClose={() => setOpenDropdown(null)}
        onSelect={setStyle}
      />
      <div className="flex items-center gap-3 text-sm text-stone-700">
        <input
          id="mixed"
          type="checkbox"
          checked={mixed}
          onChange={(event) => setMixed(event.target.checked)}
        />
        <label htmlFor="mixed">Mixed bouquet</label>
      </div>
      <label className="flex flex-col gap-2 text-sm text-stone-700">
        Note to florist (optional)
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={3}
          className="w-full min-w-0 rounded-2xl border border-stone-200 bg-white px-4 py-2 text-sm text-stone-800 outline-none focus:border-stone-400"
        />
      </label>
      <button
        type="submit"
        className="w-full rounded-full bg-[color:var(--brand)] px-5 py-3 text-xs uppercase tracking-[0.3em] text-white transition hover:bg-[color:var(--brand-dark)]"
      >
        Add custom bouquet
      </button>
    </form>
  );
}

