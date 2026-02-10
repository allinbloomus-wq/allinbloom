"use client";

import { useEffect, useState } from "react";
import { ADMIN_ORDERS_BADGE_EVENT } from "@/lib/admin-orders";
import { clientFetch } from "@/lib/api-client";

type AdminOrdersCountResponse = {
  count?: number;
};

async function fetchAdminOrdersCount() {
  try {
    const response = await clientFetch("/api/admin/orders/new-count", {
      cache: "no-store",
    }, true);
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
      const nextCount = await fetchAdminOrdersCount();
      if (active) {
        setCount(nextCount);
      }
    };

    void load();

    const handleRefresh = () => {
      void load();
    };

    window.addEventListener(ADMIN_ORDERS_BADGE_EVENT, handleRefresh);
    window.addEventListener("focus", handleRefresh);
    const intervalId = window.setInterval(handleRefresh, 60000);

    return () => {
      active = false;
      window.removeEventListener(ADMIN_ORDERS_BADGE_EVENT, handleRefresh);
      window.removeEventListener("focus", handleRefresh);
      window.clearInterval(intervalId);
    };
  }, []);

  return count > 0 ? (
    <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[color:var(--brand)] text-[10px] font-semibold text-white">
      {count}
    </span>
  ) : null;
}
