"use client";

import { useEffect, useState } from "react";
import {
  ADMIN_ORDERS_LAST_SEEN_KEY,
  ADMIN_ORDERS_SEEN_EVENT,
} from "@/lib/admin-orders";

type AdminOrdersCountResponse = {
  count?: number;
};

async function fetchAdminOrdersCount(since: string | null) {
  try {
    const params = new URLSearchParams();
    if (since) {
      params.set("since", since);
    }
    const url = params.size
      ? `/api/admin/orders/new-count?${params.toString()}`
      : "/api/admin/orders/new-count";

    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      return 0;
    }

    const data = (await response.json()) as AdminOrdersCountResponse;
    return Number(data?.count) || 0;
  } catch {
    return 0;
  }
}

export default function AdminOrdersBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const nextCount = await fetchAdminOrdersCount(
        window.localStorage.getItem(ADMIN_ORDERS_LAST_SEEN_KEY)
      );
      if (active) {
        setCount(nextCount);
      }
    };

    void load();

    const handleRefresh = () => {
      void load();
    };

    window.addEventListener(ADMIN_ORDERS_SEEN_EVENT, handleRefresh);
    window.addEventListener("focus", handleRefresh);
    window.addEventListener("storage", handleRefresh);
    const intervalId = window.setInterval(handleRefresh, 60000);

    return () => {
      active = false;
      window.removeEventListener(ADMIN_ORDERS_SEEN_EVENT, handleRefresh);
      window.removeEventListener("focus", handleRefresh);
      window.removeEventListener("storage", handleRefresh);
      window.clearInterval(intervalId);
    };
  }, []);

  return count > 0 ? (
    <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[color:var(--brand)] text-[10px] font-semibold text-white">
      {count}
    </span>
  ) : null;
}
