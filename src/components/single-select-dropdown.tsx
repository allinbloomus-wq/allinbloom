"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type SingleSelectOption = {
  value: string;
  label: string;
};

type SingleSelectDropdownProps = {
  label: string;
  controlId: string;
  name: string;
  value: string;
  options: SingleSelectOption[];
  onChange: (value: string) => void;
  invalid?: boolean;
};

export default function SingleSelectDropdown({
  label,
  controlId,
  name,
  value,
  options,
  onChange,
  invalid = false,
}: SingleSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
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

  return (
    <div
      ref={rootRef}
      className={`relative flex min-w-0 flex-col gap-2 text-sm text-stone-700 ${
        isOpen ? "z-30" : "z-0"
      }`}
    >
      <span>{label}</span>
      <input type="hidden" name={name} value={value} />
      <button
        type="button"
        id={`${controlId}-button`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={`${controlId}-listbox`}
        onClick={() => setIsOpen((current) => !current)}
        data-open={isOpen}
        className={`custom-select-trigger ${invalid ? "!border-rose-300" : ""}`}
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
                  onChange(option.value);
                  setIsOpen(false);
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
