"use client";

import { useMemo, useState } from "react";
import AdminOrderRow from "@/components/admin-order-row";
import { formatDate } from "@/lib/format";
import {
  addDaysToDayKey,
  dayKeyToDate,
  getDayKey,
} from "@/lib/admin-orders";
import { clientFetch } from "@/lib/api-client";
import type { Order } from "@/lib/api-types";

type AdminOrdersDay = {
  dayKey: string;
  orders: Order[];
};

type AdminOrdersListProps = {
  initialDays: AdminOrdersDay[];
  initialOldestDayKey: string;
};

export default function AdminOrdersList({
  initialDays,
  initialOldestDayKey,
}: AdminOrdersListProps) {
  const [days, setDays] = useState<AdminOrdersDay[]>(initialDays);
  const [oldestDayKey, setOldestDayKey] = useState(initialOldestDayKey);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const todayKey = useMemo(() => getDayKey(new Date()), []);
  const yesterdayKey = useMemo(
    () => addDaysToDayKey(todayKey, -1),
    [todayKey]
  );

  const getLabel = (dayKey: string) => {
    if (dayKey === todayKey) return "Today";
    if (dayKey === yesterdayKey) return "Yesterday";
    return formatDate(dayKeyToDate(dayKey));
  };

  const loadOlderOrders = async () => {
    if (isLoading) return;
    const targetDayKey = oldestDayKey;
    setIsLoading(true);
    setError(null);

    try {
      const response = await clientFetch(
        `/api/admin/orders/by-day?date=${targetDayKey}`,
        { cache: "no-store" },
        true
      );
      if (!response.ok) {
        throw new Error("Failed to load");
      }
      const data = (await response.json()) as AdminOrdersDay;
      setDays((current) => [
        ...current,
        { dayKey: data.dayKey, orders: data.orders || [] },
      ]);
      setOldestDayKey(addDaysToDayKey(targetDayKey, -1));
    } catch {
      setError("Could not load older orders.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {days.map((day) => (
        <section key={day.dayKey} className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-stone-900">
              {getLabel(day.dayKey)}
            </h2>
            <span className="text-xs uppercase tracking-[0.2em] text-stone-500">
              {day.orders.length} orders
            </span>
          </div>
          {day.orders.length ? (
            <div className="grid gap-4">
              {day.orders.map((order) => (
                <AdminOrderRow key={order.id} order={order} />
              ))}
            </div>
          ) : (
            <div className="glass rounded-[28px] border border-white/80 p-6 text-sm text-stone-600">
              No orders for this day.
            </div>
          )}
        </section>
      ))}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={loadOlderOrders}
          disabled={isLoading}
          className="w-full rounded-full border border-stone-300 bg-white/80 px-4 py-2 text-xs uppercase tracking-[0.3em] text-stone-600 transition hover:border-stone-400 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {isLoading ? "Loading..." : "Load older orders"}
        </button>
        {error ? <p className="text-xs text-rose-500">{error}</p> : null}
      </div>
    </div>
  );
}
