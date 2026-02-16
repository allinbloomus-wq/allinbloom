"use client";

import { useEffect, useMemo, useState } from "react";
import AdminOrderRow from "@/components/admin-order-row";
import { formatDate } from "@/lib/format";
import {
  addDaysToDayKey,
  addWeeksToWeekStartKey,
  dayKeyToDate,
  getCurrentWeekStartKey,
  getDayKey,
  weekStartKeyToDate,
} from "@/lib/admin-orders";
import { clientFetch } from "@/lib/api-client";
import type { Order } from "@/lib/api-types";

type AdminOrdersWeek = {
  weekStartKey: string;
  orders: Order[];
};

type AdminOrdersDayGroup = {
  dayKey: string;
  orders: Order[];
};

type AdminOrdersListProps = {
  initialWeeks: AdminOrdersWeek[];
  initialOldestWeekStartKey: string;
  mode?: "active" | "deleted";
};

export default function AdminOrdersList({
  initialWeeks,
  initialOldestWeekStartKey,
  mode = "active",
}: AdminOrdersListProps) {
  const [weeks, setWeeks] = useState<AdminOrdersWeek[]>(initialWeeks);
  const [oldestWeekStartKey, setOldestWeekStartKey] = useState(
    initialOldestWeekStartKey
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setWeeks(initialWeeks);
    setOldestWeekStartKey(initialOldestWeekStartKey);
    setIsLoading(false);
    setError(null);
  }, [initialWeeks, initialOldestWeekStartKey]);

  const currentWeekStartKey = useMemo(
    () => getCurrentWeekStartKey(new Date()),
    []
  );
  const todayKey = useMemo(() => getDayKey(new Date()), []);
  const yesterdayKey = useMemo(
    () => addDaysToDayKey(todayKey, -1),
    [todayKey]
  );

  const getLabel = (weekStartKey: string) => {
    const weekEndKey = addDaysToDayKey(weekStartKey, 6);
    if (weekStartKey === currentWeekStartKey) {
      return "Last 7 days";
    }

    return `${formatDate(weekStartKeyToDate(weekStartKey))} - ${formatDate(
      weekStartKeyToDate(weekEndKey)
    )}`;
  };

  const getDayLabel = (dayKey: string) => {
    if (dayKey === todayKey) return "Today";
    if (dayKey === yesterdayKey) return "Yesterday";
    return formatDate(dayKeyToDate(dayKey));
  };

  const groupOrdersByDay = (orders: Order[]): AdminOrdersDayGroup[] => {
    const groups = new Map<string, Order[]>();

    for (const order of orders) {
      const dayKey = getDayKey(new Date(order.createdAt));
      const bucket = groups.get(dayKey);
      if (bucket) {
        bucket.push(order);
      } else {
        groups.set(dayKey, [order]);
      }
    }

    return [...groups.entries()]
      .sort(([left], [right]) => right.localeCompare(left))
      .map(([dayKey, dayOrders]) => ({
        dayKey,
        orders: dayOrders,
      }));
  };

  const handleOrderRemoved = (orderId: string) => {
    setWeeks((current) =>
      current.map((week) => ({
        ...week,
        orders: week.orders.filter((order) => order.id !== orderId),
      }))
    );
  };

  const loadOlderOrders = async () => {
    if (isLoading) return;
    const targetWeekStartKey = oldestWeekStartKey;
    setIsLoading(true);
    setError(null);

    try {
      const response = await clientFetch(
        `/api/admin/orders/by-week?startDate=${targetWeekStartKey}&scope=${mode}`,
        { cache: "no-store" },
        true
      );
      if (!response.ok) {
        throw new Error("Failed to load");
      }
      const data = (await response.json()) as AdminOrdersWeek;
      setWeeks((current) => {
        const existingIndex = current.findIndex(
          (week) => week.weekStartKey === data.weekStartKey
        );
        if (existingIndex >= 0) {
          const next = [...current];
          next[existingIndex] = {
            ...next[existingIndex],
            orders: data.orders || [],
          };
          return next;
        }

        return [
          ...current,
          { weekStartKey: data.weekStartKey, orders: data.orders || [] },
        ];
      });
      setOldestWeekStartKey(addWeeksToWeekStartKey(targetWeekStartKey, -1));
    } catch {
      setError("Could not load older orders.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {weeks.map((week) => (
        <section key={week.weekStartKey} className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-stone-900">
              {getLabel(week.weekStartKey)}
            </h2>
            <span className="text-xs uppercase tracking-[0.2em] text-stone-500">
              {week.orders.length} orders
            </span>
          </div>
          {week.orders.length ? (
            <div className="space-y-5">
              {groupOrdersByDay(week.orders).map((dayGroup) => (
                <section key={`${week.weekStartKey}-${dayGroup.dayKey}`} className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-stone-600">
                      {getDayLabel(dayGroup.dayKey)}
                    </h3>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-stone-500">
                      {dayGroup.orders.length} orders
                    </span>
                  </div>
                  <div className="grid gap-4">
                    {dayGroup.orders.map((order) => (
                      <AdminOrderRow
                        key={order.id}
                        order={order}
                        onRemoved={handleOrderRemoved}
                        mode={mode}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="glass rounded-[28px] border border-white/80 p-6 text-sm text-stone-600">
              {mode === "deleted"
                ? "No deleted orders for this week."
                : "No orders for this week."}
            </div>
          )}
        </section>
      ))}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={loadOlderOrders}
          disabled={isLoading}
          className="inline-flex h-11 w-full items-center justify-center rounded-full border border-stone-300 bg-white/80 px-4 text-xs uppercase tracking-[0.3em] text-stone-600 transition hover:border-stone-400 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {isLoading
            ? "Loading..."
            : mode === "deleted"
            ? "Load previous deleted week"
            : "Load previous week"}
        </button>
        {error ? <p className="text-xs text-rose-500">{error}</p> : null}
      </div>
    </div>
  );
}
