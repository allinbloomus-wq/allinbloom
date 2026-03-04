import type { Order } from "@/lib/api-types";

const BLOCKING_STATUSES = new Set(["PENDING", "PAID"]);

export const hasExistingFirstOrderDiscount = (
  orders: Pick<Order, "status" | "firstOrderDiscountPercent">[]
) =>
  orders.some(
    (order) =>
      (order.firstOrderDiscountPercent || 0) > 0 &&
      BLOCKING_STATUSES.has(order.status)
  );

export const countPaidOrders = (orders: Pick<Order, "status">[]) =>
  orders.filter((order) => order.status === "PAID").length;

export const isFirstOrderEligibleForKnownHistory = (
  orders: Pick<Order, "status" | "firstOrderDiscountPercent">[]
) =>
  countPaidOrders(orders) === 0 && !hasExistingFirstOrderDiscount(orders);
