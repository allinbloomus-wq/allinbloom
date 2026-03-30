import { describe, expect, it } from "vitest";
import {
  countPaidOrders,
  hasBlockingOrderHistory,
  isFirstOrderEligibleForKnownHistory,
} from "@/lib/first-order-discount";

describe("first-order discount helpers", () => {
  it("counts paid orders", () => {
    expect(
      countPaidOrders([
        { status: "PENDING" },
        { status: "PAID" },
        { status: "PAID" },
        { status: "FAILED" },
      ])
    ).toBe(2);
  });

  it("treats pending and paid orders as blocking", () => {
    expect(hasBlockingOrderHistory([{ status: "FAILED" }, { status: "CANCELED" }])).toBe(
      false
    );
    expect(hasBlockingOrderHistory([{ status: "PENDING" }])).toBe(true);
    expect(hasBlockingOrderHistory([{ status: "PAID" }])).toBe(true);
  });

  it("returns eligibility based on known order history", () => {
    expect(isFirstOrderEligibleForKnownHistory([])).toBe(true);

    expect(isFirstOrderEligibleForKnownHistory([{ status: "PAID" }])).toBe(false);
    expect(isFirstOrderEligibleForKnownHistory([{ status: "PENDING" }])).toBe(false);
    expect(
      isFirstOrderEligibleForKnownHistory([
        { status: "FAILED" },
        { status: "CANCELED" },
      ])
    ).toBe(true);
  });
});
