"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type MultiCheckboxOption = {
  value: string;
  label: string;
};

type MultiCheckboxDropdownProps = {
  label: string;
  controlId: string;
  options: MultiCheckboxOption[];
  values: string[];
  onToggle: (value: string) => void;
  onClear?: () => void;
  emptyLabel?: string;
  maxSelections?: number;
  clearLabel?: string;
  doneLabel?: string;
};

export default function MultiCheckboxDropdown({
  label,
  controlId,
  options,
  values,
  onToggle,
  onClear,
  emptyLabel = "Select options",
  maxSelections,
  clearLabel = "Clear",
  doneLabel = "Done",
}: MultiCheckboxDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (rootRef.current?.contains(target)) return;
      setIsOpen(false);
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  const valueSet = useMemo(() => new Set(values), [values]);
  const selectedLabel = useMemo(() => {
    if (!values.length) return emptyLabel;
    const labels = values
      .map((value) => options.find((option) => option.value === value)?.label || value)
      .filter(Boolean);
    const preview = labels.slice(0, 3).join(", ");
    const hiddenCount = labels.length - 3;
    return hiddenCount > 0 ? `${preview} +${hiddenCount}` : preview;
  }, [emptyLabel, options, values]);

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
        onClick={() => setIsOpen((current) => !current)}
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
          className="custom-select-panel custom-select-panel--single-scroll"
        >
          <div className="custom-select-panel-list space-y-1 pr-1">
            {options.map((option) => {
              const checked = valueSet.has(option.value);
              const disableUnchecked =
                !checked && Boolean(maxSelections && values.length >= maxSelections);
              return (
                <label
                  key={option.value}
                  className={`flex cursor-pointer items-center gap-2 rounded-xl px-2 py-1.5 text-sm transition ${
                    disableUnchecked
                      ? "text-stone-400"
                      : "text-stone-700 hover:bg-stone-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={disableUnchecked}
                    onChange={() => onToggle(option.value)}
                    className="h-4 w-4 accent-[color:var(--brand)]"
                  />
                  <span>{option.label}</span>
                </label>
              );
            })}
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-stone-100 px-1 pt-2">
            {onClear ? (
              <button
                type="button"
                onClick={onClear}
                className="text-[10px] uppercase tracking-[0.2em] text-stone-500 transition hover:text-stone-700"
              >
                {clearLabel}
              </button>
            ) : (
              <span />
            )}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--brand)] transition hover:text-[color:var(--brand-dark)]"
            >
              {doneLabel}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
