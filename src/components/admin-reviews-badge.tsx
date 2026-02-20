"use client";

import { useEffect, useState } from "react";
import { ADMIN_REVIEWS_BADGE_EVENT } from "@/lib/admin-reviews";
import { clientFetch } from "@/lib/api-client";

type AdminReviewsCountResponse = {
  count?: number;
};

async function fetchAdminReviewsCount() {
  try {
    const response = await clientFetch(
      "/api/admin/reviews/new-count",
      {
        cache: "no-store",
      },
      true
    );
    if (!response.ok) {
      return 0;
    }

    const data = (await response.json()) as AdminReviewsCountResponse;
    return Number(data?.count) || 0;
  } catch {
    return 0;
  }
}

export default function AdminReviewsBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const nextCount = await fetchAdminReviewsCount();
      if (active) {
        setCount(nextCount);
      }
    };

    void load();

    const handleRefresh = () => {
      void load();
    };

    window.addEventListener(ADMIN_REVIEWS_BADGE_EVENT, handleRefresh);
    window.addEventListener("focus", handleRefresh);
    const intervalId = window.setInterval(handleRefresh, 60000);

    return () => {
      active = false;
      window.removeEventListener(ADMIN_REVIEWS_BADGE_EVENT, handleRefresh);
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
