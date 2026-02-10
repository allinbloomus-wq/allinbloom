type BouquetPlaceholderProps = {
  className?: string;
};

export default function BouquetPlaceholder({ className }: BouquetPlaceholderProps) {
  return (
    <svg
      viewBox="0 0 200 240"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <linearGradient id="bouquet-wrap" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.15" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <g fill="currentColor" opacity="0.35">
        <circle cx="60" cy="70" r="24" />
        <circle cx="100" cy="52" r="26" />
        <circle cx="140" cy="72" r="22" />
        <circle cx="85" cy="90" r="18" />
        <circle cx="120" cy="92" r="18" />
      </g>
      <g stroke="currentColor" strokeWidth="6" strokeLinecap="round" opacity="0.35">
        <path d="M70 110 L100 170" />
        <path d="M100 110 L100 170" />
        <path d="M130 110 L100 170" />
      </g>
      <path
        d="M60 150 L140 150 L120 220 L80 220 Z"
        fill="url(#bouquet-wrap)"
        stroke="currentColor"
        strokeOpacity="0.2"
        strokeWidth="2"
      />
      <path
        d="M92 182 L100 195 L108 182"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.35"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
