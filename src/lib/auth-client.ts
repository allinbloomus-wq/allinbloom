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
