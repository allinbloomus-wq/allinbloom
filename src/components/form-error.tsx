import type { ReactNode } from "react";

const AlertIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    aria-hidden="true"
    focusable="false"
    className={className}
  >
    <circle cx="10" cy="10" r="8.25" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M10 5.75v5.1"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <circle cx="10" cy="13.9" r="1" fill="currentColor" />
  </svg>
);

type FormErrorProps = {
  children: ReactNode;
  id?: string;
  className?: string;
};

/** Red alert box used for every form-level / server error message. */
export default function FormError({ children, id, className }: FormErrorProps) {
  return (
    <div
      id={id}
      role="alert"
      aria-live="polite"
      className={`flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-snug text-red-800 ${className || ""}`}
    >
      <AlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
      <div className="min-w-0 flex-1 space-y-1">{children}</div>
    </div>
  );
}

type FieldErrorProps = {
  /** Referenced by the field's aria-describedby. */
  id: string;
  children: ReactNode;
  className?: string;
};

/** Small red message shown directly under a single invalid field. */
export function FieldError({ id, children, className }: FieldErrorProps) {
  return (
    <span
      id={id}
      role="alert"
      aria-live="polite"
      className={`flex items-start gap-1.5 text-xs leading-snug text-red-700 ${className || ""}`}
    >
      <AlertIcon className="mt-px h-3.5 w-3.5 shrink-0" />
      <span className="min-w-0">{children}</span>
    </span>
  );
}
