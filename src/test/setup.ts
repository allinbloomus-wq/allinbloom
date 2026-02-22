import { afterEach, beforeEach, vi } from "vitest";

const clearAllCookies = () => {
  const raw = document.cookie;
  if (!raw) return;
  for (const entry of raw.split(";")) {
    const name = entry.split("=")[0]?.trim();
    if (!name) continue;
    document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
  }
};

beforeEach(() => {
  localStorage.clear();
  clearAllCookies();
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});
