"use client";

type FiltersToggleButtonProps = {
  isOpen: boolean;
  onClick: () => void;
  label?: string;
};

export default function FiltersToggleButton({
  isOpen,
  onClick,
  label = "Filters",
}: FiltersToggleButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={isOpen}
      className="relative inline-flex h-10 shrink-0 items-center justify-start rounded-full border border-stone-300 bg-white/80 px-4 pr-10 text-[10px] uppercase tracking-[0.24em] text-stone-700 transition hover:border-stone-400 sm:text-xs sm:tracking-[0.3em]"
    >
      <span>{label}</span>
      <svg
        aria-hidden="true"
        viewBox="0 0 16 16"
        className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--brand)] transition-transform ${
          isOpen ? "rotate-90" : ""
        }`}
      >
        <path
          d="M6 4l4 4-4 4"
          stroke="currentColor"
          strokeWidth="1.7"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
