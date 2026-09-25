import Link from "next/link";
import type { ReactNode } from "react";

/** Shared class tokens for the admin surface. */
export const adminPanel =
  "rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6";
export const adminPrimaryButton =
  "inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[color:var(--brand)] px-4 text-sm font-medium text-white transition hover:bg-[color:var(--brand-dark)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";
export const adminSecondaryButton =
  "inline-flex h-10 items-center justify-center gap-2 rounded-full border border-stone-300 bg-white px-4 text-sm font-medium text-stone-700 transition hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

type PageHeaderAction = { href: string; label: string; variant?: "primary" | "secondary" };

function PlusIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M10 4v12M4 10h12" />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5l-5 5 5 5" />
    </svg>
  );
}

export function AdminPageHeader({
  title,
  description,
  action,
  back,
  children,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: PageHeaderAction;
  back?: { href: string; label: string };
  children?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-20 -mx-4 border-b border-stone-200 bg-stone-50/95 px-4 py-4 backdrop-blur-sm sm:-mx-6 sm:px-6 lg:mx-0 lg:rounded-2xl lg:px-0 lg:border-b-0 lg:bg-transparent lg:backdrop-blur-none">
      {back ? (
        <Link
          href={back.href}
          className="mb-2 inline-flex items-center gap-1 text-sm text-stone-500 transition hover:text-stone-900"
        >
          <ArrowLeftIcon />
          {back.label}
        </Link>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold text-stone-900">{title}</h1>
          {description ? <p className="mt-1 text-sm text-stone-500">{description}</p> : null}
        </div>
        <div className="flex items-center gap-2">
          {children}
          {action ? (
            <Link
              href={action.href}
              className={action.variant === "secondary" ? adminSecondaryButton : adminPrimaryButton}
            >
              {action.variant === "secondary" ? null : <PlusIcon />}
              {action.label}
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}

export function AdminPanel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`${adminPanel} ${className}`}>{children}</section>;
}

export function AdminEmptyState({
  message,
  action,
}: {
  message: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-stone-300 bg-stone-50/60 px-6 py-10 text-center">
      <p className="text-sm text-stone-600">{message}</p>
      {action ? (
        <Link href={action.href} className={adminPrimaryButton}>
          <PlusIcon />
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}

type PillTone = "success" | "warning" | "danger" | "neutral" | "brand";

const pillTones: Record<PillTone, string> = {
  success: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  warning: "bg-amber-50 text-amber-800 ring-amber-200",
  danger: "bg-red-50 text-red-700 ring-red-200",
  neutral: "bg-stone-100 text-stone-600 ring-stone-200",
  brand: "bg-[color:rgba(var(--brand-rgb),0.1)] text-[color:var(--brand-dark)] ring-[color:rgba(var(--brand-rgb),0.25)]",
};

export function AdminStatusPill({ tone = "neutral", children }: { tone?: PillTone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${pillTones[tone]}`}
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {children}
    </span>
  );
}
