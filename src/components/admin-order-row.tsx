"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDateTime, formatMoney, formatOrderStatus } from "@/lib/format";
import { ADMIN_ORDERS_BADGE_EVENT } from "@/lib/admin-orders";
import { clientFetch } from "@/lib/api-client";
import type { Order } from "@/lib/api-types";

type AdminOrderRowProps = {
  order: Order;
  onRemoved: (orderId: string) => void;
  mode?: "active" | "deleted";
};

const orderStatusBadgeClass = (status: Order["status"]) => {
  switch (status) {
    case "PAID":
      return "border-emerald-200 bg-emerald-100 text-emerald-700";
    case "PENDING":
      return "border-amber-200 bg-amber-100 text-amber-700";
    case "FAILED":
      return "border-rose-200 bg-rose-100 text-rose-700";
    case "CANCELED":
      return "border-stone-300 bg-stone-200 text-stone-700";
    default:
      return "border-stone-200 bg-white/80 text-stone-600";
  }
};

export default function AdminOrderRow({
  order,
  onRemoved,
  mode = "active",
}: AdminOrderRowProps) {
  const statusLabel = formatOrderStatus(order.status);
  const isDeletedMode = mode === "deleted";
  const [isRead, setIsRead] = useState(order.isRead ?? false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const toggleRead = async () => {
    if (isLoading || isDeleting || isRestoring) return;
    setIsLoading(true);
    try {
      const response = await clientFetch(
        `/api/admin/orders/${order.id}/toggle-read`,
        {
          method: "PATCH",
        },
        true
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

  const softDelete = async () => {
    if (isLoading || isDeleting || isRestoring) return;
    const confirmed = window.confirm(
      "Soft delete this order? It will be hidden from admin lists."
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const response = await clientFetch(
        `/api/admin/orders/${order.id}/soft-delete`,
        {
          method: "PATCH",
        },
        true
      );
      if (!response.ok) {
        return;
      }
      onRemoved(order.id);
      window.dispatchEvent(new Event(ADMIN_ORDERS_BADGE_EVENT));
    } finally {
      setIsDeleting(false);
    }
  };

  const restoreOrder = async () => {
    if (isLoading || isDeleting || isRestoring) return;
    const confirmed = window.confirm(
      "Restore this order to active orders?"
    );
    if (!confirmed) return;

    setIsRestoring(true);
    try {
      const response = await clientFetch(
        `/api/admin/orders/${order.id}/restore`,
        {
          method: "PATCH",
        },
        true
      );
      if (!response.ok) {
        return;
      }
      onRemoved(order.id);
      window.dispatchEvent(new Event(ADMIN_ORDERS_BADGE_EVENT));
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="rounded-[24px] border border-white/80 bg-white/70 p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
            Order {order.id.slice(0, 8)}
          </p>
          <p className="break-words text-sm font-semibold text-stone-900">
            {formatMoney(order.totalCents)}
          </p>
          <p className="text-xs text-stone-500">
            {formatDateTime(order.createdAt)}
          </p>
          {order.email ? (
            <p className="break-all text-xs text-stone-500">{order.email}</p>
          ) : null}
        </div>
        <div className="flex w-full flex-wrap justify-end gap-2 sm:ml-auto sm:w-auto">
          <div
            className={`inline-flex h-11 items-center justify-center rounded-full border px-4 text-xs uppercase tracking-[0.3em] whitespace-nowrap ${orderStatusBadgeClass(
              order.status
            )}`}
          >
            {statusLabel}
          </div>
          <button
            type="button"
            onClick={toggleRead}
            disabled={isLoading || isDeleting || isRestoring}
            className={`inline-flex h-11 items-center justify-center rounded-full border px-4 text-xs uppercase tracking-[0.3em] transition whitespace-nowrap ${
              isRead
                ? "border-emerald-200 bg-emerald-100 text-emerald-700"
                : "border-stone-200 bg-white/80 text-stone-600"
            } ${isLoading ? "cursor-wait opacity-70" : ""}`}
          >
            {isRead ? "Read" : "Unread"}
          </button>
          <div className="inline-flex h-11 items-center justify-center rounded-full border border-stone-200 bg-white/80 px-4 text-xs uppercase tracking-[0.3em] text-stone-600 whitespace-nowrap">
            {order.items.length} items
          </div>
          <Link
            href={`/admin/orders/${order.id}`}
            className="inline-flex h-11 w-full items-center justify-center rounded-full border border-stone-300 bg-white/80 px-4 text-center text-xs uppercase tracking-[0.3em] text-stone-600 sm:w-auto"
          >
            Details
          </Link>
          {isDeletedMode ? (
            <button
              type="button"
              onClick={restoreOrder}
              disabled={isLoading || isDeleting || isRestoring}
              className={`inline-flex h-11 w-full items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 px-4 text-xs uppercase tracking-[0.3em] text-emerald-700 sm:w-auto ${
                isRestoring ? "cursor-wait opacity-70" : ""
              }`}
            >
              {isRestoring ? "Restoring..." : "Restore"}
            </button>
          ) : (
            <button
              type="button"
              onClick={softDelete}
              disabled={isLoading || isDeleting || isRestoring}
              className={`inline-flex h-11 w-full items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-4 text-xs uppercase tracking-[0.3em] text-rose-700 sm:w-auto ${
                isDeleting ? "cursor-wait opacity-70" : ""
              }`}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          )}
        </div>
      </div>
      <div className="mt-4 grid gap-2 text-sm text-stone-600">
        {order.items.map((item) => (
          <div key={item.id} className="flex items-start justify-between gap-3">
            <span className="min-w-0 break-words">
              {item.quantity} x {item.name}
            </span>
            <span className="shrink-0">{formatMoney(item.priceCents)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
