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

export const getClientAuthToken = () => {
  const value = getCookie(AUTH_TOKEN_COOKIE);
  return value ? decodeURIComponent(value) : null;
};

export const getClientUser = () => {
  const value = getCookie(AUTH_USER_COOKIE);
  if (!value) return null;
  try {
    return JSON.parse(decodeURIComponent(value)) as AuthUser;
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
  if (typeof document === "undefined") return;
  const maxAge = 60 * 60 * 24 * 7;
  document.cookie = `${AUTH_TOKEN_COOKIE}=${encodeURIComponent(
    token
  )}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
  document.cookie = `${AUTH_USER_COOKIE}=${encodeURIComponent(
    JSON.stringify(user)
  )}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
};

export const clearAuthSession = () => {
  if (typeof document === "undefined") return;
  document.cookie = `${AUTH_TOKEN_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
  document.cookie = `${AUTH_USER_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
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
