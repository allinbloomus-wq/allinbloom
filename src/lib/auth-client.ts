"use client";

import { AUTH_TOKEN_COOKIE, AUTH_USER_COOKIE } from "@/lib/auth-cookies";

export type AuthUser = {
  id: string;
  email: string;
  name?: string | null;
  role?: string | null;
  image?: string | null;
  phone?: string | null;
};

type RefreshPayload = {
  accessToken?: string;
  access_token?: string;
  user?: AuthUser;
};

let pendingRefresh: Promise<{ token: string; user: AuthUser } | null> | null = null;

const getCookie = (name: string) => {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  if (!match) return null;
  return match.split("=").slice(1).join("=");
};

const setStorage = (key: string, value: string) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore storage errors.
  }
};

const getStorage = (key: string) => {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const removeStorage = (key: string) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore storage errors.
  }
};

const clearLegacyCookie = (name: string) => {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
};

export const getClientAuthToken = () => {
  const stored = getStorage(AUTH_TOKEN_COOKIE);
  if (stored) return stored;

  const legacy = getCookie(AUTH_TOKEN_COOKIE);
  if (!legacy) return null;
  const token = decodeURIComponent(legacy);
  if (!token) return null;
  setStorage(AUTH_TOKEN_COOKIE, token);
  clearLegacyCookie(AUTH_TOKEN_COOKIE);
  return token;
};

export const getClientUser = () => {
  const stored = getStorage(AUTH_USER_COOKIE);
  if (stored) {
    try {
      return JSON.parse(stored) as AuthUser;
    } catch {
      removeStorage(AUTH_USER_COOKIE);
    }
  }

  const legacy = getCookie(AUTH_USER_COOKIE);
  if (!legacy) return null;
  try {
    const user = JSON.parse(decodeURIComponent(legacy)) as AuthUser;
    setStorage(AUTH_USER_COOKIE, JSON.stringify(user));
    clearLegacyCookie(AUTH_USER_COOKIE);
    return user;
  } catch {
    return null;
  }
};

const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const json = atob(padded);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
};

const getTokenExpirationMs = (token: string): number | null => {
  const payload = decodeJwtPayload(token);
  const exp = payload?.exp;
  if (typeof exp !== "number") return null;
  return exp * 1000;
};

export const isTokenExpiringSoon = (token: string, minTtlSec: number = 120) => {
  const expiresAtMs = getTokenExpirationMs(token);
  if (!expiresAtMs) return true;
  return expiresAtMs - Date.now() <= minTtlSec * 1000;
};

export const setAuthSession = (token: string, user: AuthUser) => {
  if (typeof window === "undefined") return;
  setStorage(AUTH_TOKEN_COOKIE, token);
  setStorage(AUTH_USER_COOKIE, JSON.stringify(user));
  clearLegacyCookie(AUTH_TOKEN_COOKIE);
  clearLegacyCookie(AUTH_USER_COOKIE);
};

export const clearAuthSession = () => {
  removeStorage(AUTH_TOKEN_COOKIE);
  removeStorage(AUTH_USER_COOKIE);
  clearLegacyCookie(AUTH_TOKEN_COOKIE);
  clearLegacyCookie(AUTH_USER_COOKIE);
};

export const refreshAuthSession = async () => {
  if (pendingRefresh) {
    return pendingRefresh;
  }

  pendingRefresh = (async () => {
    const response = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
    });
    if (!response.ok) {
      if (response.status === 401) {
        clearAuthSession();
      }
      return null;
    }

    const payload = (await response.json().catch(() => null)) as RefreshPayload | null;
    const token = payload?.accessToken || payload?.access_token;
    const user = payload?.user;
    if (!token || !user) return null;

    setAuthSession(token, user);
    return { token, user };
  })();

  try {
    return await pendingRefresh;
  } finally {
    pendingRefresh = null;
  }
};

export const getUsableAuthToken = async (minTtlSec: number = 120) => {
  const token = getClientAuthToken();
  if (token && !isTokenExpiringSoon(token, minTtlSec)) {
    return token;
  }

  const refreshed = await refreshAuthSession();
  return refreshed?.token || null;
};
