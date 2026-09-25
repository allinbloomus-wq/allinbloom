"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import AdminOrdersBadge from "@/components/admin-orders-badge";
import AdminReviewsBadge from "@/components/admin-reviews-badge";

type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
  badge?: ReactNode;
  match?: string[];
};

const iconProps = {
  "aria-hidden": true,
  viewBox: "0 0 20 20",
  className: "h-4 w-4 shrink-0",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const icons = {
  flower: (
    <svg {...iconProps}>
      <circle cx="10" cy="8" r="2" />
      <path d="M10 6a2.5 2.5 0 1 1 0-3.5A2.5 2.5 0 1 1 10 6Zm2 2a2.5 2.5 0 1 1 3.5 0A2.5 2.5 0 1 1 12 8Zm-4 0a2.5 2.5 0 1 1-3.5 0A2.5 2.5 0 1 1 8 8Zm2 2v8" />
    </svg>
  ),
  balloon: (
    <svg {...iconProps}>
      <ellipse cx="10" cy="7.5" rx="4.5" ry="5.5" />
      <path d="M10 13l-1 1.5h2L10 13Zm0 1.5c0 1.5-1.5 2-1.5 3.5" />
    </svg>
  ),
  gift: (
    <svg {...iconProps}>
      <rect x="3" y="7" width="14" height="4" rx="1" />
      <path d="M4.5 11v6h11v-6M10 7v10M10 7S8.5 3 6.5 4 8 7 10 7Zm0 0s1.5-4 3.5-3S12 7 10 7Z" />
    </svg>
  ),
  space: (
    <svg {...iconProps}>
      <path d="M3 17V8l7-4 7 4v9M8 17v-5h4v5" />
    </svg>
  ),
  orders: (
    <svg {...iconProps}>
      <path d="M5 3h10v14l-2.5-1.5L10 17l-2.5-1.5L5 17V3Zm3 4h4M8 10h4" />
    </svg>
  ),
  star: (
    <svg {...iconProps}>
      <path d="M10 3l2.1 4.3 4.7.7-3.4 3.3.8 4.7L10 13.8 5.8 16l.8-4.7L3.2 8l4.7-.7L10 3Z" />
    </svg>
  ),
  slides: (
    <svg {...iconProps}>
      <rect x="3" y="4" width="14" height="10" rx="1.5" />
      <path d="M7 17h6" />
    </svg>
  ),
  tag: (
    <svg {...iconProps}>
      <path d="M3 10V4a1 1 0 0 1 1-1h6l7 7-7 7-7-7Z" />
      <circle cx="7" cy="7" r="1" />
    </svg>
  ),
  image: (
    <svg {...iconProps}>
      <rect x="3" y="4" width="14" height="12" rx="1.5" />
      <path d="M3 13l4-4 4 4 2-2 4 4" />
    </svg>
  ),
};

const groups: { title: string; items: NavItem[] }[] = [
  {
    title: "Catalog",
    items: [
      { href: "/admin", label: "Bouquets", icon: icons.flower, match: ["/admin/bouquets"] },
      { href: "/admin/balloons", label: "Balloons", icon: icons.balloon },
      { href: "/admin/gifts", label: "Gift Box", icon: icons.gift },
      { href: "/admin/event-space", label: "Event space", icon: icons.space },
    ],
  },
  {
    title: "Sales",
    items: [
      { href: "/admin/orders", label: "Orders", icon: icons.orders, badge: <AdminOrdersBadge /> },
      { href: "/admin/discounts", label: "Discounts", icon: icons.tag },
    ],
  },
  {
    title: "Content",
    items: [
      { href: "/admin/reviews", label: "Reviews", icon: icons.star, badge: <AdminReviewsBadge /> },
      { href: "/admin/promotions", label: "Promotions", icon: icons.slides },
      { href: "/admin/home-images", label: "Homepage images", icon: icons.image },
    ],
  },
];

function isActive(pathname: string, item: NavItem) {
  if (item.href === "/admin") {
    return pathname === "/admin" || (item.match ?? []).some((p) => pathname.startsWith(p));
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export default function AdminSidebar() {
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);
  const current = groups.flatMap((g) => g.items).find((item) => isActive(pathname, item));

  return (
    <aside className="w-full rounded-2xl border border-stone-200 bg-white shadow-sm lg:sticky lg:top-6 lg:w-60 lg:shrink-0 lg:self-start">
      <div className="flex items-center justify-between gap-3 px-4 py-3 lg:px-5 lg:pt-5 lg:pb-2">
        <div>
          <p className="text-sm font-semibold text-stone-900">Admin panel</p>
          <p className="text-xs text-stone-500 lg:hidden">{current?.label ?? "Menu"}</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="admin-nav"
          className="inline-flex h-9 items-center gap-2 rounded-full border border-stone-300 px-3 text-sm text-stone-700 transition hover:bg-stone-50 lg:hidden"
        >
          <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            {open ? <path d="M5 5l10 10M15 5L5 15" /> : <path d="M3 6h14M3 10h14M3 14h14" />}
          </svg>
          {open ? "Close" : "Menu"}
        </button>
      </div>
      <nav
        id="admin-nav"
        className={`${open ? "block" : "hidden"} border-t border-stone-100 px-2 pb-3 pt-2 lg:block lg:border-t-0`}
      >
        {groups.map((group) => (
          <div key={group.title} className="mt-2 first:mt-0">
            <p className="px-3 pb-1 pt-2 text-xs font-medium text-stone-400">{group.title}</p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(pathname, item);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={`flex h-9 items-center gap-2.5 rounded-full px-3 text-sm transition ${
                        active
                          ? "bg-[color:rgba(var(--brand-rgb),0.12)] font-medium text-[color:var(--brand-dark)]"
                          : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                      }`}
                    >
                      {item.icon}
                      <span className="truncate">{item.label}</span>
                      {item.badge}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
