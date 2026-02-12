"use client";

import { getUsableAuthToken, refreshAuthSession } from "@/lib/auth-client";

export const clientFetch = async (
  path: string,
  options: RequestInit = {},
  auth: boolean = false
) => {
  const makeRequest = (headers: Headers) =>
    fetch(path, {
      ...options,
      headers,
      credentials: options.credentials ?? "include",
    });

  const headers = new Headers(options.headers);
  if (auth) {
    const token = await getUsableAuthToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await makeRequest(headers);
  if (!auth || response.status !== 401) {
    return response;
  }

  const refreshed = await refreshAuthSession();
  if (!refreshed?.token) {
    return response;
  }

  const retryHeaders = new Headers(options.headers);
  retryHeaders.set("Authorization", `Bearer ${refreshed.token}`);
  return makeRequest(retryHeaders);
};
