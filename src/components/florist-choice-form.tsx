"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart";

const paletteOptions = [
  "Blush & Ivory",
  "Peach & Champagne",
  "Lavender Mist",
  "Sage & Cream",
  "Ruby & Blush",
];

const styleOptions = ["Romantic", "Modern", "Garden", "Minimal"];

export default function FloristChoiceForm() {
  const { addItem } = useCart();
  const [price, setPrice] = useState(95);
  const [palette, setPalette] = useState(paletteOptions[0]);
  const [style, setStyle] = useState(styleOptions[0]);
  const [mixed, setMixed] = useState(true);
  const [note, setNote] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    addItem({
      id: `florist-choice-${Date.now()}`,
      name: "Florist Choice Bouquet",
      priceCents: Math.round(price * 100),
      image: "/images/florist-choice.png",
      quantity: 1,
      meta: {
        colors: [palette],
        style,
        note: `${mixed ? "Mixed" : "Mono"} bouquet${note ? ` - ${note}` : ""}`,
        isCustom: true,
      },
    });
    setNote("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-[28px] border border-white/80 bg-white/80 p-6 shadow-sm"
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
      <label className="flex flex-col gap-2 text-sm text-stone-700">
        Preferred palette
        <select
          value={palette}
          onChange={(event) => setPalette(event.target.value)}
          className="select-field rounded-2xl border border-stone-200 bg-white px-4 py-2 text-sm text-stone-800"
        >
          {paletteOptions.map((option) => (
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
          className="select-field rounded-2xl border border-stone-200 bg-white px-4 py-2 text-sm text-stone-800"
        >
          {styleOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
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
          className="rounded-2xl border border-stone-200 bg-white px-4 py-2 text-sm text-stone-800"
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
