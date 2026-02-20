"use client";

type ReviewStarsProps = {
  value: number;
  onChange?: (value: number) => void;
  max?: number;
  size?: "sm" | "md" | "lg";
  readOnly?: boolean;
  className?: string;
};

const sizeClassMap: Record<NonNullable<ReviewStarsProps["size"]>, string> = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

function StarIcon({
  filled,
  sizeClass,
}: {
  filled: boolean;
  sizeClass: string;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill={filled ? "currentColor" : "none"}
      className={`${sizeClass} ${
        filled
          ? "text-amber-500"
          : "text-stone-300 stroke-current"
      }`}
      strokeWidth={1.35}
    >
      <path d="m10 2.5 2.33 4.72 5.21.76-3.77 3.67.89 5.19L10 14.4l-4.66 2.44.89-5.19-3.77-3.67 5.21-.76L10 2.5Z" />
    </svg>
  );
}

export default function ReviewStars({
  value,
  onChange,
  max = 5,
  size = "md",
  readOnly = !onChange,
  className,
}: ReviewStarsProps) {
  const safeMax = Math.max(1, Math.round(max));
  const normalizedValue = Math.max(0, Math.min(safeMax, Math.round(value)));
  const sizeClass = sizeClassMap[size];

  if (readOnly || !onChange) {
    return (
      <div
        className={`flex items-center gap-1 ${className || ""}`}
        aria-label={`${normalizedValue} out of ${safeMax} stars`}
      >
        {Array.from({ length: safeMax }).map((_, idx) => (
          <StarIcon
            key={`review-star-display-${idx}`}
            filled={idx < normalizedValue}
            sizeClass={sizeClass}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1 ${className || ""}`}>
      {Array.from({ length: safeMax }).map((_, idx) => {
        const starValue = idx + 1;
        const isFilled = idx < normalizedValue;
        return (
          <button
            key={`review-star-input-${idx}`}
            type="button"
            onClick={() => onChange(starValue)}
            className="rounded-md p-0.5 transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand)]/35"
            aria-label={`Set rating to ${starValue} star${starValue > 1 ? "s" : ""}`}
          >
            <StarIcon filled={isFilled} sizeClass={sizeClass} />
          </button>
        );
      })}
    </div>
  );
}
