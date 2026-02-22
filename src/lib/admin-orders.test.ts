import { describe, expect, it } from "vitest";

import {
  addDaysToDayKey,
  addWeeksToWeekStartKey,
  getCurrentWeekStartKey,
  getDayKey,
  getDayRange,
  getWeekRange,
  parseDayKey,
  weekStartKeyToDate,
} from "@/lib/admin-orders";

describe("day key parsing", () => {
  it("parses valid day keys", () => {
    expect(parseDayKey("2026-02-22")).toEqual({
      year: 2026,
      month: 2,
      day: 22,
    });
  });

  it("rejects invalid day keys", () => {
    expect(parseDayKey("2026-00-22")).toBeNull();
    expect(parseDayKey("not-a-date")).toBeNull();
  });
});

describe("day and week key math", () => {
  it("adds and subtracts days across month/year boundaries", () => {
    expect(addDaysToDayKey("2025-12-31", 1)).toBe("2026-01-01");
    expect(addDaysToDayKey("2024-03-01", -1)).toBe("2024-02-29");
  });

  it("keeps original day key for invalid input", () => {
    expect(addDaysToDayKey("invalid", 3)).toBe("invalid");
  });

  it("calculates day key using selected timezone", () => {
    const date = new Date("2024-01-01T03:30:00.000Z");

    expect(getDayKey(date, "UTC")).toBe("2024-01-01");
    expect(getDayKey(date, "America/Chicago")).toBe("2023-12-31");
  });

  it("returns precise day and week ranges in UTC", () => {
    const dayRange = getDayRange("2026-02-22", "UTC");
    expect(dayRange).not.toBeNull();
    expect(dayRange?.start.toISOString()).toBe("2026-02-22T00:00:00.000Z");
    expect(dayRange?.end.toISOString()).toBe("2026-02-23T00:00:00.000Z");

    const weekRange = getWeekRange("2026-02-16", "UTC");
    expect(weekRange).not.toBeNull();
    expect(weekRange?.start.toISOString()).toBe("2026-02-16T00:00:00.000Z");
    expect(weekRange?.end.toISOString()).toBe("2026-02-23T00:00:00.000Z");
  });

  it("derives week boundaries from current day key", () => {
    const now = new Date("2026-02-22T14:00:00.000Z");
    const startKey = getCurrentWeekStartKey(now, "UTC");
    expect(startKey).toBe("2026-02-16");
    expect(addWeeksToWeekStartKey(startKey, 2)).toBe("2026-03-02");
    expect(weekStartKeyToDate(startKey, "UTC").toISOString()).toBe(
      "2026-02-16T12:00:00.000Z"
    );
  });
});
