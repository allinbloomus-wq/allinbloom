"use client";

import { useEffect, useState } from "react";
import { ADMIN_ORDERS_BADGE_EVENT } from "@/lib/admin-orders";
import { ADMIN_REVIEWS_BADGE_EVENT } from "@/lib/admin-reviews";
import { clientFetch } from "@/lib/api-client";

type CountResponse = {
  count?: number;
};

const defaultClassName =
  "absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[color:var(--brand)] text-[10px] font-semibold text-white";

async function fetchCount(path: string) {
  try {
    const response = await clientFetch(path, { cache: "no-store" }, true);
    if (!response.ok) {
      return 0;
    }
    const data = (await response.json()) as CountResponse;
    return Number(data?.count) || 0;
  } catch {
    return 0;
  }
}

type AdminAlertsBadgeProps = {
  className?: string;
};

export default function AdminAlertsBadge({ className }: AdminAlertsBadgeProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const [ordersCount, reviewsCount] = await Promise.all([
        fetchCount("/api/admin/orders/new-count"),
        fetchCount("/api/admin/reviews/new-count"),
      ]);
      if (active) {
        setCount(ordersCount + reviewsCount);
      }
    };

    void load();

    const handleRefresh = () => {
      void load();
    };

    window.addEventListener(ADMIN_ORDERS_BADGE_EVENT, handleRefresh);
    window.addEventListener(ADMIN_REVIEWS_BADGE_EVENT, handleRefresh);
    window.addEventListener("focus", handleRefresh);
    const intervalId = window.setInterval(handleRefresh, 60000);

    return () => {
      active = false;
      window.removeEventListener(ADMIN_ORDERS_BADGE_EVENT, handleRefresh);
      window.removeEventListener(ADMIN_REVIEWS_BADGE_EVENT, handleRefresh);
      window.removeEventListener("focus", handleRefresh);
      window.clearInterval(intervalId);
    };
  }, []);

  return count > 0 ? (
    <span className={className || defaultClassName}>{count}</span>
  ) : null;
}
