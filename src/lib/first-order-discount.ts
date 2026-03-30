import type { Order } from "@/lib/api-types";

const BLOCKING_STATUSES = new Set(["PENDING", "PAID"]);

export const hasBlockingOrderHistory = (
  orders: Pick<Order, "status">[]
) =>
  orders.some((order) => BLOCKING_STATUSES.has(order.status));

export const countPaidOrders = (orders: Pick<Order, "status">[]) =>
  orders.filter((order) => order.status === "PAID").length;

export const isFirstOrderEligibleForKnownHistory = (
  orders: Pick<Order, "status">[]
) =>
  !hasBlockingOrderHistory(orders);
