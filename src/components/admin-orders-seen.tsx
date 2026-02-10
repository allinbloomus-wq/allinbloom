"use client";

import { useEffect } from "react";
import {
  ADMIN_ORDERS_LAST_SEEN_KEY,
  ADMIN_ORDERS_SEEN_EVENT,
} from "@/lib/admin-orders";

export default function AdminOrdersSeen() {
  useEffect(() => {
    const now = new Date().toISOString();
    window.localStorage.setItem(ADMIN_ORDERS_LAST_SEEN_KEY, now);
    window.dispatchEvent(new Event(ADMIN_ORDERS_SEEN_EVENT));
  }, []);

  return null;
}
