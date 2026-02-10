"use client";

import { useState } from "react";
import type { Order, OrderItem } from "@prisma/client";
import Link from "next/link";
import { formatDateTime, formatMoney, formatOrderStatus } from "@/lib/format";
import { ADMIN_ORDERS_BADGE_EVENT } from "@/lib/admin-orders";

type AdminOrderRowProps = {
  order: Omit<Order, "createdAt"> & {
    createdAt: string;
    items: OrderItem[];
    isRead: boolean;
  };
};

export default function AdminOrderRow({ order }: AdminOrderRowProps) {
  const isPaid = order.status === "PAID";
  const statusLabel = formatOrderStatus(order.status);
  const [isRead, setIsRead] = useState(order.isRead ?? false);
  const [isLoading, setIsLoading] = useState(false);

  const toggleRead = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/admin/orders/${order.id}/toggle-read`,
        {
          method: "PATCH",
        }
      );
      if (!response.ok) {
        return;
      }
      const data = (await response.json()) as { isRead?: boolean };
      setIsRead(Boolean(data?.isRead));
      window.dispatchEvent(new Event(ADMIN_ORDERS_BADGE_EVENT));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-[24px] border border-white/80 bg-white/70 p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
            Order {order.id.slice(0, 8)}
          </p>
          <p className="text-sm font-semibold text-stone-900">
            {formatMoney(order.totalCents)} - {statusLabel}
          </p>
          <p className="text-xs text-stone-500">
            {formatDateTime(order.createdAt)}
          </p>
          {order.email ? (
            <p className="text-xs text-stone-500">{order.email}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <div
            className={`rounded-full px-4 py-2 text-xs uppercase tracking-[0.3em] ${
              isPaid
                ? "border border-emerald-200 bg-emerald-100 text-emerald-700"
                : "border border-rose-200 bg-rose-100 text-rose-700"
            }`}
          >
            {statusLabel}
          </div>
          <button
            type="button"
            onClick={toggleRead}
            disabled={isLoading}
            className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.3em] transition ${
              isRead
                ? "border-emerald-200 bg-emerald-100 text-emerald-700"
                : "border-stone-200 bg-white/80 text-stone-600"
            } ${isLoading ? "cursor-wait opacity-70" : ""}`}
          >
            {isRead ? "Read" : "Unread"}
          </button>
          <div className="rounded-full border border-stone-200 bg-white/80 px-4 py-2 text-xs uppercase tracking-[0.3em] text-stone-600">
            {order.items.length} items
          </div>
          <Link
            href={`/admin/orders/${order.id}`}
            className="rounded-full border border-stone-300 bg-white/80 px-4 py-2 text-xs uppercase tracking-[0.3em] text-stone-600"
          >
            Details
          </Link>
        </div>
      </div>
      <div className="mt-4 grid gap-2 text-sm text-stone-600">
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between">
            <span>
              {item.quantity} x {item.name}
            </span>
            <span>{formatMoney(item.priceCents)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
