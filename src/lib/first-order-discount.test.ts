import { describe, expect, it } from "vitest";
import {
  countPaidOrders,
  hasExistingFirstOrderDiscount,
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

  it("treats pending and paid first-order discounted orders as blocking", () => {
    expect(
      hasExistingFirstOrderDiscount([
        { status: "FAILED", firstOrderDiscountPercent: 10 },
        { status: "CANCELED", firstOrderDiscountPercent: 10 },
      ])
    ).toBe(false);

    expect(
      hasExistingFirstOrderDiscount([
        { status: "PENDING", firstOrderDiscountPercent: 10 },
      ])
    ).toBe(true);

    expect(
      hasExistingFirstOrderDiscount([
        { status: "PAID", firstOrderDiscountPercent: 10 },
      ])
    ).toBe(true);
  });

  it("returns eligibility based on known order history", () => {
    expect(isFirstOrderEligibleForKnownHistory([])).toBe(true);

    expect(
      isFirstOrderEligibleForKnownHistory([
        { status: "PAID", firstOrderDiscountPercent: 0 },
      ])
    ).toBe(false);

    expect(
      isFirstOrderEligibleForKnownHistory([
        { status: "PENDING", firstOrderDiscountPercent: 10 },
      ])
    ).toBe(false);
  });
});
