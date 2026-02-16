export const ADMIN_ORDERS_BADGE_EVENT = "admin-orders-badge-refresh";
export const ADMIN_TIMEZONE = "America/Chicago";
export const ADMIN_ORDERS_WEEK_DAYS = 7;

type DayParts = {
  year: number;
  month: number;
  day: number;
};

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function getFormatter(timeZone: string) {
  const cached = formatterCache.get(timeZone);
  if (cached) return cached;
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  formatterCache.set(timeZone, formatter);
  return formatter;
}

function getTimeZoneOffset(date: Date, timeZone: string) {
  const formatter = getFormatter(timeZone);
  const parts = formatter.formatToParts(date);
  const values: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== "literal") {
      values[part.type] = part.value;
    }
  }
  const utcTime = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second)
  );
  return utcTime - date.getTime();
}

function getDayParts(date: Date, timeZone: string) {
  const formatter = getFormatter(timeZone);
  const parts = formatter.formatToParts(date);
  const values: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== "literal") {
      values[part.type] = part.value;
    }
  }
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
  };
}

function toDayKey(parts: DayParts) {
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(
    parts.day
  ).padStart(2, "0")}`;
}

export function parseDayKey(dayKey: string): DayParts | null {
  const [year, month, day] = dayKey.split("-").map((value) => Number(value));
  if (!year || !month || !day) return null;
  return { year, month, day };
}

export function getDayKey(date: Date, timeZone = ADMIN_TIMEZONE) {
  return toDayKey(getDayParts(date, timeZone));
}

export function addDaysToDayKey(dayKey: string, delta: number) {
  const parts = parseDayKey(dayKey);
  if (!parts) return dayKey;
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  date.setUTCDate(date.getUTCDate() + delta);
  return toDayKey({
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  });
}

function makeDateInTimeZone(
  parts: DayParts,
  timeZone: string,
  hour = 0,
  minute = 0,
  second = 0,
  millisecond = 0
) {
  const utcGuess = new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day, hour, minute, second)
  );
  utcGuess.setUTCMilliseconds(millisecond);
  const offset = getTimeZoneOffset(utcGuess, timeZone);
  return new Date(utcGuess.getTime() - offset);
}

export function getDayRange(dayKey: string, timeZone = ADMIN_TIMEZONE) {
  const parts = parseDayKey(dayKey);
  if (!parts) return null;
  const start = makeDateInTimeZone(parts, timeZone, 0, 0, 0, 0);
  const nextKey = addDaysToDayKey(dayKey, 1);
  const nextParts = parseDayKey(nextKey);
  if (!nextParts) return null;
  const end = makeDateInTimeZone(nextParts, timeZone, 0, 0, 0, 0);
  return { start, end };
}

export function dayKeyToDate(dayKey: string, timeZone = ADMIN_TIMEZONE) {
  const parts = parseDayKey(dayKey);
  if (!parts) return new Date(dayKey);
  return makeDateInTimeZone(parts, timeZone, 12, 0, 0, 0);
}

export function getCurrentWeekStartKey(
  date: Date,
  timeZone = ADMIN_TIMEZONE
) {
  const todayKey = getDayKey(date, timeZone);
  return addDaysToDayKey(todayKey, -(ADMIN_ORDERS_WEEK_DAYS - 1));
}

export function addWeeksToWeekStartKey(weekStartKey: string, delta: number) {
  return addDaysToDayKey(weekStartKey, delta * ADMIN_ORDERS_WEEK_DAYS);
}

export function getWeekRange(
  weekStartKey: string,
  timeZone = ADMIN_TIMEZONE
) {
  const startParts = parseDayKey(weekStartKey);
  if (!startParts) return null;

  const start = makeDateInTimeZone(startParts, timeZone, 0, 0, 0, 0);
  const weekEndKey = addDaysToDayKey(weekStartKey, ADMIN_ORDERS_WEEK_DAYS);
  const endParts = parseDayKey(weekEndKey);
  if (!endParts) return null;

  const end = makeDateInTimeZone(endParts, timeZone, 0, 0, 0, 0);
  return { start, end };
}

export function weekStartKeyToDate(
  weekStartKey: string,
  timeZone = ADMIN_TIMEZONE
) {
  return dayKeyToDate(weekStartKey, timeZone);
}
