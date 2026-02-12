import { cookies } from "next/headers";
import { AUTH_TOKEN_COOKIE } from "@/lib/auth-cookies";

const API_BASE =
  process.env.API_BASE_URL || "";

export const apiUrl = (path: string) => {
  if (!API_BASE) return path;
  return `${API_BASE}${path}`;
};

export const getServerAuthToken = async () => {
  const store = await cookies();
  return store.get(AUTH_TOKEN_COOKIE)?.value || null;
};

const getServerCookieHeader = async () => {
  const store = await cookies();
  const all = store.getAll();
  if (!all.length) return "";
  return all.map(({ name, value }) => `${name}=${value}`).join("; ");
};

const refreshServerAccessToken = async () => {
  const cookieHeader = await getServerCookieHeader();
  if (!cookieHeader) return null;

  const refreshResponse = await fetch(apiUrl("/api/auth/refresh"), {
    method: "POST",
    headers: {
      Cookie: cookieHeader,
    },
    cache: "no-store",
  });
  if (!refreshResponse.ok) return null;

  const payload = (await refreshResponse.json().catch(() => null)) as
    | { accessToken?: string; access_token?: string }
    | null;
  return payload?.accessToken || payload?.access_token || null;
};

export const apiFetch = async (
  path: string,
  options: RequestInit = {},
  auth: boolean = false
) => {
  const makeRequest = (headers: Headers) =>
    fetch(apiUrl(path), {
      ...options,
      headers,
      cache: "no-store",
    });

  const headers = new Headers(options.headers);
  if (auth) {
    const token = await getServerAuthToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await makeRequest(headers);
  if (!auth || response.status !== 401 || path === "/api/auth/refresh") {
    return response;
  }

  const refreshedToken = await refreshServerAccessToken();
  if (!refreshedToken) {
    return response;
  }

  const retryHeaders = new Headers(options.headers);
  retryHeaders.set("Authorization", `Bearer ${refreshedToken}`);
  return makeRequest(retryHeaders);
};
