"use client";

import { getClientAuthToken } from "@/lib/auth-client";

export const clientFetch = async (
  path: string,
  options: RequestInit = {},
  auth: boolean = false
) => {
  const headers = new Headers(options.headers);
  if (auth) {
    const token = getClientAuthToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }
  return fetch(path, {
    ...options,
    headers,
    credentials: options.credentials ?? "include",
  });
};
