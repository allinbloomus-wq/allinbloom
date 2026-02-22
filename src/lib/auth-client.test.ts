import { describe, expect, it, vi } from "vitest";

import { AUTH_TOKEN_COOKIE, AUTH_USER_COOKIE } from "@/lib/auth-cookies";

type AuthRefreshResponse = {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
};

const toBase64Url = (value: string) =>
  btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");

const createUnsignedJwt = (payload: Record<string, unknown>) => {
  const header = toBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = toBase64Url(JSON.stringify(payload));
  return `${header}.${body}.signature`;
};

const makeRefreshResponse = (
  payload: unknown,
  init: { ok: boolean; status: number } = { ok: true, status: 200 }
): AuthRefreshResponse => ({
  ok: init.ok,
  status: init.status,
  json: async () => payload,
});

const loadAuthClient = async () => {
  vi.resetModules();
  return import("@/lib/auth-client");
};

describe("auth-client session helpers", () => {
  it("returns localStorage token first", async () => {
    localStorage.setItem(AUTH_TOKEN_COOKIE, "stored-token");
    document.cookie = `${AUTH_TOKEN_COOKIE}=${encodeURIComponent("legacy-token")}; Path=/`;

    const { getClientAuthToken } = await loadAuthClient();
    expect(getClientAuthToken()).toBe("stored-token");
  });

  it("migrates legacy token cookie to localStorage", async () => {
    document.cookie = `${AUTH_TOKEN_COOKIE}=${encodeURIComponent("legacy-token")}; Path=/`;

    const { getClientAuthToken } = await loadAuthClient();
    expect(getClientAuthToken()).toBe("legacy-token");
    expect(localStorage.getItem(AUTH_TOKEN_COOKIE)).toBe("legacy-token");
  });

  it("migrates legacy user cookie when storage is invalid", async () => {
    const user = { id: "u1", email: "user@example.com", name: "User" };
    localStorage.setItem(AUTH_USER_COOKIE, "{bad json");
    document.cookie = `${AUTH_USER_COOKIE}=${encodeURIComponent(JSON.stringify(user))}; Path=/`;

    const { getClientUser } = await loadAuthClient();
    expect(getClientUser()).toEqual(user);
    expect(localStorage.getItem(AUTH_USER_COOKIE)).toBe(JSON.stringify(user));
  });

  it("detects expiring JWTs", async () => {
    const nowMs = 1_700_000_000_000;
    vi.spyOn(Date, "now").mockReturnValue(nowMs);

    const { isTokenExpiringSoon } = await loadAuthClient();
    const freshToken = createUnsignedJwt({
      exp: Math.floor((nowMs + 10 * 60 * 1000) / 1000),
    });
    const expiringToken = createUnsignedJwt({
      exp: Math.floor((nowMs + 30 * 1000) / 1000),
    });

    expect(isTokenExpiringSoon(freshToken, 120)).toBe(false);
    expect(isTokenExpiringSoon(expiringToken, 120)).toBe(true);
    expect(isTokenExpiringSoon("invalid-token", 120)).toBe(true);
  });
});

describe("auth-client refresh flow", () => {
  it("deduplicates concurrent refresh requests", async () => {
    let resolveFetch: ((value: AuthRefreshResponse) => void) | undefined;
    const pendingResponse = new Promise<AuthRefreshResponse>((resolve) => {
      resolveFetch = resolve;
    });
    const fetchMock = vi.fn(() => pendingResponse);
    vi.stubGlobal("fetch", fetchMock);

    const authClient = await loadAuthClient();
    const p1 = authClient.refreshAuthSession();
    const p2 = authClient.refreshAuthSession();

    expect(fetchMock).toHaveBeenCalledTimes(1);

    resolveFetch?.(
      makeRefreshResponse({
        accessToken: "new-token",
        user: { id: "u1", email: "user@example.com" },
      })
    );

    const [result1, result2] = await Promise.all([p1, p2]);
    expect(result1).toEqual({
      token: "new-token",
      user: { id: "u1", email: "user@example.com" },
    });
    expect(result2).toEqual(result1);
    expect(localStorage.getItem(AUTH_TOKEN_COOKIE)).toBe("new-token");
  });

  it("clears local auth session after refresh 401", async () => {
    localStorage.setItem(AUTH_TOKEN_COOKIE, "old-token");
    localStorage.setItem(
      AUTH_USER_COOKIE,
      JSON.stringify({ id: "u1", email: "user@example.com" })
    );
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        makeRefreshResponse({}, { ok: false, status: 401 })
      )
    );

    const authClient = await loadAuthClient();
    const result = await authClient.refreshAuthSession();

    expect(result).toBeNull();
    expect(localStorage.getItem(AUTH_TOKEN_COOKIE)).toBeNull();
    expect(localStorage.getItem(AUTH_USER_COOKIE)).toBeNull();
  });

  it("reuses a non-expiring token without refresh", async () => {
    const nowMs = 1_700_000_000_000;
    vi.spyOn(Date, "now").mockReturnValue(nowMs);

    const token = createUnsignedJwt({
      exp: Math.floor((nowMs + 15 * 60 * 1000) / 1000),
    });
    localStorage.setItem(AUTH_TOKEN_COOKIE, token);

    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const authClient = await loadAuthClient();
    const usable = await authClient.getUsableAuthToken();

    expect(usable).toBe(token);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refreshes an expiring token and returns updated value", async () => {
    const nowMs = 1_700_000_000_000;
    vi.spyOn(Date, "now").mockReturnValue(nowMs);

    const oldToken = createUnsignedJwt({
      exp: Math.floor((nowMs + 10 * 1000) / 1000),
    });
    localStorage.setItem(AUTH_TOKEN_COOKIE, oldToken);

    const fetchMock = vi.fn().mockResolvedValue(
      makeRefreshResponse({
        access_token: "fresh-token",
        user: { id: "u1", email: "user@example.com" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const authClient = await loadAuthClient();
    const usable = await authClient.getUsableAuthToken(120);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(usable).toBe("fresh-token");
    expect(localStorage.getItem(AUTH_TOKEN_COOKIE)).toBe("fresh-token");
  });
});
